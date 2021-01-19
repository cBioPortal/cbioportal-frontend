#!/usr/bin/env bash

set -e
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails
shopt -s nullglob # allows files and dir globs to be null - needed in 'for ... do' loops that should not run when no files/dirs are detected by expansion

DIR=$PWD

cd $TEST_HOME/local/docker_compose/cbioportal-docker-compose

compose_extensions="-f docker-compose.yml -f ../cbioportal.yml -f ../keycloak.yml"
if [[ -n $BACKEND_BUILD_URL ]]; then
  compose_extensions="$compose_extensions -f ../cbioportal-custombranch.yml"
fi

docker-compose $compose_extensions up -d

cd $PWD

exit 0
