#!/usr/bin/env bash
# Run the Playwright suite inside the official Playwright Docker image
# pinned to the exact version in package.json. This is the *only* supported
# way to generate/update the canonical screenshot references under
# __snapshots__/ — the Docker environment pins OS, fonts, and browser
# builds so references are byte-stable across developer machines and CI.
#
# Usage:
#   ./scripts/docker-test.sh                      # run against committed baselines
#   ./scripts/docker-test.sh --update-snapshots   # regenerate baselines
#   ./scripts/docker-test.sh timeline             # run a single spec (grep)
#   CBIOPORTAL_URL=https://... ./scripts/docker-test.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
    echo "error: docker is not installed or not on PATH" >&2
    exit 1
fi

# Pin the image to the @playwright/test version declared in package.json.
# Any drift between the image and the library produces flaky comparisons,
# so this MUST stay in lockstep.
PLAYWRIGHT_VERSION=$(node -p "require('./package.json').devDependencies['@playwright/test'].replace(/^[\^~]/, '')")
IMAGE="mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-jammy"

echo "Playwright Docker image: ${IMAGE}"
echo "Target: ${CBIOPORTAL_URL:-https://www.cbioportal.org}"

# --ipc=host       avoids Chromium crashes from the default 64 MB shm
# --user           writes files as the host user so snapshots aren't root-owned
# -v ...:/work     mounts the suite; node_modules is reused from host
# PW_DOCKER=1      selected in playwright.config.ts to route snapshots
#                  to the tracked __snapshots__/ directory
exec docker run --rm -i \
    --ipc=host \
    --user "$(id -u):$(id -g)" \
    -v "$(pwd):/work" \
    -w /work \
    -e PW_DOCKER=1 \
    -e HOME=/tmp \
    -e CBIOPORTAL_URL="${CBIOPORTAL_URL:-https://www.cbioportal.org}" \
    -e CI="${CI:-}" \
    "${IMAGE}" \
    npx playwright test "$@"
