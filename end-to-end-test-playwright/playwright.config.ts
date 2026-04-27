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

// When LOCALDEV=1, tests point at a public cbioportal origin but load the
// local frontend bundle from https://localhost:3000 (via ?localdev=true).
// Chromium's Private Network Access gate blocks public→loopback subresource
// loads by default; disable it so the local bundle can attach.
const isLocaldev = process.env.LOCALDEV === '1';

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
                // No `channel` — Playwright's bundled Chromium runs in
                // its "new headless" mode by default, which (unlike the
                // chromium-headless-shell binary) has SwiftShader linked
                // in for software WebGL.
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
                        // The probe confirmed SwiftShader was rendering
                        // WebGL into the canvas (toDataURL() saw real
                        // pixels), but they didn't make it into the
                        // page screenshot — they were on a separate GPU
                        // compositor layer that headless skips.
                        // --disable-gpu drops the dedicated GPU process
                        // and routes everything through the CPU
                        // compositor that the screenshot path actually
                        // walks. WebGL stays functional because
                        // SwiftShader is software-only and doesn't need
                        // the GPU process.
                        '--disable-gpu',
                        '--in-process-gpu',
                        '--use-gl=swiftshader',
                        '--enable-unsafe-swiftshader',
                        '--ignore-gpu-blocklist',
                        '--enable-webgl',
                        ...(isLocaldev
                            ? [
                                  // Private Network Access + the newer
                                  // Local Network Access gate both need
                                  // to be disabled for public→loopback
                                  // subresource loads.
                                  '--disable-features=BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessPreflightSupport,PrivateNetworkAccessRespectPreflightResults,LocalNetworkAccessChecks,LocalNetworkAccessChecksWarnings',
                              ]
                            : []),
                    ],
                },
            },
        },
    ],
});
