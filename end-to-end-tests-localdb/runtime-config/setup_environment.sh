#!/usr/bin/env bash

set -e

# -+-+-+-+-+-+-+ ENVIRONMENTAL VARS +-+-+-+-+-+-+-

# TODO !!!! change back to cbioportal -->
export GITHUB_PR_API_PATH="https://api.github.com/repos/thehyve/cbioportal-frontend/pulls"
echo export GITHUB_PR_API_PATH=$GITHUB_PR_API_PATH

echo export E2E_CBIOPORTAL_HOST_NAME=cbioportal
echo export CBIOPORTAL_URL="http://cbioportal:8080/cbioportal"
echo export DOCKER_NETWORK_NAME=endtoend_localdb_network
echo export SESSION_SERVICE_HOST_NAME=cbio-session-service
echo export SCREENSHOT_IMAGE_NAME=cbio-screenshot
echo export SCREENSHOT_DIRECTORY=./screenshots
echo export JUNIT_REPORT_PATH=./junit/
echo export SPEC_FILE_PATTERN=./specs/**/*.spec.js

echo export DB_CGDS_URL=https://raw.githubusercontent.com/cBioPortal/cbioportal/v2.0.0/db-scripts/src/main/resources/cgds.sql
echo export DB_SEED_URL=https://raw.githubusercontent.com/cBioPortal/datahub/master/seedDB/seed-cbioportal_hg19_v2.7.3.sql.gz

# -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-

# Notes on BACKEND variable
# For e2e testing against a local database the version of the cbioportal backend must be known.
# The cbioportal backend version is passed as the BACKEND environmental variable.
# BACKEND variable is formatted as <BACKEND_GITHUB_USER>:<BACKEND_BRANCH> (e.g. BACKEND=cbioportal:rc) in the /env/custom.sh file
# Requirement for setting the BACKEND variable depends on the context of the job:
# | **context**             | **BACKEND env** | **comments**
# | local                   | required        |
# | CircleCI                | required        | 
# | CircleCI pull request   | optional        | 1. When specified, GitHub PR must be of 'draft' state (prevents merge of branches that require a non-accepted backend version) 2. When not-specified, backend branch will mirror frontend branch (rc frontend vs. rc backend)

parse_custom_backend_var() {
    # Parse BRACKEND environmental variable. This must occur after PR evaluation
    # because this possibly overwrites variables extracted from the GitHub pull request.
    if [[ $BACKEND =~ ([^\s]+):([^\s]+) ]]; then
        echo "export BACKEND_USER=${BASH_REMATCH[1]}"
        echo "export BACKEND_BRANCH=${BASH_REMATCH[2]}"
        echo "export FRONTEND_GROUPID=com.github.${BASH_REMATCH[1]}"
    else
        echo Error: could not parse BACKEND variable from custom.sh. Expected format: <BACKEND_GITHUB_USER>:<BACKEND_BRANCH> (e.g. 'cbioportal:rc')
        exit 1
    fi
}

# Check whether running in CircleCI environment
if [[ $CIRCLECI ]]; then

    # Check whether running in context of a pull request
    # by extracting the pull request number
    if [[ "$CIRCLE_PULL_REQUEST" =~ \/([0-9]+)$ ]] ; then
        CIRCLE_PR_NUMBER=$F{BASH_REMATCH[1]}
        echo export CIRCLE_PR_NUMBER=${BASH_REMATCH[1]}
        python3 get_pullrequest_info.py $CIRCLE_PR_NUMBER $GITHUB_PR_API_PATH
        # retrieves
            # PULL_REQUEST_STATE        ->  (e.g. 'draft')
            # FRONTEND_BASE_BRANCH      ->  (e.g. 'rc')
            # FRONTEND_GROUPID          ->  (e.g. 'com.github.cbioportal')
            # BACKEND_USER              ->  (e.g. 'cbioportal')
            # BACKEND_BRANCH            ->  (e.g. 'rc')
        
        # Check whether the pull request is of 'draft' state when BACKEND is specified in custom.sh 
        # This requirement ensures that only pull requests against a accepted backend are merged
        if [[ -n $BACKEND ]] && [[ $PULL_REQUEST_STATE != "draft" ]]; then
            echo "Error: `BACKEND` parameter defined in custom.sh, but pull request state is not 'draft'"
            echo "Remove `BACKEND` parameter from custom.sh or change the pull request into a draft pull request."
        fi

    fi

    # Check whether custom BACKEND environmental var is defined (required when running outside context of a pull request on CircleCI)
    if [[ -z $BACKEND ]]; then
        if [[ -z $CIRCLE_PR_NUMBER ]]; then
            echo Error: BACKEND environmental variable not set in /env/custom.sh. This is required when running outside context of a pull request on CircleCI.
            exit 1
        fi
    else
        parse_custom_backend_var
    fi


else
    # When not running in CircleCI environment, check whether custom BACKEND environmental var is defined (required when running outside CircleCI context)
    if [[ -z $BACKEND ]]; then
        echo Error: BACKEND environmental variable not set in /env/custom.sh. This is required when running outside the CircleCI environment.
        exit 1
    else
        parse_custom_backend_var
    fi
fi

python3 read_portalproperties.py portal.properties
# retrieves
    # DB_USER                       ->  (e.g. 'cbio_user')
    # DB_PASSWORD                   ->  (e.g. 'cbio_pass')
    # DB_PORTAL_DB_NAME             ->  (e.g. 'endtoend_local_cbiodb')
    # DB_CONNECTION_STRING          ->  (e.g. 'jdbc:mysql://cbiodb-endtoend:3306/')
    # DB_HOST                       ->  (e.g. 'cbiodb-endtoend')

exit 0