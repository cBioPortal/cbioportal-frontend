export BACKEND=cbioportal:master
export PORTAL_SOURCE_DIR=$(pwd) # change path if needed
export DB_DATA_DIR=/tmp/mysql # change path if needed
export TEST_HOME="$PORTAL_SOURCE_DIR/end-to-end-test"
export CHROMEDRIVER_VERSION=83.0.4103.39
export CBIOPORTAL_URL='http://localhost:8081'
