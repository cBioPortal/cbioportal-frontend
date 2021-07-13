#!/usr/bin/env bash

set -e
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails

#echo INSTALL SCREENSHOT DEPENDENCIES
#cd /cbioportal-frontend/end-to-end-test
#yarn install --frozen-lockfile

export FRONTEND_TEST_USE_LOCAL_DIST=true
export HEADLESS_CHROME=true

echo START SERVE_DIST
cd /cbioportal-frontend
yarn serveDistLocalDb &

cd /cbioportal-frontend/end-to-end-test

echo PROBE CBIOPORTAL
curl $CBIOPORTAL_URL > /dev/null
sleep 5s
curl $CBIOPORTAL_URL > /dev/null
sleep 5s
curl $CBIOPORTAL_URL > /dev/null
sleep 20s

echo PROBE FRONTEND SERVER
(curl --insecure https://localhost:3000 || curl http://localhost:3000) > /dev/null

echo RUN E2E-TESTS
cd /cbioportal-frontend/end-to-end-test
yarn run test-webdriver-manager-local
