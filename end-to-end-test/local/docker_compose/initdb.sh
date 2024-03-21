#!/usr/bin/env bash

set -e
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails

DIR=$PWD

cd $E2E_WORKSPACE/cbioportal-docker-compose

# If the mysql data dir is empty, download schema and seed before starting
if [ ! "$(ls -A $CBIO_DB_DATA_DIR)" ]; then
  rm -rf data/cgds.sql
  rm -rf data/seed.sql.gz
  curl $DB_CGDS_URL > data/cgds.sql
  curl $DB_SEED_URL > data/seed.sql.gz
fi

compose_extensions="-f docker-compose.yml -f $TEST_HOME/docker_compose/cbioportal.yml"
#if [ $CUSTOM_BACKEND -eq 1 ]; then
  #compose_extensions="$compose_extensions -f $TEST_HOME/docker_compose/cbioportal-custombranch.yml"
#fi

rm -rf $CBIO_DB_DATA_DIR/*
mkdir -p $CBIO_DB_DATA_DIR
docker-compose $compose_extensions up -d cbioportal
echo

echo "Init DB"

# wait for up to 15m until all services are up and running
healthy=
for i in {1..30}; do
    [[ $(curl -sf http://localhost:8080/api/health) ]] && { healthy=1; break; } || echo "Waiting for cBioPortal service                 ..."
    sleep 10
done
[ -z "$healthy" ] && { echo "Error starting cBioPortal services."; exit 1; } || echo "Waiting for cBioPortal service                 ... done"

# import study_es_0
echo "Loading study_es_0 geneset and GSVA data"
docker-compose $compose_extensions run --rm \
  -v "$TEST_HOME/test_data:/test_data" \
  cbioportal \
  sh -c 'cd /core/scripts/ \
  && ./importGenePanel.pl --data /test_data/study_es_0/data_gene_panel_testpanel1.txt \
  && ./importGenePanel.pl --data /test_data/study_es_0/data_gene_panel_testpanel2.txt \
  && ./importGenesetData.pl --data /test_data/genesets/study_es_0_genesets.gmt --new-version msigdb_7.5.1 \
      --sup /test_data/genesets/study_es_0_supp-genesets.txt --confirm-delete-all-genesets-hierarchy-genesetprofiles\
  && ./importGenesetHierarchy.pl --data /test_data/genesets/study_es_0_tree.yaml'

# dump portalInfo
echo "Exporting cBioPortal data                      ..."
docker-compose $compose_extensions run --rm \
        -v "$TEST_HOME/test_data:/test_data" \
        cbioportal sh -c 'cd /core/scripts/ && ./dumpPortalInfo.pl /portalInfo/'
echo "Exporting cBioPortal data                      ... done"

# import study_es_0
echo "Loading study_es_0"
docker-compose $compose_extensions run --rm \
  -v "$TEST_HOME/test_data:/test_data" \
  cbioportal sh -c '\
  cd /core/scripts/importer && ./metaImport.py -o -p /portalInfo -s /test_data/study_es_0'

for DIR in "$TEST_HOME"/studies/*/; do

    echo "Loading study $DIR"
    docker-compose $compose_extensions run --rm \
        -v "$DIR:/study-to-import:rw" \
        cbioportal \
        sh -c 'docker-entrypoint.sh && cd /core/scripts/importer && ./metaImport.py \
          -o \
          -p /portalInfo \
          -s /study-to-import'

done

docker-compose $compose_extensions down

cd $PWD

exit 0
