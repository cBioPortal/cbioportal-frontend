#!/usr/bin/env bash

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

if [[ -d "diff/" ]]; then
    diffs_uploaded=()
    screenshots_uploaded=()
    references=()

    # upload screenshots
    for diff in diff/*.png; do
        screenshot=${diff/diff/screen}
        reference=${diff/diff/reference}
        references=( ${references[@]} $reference )
        diffs_uploaded=( ${diffs_uploaded[@]} "$(upload_image $diff)" )
        screenshots_uploaded=( ${screenshots_uploaded[@]} "$(upload_image $screenshot)" )
    done

	# show dev how to download failing test screenshots
	echo -e "${RED}SCREENSHOT TESTS FAILED!${NC}"
	echo "TO DOWNLOAD FAILING SCREENSHOTS TO LOCAL REPO ROOT RUN:"
	for ((i=0; i < ${#screenshots_uploaded[@]}; i++)); do
        reference=${references[$i]}
		url=${screenshots_uploaded[$i]}
		echo "curl '"${url}"' > end-to-end-tests/screenshots/${reference}"
	done

    if [[ ${TRAVIS} || ${CIRCLECI} ]]; then
        echo "OR CHECK OUT FAILED SCREENSHOTS ONLINE:"
        for ((i=0; i < ${#screenshots_uploaded[@]}; i++)); do
            reference=${references[$i]}
            url=${screenshots_uploaded[$i]}
            diff_url=${diffs_uploaded[$i]}
            if [[ ${TRAVIS} ]]; then
                repo_url=${TRAVIS_REPO_SLUG}/${TRAVIS_COMMIT}
                branch=${TRAVIS_BRANCH}
            fi
            if [[ ${CIRCLECI} ]]; then
                repo_url=${CIRCLE_PROJECT_USERNAME}/${CIRCLE_PROJECT_REPONAME}/${CIRCLE_SHA1}
                branch=${CIRCLE_BRANCH}
            fi
            original_screenshot_url="https://raw.githubusercontent.com/${repo_url}/end-to-end-tests/screenshots/${reference}"
            echo -e "COPY+PASTE in BROWSER TO COMPARE FAILED SCREENSHOT: ${YELLOW}http://rawgit.com/${repo_url}/end-to-end-tests/screenshots/image-compare/index.html?img1=${original_screenshot_url}&img2=${url}&label1=${branch}&label2=$(git rev-parse --short HEAD)&screenshot_name=end-to-end-tests/screenshots/${reference}&diff_img=${diff_url}${NC}"
        done
    fi

    exit 1;
fi
exit 0
