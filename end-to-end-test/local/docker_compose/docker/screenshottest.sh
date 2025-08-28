#!/usr/bin/env bash

set -e
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails

apt-get update
apt-get install -y lsb-release libappindicator3-1 curl

# Install Chrome
curl -L -o google-chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
dpkg -i google-chrome.deb
sed -i 's|HERE/chrome"|HERE/chrome" --no-sandbox|g' /opt/google/chrome/google-chrome
rm google-chrome.deb

# Get Chrome version and install matching chromedriver
CHROME_VERSION=$(google-chrome --version | cut -d ' ' -f3 | cut -d '.' -f1-3)
echo "Chrome version: $CHROME_VERSION"

# Get the matching chromedriver version
CHROMEDRIVER_VERSION=$(curl -s "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_$CHROME_VERSION")
echo "ChromeDriver version: $CHROMEDRIVER_VERSION"

# Download and install chromedriver
curl -L -o chromedriver.zip "https://chromedriver.storage.googleapis.com/$CHROMEDRIVER_VERSION/chromedriver_linux64.zip"
unzip chromedriver.zip
chmod +x chromedriver
mv chromedriver /usr/local/bin/
rm chromedriver.zip



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
