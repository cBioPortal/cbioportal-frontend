import { test, expect, Page } from '@playwright/test';
import { byTestHandle } from './helpers/common';
import {
    expectOncoprintScreenshot,
    getNthOncoprintTrackOptionsSelectors,
    waitForOncoprint,
} from './helpers/oncoprint';

/**
 * Port of end-to-end-test/remote/specs/core/oncoprinterColorConfig.spec.js.
 *
 * Exercises the per-track color configuration modal on the standalone
 * Oncoprinter tool:
 *  - Opening the modal and picking three new colors updates the swatch
 *    fills immediately and re-renders the oncoprint (screenshot).
 *  - "Reset Colors" is only visible when at least one color has been
 *    overridden; it's hidden when everything is on its default.
 *
 * Tests run serially sharing one Page because every test mutates the
 * state of the modal/oncoprint established in the previous test.
 */

// "Edit Colors" is the 11th item in the track-options dropdown.
const EDIT_COLORS_MENU_ITEM = 'li:nth-child(11)';

test.describe.serial('oncoprinter color configuration', () => {
    let page: Page;
    let trackOpts: { button: string; dropdown: string };

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto('/oncoprinter');

        // Load the bundled clinical example data — gives us a track with
        // three distinct categorical values (nice for color testing).
        await page.locator('.oncoprinterClinicalExampleData').click();
        await page.locator('.oncoprinterSubmit').click();
        await waitForOncoprint(page);

        trackOpts = getNthOncoprintTrackOptionsSelectors(2);
    });

    test.afterAll(async () => {
        await page.close();
    });

    async function openColorEditor() {
        await page.locator(trackOpts.button).click();
        await expect(page.locator(trackOpts.dropdown)).toBeVisible();
        await page
            .locator(`${trackOpts.dropdown} ${EDIT_COLORS_MENU_ITEM}`)
            .click();
    }

    /** Click the Nth color-picker swatch then pick `hex` from the circle picker. */
    async function pickColor(n: number, hex: string) {
        await byTestHandle(page, 'color-picker-icon')
            .nth(n)
            .click();
        await expect(page.locator('.circle-picker').first()).toBeVisible();
        await page.locator(`.circle-picker [title="${hex}"]`).click();
        await waitForOncoprint(page);
        // Close the circle picker by re-clicking the swatch so subsequent
        // clicks on other swatches aren't intercepted by the open picker.
        await byTestHandle(page, 'color-picker-icon')
            .nth(n)
            .click();
        await expect(page.locator('.circle-picker')).toHaveCount(0);
    }

    test('color-modal reflects user-selected colors', async () => {
        await openColorEditor();
        await page.waitForTimeout(1000);

        await pickColor(0, '#990099');
        await pickColor(1, '#109618');
        await pickColor(2, '#8b0707');

        await expect(
            byTestHandle(page, 'color-picker-icon')
                .nth(0)
                .locator('rect')
        ).toHaveAttribute('fill', '#990099');
        await expect(
            byTestHandle(page, 'color-picker-icon')
                .nth(1)
                .locator('rect')
        ).toHaveAttribute('fill', '#109618');
        await expect(
            byTestHandle(page, 'color-picker-icon')
                .nth(2)
                .locator('rect')
        ).toHaveAttribute('fill', '#8b0707');

        // Close the modal so the next test can see the re-rendered oncoprint.
        await page.locator('.modal-dialog .close').click();
    });

    test('oncoprinter reflects user-selected colors', async () => {
        await page.locator('a.tabAnchor_oncoprint').click();
        await expectOncoprintScreenshot(page, 'oncoprinter-custom-colors.png');
    });

    test('"Reset Colors" button is visible when defaults are overridden', async () => {
        await openColorEditor();
        await expect(byTestHandle(page, 'resetColors')).toBeVisible();
    });

    test('modal reflects default colors after reset', async () => {
        await byTestHandle(page, 'resetColors').click();
        await waitForOncoprint(page);
        // Give the "has custom colors" state a tick to propagate so the
        // later "Reset Colors is hidden" test doesn't race.
        await page.waitForTimeout(500);

        await expect(
            byTestHandle(page, 'color-picker-icon')
                .nth(0)
                .locator('rect')
        ).toHaveAttribute('fill', '#dc3912');
        await expect(
            byTestHandle(page, 'color-picker-icon')
                .nth(1)
                .locator('rect')
        ).toHaveAttribute('fill', '#3366cc');
        await expect(
            byTestHandle(page, 'color-picker-icon')
                .nth(2)
                .locator('rect')
        ).toHaveAttribute('fill', '#ff9900');
    });

    test('oncoprinter reflects default colors', async () => {
        await page.locator('.modal button.close').click();
        await expectOncoprintScreenshot(page, 'oncoprinter-default-colors.png');
    });

    test('"Reset Colors" button is hidden when defaults are used', async () => {
        await openColorEditor();
        // wdio's waitForDisplayed({reverse: true}) polls up to ~30s; the
        // "non-default colors" flag can take a moment to clear after reset
        // + modal close/reopen, so give it a generous window.
        await expect(byTestHandle(page, 'resetColors')).toBeHidden({
            timeout: 15000,
        });
    });
});
