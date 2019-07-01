#!/usr/bin/env bash

set -e

DIR=$PWD

echo RUN E2E-TESTS
cd $TEST_HOME
yarn run test-webdriver-manager-debug || true # continue even when tests fail

cd $DIR
