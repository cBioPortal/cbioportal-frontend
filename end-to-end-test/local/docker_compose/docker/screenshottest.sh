#!/usr/bin/env bash

set -e
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails

export FRONTEND_TEST_USE_LOCAL_DIST=true
export HEADLESS_CHROME=true

echo START SERVE_DIST
cd /cbioportal-frontend
yarn serveDistLocalDb &

cd /cbioportal-frontend/end-to-end-test

echo UPDATE WEBDRIVER-MANAGER
./node_modules/webdriver-manager/bin/webdriver-manager update --versions.chrome '70.0.3538.110' --versions.standalone '3.141.59' --gecko false
echo START WEBDRIVER-MANAGER
./node_modules/webdriver-manager/bin/webdriver-manager start --versions.chrome '70.0.3538.110' --versions.standalone '3.141.59' &

echo PROBE FRONTEND SERVER
(curl --insecure https://localhost:3000 || curl http://localhost:3000) > /dev/null

echo PROBE SELENIUM
until $(curl --output /dev/null --silent --fail http://localhost:4444); do
    printf '.'
    sleep 5
done
echo PROBE SELENIUM - SUCCESS

echo RUN E2E-TESTS
yarn run test-webdriver-manager-local
