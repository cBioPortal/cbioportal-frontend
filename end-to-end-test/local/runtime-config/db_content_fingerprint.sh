#!/usr/bin/env bash

set -e 
set -u
set -o pipefail

DIR=$PWD

CHECKSUM_TEST_STUDIES=$(find "$TEST_HOME"/studies/ -type f -exec md5sum {} \; | shasum -a 1)
CHECKSUM_SEED_URL=$(echo "$DB_SEED_URL" | shasum -a 1)
CHECKSUM_SCHEMA_URL=$(echo "$DB_CGDS_URL" | shasum -a 1)

# Check whether the migration script (database schema) has changed.
cd $E2E_WORKSPACE/cbioportal-docker-compose
compose_extensions=("docker-compose.yml")
if [ $CUSTOM_BACKEND -eq 1 ]; then
  compose_extensions+="$TEST_HOME/docker_compose/cbioportal-custombranch.yml"
fi
CHECKSUM_MIGRATION_SQL=$(docker-compose $(echo "${compose_extensions[@]/#/-f }") run --rm --no-deps cbioportal sh -c 'shasum -a 1 /cbioportal/db-scripts/src/main/resources/migration.sql')
cd $DIR

# Take first 10 chars.
CHECKSUM_TEST_STUDIES=$(echo $CHECKSUM_TEST_STUDIES | cut -c 1-10)
CHECKSUM_MIGRATION_SQL=$(echo $CHECKSUM_MIGRATION_SQL | cut -c 1-10)
CHECKSUM_SEED_URL=$(echo $CHECKSUM_SEED_URL | cut -c 1-10)
CHECKSUM_SCHEMA_URL=$(echo $CHECKSUM_SCHEMA_URL | cut -c 1-10)

echo $CHECKSUM_TEST_STUDIES$CHECKSUM_MIGRATION_SQL$CHECKSUM_SEED_URL$CHECKSUM_SCHEMA_URL
