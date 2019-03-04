#!/usr/bin/env bash

set -e

# evaluate the pull request number. This is sometimes not set by CirclCI 
if [[ -z "$CIRCLE_PR_NUMBER" ]]; then
    if [[ "$CIRCLE_PULL_REQUEST" =~ \/([0-9]+)$ ]] ; then
        CIRCLE_PR_NUMBER=${BASH_REMATCH[1]}
        echo export CIRCLE_PR_NUMBER=${BASH_REMATCH[1]}
    else
        echo "Error: could not identify pull request number (CIRCLE_PULL_REQUEST: '$CIRCLE_PULL_REQUEST')."
        exit 1
    fi
fi

python3 get_pullrequest_info.py $CIRCLE_PR_NUMBER
# retrieves
    # FRONTEND_BRANCH_NAME          ->  (e.g. 'superawesome_feature_branch')
    # FRONTEND_COMMIT_HASH          ->  (e.g. '3as8sAs4')
    # FRONTEND_ORGANIZATION         ->  (e.g. 'thehyve')
    # FRONTEND_REPO_NAME            ->  (e.g. 'cbioportal-frontend')
    # FRONTEND_BASE_BRANCH_NAME     ->  (e.g. 'rc')
    # FRONTEND_BASE_COMMIT_HASH     ->  (e.g. '34hh9jad')
    # FRONTEND_BASE_ORGANIZATION    ->  (e.g. 'cbioportal')
    # FRONTEND_BASE_REPO_NAME       ->  (e.g. 'cbioportal-frontend)
    # BACKEND_ORGANIZATION          ->  (e.g. 'cbioportal')
    # BACKEND_BRANCH_NAME           ->  (e.g. 'rc')

python3 read_portalproperties.py portal.properties
# retrieves
    # DB_USER                       ->  (e.g. 'cbio_user')
    # DB_PASSWORD                   ->  (e.g. 'cbio_pass')
    # DB_PORTAL_DB_NAME             ->  (e.g. 'endtoend_local_cbiodb')
    # DB_CONNECTION_STRING          ->  (e.g. 'jdbc:mysql://cbiodb-endtoend:3306/')
    # DB_HOST                       ->  (e.g. 'cbiodb-endtoend')

exit 0