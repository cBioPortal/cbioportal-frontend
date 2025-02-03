#!/usr/bin/env bash

set -e
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails

export FRONTEND_TEST_USE_LOCAL_DIST=false
export HEADLESS_CHROME=false

cd /cbioportal-frontend
yarn serveDistLocalDb &

cd /cbioportal-frontend/
cd /cbioportal-frontend/end-to-end-test

echo PROBE CBIOPORTAL
curl $CBIOPORTAL_URL > /dev/null
sleep 5
curl $CBIOPORTAL_URL > /dev/null
sleep 5
curl $CBIOPORTAL_URL > /dev/null
sleep 20

echo PROBE FRONTEND SERVER
(curl --insecure https://localhost:3000 || curl http://localhost:3000) > /dev/null

echo RUN E2E-TESTS
cd /cbioportal-frontend/end-to-end-test
yarn run test-webdriver-manager-local
