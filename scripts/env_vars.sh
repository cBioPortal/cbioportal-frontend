#!/usr/bin/env bash
# eval output of this file to get appropriate env variables e.g. eval "$(./env_vars.sh)"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "export CBIOPORTAL_URL=http://$(grep 'apiRoot' ${SCRIPT_DIR}/../my-index.ejs | cut -d: -f2 | cut -d, -f1 | tr -d "'" | tr -d [:space:] | tr -d ';')"
echo "export GENOME_NEXUS_URL=http://$(grep 'genomeNexusApiUrl' ${SCRIPT_DIR}/../my-index.ejs | cut -d: -f2 | cut -d, -f1 | tr -d "'" | tr -d [:space:] | tr -d ';')"
