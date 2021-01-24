#!/usr/bin/env bash

set -e
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails
shopt -s nullglob # allows files and dir globs to be null - needed in 'for ... do' loops that should not run when no files/dirs are detected by expansion

DIR=$PWD

cd $E2E_WORKSPACE/cbioportal-docker-compose

# If the mysql data dir is empty, download schema and seed before starting
if (ls "$CBIO_DB_DATA_DIR"/* 2> /dev/null > /dev/null); then
  rm -rf data/cgds.sql
  rm -rf data/seed.sql.gz
  curl $DB_CGDS_URL > data/cgds.sql
  curl $DB_SEED_URL > data/seed.sql.gz
fi

compose_extensions="-f docker-compose.yml -f $TEST_HOME/docker_compose/cbioportal.yml"
if [[ -n $BACKEND_BUILD_URL ]]; then
  compose_extensions="$compose_extensions -f $TEST_HOME/docker_compose/cbioportal-custombranch.yml"
fi

sudo rm -rf $CBIO_DB_DATA_DIR/*
mkdir -p $CBIO_DB_DATA_DIR
docker-compose $compose_extensions up -d cbioportal
# wait for up to 15m until all services are up and running
for i in {1..30}; do
    [[ $(curl -sf http://localhost:8080/api/health) ]] && { healthy=1; break; } || echo "Waiting for cBioPortal service..."
    sleep 10s
done
[ -z "$healthy" ] && { echo "Error starting cBioPortal services."; exit 1; } || echo "Successful deployment."

# import study_es_0
echo "Loading study_es_0"
docker-compose $compose_extensions run --rm cbioportal sh -c '\
  cd /cbioportal/core/src/main/scripts/ \
  && ./importGenePanel.pl --data /cbioportal/core/src/test/scripts/test_data/study_es_0/data_gene_panel_testpanel1.txt \
  && ./importGenePanel.pl --data /cbioportal/core/src/test/scripts/test_data/study_es_0/data_gene_panel_testpanel2.txt \
  && ./importGenesetData.pl --data /cbioportal/core/src/test/resources/genesets/study_es_0_genesets.gmt --new-version msigdb_6.1 \
      --sup /cbioportal/core/src/test/resources/genesets/study_es_0_supp-genesets.txt --confirm-delete-all-genesets-hierarchy-genesetprofiles\
  && ./importGenesetHierarchy.pl --data /cbioportal/core/src/test/resources/genesets/study_es_0_tree.yaml \
  && cd importer && ./cbioportalImporter.py -s /cbioportal/core/src/test/scripts/test_data/study_es_0'

for DIR in "$TEST_HOME"/studies/*/; do

    echo "Loading study $DIR"
    # FIXME metaImport.py cannot be used here since the URL for validation cannot contain '_'
    # for the study to be validated the container names in docker compose should be updated
    docker-compose $compose_extensions run --rm \
        -v "$DIR:/study-to-import:rw" \
        cbioportal \
        sh -c 'cd /cbioportal/core/src/main/scripts/importer && ./cbioportalImporter.py \
          --command import-study \
          --study_directory /study-to-import'

done

docker-compose $compose_extensions down

cd $PWD

exit 0
