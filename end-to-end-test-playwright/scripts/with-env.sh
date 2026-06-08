#!/usr/bin/env bash
# Resolve CBIOPORTAL_URL (and friends) before running a command.
#
# Resolution order — first match wins:
#   1. CBIOPORTAL_URL already set in the environment → use as-is.
#      This is the simple per-run override path:
#          CBIOPORTAL_URL=https://rc.cbioportal.org pnpm test
#   2. CIRCLECI / NETLIFY / BRANCH_ENV set → delegate to
#      scripts/env_vars.sh, which picks env/${BRANCH}.sh based on:
#        - CI: PR's target branch (via GitHub API), MANUAL_TRIGGER_BRANCH_ENV,
#          or branch name
#        - Local: $BRANCH_ENV, plus env/custom.sh overrides
#   3. Nothing set → fall through. playwright.config.ts's hardcoded default
#      (https://www.cbioportal.org) kicks in.
#
# Why this exists: the old WebdriverIO e2e suite ran
#   eval "$(../scripts/env_vars.sh)" && pnpm run test-webdriver-manager-remote
# so the URL tracked the PR's target branch. The Playwright suite lost that
# wiring during migration. This wrapper restores it while keeping the
# "just set CBIOPORTAL_URL" path simple for one-off runs.
set -euo pipefail

if [[ -z "${CBIOPORTAL_URL:-}" ]]; then
    if [[ -n "${CIRCLECI:-}" || -n "${NETLIFY:-}" || -n "${BRANCH_ENV:-}" ]]; then
        SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
        eval "$(bash "$SCRIPT_DIR/../../scripts/env_vars.sh")"
    fi
fi

# Surface the resolved backend loudly so anyone reading test output (CI
# log, local terminal, docker run) can see at a glance what the suite
# is actually pointed at. Without this it's surprisingly easy to spend
# 20 minutes debugging a "test failure" that's really an instance mismatch.
echo "============================================================"
echo "  CBIOPORTAL_URL: ${CBIOPORTAL_URL:-(unset — playwright.config.ts default kicks in)}"
echo "  BRANCH_ENV:     ${BRANCH_ENV:-(unset)}"
echo "============================================================"

exec "$@"
