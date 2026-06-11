import { defineConfig, devices } from '@playwright/test';

// Storybook serves each story in isolation at:
//   /iframe.html?id=<story-id>&viewMode=story
// This lets Playwright take pixel-stable screenshots of individual components
// without a running backend, network calls, or auth — far less flaky than
// full E2E screenshot tests.
//
// Run locally:
//   pnpm storybook             (in one terminal — keep it running)
//   pnpm test:storybook        (in another terminal)
//
// Run in CI (builds first, then serves statically):
//   pnpm test:storybook:ci

const STORYBOOK_URL = process.env.STORYBOOK_URL || 'http://localhost:6006';

// Same Docker-vs-host snapshot strategy as the E2E playwright config:
// canonical baselines live in __snapshots__/ (committed, Docker-rendered);
// local runs write to __local_snapshots__/ (gitignored) to avoid polluting
// the reference set with host-machine subpixel drift.
const inDocker = process.env.PW_DOCKER === '1';
const SNAPSHOT_DIR = inDocker ? '__snapshots__' : '__local_snapshots__';

// Mirror the same PW_UPDATE_SNAPSHOTS env-var pattern used in the E2E
// playwright config so CI behaviour is consistent across both suites:
//   unset (default) → Playwright auto-generates missing baselines and passes
//   'none'          → never update; any missing baseline is a hard failure
//   'missing'       → write missing baselines, leave existing ones unchanged
//   'all'           → overwrite every baseline (use when intentionally restyling)

export default defineConfig({
    // Only set updateSnapshots when the env var is explicitly provided —
    // passing undefined causes a Playwright validation error.
    ...(process.env.PW_UPDATE_SNAPSHOTS
        ? { updateSnapshots: process.env.PW_UPDATE_SNAPSHOTS as 'all' | 'changed' | 'missing' | 'none' }
        : {}),
    testDir: './tests',
    fullyParallel: true,
    retries: 0,
    workers: 2,

    snapshotPathTemplate: `{testDir}/${SNAPSHOT_DIR}/{testFilePath}/{arg}{ext}`,

    reporter: [['list'], ['html', { open: 'never' }]],

    // Stories are served locally — tight timeouts are fine and keep the
    // feedback loop fast.
    timeout: 15_000,

    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.01,
            threshold: 0.2,
            animations: 'disabled',
        },
    },

    use: {
        baseURL: STORYBOOK_URL,
        // Render stories at 1280px — wide enough for most components without
        // triggering responsive breakpoints.
        viewport: { width: 1280, height: 800 },
        trace: 'retain-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                channel: inDocker ? 'chromium-headless-shell' : undefined,
                launchOptions: {
                    // Disable subpixel rendering for bit-stable text across runs.
                    args: [
                        '--disable-font-subpixel-positioning',
                        '--disable-lcd-text',
                        '--font-render-hinting=none',
                    ],
                },
            },
        },
    ],
});
