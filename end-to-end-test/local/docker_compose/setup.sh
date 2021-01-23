#!/usr/bin/env bash

set -e
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails
shopt -s nullglob # allows files and dir globs to be null - needed in 'for ... do' loops that should not run when no files/dirs are detected by expansion

DIR=$PWD

cd $TEST_HOME/local/docker_compose
git clone https://github.com/cBioPortal/cbioportal-docker-compose.git
cd cbioportal-docker-compose

compose_extensions="-f docker-compose.yml -f ../cbioportal.yml"
if [[ -n "$BACKEND_BUILD_URL" ]]; then
  compose_extensions="$compose_extensions -f ../cbioportal-custombranch.yml"
fi

# add permissions for test studies to testuser
config_json="$(cat ../keycloak/keycloak-config.json)"
studies=$(find $TEST_HOME/local/studies -name meta_study.txt -exec grep cancer_study_identifier {} \; | awk 'NF>1{print $NF}')
studies=("study_es_0" $studies)
studies_json_array=$(printf '%s\n' "${studies[@]}" | jq -R . | jq -s .)
studies_json_object=$(jq '[.[] | {name: .}]' <<< $studies_json_array)
config_json=$(jq '.roles.client.cbioportal='"$studies_json_object" <<< $config_json)
config_json=$(jq '(.groups[] | select (.name == "PUBLIC_STUDIES") | .clientRoles.cbioportal) = '"$studies_json_array" <<< $config_json)
echo 'Creating realm ... (see keycloak-config-generated.json for settings)'
echo "$config_json" > ../keycloak/keycloak-config-generated.json

echo "docker-compose $compose_extensions build"
docker-compose $compose_extensions build

cd $PWD

exit 0
