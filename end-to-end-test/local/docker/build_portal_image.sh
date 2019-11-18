#!/usr/bin/env bash

set -e 
set -u
set -o pipefail

# rc, master and tagged releases (e.g. 3.0.1) of cbioportal are available as prebuilt images
# build a image of a specified backend if no prebuilt image exists
if [[ $BACKEND_IMAGE_NAME == $CUSTOM_BACKEND_IMAGE_NAME ]]; then
    docker build https://github.com/$BACKEND_PROJECT_USERNAME/cbioportal.git#$BACKEND_BRANCH \
        -f docker/web-and-data/Dockerfile \
        -t $BACKEND_IMAGE_NAME
else
    docker pull $BACKEND_IMAGE_NAME
fi