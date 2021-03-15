#!/usr/bin/env bash

set -e
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails
shopt -s nullglob # allows files and dir globs to be null - needed in 'for ... do' loops that should not run when no files/dirs are detected by expansion

DIR=$PWD

cd $E2E_WORKSPACE/cbioportal-docker-compose

compose_extensions="-f docker-compose.yml -f $TEST_HOME/docker_compose/cbioportal.yml -f $TEST_HOME/docker_compose/keycloak.yml"
if [ $CUSTOM_BACKEND -eq 1 ]; then
  compose_extensions="$compose_extensions -f $TEST_HOME/docker_compose/cbioportal-custombranch.yml"
fi

if (ls "$KC_DB_DATA_DIR"/* 2> /dev/null > /dev/null); then
  compose_extensions="$compose_extensions -f $TEST_HOME/docker_compose/keycloak_init.yml"
fi

# initiate keycloak and get idp-client-metadata
docker-compose $compose_extensions up -d keycloak
healthy=
for i in {1..30}; do
    [[ $(curl --write-out '%{http_code}' --silent --output /dev/null http://localhost:8081) == 200 ]] && { healthy=1; break; } || echo "Waiting for Keycloak service                    ..."
    sleep 10s
done
[ -z "$healthy" ] && { echo "Error starting Keycloak service."; exit 1; } || echo "Waiting for Keycloak service                    ... done"

rm -rf $E2E_WORKSPACE/keycloak/idp-metadata.xml
wget -O $E2E_WORKSPACE/keycloak/idp-metadata.xml http://localhost:8081/auth/realms/cbio/protocol/saml/descriptor

docker-compose $compose_extensions up -d

healthy=
for i in {1..30}; do
    [[ $(curl --write-out '%{http_code}' --silent --output /dev/null http://localhost:8080/api/health) == 200 ]] && { healthy=1; break; } || echo "Waiting for cBioPortal services                 ..."
    sleep 30s
done
[ -z "$healthy" ] && { echo "Error starting cBioPortal services."; exit 1; } || echo "Waiting for cBioPortal services                 ... done"

cd $PWD

exit 0
