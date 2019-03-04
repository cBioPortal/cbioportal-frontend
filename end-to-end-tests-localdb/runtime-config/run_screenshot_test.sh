#!/usr/bin/env bash

set -e 
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails

CUR_DIR=$PWD
cd $PORTAL_SOURCE_DIR
docker run --rm \
    --name screenshot-e2e \
    --network="$DOCKER_NETWORK_NAME" \
    -e CBIOPORTAL_URL="$CBIOPORTAL_URL" \
    -e SCREENSHOT_DIRECTORY="$SCREENSHOT_DIRECTORY"\
    -e SPEC_FILE_PATTERN="$SPEC_FILE_PATTERN" \
    -e JUNIT_REPORT_PATH="$JUNIT_REPORT_PATH" \
    -v "$PORTAL_SOURCE_DIR:/cbioportal-frontend/" \
    $SCREENSHOT_IMAGE_NAME

cd $CUR_DIR
exit 0