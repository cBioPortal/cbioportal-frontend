#!/usr/bin/env bash

set -e 
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails
shopt -s nullglob # allows files and dir globs to be null - needed in 'for ... do' loops that should not run when no files/dirs are detected by expansion

BUILD_PORTAL=true
BUILD_DATABASE=true
BUILD_E2E=true

while getopts "pde" opt; do
  case "${opt}" in
    d) BUILD_DATABASE=false
    ;;
    p) BUILD_PORTAL=false
    ;;
    e) BUILD_E2E=false
    ;;
    \?) echo "Invalid option -$OPTARG" >&2
    ;;
  esac
done

build_database_container() {
    # create local database from with cbioportal db and seed data
    download_db_seed
    docker stop $DB_HOST  2> /dev/null && docker rm $DB_HOST 2> /dev/null
    docker volume rm MYSQL_DATA_DIR 2> /dev/null || true # empty database
    docker run -d \
        --name=$DB_HOST \
        --net=$DOCKER_NETWORK_NAME \
        -e MYSQL_ROOT_PASSWORD=$DB_USER \
        -e MYSQL_USER=$DB_USER \
        -e MYSQL_PASSWORD=$DB_PASSWORD \
        -e MYSQL_DATABASE=$DB_PORTAL_DB_NAME \
        -v "MYSQL_DATA_DIR:/var/lib/mysql/" \
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
        -v "MYSQL_DATA_DIR:/var/lib/mysql/" \
        mysql:5.7

    # migrate database schema to most recent version
    echo Migrating database schema to most recent version ...
    docker run --rm \
        --net=$DOCKER_NETWORK_NAME \
        -v "$TEST_HOME/runtime-config/portal.properties:/cbioportal/portal.properties:ro" \
        cbioportal-endtoend-image \
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
        -v "MYSQL_DATA_DIR:/var/lib/mysql/" \
        mysql:5.7

}

build_cbioportal_image() {

    curdir=$PWD
    
    cd /tmp
    rm -rf cbioportal
    git clone --depth 1 -b $BACKEND_BRANCH "https://github.com/$BACKEND_PROJECT_USERNAME/cbioportal.git"
    docker stop $E2E_CBIOPORTAL_HOST_NAME 2> /dev/null && docker rm $E2E_CBIOPORTAL_HOST_NAME  2> /dev/null
    cp $TEST_HOME/docker/Dockerfile cbioportal
    cp $TEST_HOME/runtime-config/portal.properties cbioportal
    cd cbioportal
    # docker build -f Dockerfile.local -t cbioportal-backend-endtoend .
    docker rm cbioportal-endtoend-image 2> /dev/null || true
    cp $TEST_HOME/docker/catalina_server.xml.patch .
    docker build -f Dockerfile -t cbioportal-endtoend-image . \
        --build-arg MAVEN_OPTS="-Dfrontend.version=$FRONTEND_SHA1_SHORT -Dfrontend.groupId=$FRONTEND_GROUPID" \
        --build-arg SESSION_SERVICE_HOST_NAME=$SESSION_SERVICE_HOST_NAME

    cd $curdir
}

run_cbioportal_container() {

    # stop cbioportal container if running
   (docker stop $E2E_CBIOPORTAL_HOST_NAME && docker rm $E2E_CBIOPORTAL_HOST_NAME) || true

    # start cbioportal
    # port 8081 opened for development in Local context
    docker run -d --restart=always \
        --name=$E2E_CBIOPORTAL_HOST_NAME \
        --net=$DOCKER_NETWORK_NAME \
        -v "$TEST_HOME/runtime-config/portal.properties:/cbioportal/portal.properties:ro" \
        -e CATALINA_OPTS='-Xms2g -Xmx4g' \
        -p 8081:8080 \
        cbioportal-endtoend-image
    
    sleeptime=0
    maxtime=180
    while ! docker run --rm --net=$DOCKER_NETWORK_NAME cbioportal-endtoend-image ping -c 1 "$E2E_CBIOPORTAL_HOST_NAME" &> /dev/null; do
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
        -v "$TEST_HOME/runtime-config/portal.properties:/cbioportal/portal.properties:ro" \
        cbioportal-endtoend-image \
        sh -c 'cd /cbioportal/core/src/main/scripts; for FILE in /cbioportal/core/src/test/scripts/test_data/study_es_0/data_gene_panel_testpanel*.txt; do ./importGenePanel.pl --data $FILE; done'

    # # import study_es_0 gene sets
    # docker run --rm \
    #     --name=cbioportal-importer \
    #     --net=$DOCKER_NETWORK_NAME \
    #     -v "$TEST_HOME/runtime-config/portal.properties:/cbioportal/portal.properties:ro" \
    #     cbioportal-endtoend-image \
    #     sh -c 'cd /cbioportal/core/src/main/scripts; yes yes | ./importGenesetData.pl --data ../../test/resources/genesets/study_es_0_genesets.gmt \ --new-version msigdb_6.1 --supp ../../test/resources/genesets/study_es_0_supp-genesets.txt;  yes yes | ./importGenesetHierarchy.pl --data ../../test/resources/genesets/study_es_0_tree.yaml'

    # import study_es_0
    docker run --rm \
        --name=cbioportal-importer \
        --net=$DOCKER_NETWORK_NAME \
        -v "$TEST_HOME/runtime-config/portal.properties:/cbioportal/portal.properties:ro" \
        cbioportal-endtoend-image \
        python3 /cbioportal/core/src/main/scripts/importer/metaImport.py \
        --url_server "http://$E2E_CBIOPORTAL_HOST_NAME:8080/cbioportal" \
        --study_directory /cbioportal/core/src/test/scripts/test_data/study_es_0 \
        --override_warning

    # import custom studies
    for DIR in "$TEST_HOME"/studies/*/; do

        docker run --rm \
            --name=cbioportal-importer \
            --net=$DOCKER_NETWORK_NAME \
            -v "$TEST_HOME/runtime-config/portal.properties:/cbioportal/portal.properties:ro" \
            -v "$DIR:/study:ro" \
            cbioportal-endtoend-image \
            python3 /cbioportal/core/src/main/scripts/importer/metaImport.py \
            --url_server "http://$E2E_CBIOPORTAL_HOST_NAME:8080/cbioportal" \
            --study_directory /study \
            --override_warning
    done

}

check_jitpack_download_frontend() {
    # check whether jitpack versions for the frontend exist
    # url="https://jitpack.io/com/github/$FRONTEND_PROJECT_USERNAME/cbioportal-frontend/$FRONTEND_SHA1/cbioportal-frontend-$FRONTEND_SHA1.jar"
    # # trigger build
    # curl -s --head $url | head -n 0
    FRONTEND_SHA1_SHORT=$(echo $FRONTEND_SHA1 | awk '{print substr($0,0,10)}')
    url_short="https://jitpack.io/com/github/$FRONTEND_PROJECT_USERNAME/cbioportal-frontend/$FRONTEND_SHA1_SHORT/cbioportal-frontend-$FRONTEND_SHA1_SHORT.jar"
    sleeptime=0
    maxtime=1200
    while (($sleeptime < $maxtime)); do
        if !(curl -s --head $url_short | head -n 1 | egrep "HTTP/[0-9.]+ 200"); then
            echo "Waiting... ($url_short)"
            sleep 10
            sleeptime=$sleeptime+10
        else
            sleeptime=maxtime+1
        fi
    done

    if !(curl -s --head $url_short | head -n 1 | egrep "HTTP/[0-9.]+ 200"); then
        echo "Could not find frontend .jar (version: $FRONTEND_SHA1, org: $FRONTEND_PROJECT_USERNAME) at jitpack (url: $url_short)"
        exit 1
    fi
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

    docker stop cbio-session-service && docker rm cbio-session-service
    docker run -d --name=cbio-session-service --net=$DOCKER_NETWORK_NAME -p 8084:8080 \
        -e JAVA_OPTS="-Dspring.data.mongodb.uri=mongodb://mongoDB:27017/session-service" \
        thehyve/cbioportal-session-service:cbiov2.1.0
}

build_e2e_image() {
    CUR_DIR=$PWD
    cp $TEST_HOME/docker/Dockerfile.screenshottest $PORTAL_SOURCE_DIR
    cd $PORTAL_SOURCE_DIR
    docker build -f Dockerfile.screenshottest -t $SCREENSHOT_IMAGE_NAME .
    cd $CUR_DIR
}

if [ "$BUILD_PORTAL" = true ]; then

    echo Wait for JitPack download of frontend code
    check_jitpack_download_frontend

    echo Build portal image
    build_cbioportal_image

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

echo Start session service
run_session_service

echo Run/restart cbioportal container
run_cbioportal_container

exit 0