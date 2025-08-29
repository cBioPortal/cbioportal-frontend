#!/usr/bin/env bash

set -e
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails


# Install dependencies
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    curl \
    lsb-release \
    libappindicator3-1 \
    && rm -rf /var/lib/apt/lists/*

# Install Chrome 139.0.7258.154
RUN wget -q https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_139.0.7258.154-1_amd64.deb \
    && dpkg -i google-chrome-stable_139.0.7258.154-1_amd64.deb || apt-get install -yf \
    && rm google-chrome-stable_139.0.7258.154-1_amd64.deb

# Install ChromeDriver 139.0.7258.154
RUN wget -q https://storage.googleapis.com/chrome-for-testing-public/139.0.7258.154/linux64/chromedriver-linux64.zip \
    && unzip chromedriver-linux64.zip \
    && mv chromedriver-linux64/chromedriver /usr/local/bin/ \
    && chmod +x /usr/local/bin/chromedriver \
    && rm -rf chromedriver-linux64.zip chromedriver-linux64

# Verify installations
RUN google-chrome --version && chromedriver --version

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
