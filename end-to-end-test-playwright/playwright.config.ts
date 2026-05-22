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

// Always-on caching forward proxy in front of *.cbioportal.org. When
// PW_PROXY_SERVER is set, route the browser through it and stamp every
// request with PW_WF_STAMP so the proxy can key its cache per-workflow.
// HTTPS_PROXY is honored as a fallback for local-dev convenience, but
// CI must use PW_PROXY_SERVER: setting HTTPS_PROXY at job scope makes
// pnpm install try to fetch the npm registry through the proxy too,
// which times out (the proxy allowlists only *.cbioportal.org).
const PROXY_SERVER = process.env.PW_PROXY_SERVER || process.env.HTTPS_PROXY;
const WF_STAMP = process.env.PW_WF_STAMP || '';

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
        // First time a workflow runs, the proxy cache is empty and every
        // request to cbioportal/3rd-parties goes upstream through
        // mitmproxy's TLS-MITM hop. That adds enough latency (esp. at
        // CI concurrency) that the standard 60s isn't always enough for
        // a full SPA boot. Subsequent runs in the same workflow id (or
        // retries within a run) hit the cache and complete much faster.
        navigationTimeout: PROXY_SERVER ? 120_000 : 60_000,
        // ignoreHTTPSErrors is needed in localdev mode (to accept the
        // serveDist self-signed cert) and any time we route through
        // the cache proxy (to accept mitmproxy's generated CA).
        ...((isLocaldev || PROXY_SERVER) && { ignoreHTTPSErrors: true }),
        ...(PROXY_SERVER && {
            // Proxy is configured at launch level (--proxy-server /
            // --proxy-bypass-list flags below) — NOT here. Setting
            // both context-level `proxy` and launch-level flags
            // produced ERR_EMPTY_RESPONSE for normal requests; the
            // two configurations conflict inside chromium. We keep
            // just the X-PW-Workflow-ID stamp header at this level.
            extraHTTPHeaders: {
                'X-PW-Workflow-ID': WF_STAMP,
            },
        }),
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
                        // --proxy-server has to be at launch time:
                        // chromium-headless-shell was observed to
                        // silently no-op the CDP-level proxy setting
                        // for HTTPS traffic. We rely on CDP-level
                        // ignoreHTTPSErrors (set in use.ignoreHTTPSErrors
                        // above) to handle both the proxy's MITM cert
                        // and the localhost:3000 self-signed dev cert
                        // — the launch-level --ignore-certificate-errors
                        // tried earlier appeared to short-circuit the
                        // CDP path for localhost, leaving the SPA bundle
                        // unable to load and only the localdev banner
                        // rendering.
                        ...(PROXY_SERVER
                            ? [
                                  // Chromium intermittently rejects the
                                  // mitmproxy-generated cert even when
                                  // ignoreHTTPSErrors: true is set at
                                  // the CDP context level — the launch
                                  // flag forces the always-accept path
                                  // before CDP gets a chance. Re-added
                                  // after fly logs showed periodic
                                  // "ssl/tls alert certificate unknown"
                                  // rejections from Chromium →
                                  // ERR_EMPTY_RESPONSE on the test side.
                                  '--ignore-certificate-errors',
                                  `--proxy-server=${PROXY_SERVER}`,
                                  // Only proxy cbioportal traffic; route
                                  // everything else direct. Reasons:
                                  //  1. loopback (localhost/127.0.0.1/
                                  //     host.docker.internal) can't be
                                  //     reached from the remote proxy.
                                  //  2. 3rd-party static-asset hosts
                                  //     (cdnjs font-awesome, googleapis,
                                  //     gstatic) loaded font/icon
                                  //     subresources through the proxy
                                  //     unreliably — icons rendered as
                                  //     glyph squares and screenshot
                                  //     specs failed en masse.
                                  //  3. Analytics endpoints (gtm, heap,
                                  //     contentsquare) add nothing to
                                  //     test correctness but add
                                  //     proxy-MITM overhead.
                                  //  4. docs.cbioportal.org renders an
                                  //     embedded news iframe; it's not
                                  //     part of the API surface we want
                                  //     to cache, just let it through.
                                  // Semicolons are chromium's bypass
                                  // delimiter; wildcards match
                                  // subdomains only (so we list each
                                  // bare-host + *.host pair we care
                                  // about).
                                  '--proxy-bypass-list=' +
                                      [
                                          'localhost',
                                          '127.0.0.1',
                                          'host.docker.internal',
                                          'cdnjs.cloudflare.com',
                                          '*.cloudflare.com',
                                          'googletagmanager.com',
                                          '*.googletagmanager.com',
                                          'heapanalytics.com',
                                          '*.heapanalytics.com',
                                          'contentsquare.net',
                                          '*.contentsquare.net',
                                          '*.netlify.app',
                                          'docs.cbioportal.org',
                                          '*.googleapis.com',
                                          '*.gstatic.com',
                                          '*.oncokb.org',
                                          '*.genomenexus.org',
                                      ].join(';'),
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
