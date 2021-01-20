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

# initiate keycloak and get idp-client-metadata
docker-compose $compose_extensions up -d keycloak
for i in {1..30}; do
    [[ $(curl --write-out '%{http_code}' --silent --output /dev/null http://localhost:8081) == 200 ]] && { healthy=1; break; } || echo "Waiting for Keycloak service..."
    sleep 10s
done
[ -z "$healthy" ] && { echo "Error starting Keycloak service."; exit 1; } || echo "Successful deploy."

rm -rf ../keycloak/idp-metadata.xml
wget -O ../keycloak/idp-metadata.xml http://localhost:8081/auth/realms/cbio/protocol/saml/descriptor

docker-compose $compose_extensions up -d

cd $PWD

exit 0
