#!/usr/bin/env bash

set -e
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails

echo INSTALL cavas deps [necessary for visual regression framework]
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

echo INSTALL SCREENSHOT DEPENDENCIES
cd /cbioportal-frontend/end-to-end-test2
yarn install --frozen-lockfile

echo START SERVE_DIST
cd /cbioportal-frontend
yarn
yarn buildModules
yarn serveDistLocalDb &

cd /cbioportal-frontend/end-to-end-test2

echo UPDATE WEBDRIVER-MANAGER
./node_modules/webdriver-manager/bin/webdriver-manager update --versions.chrome "2.42"

echo START WEBDRIVER-MANAGER
./node_modules/webdriver-manager/bin/webdriver-manager start --versions.chrome "2.42" &

# echo PROBE CBIOPORTAL
# curl $CBIOPORTAL_URL > /dev/null
# sleep 5s
# curl $CBIOPORTAL_URL > /dev/null
# sleep 5s
# curl $CBIOPORTAL_URL > /dev/null
# sleep 20s

echo PROBE FRONTEND SERVER
(curl --insecure https://localhost:3000 || curl http://localhost:3000) > /dev/null

echo RUN E2E-TESTS
cd /cbioportal-frontend/end-to-end-test2
yarn run wdio