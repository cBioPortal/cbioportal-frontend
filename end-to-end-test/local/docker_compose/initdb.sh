#!/usr/bin/env bash

set -e
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails
shopt -s nullglob # allows files and dir globs to be null - needed in 'for ... do' loops that should not run when no files/dirs are detected by expansion

DIR=$PWD

cd $TEST_HOME/local/docker_compose/cbioportal-docker-compose

# If the mysql data dir is empty, download schema and seed before starting
#HAS_DATA=`ls $DB_DATA_DIR/* 2> /dev/null > /dev/null`
#if [[ ! $HAS_DATA ]]; then
#  rm -rf data/cgds.sql
#  rm -rf data/seed.sql.gz
#  curl $DB_CGDS_URL > data/cgds.sql
#  curl $DB_SEED_URL > data/seed.sql.gz
#fi

compose_extensions="-f docker-compose.yml -f ../cbioportal.yml"
if [[ -n $BACKEND_BUILD_URL ]]; then
  compose_extensions="$compose_extensions -f ../cbioportal-custombranch.yml"
fi

echo "$compose_extensions"
docker-compose $compose_extensions up -d cbioportal
# wait for up to 15m until all services are up and running
for i in {1..30}; do
    [[ $(curl -sf http://localhost:8080/api/health) ]] && { healthy=1; break; } || echo "Waiting for cBioPortal services..."
    sleep 10s
done
[ -z "$healthy" ] && { echo "Error starting cBioPortal services."; exit 1; } || echo "Successful deploy."

# import study_es_0
docker-compose $compose_extensions run --rm cbioportal sh -c '\
  cd /cbioportal/core/src/main/scripts/ \
  && ./importGenePanel.pl --data /cbioportal/core/src/test/scripts/test_data/study_es_0/data_gene_panel_testpanel1.txt \
  && ./importGenePanel.pl --data /cbioportal/core/src/test/scripts/test_data/study_es_0/data_gene_panel_testpanel2.txt \
  && ./importGenesetData.pl --data /cbioportal/core/src/test/resources/genesets/study_es_0_genesets.gmt --new-version msigdb_6.1 \
      --sup /cbioportal/core/src/test/resources/genesets/study_es_0_supp-genesets.txt --confirm-delete-all-genesets-hierarchy-genesetprofiles\
  && ./importGenesetHierarchy.pl --data /cbioportal/core/src/test/resources/genesets/study_es_0_tree.yaml'

# download portal info

# import custom studies
for DIR in "$TEST_HOME"/local/studies/*/; do

    echo "Loading study $DIR"
    ls $DIR
    # FIXME metaImport.py canot be used here since the URL for validation cannot contain '_'
    # for the study to be validated the container names in docker compose should be updated
    docker-compose $compose_extensions run --rm \
        -v "$DIR:/study:ro" \
        cbioportal \
        sh -c '/cbioportal/core/src/main/scripts/importer/cbioportalImporter.py \
          --command import-study \
          --study_directory /study'

done

# shut down cbioportal so that db changes will take effect when started again
docker-compose $compose_extensions down

cd $PWD

exit 0
