eval "$(./localdb_env_vars.sh)"
source $PORTAL_SOURCE_DIR/env/custom.sh
cd $TEST_HOME/local/runtime-config
eval "$(./setup_environment.sh)"
cd $PORTAL_SOURCE_DIR

$TEST_HOME/local/runtime-config/setup_local_context.sh -p -d -e # remove flags to exclude specific stages if desired (see below)
cd $PORTAL_SOURCE_DIR



#During rebuilding of the development environment the developer can specify which stept should be executed by providing
# -j (building of frontent code),
# -d (building of database),
# -p (building of cbioportal)
# -e (building of e2e service) flags to the setup_local_context.sh script. For instance, to rebuild the database and start all containers the script can be executed as:
