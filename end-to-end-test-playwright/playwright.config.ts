import { defineConfig, devices } from '@playwright/test';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL || 'https://www.cbioportal.org'
).replace(/\/$/, '');

export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: [['list'], ['html', { open: 'never' }]],

    // Visual regression: tight tolerance + tiny anti-aliasing grace.
    // Platform differences in font rendering are the main source of flake;
    // future work is to run this inside the official Playwright Docker image
    // so references are byte-stable across dev machines and CI.
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
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
