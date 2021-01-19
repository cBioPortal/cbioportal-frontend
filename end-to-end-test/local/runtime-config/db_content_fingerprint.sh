#!/usr/bin/env bash

set -e 
set -u
set -o pipefail

DIR=$PWD

compose_extensions="-f docker-compose.yml"
if [ $CUSTOM_BACKEND -eq 1 ]; then
  compose_extensions="$compose_extensions -f $TEST_HOME/docker_compose/cbioportal-custombranch.yml"
fi

cd $E2E_WORKSPACE/cbioportal-docker-compose
CHECKSUM_ES_0=$(docker-compose $compose_extensions run --rm --no-deps cbioportal sh -c 'tar -cf - /cbioportal/core/src/test/scripts/test_data/study_es_0/ 2> /dev/null | shasum -a 1')
CHECKSUM_ES_0_GENESETS=$(docker-compose $compose_extensions run --rm --no-deps cbioportal sh -c 'tar -cf - /cbioportal/core/src/test/resources/genesets/study_es_0* 2> /dev/null | shasum -a 1')
CHECKSUM_TEST_STUDIES=$(find "$TEST_HOME"/studies/ -type f -exec md5sum {} \; | shasum -a 1)
CHECKSUM_MIGRATION_SQL=$(docker-compose $compose_extensions run --rm --no-deps cbioportal sh -c 'shasum -a 1 /cbioportal/db-scripts/src/main/resources/migration.sql')
CHECKSUM_SEED_URL=$(echo "$DB_SEED_URL" | shasum -a 1)
CHECKSUM_SCHEMA_URL=$(echo "$DB_CGDS_URL" | shasum -a 1)

docker-compose down --volumes

cd $DIR
CHECKSUM_ES_0=$(echo $CHECKSUM_ES_0 | cut -c 1-10)
CHECKSUM_ES_0_GENESETS=$(echo CHECKSUM_ES_0_GENESETS | cut -c 1-10)
CHECKSUM_TEST_STUDIES=$(echo $CHECKSUM_TEST_STUDIES | cut -c 1-10)
CHECKSUM_MIGRATION_SQL=$(echo $CHECKSUM_MIGRATION_SQL | cut -c 1-10)
CHECKSUM_SEED_URL=$(echo $CHECKSUM_SEED_URL | cut -c 1-10)
CHECKSUM_SCHEMA_URL=$(echo $CHECKSUM_SCHEMA_URL | cut -c 1-10)

echo $CHECKSUM_ES_0$CHECKSUM_ES_0_GENESETS$CHECKSUM_TEST_STUDIES$CHECKSUM_MIGRATION_SQL$CHECKSUM_SEED_URL$CHECKSUM_SCHEMA_URL
