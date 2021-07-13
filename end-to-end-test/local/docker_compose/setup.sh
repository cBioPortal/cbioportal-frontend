#!/usr/bin/env bash

set -e
set -u # unset variables throw error
set -o pipefail # pipes fail when partial command fails

DIR=$PWD

mkdir -p $E2E_WORKSPACE
mkdir -p $E2E_WORKSPACE/keycloak
cd $E2E_WORKSPACE
git clone https://github.com/cBioPortal/cbioportal-docker-compose.git
cd cbioportal-docker-compose

# update keycloak config with permissions for test studies
config_json="$(cat $TEST_HOME/docker_compose/keycloak/keycloak-config.json)"
studies=$(find $TEST_HOME/studies -name meta_study.txt -exec grep cancer_study_identifier {} \; | awk 'NF>1{print $NF}')
studies=(study_es_0 coadread_tcga_pub acc_tcgaa $studies)
studies_json_array=$(printf '%s\n' "${studies[@]}" | jq -R . | jq -s .)
studies_json_object=$(jq '[.[] | {name: .}]' <<< $studies_json_array)
config_json=$(jq '.roles.client.cbioportal='"$studies_json_object" <<< $config_json)
config_json=$(jq '(.groups[] | select (.name == "PUBLIC_STUDIES") | .clientRoles.cbioportal) = '"$studies_json_array" <<< $config_json)
echo 'Creating realm ... (see keycloak-config-generated.json for settings)'
echo "$config_json" > ../keycloak/keycloak-config-generated.json

cd $PWD

exit 0
