export BACKEND=cbioportal:master
export PORTAL_SOURCE_DIR=$(pwd) # change path if needed
export CBIO_DB_DATA_DIR=$E2E_WORKSPACE/cbio_db_data # change path if needed
export TEST_HOME="$PORTAL_SOURCE_DIR/end-to-end-test"
export CHROMEDRIVER_VERSION=83.0.4103.39
export CBIOPORTAL_URL='http://localhost:8081'
