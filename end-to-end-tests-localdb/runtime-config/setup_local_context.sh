#!/usr/bin/env bash

set -e

BUILD_JS=true
BUILD_PORTAL=true
BUILD_DATABASE=true
BUILD_E2E=true

while getopts "pdej" opt; do
  case "${opt}" in
    d) BUILD_DATABASE=false
    ;;
    p) BUILD_PORTAL=false
    ;;
    e) BUILD_E2E=false
    ;;
    j) BUILD_JS=false
    ;;
    \?) echo "Invalid option -$OPTARG" >&2
    ;;
  esac
done

if [[ -z $PORTAL_SOURCE_DIR ]]; then
    echo "Error: please point `PORTAL_SOURCE_DIR` env-var to the cbioportal-frontend git repo directory on your system."
    echo "E.g. run 'export PORTAL_SOURCE_DIR=~/git/cbioportal-frontend' in terminal (change path if needed)"
    exit 1
fi

# Uncomment options below to simulate CircleCI contexts
## 1. Uncomment to simulate `CircleCI` context job:
# export CIRCLECI=true
# export CIRCLE_PROJECT_USERNAME=thehyve
# export CIRCLE_SHA1=$(git rev-parse HEAD 2> /dev/null | sed "s/\(.*\)/\1/")

## 2. Uncomment to simulate CircleCI+PR context (replace '8' with valid PR number)
# export CIRCLE_PULL_REQUEST=/8

export TEST_HOME=$PORTAL_SOURCE_DIR/end-to-end-tests-localdb
export FRONTEND_TEST_USE_LOCAL_DIST=true
export NO_PARALLEL=true

DIR=$PWD
cd $PORTAL_SOURCE_DIR

if $BUILD_JS; then
    yarn
    yarn build
fi

docker network create $DOCKER_NETWORK_NAME 2> /dev/null || true

if [ "$BUILD_DATABASE" = false ]; then
    dflag="-d"
fi
if [ "$BUILD_PORTAL" = false ]; then
    pflag="-p"
fi
if [ "$BUILD_E2E" = false ]; then
    eflag="-e"
fi

cd $TEST_HOME/docker && ./setup_docker_containers.sh $dflag $pflag $eflag

cd $PORTAL_SOURCE_DIR

cd $PORTAL_SOURCE_DIR/end-to-end-tests-localdb
yarn install --frozen-lockfile

echo START SERVE_DIST
cd $PORTAL_SOURCE_DIR
yarn
yarn serveDistLocalDb &

cd $PORTAL_SOURCE_DIR/end-to-end-tests-localdb

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

cd $DIR
