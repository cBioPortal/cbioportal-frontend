#!/usr/bin/env bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

upload_image() {
    local png=${1}

    # curl -s -F "clbin=@$png" https://clbin.com
    # clbin.com is down, using ptpb.pw instead
    curl -F "c=@$png" https://ptpb.pw/ | grep url | cut -d' ' -f2
}


cd ${DIR}/../screenshots
if (ls diff/*.png 2> /dev/null > /dev/null); then
    references=()
    refs_uploaded=()
    diffs_uploaded=()
    screenshots_uploaded=()

    for diff in diff/*.png; do
        reference=${diff/diff/reference}
        references=( ${references[@]} $reference )

        echo $reference

        # upload screenshots when using Travis or Circle CI
        if [[ ${TRAVIS} || ${CIRCLECI} || ${LOCALTESTING} ]]; then
            screenshot=${diff/diff/screen}
            echo "Full path to image being uploaded $(readlink -f $diff)"
            diffs_uploaded=( ${diffs_uploaded[@]} "$(upload_image $diff)" )
            refs_uploaded=( ${refs_uploaded[@]} "$(upload_image $reference)" )
            screenshots_uploaded=( ${screenshots_uploaded[@]} "$(upload_image $screenshot)" )
        fi
    done

    echo "var errorImages = '${references[@]}'.split(' ')" > ${DIR}/errors.js


	# show dev how to download failing test screenshots
	echo -e "${RED}SCREENSHOT TESTS FAILED!${NC}"
    if [[ ${TRAVIS} || ${CIRCLECI} || ${LOCALTESTING} ]]; then
        echo "TO DOWNLOAD FAILING SCREENSHOTS TO LOCAL REPO ROOT RUN:"
        for ((i=0; i < ${#references[@]}; i++)); do
            reference=${references[$i]}
            url=${screenshots_uploaded[$i]}
            echo "curl '"${url}"' > end-to-end-tests/screenshots/${reference}"
        done
    fi

    if [[ ${TRAVIS} || ${CIRCLECI} || ${LOCALTESTING} ]]; then
        echo "var screenImages = '${screenshots_uploaded[@]}'.split()" > ${DIR}/screens.js
        echo "var referenceImages = '${references[@]}'.split()" > ${DIR}/references.js
        echo "var diffImages = '${diffs_uploaded[@]}'.split()" > ${DIR}/diffs.js
    fi

    echo "CHECK OUT FAILED SCREENSHOTS:"
	for ((i=0; i < ${#references[@]}; i++)); do
        reference=${references[$i]}

        if [[ ${TRAVIS} || ${CIRCLECI} ]]; then
            ref_url=${refs_uploaded[$i]}
            diff_url=${diffs_uploaded[$i]}
            url=${screenshots_uploaded[$i]}
            if [[ ${TRAVIS} ]]; then
                repo_url=http://rawgit.com/${TRAVIS_REPO_SLUG}/${TRAVIS_COMMIT}
            else
                repo_url=http://rawgit.com/${CIRCLE_PROJECT_USERNAME}/${CIRCLE_PROJECT_REPONAME}/${CIRCLE_SHA1}
            fi
        else
            repo_url=file://${PWD}/../..
            ref_url=../screenshots/${reference}
            url=../screenshots/${reference/reference/screen}
            diff_url=../screenshots/${reference/reference/diff}
        fi
        echo -e "COPY+PASTE in BROWSER TO COMPARE FAILED SCREENSHOT: ${YELLOW}${repo_url}/end-to-end-tests/image-compare/index.html?img1=${ref_url}&img2=${url}&label1=reference&label2=$(git rev-parse --short HEAD)&screenshot_name=end-to-end-tests/screenshots/${reference}&diff_img=${diff_url}${NC}"
    done
fi
exit 1 # always exit 1 since we are assuming that you call this when screenshots have failed
