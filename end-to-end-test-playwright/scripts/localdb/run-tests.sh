#!/usr/bin/env bash
# Run the Playwright localdb suite against http://localhost:8080.
# Assumes the backend is up (start-backend.sh) and the locally-built
# frontend dist is being served on https://localhost:3000 (via
# `pnpm run serveDistLocalDb` in another shell). Default test directory
# is tests/local — extra arguments are forwarded to `playwright test`.
set -euo pipefail

cd "$(dirname "$0")/../.."

export CBIOPORTAL_URL="${CBIOPORTAL_URL:-http://localhost:8080}"
# LOCALDEV adds ?localdist=true to every page.goto so the backend swaps
# in the locally-built dist bundle. Set LOCALDEV=0 to test the bundle
# the backend serves natively.
export LOCALDEV="${LOCALDEV:-1}"

# Default to the tests/local directory; allow callers to override via
# additional args (e.g. ./run-tests.sh tests/local/foo.spec.ts).
if [ "$#" -eq 0 ]; then
    set -- tests/local
fi

exec npx playwright test "$@"
