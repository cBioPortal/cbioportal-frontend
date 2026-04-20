import { test, expect, Page } from '@playwright/test';
import { setServerConfiguration } from './helpers/common';

/**
 * Port of end-to-end-test/remote/specs/config.spec.js.
 *
 * Verifies that the homepage honors several skin/auth config values.
 * The portal reads `frontendConfig` out of localStorage at boot, so
 * each test writes an override, reloads, and then asserts DOM state.
 *
 * Tests are serialized and share one page because they all configure
 * the same localStorage key and each assertion requires a fresh load.
 */

async function resetLocalStorage(page: Page) {
    await page.goto('/');
    await page.evaluate(() => {
        localStorage.setItem(
            'frontendConfig',
            JSON.stringify({ serverConfig: {} })
        );
    });
}

test.describe.serial('homepage config overrides', () => {
    test.beforeEach(async ({ page }) => {
        await resetLocalStorage(page);
    });

    test('login UI observes authenticationMethod', async ({ page }) => {
        // With authenticationMethod explicitly nulled out, the Login button
        // in the header should not render. (The wdio spec only asserted the
        // *after* state — public cbioportal's default config is already
        // unauthenticated, so the before-state assertion would be trivial.)
        await setServerConfiguration(page, { authenticationMethod: null });
        await page.goto('/');
        await expect(page.locator('#rightHeaderContent')).toBeAttached();
        await expect(page.locator('button', { hasText: 'Login' })).toHaveCount(
            0
        );
    });

    test('dataset nav observes skin_show_data_tab', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#rightHeaderContent')).toBeAttached();
        await expect(page.locator('a', { hasText: 'Data Sets' })).toHaveCount(
            1
        );

        await setServerConfiguration(page, { skin_show_data_tab: false });
        await page.goto('/');
        await expect(page.locator('#rightHeaderContent')).toBeAttached();
        // Data Sets link is initially rendered before the frontendConfig
        // override applies; under parallel load the 5s default isn't enough
        // to see it disappear.
        await expect(page.locator('a', { hasText: 'Data Sets' })).toHaveCount(
            0,
            { timeout: 30000 }
        );
    });

    test('shows right logo depending on skin_right_logo', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#rightHeaderContent')).toBeAttached();
        await expect(
            page.locator("img[src*='images/msk_logo_transparent_black.png']")
        ).toHaveCount(0);

        await setServerConfiguration(page, {
            skin_right_logo: 'msk_logo_transparent_black.png',
        });
        await page.goto('/');
        await expect(
            page.locator("img[src*='images/msk_logo_transparent_black.png']")
        ).toBeVisible();
    });

    test('shows skin_blurb as configured', async ({ page }) => {
        await setServerConfiguration(page, {
            skin_blurb: "<div id='blurbDiv'>This is the blurb</div>",
        });
        await page.goto('/');
        await expect(page.locator('#blurbDiv')).toBeVisible();
    });
});
