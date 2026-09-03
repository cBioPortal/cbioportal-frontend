#!/bin/sh
# Spin up the localdb cBioPortal backend for the Playwright local e2e
# suite. Mirrors the relevant pieces of scripts/e2e.sh but:
#   - clones into a fixed working dir under /tmp/cbio-localdb so the
#     keycloak-config volume and the backend itself stay alive across
#     test runs (the upstream script wipes its temp dir at exit).
#   - leaves the containers detached and exits 0 once the backend reports
#     healthy.
#
# Usage:
#   STUDIES="..." ./start-backend.sh
#   KEYCLOAK=false ./start-backend.sh   (skip keycloak)
set -e

KEYCLOAK="${KEYCLOAK:-true}"
CLICKHOUSE="${CLICKHOUSE:-true}"
DOCKER_COMPOSE_REF="${DOCKER_COMPOSE_REF:-master}"
TEST_REPO_REF="${TEST_REPO_REF:-main}"
STUDIES="${STUDIES:-ascn_test_study study_hg38 teststudy_genepanels study_es_0 lgg_ucsf_2014_test_generic_assay}"

ROOT_DIR=$(cd -- "$(dirname -- "$0")" && cd ../../.. && pwd)
APPLICATION_PROPERTIES_PATH=$ROOT_DIR/end-to-end-test/local/runtime-config/portal.properties
WORK_DIR=${CBIO_LOCALDB_WORKDIR:-/tmp/cbio-localdb}

mkdir -p "$WORK_DIR"

if [ ! -d "$WORK_DIR/cbioportal-test" ]; then
  git clone --depth 1 -b "$TEST_REPO_REF" \
    https://github.com/cBioPortal/cbioportal-test.git \
    "$WORK_DIR/cbioportal-test"
fi
if [ ! -d "$WORK_DIR/cbioportal-docker-compose" ]; then
  git clone --depth 1 -b "$DOCKER_COMPOSE_REF" \
    https://github.com/cBioPortal/cbioportal-docker-compose.git \
    "$WORK_DIR/cbioportal-docker-compose"
fi

export DOCKER_IMAGE_MYSQL=cbioportal/mysql:8.0-database-test
export APPLICATION_PROPERTIES_PATH
export DOCKER_IMAGE_CBIOPORTAL=cbioportal/cbioportal:master
export APP_CBIOPORTAL_CORE_BRANCH=main
export DOCKER_COMPOSE_REF

cd "$WORK_DIR/cbioportal-test"

if [ "$KEYCLOAK" = "true" ]; then
  ./utils/gen-keycloak-config.sh \
    --studies="$STUDIES" \
    --template="$WORK_DIR/cbioportal-docker-compose/dev/keycloak/keycloak-config.json" \
    --out='keycloak-config-generated.json'
  export KEYCLOAK_CONFIG_PATH="$WORK_DIR/cbioportal-test/keycloak-config-generated.json"
fi

if [ "$KEYCLOAK" = "true" ]; then
  if [ "$CLICKHOUSE" = "true" ]; then
    COMPOSE_EXTENSIONS='-f addon/clickhouse/docker-compose.remote.clickhouse.yml'
  else
    COMPOSE_EXTENSIONS=''
  fi
  ./scripts/docker-compose.sh --portal_type='keycloak' \
    --compose_extensions="$COMPOSE_EXTENSIONS" --docker_args='-d'

  ./utils/check-connection.sh --url=localhost:8081 --max_retries=50
else
  ./scripts/docker-compose.sh --portal_type='web-and-data' --docker_args='-d'
fi

./utils/check-connection.sh --url=localhost:8080/api/health --max_retries=50

echo "Backend up: http://localhost:8080"
