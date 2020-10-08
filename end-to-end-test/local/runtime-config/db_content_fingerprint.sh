#!/usr/bin/env bash

set -e 
set -u
set -o pipefail
set -v

DIR=$PWD

cd $TEST_HOME/local/docker
./build_portal_image.sh

MD5_TEST_STUDIES=$(find $TEST_HOME/local/studies/ -type f -exec md5sum {} \; | md5sum | sed "s/\s.*$//")
if [[ $BACKEND_IMAGE_NAME == $CUSTOM_BACKEND_IMAGE_NAME ]]; then
	MD5_ES_0=$(find /$BACKEND_SOURCE_DIR/core/src/test/scripts/test_data/study_es_0/ -type f -exec md5sum {} \; | md5sum | sed "s/\s.*$//")
	MD5_MIGRATION_SQL=$(md5sum /$BACKEND_SOURCE_DIR/db-scripts/src/main/resources/migration.sql | sed "s/\s.*$//")
else
	MD5_ES_0=$(docker run --rm $BACKEND_IMAGE_NAME sh -c 'find /cbioportal/core/src/test/scripts/test_data/study_es_0/ -type f -exec md5sum {} \; | md5sum | sed "s/\s.*$//"')
	MD5_MIGRATION_SQL=$(docker run --rm $BACKEND_IMAGE_NAME sh -c 'md5sum /cbioportal/db-scripts/src/main/resources/migration.sql | sed "s/\s.*$//"')
fi

cd $DIR

echo "$MD5_ES_0 $MD5_TEST_STUDIES $MD5_MIGRATION_SQL $DB_CGDS_URL $DB_SEED_URL"