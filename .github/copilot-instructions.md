# GitHub Copilot Instructions for cBioPortal Frontend

## Project Overview

This repository contains the frontend code for cBioPortal, a comprehensive cancer genomics data visualization platform. The codebase uses React, MobX, and TypeScript.

## Architecture & Technology Stack

- **Framework**: React with TypeScript
- **State Management**: MobX
- **Build Tools**: rspack, pnpm
- **Testing**: Jest with ts-jest (unit), Playwright (end-to-end)
- **Code Formatting**: Prettier
- **Monorepo**: Lerna with pnpm workspaces (`packages/`)

## Code Style & Standards

### TypeScript
- Use TypeScript for all new code
- Enable strict null checks and no implicit any
- Use ES6+ features (module target: es6)
- Use decorators (experimental decorators enabled)
- Follow the existing TypeScript configuration in `tsconfig.json`

### React Components
- Use functional components with hooks when possible
- For class components with state management, use MobX `@observer` decorator
- Use `@observable`, `@computed`, and `@action` decorators for MobX reactive state
- Keep components focused and single-purpose

### Code Formatting
- Use Prettier for code formatting (automatically runs on git commit)
- Configuration:
  - Tab width: 4 spaces
  - Single quotes
  - Trailing commas (ES5)
- Run `pnpm run prettierFixLocal` if CircleCI prettier check fails

### Comments
- Comments should explain the current code's intent — not narrate what changed or why it replaced a previous version (that's what git history is for).
- Avoid change logs in code: don't write comments like "switched X to Y because…" or "under React 18 this used to…". State what the code does now and any non-obvious reason it must.
- Keep them concise; delete comments that no longer match the code.

### File Organization
- Source code lives in `src/` directory
- Shared components: `src/shared/`
- Pages: `src/pages/`
- Configuration: `src/config/`
- Tests: Co-located with source files using `*.spec.ts` or `*.spec.tsx` extension

## Development Workflow

### Setup
1. Install dependencies: `pnpm install --frozen-lockfile`
2. Build packages: `pnpm run buildModules`
3. Start dev server: `pnpm run start`

### Environment Variables
- Set `BRANCH_ENV` to `master` or `rc` based on the branch you're working from
- Custom API URLs can be configured in `env/custom.sh`

### Testing
- Run main project tests: `pnpm run testMain`
- Run package tests: `pnpm run testPackages`
- Run tests in watch mode: `pnpm run test:watch`
- Use `GREP=<path or regex>` to run specific test files, e.g. `GREP=src/shared/lib/MutationUtils.spec.ts pnpm run testMain`
- Test files should be named `*.spec.ts` or `*.spec.tsx`
- Setup tests configuration is in `src/setupTests.ts`
- Type check with `pnpm run typecheck` (CI runs it separately from the unit tests)

### End-to-End Testing
CI runs the Playwright suite in `end-to-end-test-playwright/`. The older WebdriverIO suite in `end-to-end-test/` is no longer run by any CI workflow, so add new e2e tests to the Playwright suite. See `end-to-end-test-playwright/README.md` for details.

There are two lanes:
- **Remote** (`tests/*.spec.ts`): runs against the public site (www.cbioportal.org, or rc.cbioportal.org for PRs targeting `rc`). It loads the locally built frontend bundle from `https://localhost:3000` (`LOCALDEV=1`, the default).
- **Local DB** (`tests/local/`): runs against a dockerized backend seeded with test studies, for data that has to stay fixed.

Run the suite in the same Docker image CI uses:
```bash
cd end-to-end-test-playwright
pnpm install --ignore-workspace          # this suite is not a workspace member

# The remote lane needs the bundle served on https://localhost:3000:
# in the repo root, `pnpm run buildMain && ./scripts/serve_dist.sh` (or `pnpm run startSSL`)
./scripts/docker-test.sh tests/mutation-table.spec.ts
./scripts/docker-test.sh tests/mutation-table.spec.ts --update-snapshots

# Test-only changes can run against the deployed frontend instead
LOCALDEV=0 ./scripts/docker-test.sh tests/mutation-table.spec.ts

# Local-DB lane: start the backend on http://localhost:8080 first
# (./scripts/localdb/start-backend.sh). Tests in tests/local only run with PW_LOCAL=1.
PW_LOCAL=1 CBIOPORTAL_URL=http://localhost:8080 ./scripts/docker-test.sh tests/local/my.spec.ts
```
Anything after `docker-test.sh` is passed to `playwright test` (`-g`, `--repeat-each`, `--workers`, `--trace on`, ...).

### Screenshot Testing
- Screenshot references live in `end-to-end-test-playwright/tests/**/__snapshots__/` and must be generated in Docker (`./scripts/docker-test.sh ... --update-snapshots`). Screenshots taken on the host differ from CI's and can't be used as references.
- **Best Practices**:
  - Only use screenshot tests for components that cannot be checked through the DOM
  - Keep screenshots as small as possible to minimize false positives. Larger screenshots need updating whenever unrelated features change.
  - Mask or hide parts that change between runs (tooltips, timestamps, animations)
  - Commit updated references in the same PR as the change that causes them, and review the image diffs
- On a failure, CircleCI stores the expected, actual and diff images under the job's **Artifacts** tab, in `test-results/<test>/*-actual.png`, `*-expected.png` and `*-diff.png`.

#### Updating stale reference screenshots after an upstream data change

When an upstream data source (Genome Nexus, OncoKB, cBioPortal backend) changes and the e2e reference screenshots go stale, CircleCI will fail on screenshot comparison. The fastest way to refresh the references is to **pull the "actual" screenshot from the failing CircleCI job's artifacts**. That image already shows the new data, rendered in the same Docker image the reference must match.

```bash
curl -L '<artifact URL of test-results/<test>/<screenshot-name>-actual.png>' \
  > 'end-to-end-test-playwright/tests/__snapshots__/<spec-file>/<screenshot-name>.png'
```

Get the artifact URL from the failing job's **Artifacts** tab. After a failure, Playwright doesn't run the remaining tests in a serial `describe`, so their screenshots have no artifacts; regenerate those in Docker.

Only update the screenshots affected by the upstream change. Don't bundle unrelated screenshot updates. One upstream fix, one PR. PR #5514 (CCDS ID fix) is a reference example.

### Writing Reliable Tests (Avoiding Flakiness)
A test that fails at random blocks every PR, and people learn to ignore red CI. Don't add one. CI retries a failing test once, so a test that only passes on retry is still flaky: fix it rather than relying on the retry. The `analyze_flakes` CI job's `flake-report.md` artifact lists tests whose results flip between recent runs.

- **Wait for a condition, not for time.** Use Playwright's web-first assertions (`await expect(locator).toBeVisible()`, `toContainText`, `toHaveCount`), which retry until they pass. A fixed `page.waitForTimeout()` is either too short on a busy CI runner or wastes time everywhere else.
- **Wait for the data a screenshot shows.** A table can render before all its columns have loaded. Wait for the specific values in the screenshot (e.g. a copy number column's `ShallowDel`) before taking it, not just for the table to exist.
- **Don't depend on incidental order.** API responses and unsorted data come back in arbitrary order. If a test needs a particular row, search or filter for it instead of assuming it's on the first page, and make UI that lists data order it deterministically.
- **Scope locators.** `page.locator('text=T790M')` also matches labels in charts and tooltips. Scope to the element under test (`getByRole('cell', { name: 'T790M', exact: true })`, a `data-test` attribute) and add `data-test` attributes to new UI elements tests need.
- **Set state through the URL where you can.** Loading a view with URL parameters (`?tab=...`, filters, panel settings) is faster and more reliable than clicking through the UI to get there.
- **Budget for CI being slower than your machine.** Each remote-lane CI shard runs 3 Playwright workers on 4 vCPUs. Local-DB shards run 2 workers on the same size machine, which they share with the MySQL, cBioPortal, Keycloak and ClickHouse containers. Either way, heavy pages (large studies, WebGL plots, oncoprints) take several times longer than locally. The default test timeout is 120s. When a test is legitimately slow, raise its timeout with a comment saying why, rather than letting it run close to the limit. Timing assertions should only catch large regressions, with generous budgets.
- **Expect live data to change.** Remote-lane tests use public data and annotations (OncoKB, Genome Nexus, hotspots) that change over time. Assert on what the test is about, not on incidental counts or values, and use the local-DB lane when exact data matters.
- **Check new tests repeatedly before opening the PR.** Run new or changed e2e tests several times in Docker, with the same number of workers as their CI lane:
  - Remote: `./scripts/docker-test.sh tests/my.spec.ts --repeat-each=5 --workers=3`
  - Local DB: `PW_LOCAL=1 CBIOPORTAL_URL=http://localhost:8080 ./scripts/docker-test.sh tests/local/my.spec.ts --repeat-each=5 --workers=2`

### Describing Tests in Pull Requests
When a PR adds or changes e2e tests, say in the PR description:
- **How many tests** it adds, changes or removes, and in which spec files
- **How long each new test takes** in the CI Docker image (`docker-test.sh` prints each test's duration), and how many times you ran it (e.g. `--repeat-each=5`)
- **How much time it adds to CI**, if it's noticeable: the e2e jobs are split into shards, so one slow test can make its shard, and the whole run, take longer

This lets reviewers weigh the coverage against the CI time and flakiness risk. Unit tests don't need this unless they're unusually slow.

### Code Quality
- Pre-commit hooks automatically format code with Prettier
- CircleCI runs prettier checks on pull requests
- Follow existing patterns in similar files when adding new features
- `tsc`/Prettier/`pnpm run testMain` do **not** validate SCSS syntax — a `.module.scss` file can pass all of those and still break the production build. In particular, an apostrophe (or other stray `'`) inside a `//` comment can be misread as an unterminated string by the css-loader/sass pipeline and throw a `CssSyntaxError` (`Unexpected }`) at build time only. After editing any `.scss`/`.module.scss` file, run a real build (`pnpm run buildMain`, or `rspack build -c rspack.config.js`) before considering the change done.

## Important Notes

### API Integration
- API clients are auto-generated from Swagger/OpenAPI specs
- Main API client: `packages/cbioportal-ts-api-client/`
- Update API: `pnpm run updateAPI`
- Change API root in development: Edit `my-index.ejs`

### Branch Strategy
- `master`: Production-ready code, bug fixes, features without DB migrations
- `rc`: Release candidate with features requiring DB migrations
- See README for detailed branch information

### External Dependencies
- OncoKB API: `packages/oncokb-ts-api-client/`
- Genome Nexus API: `packages/genome-nexus-ts-api-client/`
- These are external services with their own API clients

### Testing Against Live Instances
- Use `localStorage.setItem("localdev", true)` in browser console at cbioportal.org to test local changes
- **Important**: When testing against HTTPS backends (e.g., cbioportal.org, rc.cbioportal.org), use `pnpm run startSSL` instead of `pnpm run start` to serve frontend over SSL
- Clear with `localStorage.clear()` when done

## Common Patterns

### MobX Observables
```typescript
@observable someValue: boolean = false;
@observable.ref someObject: SomeType | undefined = undefined;

@computed get derivedValue() {
    return this.someValue ? 'yes' : 'no';
}

@action
updateValue() {
    this.someValue = true;
}
```

### Remote Data Pattern
Use `remoteData` for async operations:
```typescript
public someData = remoteData(async () => {
    return fetch('url').then(d => d.json());
});
```

### Path Aliases
- Use configured path aliases from `tsconfig.json`:
  - `shared/*` → `src/shared/*`
  - `config/*` → `src/config/*`
  - `pages/*` → `src/pages/*`
  - etc.

## Documentation
- Main docs: https://docs.cbioportal.org
- Architecture: https://docs.cbioportal.org/2.1-deployment/architecture-overview
- Contributing guidelines: See `CONTRIBUTING.md` (links to main cBioPortal repo)

## Tips for AI Code Generation

1. **Respect existing patterns**: Look at similar files before creating new ones
2. **Use MobX properly**: Don't mix React state with MobX state
3. **Follow TypeScript strictly**: No `any` types unless absolutely necessary
4. **Test thoroughly**: Write tests for new features
5. **Format with Prettier**: Code should match existing formatting
6. **Check imports**: Use the configured path aliases
7. **Consider performance**: This is a data-heavy visualization app
8. **Maintain accessibility**: Follow WCAG guidelines where applicable
