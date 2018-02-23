#!/usr/bin/env bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd ${DIR}/../screenshots
if (ls diff/*.png 2> /dev/null > /dev/null); then
    references=()
    for diff in diff/*.png; do
        reference=${diff/diff/reference}
        references=( ${references[@]} $reference )
        echo "FAILED SCREENSHOT TEST: ${reference}"
    done

    echo "var errorImages = '${references[@]}'.split(' ')" > ${DIR}/errors.js


    if [[ ${TRAVIS} || ${CIRCLECI} ]]; then
        echo "${YELLOW}See Artifacts tab above for image comparison UI (imageCompare.html)${NC}"
    else
        repo_url=file://${PWD}/../..
        echo -e "${GREEN}COPY+PASTE in BROWSER TO COMPARE FAILED SCREENSHOTS: ${YELLOW}${repo_url}/end-to-end-tests/imageCompare.html${NC}";
    fi


fi
exit 1 # always exit 1 since we are assuming that you call this when screenshots have failed
