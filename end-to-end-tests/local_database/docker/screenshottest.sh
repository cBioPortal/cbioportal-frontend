#!/usr/bin/env bash

set -e 
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails

cd /cbioportal-frontend
yarn serveDistLocalDb &
cd /cbioportal-frontend/end-to-end-tests
echo UPDATE WEBDRIVER-MANAGER && ./node_modules/webdriver-manager/bin/webdriver-manager update --versions.chrome "2.42"
echo START WEBDRIVER-MANAGER && ./node_modules/webdriver-manager/bin/webdriver-manager start --versions.chrome "2.42" &
echo PROBE CBIOPORTAL && curl $CBIOPORTAL_URL > /dev/null
sleep 5s
echo PROBE CBIOPORTAL && curl $CBIOPORTAL_URL > /dev/null
sleep 5s
echo PROBE CBIOPORTAL && curl $CBIOPORTAL_URL > /dev/null
sleep 20s
echo PROBE FRONTEND SERVER && (curl --insecure https://localhost:3000 || curl http://localhost:3000) > /dev/null
echo RUN E2E-TESTS && cd /cbioportal-frontend/end-to-end-tests && yarn run e2e-localdb