# Custom Playwright CI image for cbioportal-frontend
#
# Based on the official Microsoft Playwright image and pre-bakes the extra
# runtime dependencies that the playwright_e2e_shards CircleCI job previously
# had to install on every shard at runtime via apt-get / npm:
#
#   • jq            – used by scripts/env_vars.sh to parse GitHub API responses
#   • corepack      – activates pnpm (version pinned in packageManager field)
#   • http-server   – used by scripts/serve_dist.sh via ./node_modules/http-server/…
#
# Build image tag: ghcr.io/cbioportal/cbioportal-frontend-playwright-ci:v1.59.1-jammy
# Rebuilt automatically by .github/workflows/build-playwright-ci-image.yml when
# this Dockerfile changes.

FROM mcr.microsoft.com/playwright:v1.59.1-jammy

# Install jq (used by scripts/env_vars.sh to parse the GitHub API response when
# resolving the PR's base branch).
RUN apt-get update \
    && apt-get install -y --no-install-recommends jq \
    && rm -rf /var/lib/apt/lists/*

# Enable corepack so the `pnpm` shim is on PATH.  The actual pnpm version is
# resolved at runtime from the project's packageManager field in package.json.
RUN corepack enable

# Pre-install http-server@0.11.1 in a fixed location.
# scripts/serve_dist.sh calls ./node_modules/http-server/bin/http-server
# (relative to the repo root); at runtime the CI step creates a single symlink:
#   ln -sfn /opt/serve-deps/node_modules /tmp/repo/cbioportal-frontend/node_modules
# so the hardcoded path resolves without any network download on each shard.
RUN mkdir -p /opt/serve-deps \
    && cd /opt/serve-deps \
    && echo '{"name":"_serve","version":"0.0.0","private":true}' > package.json \
    && npm install --no-save --no-package-lock --no-audit http-server@0.11.1 \
    && rm package.json

