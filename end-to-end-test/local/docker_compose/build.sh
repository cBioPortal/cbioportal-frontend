#!/usr/bin/env bash

set -e
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails

DIR=$PWD

mkdir -p $E2E_WORKSPACE
cd $E2E_WORKSPACE
git clone --depth 1 --branch $BACKEND_BRANCH --single-branch https://github.com/$BACKEND_PROJECT_USERNAME/cbioportal.git
cd cbioportal
mvn -DskipTests clean install
unzip portal/target/cbioportal*.war -d portal/target/war-exploded

cd $PWD

exit 0
