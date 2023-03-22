#!/usr/bin/env bash

MY_PATH="`dirname \"$0\"`"              # relative
MY_PATH="`( cd \"$MY_PATH\" && pwd )`"  # absolutized and normalized
if [ -z "$MY_PATH" ] ; then
  # error; for some reason, the path is not accessible
  # to the script (e.g. permissions re-evaled after suid)
  exit 1  # fail
fi


# check for docker
DOCKER_RESP=$(docker version)
if grep -q "Is the docker daemon running?" <<< "$DOCKER_RESP"; then
  echo "You need to start the docker daemon"
  exit 1 #fail
fi

# check for jq
JQ_RESP=$(which jq)
if [ ${#JQ_RESP} -eq 0 ]; then
  echo "You need to install the jq package (brew install jq)"
  exit 1 #fail
fi


SPIN_UP=false

while true; do
    read -p "Do you wish to build containers? (default=no) " yn
    case $yn in
        [Yy]* ) SPIN_UP=true;break;;
        [Nn]* ) break;;
        * ) break;;
    esac
done

echo $SPIN_UP;


export PORTAL_SOURCE_DIR=$PWD;

export TEST_HOME=$PORTAL_SOURCE_DIR/end-to-end-test/local
export E2E_WORKSPACE=$PORTAL_SOURCE_DIR/e2e-localdb-workspace
export DB_DATA_DIR=$E2E_WORKSPACE/cbio_db_data

cd $PORTAL_SOURCE_DIR

export BACKEND=cbioportal:master
export BRANCH_ENV="http://localhost:8080"
export GENOME_NEXUS_URL="https://www.genomenexus.org"

echo "$TEST_HOME"

cat <<< $($TEST_HOME/runtime-config/setup_environment.sh)
$($TEST_HOME/runtime-config/setup_environment.sh)

if [[ "$(uname -s)" == "Darwin" ]] && [[ "$(sysctl -n machdep.cpu.brand_string)" =~ M.* ]]; then
  # if macOS and M-series chip, use images for ARM architecture
  export DOCKER_IMAGE_MYSQL=biarms/mysql:5.7
  export DOCKER_IMAGE_SESSION_SERVICE=fuzhaoyuan/session-service:0.5.0
else
  # else use images for x86_64 architecture
  export DOCKER_IMAGE_MYSQL=mysql:5.7
fi

if [ "$SPIN_UP" = "true" ]
then
  #cleanup
  sudo rm -rf $E2E_WORKSPACE/kc_db_data
  sudo rm -rf $E2E_WORKSPACE/cbioportal-docker-compose
  sudo rm -rf $E2E_WORKSPACE/cbio_db_data

  $TEST_HOME/docker_compose/setup.sh
  [ $CUSTOM_BACKEND -eq 1 ] && $TEST_HOME/docker_compose/build.sh
  mkdir -p $E2E_WORKSPACE/cbio_db_data
  $TEST_HOME/docker_compose/initdb.sh
fi

$TEST_HOME/docker_compose/start.sh

export CBIOPORTAL_URL=http://localhost:8080

cd end-to-end-test
