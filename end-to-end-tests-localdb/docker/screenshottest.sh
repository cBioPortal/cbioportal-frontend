#!/usr/bin/env bash

set -e 
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails

echo INSTALL SCREENSHOT DEPENDENCIES
cd /cbioportal-frontend/end-to-end-tests-localdb
yarn install --frozen-lockfile

echo START SERVE_DIST
cd /cbioportal-frontend
yarn serveDistLocalDb &

cd /cbioportal-frontend/end-to-end-tests-localdb

echo UPDATE WEBDRIVER-MANAGER
./node_modules/webdriver-manager/bin/webdriver-manager update --versions.chrome "2.42"

echo START WEBDRIVER-MANAGER
./node_modules/webdriver-manager/bin/webdriver-manager start --versions.chrome "2.42" &

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
cd /cbioportal-frontend/end-to-end-tests-localdb
yarn run test-webdriver-manager || true # continue even when tests fail

echo COMPARE IMAGES
cd /cbioportal-frontend/end-to-end-tests-localdb
for f in $SCREENSHOT_DIRECTORY/reference/*.png; do
    git ls-files --error-unmatch $f > /dev/null 2> /dev/null || (echo -e "\033[0;31m $f not tracked \033[0m" && touch screenshots_not_tracked)
done
exit ! ls screenshots_not_tracked > /dev/null 2> /dev/null