#!/usr/bin/env bash
# Check if output files in dist/ are the same as committed files
set -e
GREEN='\033[0;32m'
RED='\033[0;31m'

echo "TESTING: Check if current dist/ is same as committed dist/"

# test contents of files
( find dist | xargs git diff --quiet -- ) || \
	(echo -e "${RED}ERROR: Output dist/ differs from committed dist/" && exit 1)

# test number of files
OUTPUT_DIST=$(find dist/ -type f | wc -l)
COMMIT_DIST=$(git ls-files dist/ | wc -l)
( test  ${OUTPUT_DIST} -eq ${COMMIT_DIST} ) || \
	(echo -e "${RED}ERROR: Number of files in output dist/ differs from committed dist/: ${OUTPUT_DIST} vs ${COMMIT_DIST} respectively" && exit 1)

echo -e "${GREEN}SUCCESS: Output dist/ is the same as commited dist/"
