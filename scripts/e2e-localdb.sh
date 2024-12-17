#!/bin/sh
set -e

TEST_REPO_URL="https://github.com/cBioPortal/cbioportal-test.git"

# Create a temp dir and clone test repo
ROOT_DIR=$(pwd)
TEMP_DIR=$(mktemp -d)
git clone "$TEST_REPO_URL" "$TEMP_DIR/cbioportal-test" || exit 1
cd "$TEMP_DIR/cbioportal-test" || exit 1

# Start backend
./scripts/docker-compose.sh --portal_type='web-and-data' --docker_args='-d'

# Wait for backend at localhost:8080
./utils/check-connection.sh --url=localhost:8080

# Import studies into backend
./scripts/import-data.sh --seed="$SEED" --schema="$SCHEMA" --studies="$STUDIES"

# Build frontend
printf "\nBuilding frontend ...\n\n"
cd "$FRONTEND_SRC" || exit 1
export BRANCH_ENV=master
yarn run build

# Start frontend http server, delete if previous server exists
if [ -e "/var/tmp/cbioportal-pid" ]; then
  pkill -F /var/tmp/cbioportal-pid
fi
nohup ./node_modules/http-server/bin/http-server --cors dist/ -p 3000 > /dev/null 2>&1 &
echo $! > /var/tmp/cbioportal-pid

# Wait for frontend at localhost:3000
printf "\nVerifying frontend connection ...\n\n"
cd "$TEMP_DIR/cbioportal-test" || exit 1
./utils/check-connection.sh --url=localhost:3000

# Build e2e localdb tests
cd "$FRONTEND_SRC/end-to-end-test" || exit 1
yarn --ignore-engines

# Run e2e localdb tests
cd "$FRONTEND_SRC" || exit 1
yarn run e2e:local

# Cleanup
cd "$ROOT_DIR" || exit 1
rm -rf "$TEMP_DIR"