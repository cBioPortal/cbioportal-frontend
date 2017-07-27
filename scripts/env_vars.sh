#!/usr/bin/env bash
# eval output of this file to get appropriate env variables e.g. eval "$(./env_vars.sh)"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "export CBIOPORTAL_URL=http://$(grep '__API_ROOT__' ${SCRIPT_DIR}/../my-index.ejs | cut -d= -f2 | tr -d "'" | tr -d [:space:] | tr -d ';')"
