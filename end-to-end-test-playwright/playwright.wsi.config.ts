import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

// WSI validation runs the frontend over the local HTTPS development server
// while the imported backend and tile service use separate origins. Keep the
// ordinary Playwright config unchanged and opt into this behavior only for
// WSI browser contracts.
export default defineConfig({
    ...baseConfig,
    use: {
        ...baseConfig.use,
        ignoreHTTPSErrors: true,
    },
});
