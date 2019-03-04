#!/usr/bin/env bash

set -e 
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails

CUR_DIR=$PWD

cp $TEST_HOME/local_database/docker/Dockerfile.screenshottest $PORTAL_SOURCE_DIR
cd $PORTAL_SOURCE_DIR
docker build -f Dockerfile.screenshottest -t cbioportal:screenshot .
docker run --network="$DOCKER_NETWORK_NAME" -e CBIOPORTAL_URL=$CBIOPORTAL_URL cbioportal:screenshot

cd $CUR_DIR
exit 0