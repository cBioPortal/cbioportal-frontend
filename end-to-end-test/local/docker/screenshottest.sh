#!/usr/bin/env bash

set -e
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails

echo INSTALL SCREENSHOT DEPENDENCIES
cd /cbioportal-frontend/end-to-end-test
yarn install --frozen-lockfile

echo START SERVE_DIST
cd /cbioportal-frontend
yarn
yarn buildModules
yarn serveDistLocalDb &

cd /cbioportal-frontend/end-to-end-test

echo UPDATE WEBDRIVER-MANAGER
./node_modules/webdriver-manager/bin/webdriver-manager update --versions.chrome '70.0.3538.110' --versions.standalone '3.141.59'

echo START WEBDRIVER-MANAGER
./node_modules/webdriver-manager/bin/webdriver-manager start --versions.chrome '70.0.3538.110' --versions.standalone '3.141.59' &

# echo PROBE CBIOPORTAL
# curl $CBIOPORTAL_URL > /dev/null
# sleep 5s
# curl $CBIOPORTAL_URL > /dev/null
# sleep 5s
# curl $CBIOPORTAL_URL > /dev/null
# sleep 20s

echo PROBE FRONTEND SERVER
(curl --insecure https://localhost:3000 || curl http://localhost:3000) > /dev/null

echo PROBE SELENIUM
until $(curl --output /dev/null --silent --fail http://localhost:4444); do
    printf '.'
    sleep 5
done
echo PROBE SELENIUM - SUCCESS

echo RUN E2E-TESTS
cd /cbioportal-frontend/end-to-end-test
yarn run test-webdriver-manager-debug
