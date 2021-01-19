#!/usr/bin/env bash

set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails

CUR_DIR=$PWD

cd $TEST_HOME/local/docker_compose/docker
docker build -f Dockerfile.screenshottest -t cbio-screenshottest .

cd $PORTAL_SOURCE_DIR
docker run -it --rm \
    --network=cbio-net \
    -e CBIOPORTAL_URL="$CBIOPORTAL_URL" \
    -e SCREENSHOT_DIRECTORY="$SCREENSHOT_DIRECTORY"\
    -e SPEC_FILE_PATTERN="$SPEC_FILE_PATTERN" \
    -e JUNIT_REPORT_PATH="$JUNIT_REPORT_PATH" \
    -v "$PORTAL_SOURCE_DIR:/cbioportal-frontend/" \
    cbio-screenshottest

status=$?

if [[ "$status" -eq 0 ]]; then
    echo Succes!!!!! E2e-test test completed without errors.
else
    echo Error!!!!! E2e-test test completed with errors.
fi

cd $CUR_DIR

exit $status