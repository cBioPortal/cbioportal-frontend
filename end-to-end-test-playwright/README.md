# end-to-end-test-playwright

Playwright spike running alongside the existing `end-to-end-test/` wdio
suite. See the top-level branch `e2e-playwright-spike` for the migration
motivation; short version: wdio's awaits are painful, screenshot tests
can't be developed locally, and intent is hard to read.

## Two snapshot lanes

Screenshots flake across machines because fonts, GPU, and Chromium
builds differ. This suite has two snapshot directories to keep that
under control:

| Directory                                      | Tracked in git | Produced by                          |
| ---------------------------------------------- | -------------- | ------------------------------------ |
| `tests/**/__snapshots__/` (canonical)          | yes            | `pnpm run test:docker:update`        |
| `tests/**/__local_snapshots__/` (dev scratch)  | no (gitignored)| `pnpm test` / `pnpm run test:update` |

The selector is the `PW_DOCKER=1` env var (set by the wrapper script);
see `playwright.config.ts`. Only Docker output is authoritative. Host
runs are for fast dev iteration; they don't count as references.

## Prereqs

- Node >= 18
- pnpm (the rest of the repo uses pnpm; `corepack enable` will pick up the
  version pinned in the root `package.json`'s `packageManager` field)
- Docker (only for the canonical/Docker lane)
  - **Apple Silicon (M1/M2/M3)**: the CI image is amd64-only and runs via
    Rosetta emulation automatically — Docker Desktop must have "Use Rosetta
    for x86_64/amd64 emulation on Apple Silicon" enabled in settings

```bash
# --ignore-workspace is required because this suite lives below the
# repo's pnpm workspace root but is intentionally NOT a workspace
# member (see pnpm-workspace.yaml — only `packages/*` is included).
# Without the flag, pnpm walks up and installs the whole workspace
# instead of this suite's two devDependencies.
pnpm install --ignore-workspace
pnpm exec playwright install chromium   # only needed for host-mode runs
```

## Daily commands

```bash
# Canonical (Docker, byte-stable) — what CI runs, what we commit
pnpm run test:docker                    # verify against tracked baselines
pnpm run test:docker:update             # regenerate tracked baselines

# Local-DB lane (Docker against a localhost backend, runs tests/local only)
pnpm run test:docker:localdb            # verify against tracked baselines
pnpm run test:docker:localdb:update     # regenerate tracked baselines

# Local-DB lane (host-mode, scratch snapshots) — for fast local iteration
pnpm run test:localdb                   # verify against local scratch snapshots
pnpm run test:localdb:update            # regenerate local scratch snapshots
pnpm run test:localdb:ui                # interactive runner + trace viewer

# Host-mode (fast, scratch snapshots) — for local iteration
pnpm test                               # verify against local scratch
pnpm run test:update                    # regenerate local scratch
pnpm run test:ui                        # interactive runner + trace viewer

# Reports + pass-through args
pnpm run report                         # open the last HTML report
./scripts/docker-test.sh timeline       # grep-filter specs
CBIOPORTAL_URL=https://rc.cbioportal.org pnpm run test:docker
```

The `test:docker:localdb` scripts set `PW_LOCAL=1` and point
`CBIOPORTAL_URL` at `http://localhost:8080`, then forward `tests/local`
to the wrapper. They assume a local cBioPortal backend is already
listening on port 8080; the wrapper's `host.docker.internal` remap
makes that reachable from inside the Playwright container.

The `test:localdb` and `test:localdb:update` commands run the same
`tests/local` suite directly on the host (no Docker) against a backend
already listening on `http://localhost:8080`. They write scratch
snapshots to `tests/**/__local_snapshots__/` (gitignored) so they never
overwrite the tracked Docker references. `LOCALDEV=0` is set explicitly
because the backend serves the full app directly — no separate frontend
dev server is involved. These commands are the fastest way to iterate on
localdb tests without waiting for a Docker pull.

`./scripts/docker-test.sh` is a thin wrapper — anything after the
script name is forwarded to `playwright test`, so flags like
`--debug`, `--headed`, `--grep`, `--trace on` all work.

## Pointing at a different backend (CBIOPORTAL_URL)

All test entry points route through `scripts/with-env.sh`, which resolves
`CBIOPORTAL_URL` in this order — first match wins:

1. **`CBIOPORTAL_URL` already set in your shell** — used as-is. The simple
   one-off override:
   ```bash
   CBIOPORTAL_URL=https://rc.cbioportal.org pnpm test
   ```
2. **`BRANCH_ENV` set (local) or `CIRCLECI`/`NETLIFY` set (CI)** — delegate
   to `../scripts/env_vars.sh`, which picks `../env/${BRANCH}.sh` based on
   `$BRANCH_ENV` locally, or the PR's target branch in CI. `../env/custom.sh`
   layers on top for personal overrides.
3. **Nothing set** — `playwright.config.ts`'s hardcoded default
   (`https://www.cbioportal.org`) kicks in.

In CI, this means a PR targeting `rc` automatically runs against
`rc.cbioportal.org`; a PR targeting `master` runs against
`www.cbioportal.org`; etc. — matching the legacy WebdriverIO behavior.

## Updating references when a real visual change lands

1. Land the code change.
2. `pnpm run test:docker:update`
3. Review the diff on the PNGs under `tests/**/__snapshots__/`.
4. Commit the updated snapshots with the code change in the same PR.

Because baselines are Docker-generated, the review diff is meaningful —
any pixel change reflects an actual rendering change, not host drift.

## Pinning

The wrapper reads `@playwright/test` from `package.json` and runs
`ghcr.io/cbioportal/cbioportal-frontend-playwright-ci:v<version>-jammy`
— our custom image, built from `.circleci/images/playwright/Dockerfile`
on top of `mcr.microsoft.com/playwright:v<version>-jammy`. CircleCI
runs the same image, so the dev experience and CI experience are
byte-identical. Bumping the library version automatically bumps the
image lookup; keep `@playwright/test` and the CI image tag in
lockstep — a skew will produce spurious diffs on every snapshot.

When `@playwright/test` is bumped, also bump the
`mcr.microsoft.com/playwright:v<X>-jammy` base in the Dockerfile and
the tag references in `.circleci/config.yml` so the rebuild publishes
the matching image.
