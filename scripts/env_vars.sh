#!/usr/bin/env bash
# eval output of this file to get appropriate env variables e.g. eval "$(./env_vars.sh)"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
RED='\033[0;31m'
NC='\033[0m'

github_api_get() {
    # Remote Playwright runs many shards concurrently. Keep this lookup
    # resilient to transient GitHub API failures and rate limiting.
    curl -fsSL --retry 3 --retry-all-errors --retry-delay 1 \
        --connect-timeout 5 --max-time 15 "$1" 2>/dev/null
}

if [[ -n "${CIRCLECI:-}" ]]; then
    PR_BRANCH="${CIRCLE_BRANCH:-}"
    PR_NUMBER="${CIRCLE_PR_NUMBER:-}"
    PR_URL="${CIRCLE_PULL_REQUEST:-}"

    # Same-repository PRs do not consistently get CIRCLE_PR_NUMBER, but
    # CircleCI does provide CIRCLE_PULL_REQUEST in those builds.
    if [[ -z "$PR_NUMBER" && "$PR_URL" =~ /pull/([0-9]+) ]]; then
        PR_NUMBER="${BASH_REMATCH[1]}"
    fi

    # Some CircleCI contexts expose the literal string "null" for unset
    # values. Never allow it to become an env/null.sh path.
    [[ "$PR_BRANCH" == "null" ]] && PR_BRANCH=""
    [[ "$PR_NUMBER" == "null" ]] && PR_NUMBER=""

    # CircleCI only populates CIRCLE_PR_NUMBER for PRs from forks. For
    # same-repo PRs we have to look up the PR ourselves via the GitHub
    # API by branch name. Without this, BRANCH falls through to the raw
    # branch name and the "Branch name X was not recognized" path runs.
    if [[ -z "$PR_NUMBER" && -n "$PR_BRANCH" ]]; then
        PR_NUMBER="$(github_api_get "https://api.github.com/repos/cBioPortal/cbioportal-frontend/pulls?head=cBioPortal:${PR_BRANCH}&state=open" \
            | jq -r '.[0].number // empty' 2>/dev/null || true)"
    fi
elif [[ -n "${NETLIFY:-}" ]]; then
    PR_BRANCH="${BRANCH:-}"
    PR_NUMBER="${REVIEW_ID:-}"
    if [[ "${PULL_REQUEST:-}" = true ]]; then
        PR_URL="${REPOSITORY_URL}/pull/${PR_NUMBER}"
    fi
fi

if [[ -n "${CIRCLECI:-}" || -n "${NETLIFY:-}" ]]; then
    # on circle ci determine env variables based on branch or in case of PR
    # what branch the PR is pointing to (use GitHub API since HTML scraping no longer works)
    if [[ -n "${PR_NUMBER:-}" ]] && ! [[ "${PR_BRANCH:-}" == "release-"* ]]; then
        echo "PR_NUMBER: ${PR_NUMBER}" >&2
        BRANCH="$(github_api_get "https://api.github.com/repos/cBioPortal/cbioportal-frontend/pulls/${PR_NUMBER}" \
            | jq -r '.base.ref // empty' 2>/dev/null || true)"
        if [[ -z "$BRANCH" || "$BRANCH" == "null" ]]; then
            # A rate-limited lookup must never emit an invalid branch name.
            # Use the source branch only when it has a matching env file;
            # otherwise master is the safe default for CI PR validation.
            if [[ -n "${PR_BRANCH:-}" && -f "$SCRIPT_DIR/../env/${PR_BRANCH}.sh" ]]; then
                BRANCH="$PR_BRANCH"
            else
                BRANCH="master"
            fi
            echo "Warning: Could not determine target branch from PR ${PR_NUMBER}, falling back to ${BRANCH}" >&2
        fi
    elif [[ -n "${MANUAL_TRIGGER_BRANCH_ENV:-}" ]]; then
        BRANCH="$MANUAL_TRIGGER_BRANCH_ENV"
    else
        BRANCH="${PR_BRANCH:-master}"
    fi
    ENV_FILE="$SCRIPT_DIR/../env/${BRANCH}.sh"
    if test -f "$ENV_FILE"; then
        cat "$ENV_FILE"
    else
        # Send to stderr — this script's stdout is consumed by `eval` in
        # callers like serve_dist.sh, and a warning on stdout gets
        # executed as shell ("Branch: command not found", exit 127).
        echo "Branch name ${BRANCH} was not recognized. Please add env script to /env/ directory or test the branch as part of a github pull request." >&2
    fi
    printf 'export BRANCH_ENV=%q\n' "$BRANCH"
elif [[ -n "${BRANCH_ENV:-}" ]]; then
    cat "$SCRIPT_DIR/../env/${BRANCH_ENV}.sh"

    # override with custom exports if they exist
    if [[ -f "$SCRIPT_DIR/../env/custom.sh" ]]; then
        cat "$SCRIPT_DIR/../env/custom.sh"
    fi
else
    echo -e "${RED}No desired BRANCH_ENV variable set${NC}"
    echo -e "${RED}set with e.g. export BRANCH_ENV=master${NC}"
    echo -e "${RED}or export BRANCH_ENV=rc${NC}"
    exit 1
fi
