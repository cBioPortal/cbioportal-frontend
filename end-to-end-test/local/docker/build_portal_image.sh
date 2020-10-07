#!/usr/bin/env bash

set -e 
set -u
set -o pipefail

# rc, master and tagged releases (e.g. 3.0.1) of cbioportal are available as prebuilt images
# build a image of a specified backend if no prebuilt image exists
if [[ $BACKEND_IMAGE_NAME == $CUSTOM_BACKEND_IMAGE_NAME ]]; then
   dir=$PWD
   git clone "https://github.com/$BACKEND_PROJECT_USERNAME/cbioportal.git"
   cd $BACKEND_SOURCE_DIR
   git fetch --all
   git checkout -b $BACKEND_BRANCH origin/$BACKEND_BRANCH
   mvn clean install -DskipTests
   unzip $BACKEND_SOURCE_DIR/portal/target/cbioportal*.war -d $BACKEND_SOURCE_DIR/portal/target/war-exploded
   cd $PWD
else
    docker pull $BACKEND_IMAGE_NAME
fi