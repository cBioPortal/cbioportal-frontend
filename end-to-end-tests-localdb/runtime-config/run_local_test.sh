#!/usr/bin/env bash

set -e
set -v

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
yarn
yarn build
source $PORTAL_SOURCE_DIR/env/custom.sh
cd $TEST_HOME/runtime-config
eval "$(./setup_environment.sh)"
docker network create $DOCKER_NETWORK_NAME 2> /dev/null || true
cd $TEST_HOME/docker && ./setup_docker_containers.sh
cd $TEST_HOME && ./runtime-config/run_screenshot_test.sh
cd DIR
