#!/usr/bin/env bash

set -e
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails
shopt -s nullglob # allows files and dir globs to be null - needed in 'for ... do' loops that should not run when no files/dirs are detected by expansion

BUILD_PORTAL=false
BUILD_DATABASE=false
BUILD_E2E=false

usage() {
    echo "-d: build database image and load studies into database"
    echo "-p: build cbioportal image and container"
    echo "-e: build e2e-screenshot image and container"
    exit 1
}

while getopts "pdei" opt; do
  case "${opt}" in
    d) BUILD_DATABASE=true
    ;;
    p) BUILD_PORTAL=true
    ;;
    e) BUILD_E2E=true
    ;;
    \?) usage
    ;;
  esac
done

build_database_container() {
    # create local database from with cbioportal db and seed data
    download_db_seed
    docker stop $DB_HOST  2> /dev/null && docker rm $DB_HOST 2> /dev/null
    sudo rm -rf $DB_DATA_DIR/*
    docker run -d \
        --name=$DB_HOST \
        --net=$DOCKER_NETWORK_NAME \
        -e MYSQL_ROOT_PASSWORD=$DB_USER \
        -e MYSQL_USER=$DB_USER \
        -e MYSQL_PASSWORD=$DB_PASSWORD \
        -e MYSQL_DATABASE=$DB_PORTAL_DB_NAME \
        -v "$DB_DATA_DIR:/var/lib/mysql/" \
        -v "/tmp/cgds.sql:/docker-entrypoint-initdb.d/cgds.sql:ro" \
        -v "/tmp/seed.sql.gz:/docker-entrypoint-initdb.d/seed_part1.sql.gz:ro" \
        mysql:5.7

    sleeptime=0
    maxtime=180
    while ! docker run --rm --net=$DOCKER_NETWORK_NAME mysql:5.7 mysqladmin ping -u $DB_USER -p$DB_PASSWORD -h$DB_HOST --silent; do
        echo Waiting for cbioportal database to initialize...
        sleeptime=$sleeptime+10
        if (($sleeptime > $maxtime)); then
            echo Timeout reached. Terminating test!
            exit 1
        fi
        sleep 10
    done

    # migrate database schema to most recent version
    echo Migrating database schema to most recent version ...
    docker run --rm \
        --net=$DOCKER_NETWORK_NAME \
        -v "$TEST_HOME/local/runtime-config/portal.properties:/cbioportal/portal.properties:ro" \
        $BACKEND_IMAGE_NAME \
        python3 /cbioportal/core/src/main/scripts/migrate_db.py -y -p /cbioportal/portal.properties -s /cbioportal/db-scripts/src/main/resources/migration.sql
}

run_database_container() {
    # when seed database has been loaded, create a container that does
    # not depend on the seed data to be present in /tmp (this benefits local testing only)
    (docker stop $DB_HOST && docker rm $DB_HOST) || true
    docker run -d \
        --name=$DB_HOST \
        --net=$DOCKER_NETWORK_NAME \
        -e MYSQL_ROOT_PASSWORD=$DB_USER \
        -e MYSQL_USER=$DB_USER \
        -e MYSQL_PASSWORD=$DB_PASSWORD \
        -e MYSQL_DATABASE=$DB_PORTAL_DB_NAME \
        -v "$DB_DATA_DIR:/var/lib/mysql/" \
        mysql:5.7

}

run_cbioportal_container() {

    # stop cbioportal container if running
   (docker stop $E2E_CBIOPORTAL_HOST_NAME && docker rm $E2E_CBIOPORTAL_HOST_NAME) || true

    # start cbioportal
    # port 8081 opened for development in Local context
    docker run -d --restart=always \
        --name=$E2E_CBIOPORTAL_HOST_NAME \
        --net=$DOCKER_NETWORK_NAME \
        -v "$TEST_HOME/local/runtime-config/portal.properties:/cbioportal/portal.properties:ro" \
        -e JAVA_OPTS="-Xms2g -Xmx4g -Dauthenticate=false" \
        -p 8081:8080 \
        $BACKEND_IMAGE_NAME \
        /bin/sh -c 'java ${JAVA_OPTS} -jar webapp-runner.jar /app.war'

    sleeptime=0
    maxtime=180
    while ! docker run --rm --net=$DOCKER_NETWORK_NAME busybox ping -c 1 "$E2E_CBIOPORTAL_HOST_NAME" &> /dev/null; do
        echo Waiting for cbioportal to initialize...
        sleeptime=$sleeptime+10
        if (($sleeptime > $maxtime)); then
            echo Timeout reached. Terminating test!
            exit 1
        fi
        sleep 10
    done

}

load_studies_in_db() {

    # import study_es_0 gene panels
    docker run --rm \
        --name=cbioportal-importer \
        --net=$DOCKER_NETWORK_NAME \
        -v "$TEST_HOME/local/runtime-config/portal.properties:/cbioportal/portal.properties:ro" \
        $BACKEND_IMAGE_NAME \
        sh -c 'cd /cbioportal/core/src/main/scripts; for FILE in /cbioportal/core/src/test/scripts/test_data/study_es_0/data_gene_panel_testpanel*.txt; do ./importGenePanel.pl --data $FILE; done'

    # import study_es_0
    docker run --rm \
        --name=cbioportal-importer \
        --net=$DOCKER_NETWORK_NAME \
        -v "$TEST_HOME/local/runtime-config/portal.properties:/cbioportal/portal.properties:ro" \
        $BACKEND_IMAGE_NAME \
        python3 /cbioportal/core/src/main/scripts/importer/metaImport.py \
        --url_server "http://$E2E_CBIOPORTAL_HOST_NAME:8080" \
        --study_directory /cbioportal/core/src/test/scripts/test_data/study_es_0 \
        --override_warning

    # import custom studies
    for DIR in "$TEST_HOME"/local/studies/*/; do

        docker run --rm \
            --name=cbioportal-importer \
            --net=$DOCKER_NETWORK_NAME \
            -v "$TEST_HOME/local/runtime-config/portal.properties:/cbioportal/portal.properties:ro" \
            -v "$DIR:/study:ro" \
            $BACKEND_IMAGE_NAME \
            python3 /cbioportal/core/src/main/scripts/importer/metaImport.py \
            --url_server "http://$E2E_CBIOPORTAL_HOST_NAME:8080" \
            --study_directory /study \
            --override_warning

    done

}

download_db_seed() {
    # download db schema and seed data
    curdir=$PWD
    cd /tmp
    curl $DB_CGDS_URL > cgds.sql
    curl $DB_SEED_URL > seed.sql.gz
    cd $curdir
}

run_session_service() {
    docker stop mongoDB && docker rm mongoDB
    docker run -d --name=mongoDB --net=$DOCKER_NETWORK_NAME \
        -e MONGO_INITDB_DATABASE=session_service \
        mongo:4.0

    docker stop $SESSION_SERVICE_HOST_NAME && docker rm $SESSION_SERVICE_HOST_NAME
    docker run -d --name=$SESSION_SERVICE_HOST_NAME --net=$DOCKER_NETWORK_NAME \
        -e SERVER_PORT=5000 \
        -e JAVA_OPTS="-Dspring.data.mongodb.uri=mongodb://mongoDB:27017/session-service" \
    cbioportal/session-service:latest
}

build_e2e_image() {
    CUR_DIR=$PWD
    cp $TEST_HOME/local/docker/Dockerfile.screenshottest $PORTAL_SOURCE_DIR
    cd $PORTAL_SOURCE_DIR
    docker build -f Dockerfile.screenshottest -t $SCREENSHOT_IMAGE_NAME .
    cd $CUR_DIR
}

if [ "$BUILD_PORTAL" = true ]; then

    echo Build portal image
    $TEST_HOME/local/docker/build_portal_image.sh

fi

if [ "$BUILD_DATABASE" = true ]; then

    echo Setup database container, import seed and migrate schema
    build_database_container

    echo Run cbioportal container
    run_cbioportal_container

    echo Load studies into local database
    load_studies_in_db

fi

if [ "$BUILD_E2E" = true ]; then

    echo Build e2e-image
    build_e2e_image

fi

echo Run database container
run_database_container

# echo Start session service
# run_session_service

echo Run/restart cbioportal container
run_cbioportal_container

exit 0
