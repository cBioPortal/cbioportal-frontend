import { defineConfig, devices } from '@playwright/test';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL || 'https://www.cbioportal.org'
).replace(/\/$/, '');

// When tests run inside the pinned Playwright Docker image (via
// scripts/docker-test.sh), they write/read canonical baselines under
// __snapshots__/. Host-mode runs use __local_snapshots__/ (gitignored) so
// developer machines never overwrite the tracked references. Only Docker
// output is authoritative.
const inDocker = process.env.PW_DOCKER === '1';
const SNAPSHOT_DIR = inDocker ? '__snapshots__' : '__local_snapshots__';

// LOCALDEV defaults ON: tests point at a public cbioportal origin but
// load the local frontend bundle from https://localhost:3000 (via
// ?localdev=true). Chromium's Private Network Access gate blocks
// public→loopback subresource loads by default; disable it so the local
// bundle can attach. Opt out with LOCALDEV=0 to exercise the deployed
// bundle on the public origin instead.
const isLocaldev = process.env.LOCALDEV !== '0';

export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: [
        ['list'],
        ['html', { open: 'never' }],
        ['json', { outputFile: 'test-results/report.json' }],
    ],

    snapshotPathTemplate: `{testDir}/${SNAPSHOT_DIR}/{testFilePath}/{arg}{ext}`,

    // Some screenshot tests (group comparison enrichments, oncoprint
    // tracks, pathway mapper) include long backend round-trips followed
    // by stable-frame waits — give them comfortable headroom over the
    // default 30s.
    timeout: 120_000,

    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.01,
            threshold: 0.2,
            animations: 'disabled',
            caret: 'hide',
        },
    },

    use: {
        baseURL: CBIOPORTAL_URL,
        viewport: { width: 1600, height: 1000 },
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        actionTimeout: 15_000,
        navigationTimeout: 60_000,
        ...(isLocaldev && { ignoreHTTPSErrors: true }),
    },

    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // chrome-headless-shell is a separate, stripped-down binary
                // designed for automated pixel-stable work — less variance
                // than the full "new headless" Chrome Chromium ships with.
                // Only relevant when generating/comparing canonical
                // baselines (Docker mode). On host runs, fall back to the
                // standard Chromium so `--headed` / `--ui` actually show a
                // window.
                channel: inDocker ? 'chromium-headless-shell' : undefined,
                launchOptions: {
                    // Kill the most common sources of per-run subpixel
                    // drift: fractional glyph placement, LCD-RGB
                    // stripe antialiasing, and hinting-driven outline
                    // changes. All three together give bit-stable text
                    // across runs at the cost of slightly chunkier glyphs.
                    args: [
                        '--disable-font-subpixel-positioning',
                        '--disable-lcd-text',
                        '--font-render-hinting=none',
                        ...(isLocaldev
                            ? [
                                  // Private Network Access + the newer
                                  // Local Network Access gate both need
                                  // to be disabled for public→loopback
                                  // subresource loads.
                                  '--disable-features=BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessPreflightSupport,PrivateNetworkAccessRespectPreflightResults,LocalNetworkAccessChecks,LocalNetworkAccessChecksWarnings',
                                  // Inside the Playwright Docker image,
                                  // `localhost` resolves to the container,
                                  // not the host running `yarn startSSL`.
                                  // Remap it at the resolver level so the
                                  // bundle URL (https://localhost:3000)
                                  // reaches the host. host.docker.internal
                                  // is provided by Docker Desktop on macOS
                                  // and added via --add-host on Linux (see
                                  // scripts/docker-test.sh). Skip on host
                                  // runs — there `localhost` already works.
                                  ...(inDocker
                                      ? [
                                            '--host-resolver-rules=MAP localhost host.docker.internal',
                                        ]
                                      : []),
                              ]
                            : []),
                    ],
                },
            },
        },
    ],
});
