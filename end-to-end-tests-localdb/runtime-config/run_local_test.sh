#!/usr/bin/env bash

set -e

# Activate options below to simulate different CircleCI job contexts

## 1. Uncomment to simulate CircleCI job:
# export CIRCLECI=true
# export CIRCLE_PROJECT_USERNAME=thehyve
# export CIRCLE_SHA1=$(git rev-parse HEAD 2> /dev/null | sed "s/\(.*\)/\1/")

## 2. Uncomment to simulate pull request context (replace '8' with valid PR number)
# export CIRCLE_PULL_REQUEST=/8

export PORTAL_SOURCE_DIR=~/git/cbioportal-frontend
export TEST_HOME=$PORTAL_SOURCE_DIR/end-to-end-tests-localdb
export FRONTEND_TEST_USE_LOCAL_DIST=true
docker network create endtoend_localdb_network 2> /dev/null
cd ~/git/cbioportal-frontend/
yarn
yarn build
cd ~/git/cbioportal-frontend/end-to-end-tests-localdb/runtime-config
./setup_environment.sh && eval "$(./setup_environment.sh)"
cd ../docker && ./setup_docker_containers.sh
cd .. && ./runtime-config/run_screenshot_test.sh
