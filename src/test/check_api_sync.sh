#!/usr/bin/env bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

run_and_check_diff() {
    local cmd="$1"
    local files="$2"
    local msg="$3"
    local return_code=0

    eval "$cmd"
    for f in $files; do
        git diff --quiet $f || (git checkout -- $f && echo -e "${RED}$f $msg${NC}" && exit 1)
        return_code=$(($return_code + $?))
    done

    return $return_code
}
# dir of bash script http://stackoverflow.com/questions/59895
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# move to root dir
cd ${DIR}/../..

echo "Test if docs used to generate API are same as those in repo (fail with exit code > 0)"
OUT_OF_SYNC_MSG="out of sync"
sync_error_count=0
run_and_check_diff 'yarn run fetchAPI' 'packages/cbioportal-ts-api-client/src/generated/CBioPortalAPI-docs.json packages/cbioportal-ts-api-client/src/generated/CBioPortalAPIInternal-docs.json' "${OUT_OF_SYNC_MSG}"
if [[ $? -gt 0 ]]; then
    sync_error_count=$(($sync_error_count + 1))
fi
run_and_check_diff 'yarn run fetchOncoKbAPI' packages/oncokb-ts-api-client/src/generated/OncoKbAPI-docs.json "${OUT_OF_SYNC_MSG}"
if [[ $? -gt 0 ]]; then
    sync_error_count=$(($sync_error_count + 1))
fi
run_and_check_diff 'yarn run fetchGenomeNexusAPI' packages/genome-nexus-ts-api-client/src/generated/GenomeNexusAPI-docs.json "${OUT_OF_SYNC_MSG}"
if [[ $? -gt 0 ]]; then
    sync_error_count=$(($sync_error_count + 1))
fi
TS_GEN_MSG="generation of typescript client differs compared to checked in version"
echo "Test if docs generate the same TS client as the one stored in the repo (fail with exit code > 0)"
generation_error_count=0
run_and_check_diff 'yarn run buildAPI' 'packages/cbioportal-ts-api-client/src/generated/CBioPortalAPI.ts packages/cbioportal-ts-api-client/src/generated/CBioPortalAPIInternal.ts' "${TS_GEN_MSG}"
if [[ $? -gt 0 ]]; then
    generation_error_count=$(($generation_error_count + 1))
fi
run_and_check_diff 'yarn run buildOncoKbAPI' packages/oncokb-ts-api-client/src/generated/OncoKbAPI.ts "${TS_GEN_MSG}"
if [[ $? -gt 0 ]]; then
    generation_error_count=$(($generation_error_count + 1))
fi
exit $(($generation_error_count + $sync_error_count))
run_and_check_diff 'yarn run buildGenomeNexusAPI' packages/genome-nexus-ts-api-client/src/generated/GenomeNexusAPI.ts "${TS_GEN_MSG}"
if [[ $? -gt 0 ]]; then
    generation_error_count=$(($generation_error_count + 1))
fi
exit $(($generation_error_count + $sync_error_count))
