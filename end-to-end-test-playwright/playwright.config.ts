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

// PW_UPDATE_SNAPSHOTS lets CI auto-generate missing screenshot
// baselines on first run without making every developer pass a CLI
// flag. Set to 'missing' / 'changed' / 'all' / 'none'. When unset, we
// pass `undefined` so Playwright falls back to its built-in default
// ('missing'), which is what the remote shards job has always relied
// on — overriding to 'none' here previously slowed the remote suite
// from ~12 min to ~35 min by forcing failures + retries on any test
// whose baseline drifted vs. silently re-baselining.
const updateSnapshots = process.env.PW_UPDATE_SNAPSHOTS as
    | 'all'
    | 'changed'
    | 'missing'
    | 'none'
    | undefined;

// The remote `playwright_e2e_shards` job runs `npx playwright test`
// with no path filter and would otherwise pick up tests/local/**, where
// the Keycloak/SAML helpers hang against the public origin and add
// 5+ minutes to slow shards. The localdb job opts in via PW_LOCAL=1.
const includeLocalDb = process.env.PW_LOCAL === '1';

// When scripts/run-with-cache-proxy.sh is in play, HTTPS_PROXY points
// at a local mitmdump that caches *.cbioportal.org responses for the
// duration of a single test run. Routing Playwright's browser through
// it requires (a) the proxy server setting and (b) accepting the
// proxy's self-signed CA — easier than installing the CA into Chromium.
const proxyServer = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const proxy = proxyServer ? { server: proxyServer } : undefined;
if (proxy) {
    // eslint-disable-next-line no-console
    console.log(`[playwright.config] routing through proxy ${proxy.server}`);
}

export default defineConfig({
    testDir: './tests',
    testIgnore: includeLocalDb ? [] : ['**/local/**'],
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    updateSnapshots,
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
        ...((isLocaldev || proxy) && { ignoreHTTPSErrors: true }),
        ...(proxy && { proxy }),
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
                        // When routed through scripts/run-with-cache-proxy.sh,
                        // mitmdump presents a self-signed cert generated on
                        // first use. Chromium gates proxy/MITM certs *before*
                        // Playwright's context-level ignoreHTTPSErrors gets a
                        // chance to respond to the CDP request, so the only
                        // reliable way to make TLS interception work is the
                        // launch-level --ignore-certificate-errors flag.
                        // We also pass --proxy-server here in addition to
                        // use.proxy: in chromium-headless-shell builds the
                        // CDP-level proxy setting (use.proxy) was observed to
                        // silently no-op for HTTPS traffic, while the
                        // launch-level switch is honoured reliably.
                        ...(proxy
                            ? [
                                  '--ignore-certificate-errors',
                                  `--proxy-server=${proxy.server}`,
                              ]
                            : []),
                        ...(isLocaldev
                            ? [
                                  // Private Network Access + the newer
                                  // Local Network Access gate both need
                                  // to be disabled for public→loopback
                                  // subresource loads.
                                  '--disable-features=BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessPreflightSupport,PrivateNetworkAccessRespectPreflightResults,LocalNetworkAccessChecks,LocalNetworkAccessChecksWarnings',
                                  // Opt-in remap for the one caller that
                                  // needs it: scripts/docker-test.sh runs
                                  // Playwright inside the pinned image on a
                                  // developer machine while `yarn startSSL`
                                  // serves the bundle on the host. From
                                  // inside that container, `localhost` is
                                  // the container itself, so we map it to
                                  // host.docker.internal (provided by
                                  // Docker Desktop on macOS, added via
                                  // --add-host on Linux). Every other
                                  // setup — host runs, CircleCI jobs
                                  // (Playwright + serveDist colocated),
                                  // and any VPS/CI runner that boots the
                                  // backend in docker but runs Playwright
                                  // on the host — leaves this unset and
                                  // `localhost` resolves naturally.
                                  ...(process.env.PW_REMAP_LOCALHOST === '1'
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
