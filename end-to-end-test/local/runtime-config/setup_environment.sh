#!/usr/bin/env bash

set -e

# -+-+-+-+-+-+-+ ENVIRONMENTAL VARIABLES +-+-+-+-+-+-+-

echo export CBIOPORTAL_URL="http://localhost:8080"
echo export SCREENSHOT_DIRECTORY=./local/screenshots
echo export JUNIT_REPORT_PATH=./local/junit/
echo export SPEC_FILE_PATTERN=./local/specs/**/*.spec.js
echo export CBIO_DB_DATA_DIR=$E2E_WORKSPACE/cbio_db_data
echo export KC_DB_DATA_DIR=$E2E_WORKSPACE/kc_db_data

echo export DB_CGDS_URL=https://raw.githubusercontent.com/cBioPortal/cbioportal/v2.0.0/db-scripts/src/main/resources/cgds.sql
echo export DB_SEED_URL=https://raw.githubusercontent.com/cBioPortal/datahub/master/seedDB/seed-cbioportal_hg19_v2.7.3.sql.gz

# -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-

parse_custom_backend_var() {
    # Parse BACKEND environmental variable. This must occur after PR evaluation
    if [[ $BACKEND =~ (.+):(.+) ]]; then
        BACKEND_PROJECT_USERNAME=${BASH_REMATCH[1]}
        echo "export BACKEND_PROJECT_USERNAME=${BASH_REMATCH[1]}"
        BACKEND_BRANCH=${BASH_REMATCH[2]}
        echo "export BACKEND_BRANCH=${BASH_REMATCH[2]}"
    else
        echo "Error: could not parse BACKEND variable from custom.sh. Expected format: <BACKEND_GITHUB_USER>:<BACKEND_BRANCH> (e.g. 'cbioportal:rc')"
        exit 1
    fi
}

# Check whether running in CircleCI environment
if [[ "$CIRCLECI" = true ]]; then

    # Check whether running in context of a pull request
    # by extracting the pull request number
    if [[ "$CIRCLE_PULL_REQUEST" =~ \/([0-9]+)$ ]] ; then
        
        GITHUB_PR_API_PATH="${CIRCLE_PULL_REQUEST/github\.com\//api\.github\.com\/repos/}"
        GITHUB_PR_API_PATH="${GITHUB_PR_API_PATH/\/pull\//\/pulls\/}"

        python3 $TEST_HOME/../shared/get_pullrequest_info.py $GITHUB_PR_API_PATH
        eval $(python3 $TEST_HOME/../shared/get_pullrequest_info.py $GITHUB_PR_API_PATH)

        # Only allow committing a BACKEND variable in custom.sh if the PR is in
        # draft state. We do allow setting custom.sh programmatically on CI (as
        # is done in the backend repo), which is why we use `git show`.
        if git show HEAD:env/custom.sh | grep -q BACKEND && [[ $PULL_REQUEST_STATE != "draft" ]]; then
            echo "Error: BACKEND variable defined in custom.sh, but pull request state is not 'draft'"
            echo "Remove BACKEND variable from custom.sh or change the pull request into a draft pull request."
            exit 1
        fi

    fi

    # Check whether custom BACKEND environmental var is defined (required when running outside context of a pull request on CircleCI)
    # When the current branch is master or rc continue using corresponding master or rc backend, respectively. 
    if [[ -z $BACKEND ]]; then
        if [[ -z $CIRCLE_PULL_REQUEST ]]; then
            if [[ "$CIRCLE_BRANCH" = "master" ]] || [[ "$CIRCLE_BRANCH" = "rc" ]] || [[ "$CIRCLE_BRANCH" == "release-"* ]]; then
                BACKEND_PROJECT_USERNAME="cbioportal"
                echo "export BACKEND_PROJECT_USERNAME=$BACKEND_PROJECT_USERNAME"
                BACKEND_BRANCH="$CIRCLE_BRANCH"
                echo "export BACKEND_BRANCH=$BACKEND_BRANCH"
            else
                echo Error: BACKEND environmental variable not set in /env/custom.sh for this feature branch. This is required when running outside context of a pull request on CircleCI.
                exit 1
            fi
        fi
    else
        parse_custom_backend_var
    fi

    echo export FRONTEND_SHA1=$CIRCLE_SHA1
    echo export FRONTEND_SHA1_SHORT=$(echo $CIRCLE_SHA1 | awk '{print substr($0,0,10)}')
    echo export FRONTEND_PROJECT_USERNAME=$CIRCLE_PROJECT_USERNAME
    echo export FRONTEND_GROUPID=com.github.$CIRCLE_PROJECT_USERNAME

else
    # When not running in CircleCI environment, check whether custom BACKEND environmental var is defined (required when running outside CircleCI context)
    if [[ -z $BACKEND ]]; then
        echo Error: BACKEND environmental variable not set in /env/custom.sh. This is required when running outside the CircleCI environment.
        exit 1
    else
        parse_custom_backend_var
    fi

    FRONTEND_SHA1=$(git rev-parse HEAD 2> /dev/null | sed "s/\(.*\)/\1/")
    echo export FRONTEND_SHA1=$FRONTEND_SHA1
    echo export FRONTEND_SHA1_SHORT=$(echo $FRONTEND_SHA1 | awk '{print substr($0,0,10)}')

    FRONTEND_PROJECT_USERNAME=$(git config --local remote.origin.url|sed -n "s#.*/\([^.]*\)/.*#\1#p")
    echo export FRONTEND_PROJECT_USERNAME=$FRONTEND_PROJECT_USERNAME
    echo export FRONTEND_GROUPID=com.github.$FRONTEND_PROJECT_USERNAME
fi

# Evaluate whether a custom backend image should be built
# rc, master and tagged releases (e.g. 3.0.1) of cbioportal are available as prebuilt images
# update the reference to the corresponding image name when prebuilt image exists
(([[ $BACKEND_PROJECT_USERNAME == "cbioportal" ]] && ( [[ $BACKEND_BRANCH == "rc" ]] || [[ $BACKEND_BRANCH == "master" ]] || [[ $BACKEND_BRANCH =~ [0-9.]+ ]] )) && echo export CUSTOM_BACKEND=0) || echo export CUSTOM_BACKEND=1
echo export DOCKER_IMAGE_CBIOPORTAL="cbioportal/cbioportal:master"
