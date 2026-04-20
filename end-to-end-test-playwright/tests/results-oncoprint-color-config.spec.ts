import { test, expect, Page } from '@playwright/test';
import { byTestHandle } from './helpers/common';
import {
    expectOncoprintScreenshot,
    getNthOncoprintTrackOptionsSelectors,
    waitForOncoprint,
} from './helpers/oncoprint';

/**
 * Port of end-to-end-test/remote/specs/core/resultsOncoprintColorConfig.spec.js.
 *
 * Two serial groups against /results/oncoprint:
 *  - Clinical track color modal: add a "Mutation Spectrum" track, open
 *    its Edit-Colors modal, override three colors, verify the oncoprint
 *    reflects them, reset, verify defaults are restored.
 *  - "White background for glyphs" view-menu toggle — screenshot on/off.
 *
 * The oncoprint-within-results-view test index for the Mutation
 * Spectrum track is 5 (vs 2 in the standalone Oncoprinter); Edit Colors
 * sits at menu item 8 here (vs 11 in the Oncoprinter modal).
 */

const ONCOPRINT_URL =
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0' +
    '&cancer_study_list=gbm_tcga&case_set_id=gbm_tcga_all&data_priority=0' +
    '&gene_list=EGFR%250APTEN%250AIDH1%250ATP53&geneset_list=%20' +
    '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=gbm_tcga_gistic' +
    '&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=gbm_tcga_mrna_median_all_sample_Zscores' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=gbm_tcga_mutations' +
    '&hide_unprofiled_samples=false&profileFilter=0&tab_index=tab_visualize&show_samples=false';

const COLOR_PICKER_ICON = '[data-test="color-picker-icon"]';

test.describe.serial(
    'oncoprint results-view clinical track color config',
    () => {
        let page: Page;
        let trackOpts: { button: string; dropdown: string };

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage({
                viewport: { width: 1600, height: 1000 },
            });
            await page.goto(ONCOPRINT_URL);
            await waitForOncoprint(page);
        });

        test.afterAll(async () => {
            await page.close();
        });

        /**
         * Find the track index (1-indexed) for the "Mutation spectrum"
         * clinical track. wdio hardcoded nth-5, but the default track
         * count has drifted. Several default clinical tracks (e.g.
         * "Profiled in Mutations") also carry "Edit Colors", so simply
         * matching on that menu item matches the wrong track. We open
         * each candidate's Edit-Colors modal and check the dialog title
         * — the Mutation Spectrum modal reads "Color Configuration:
         * Mutation spectrum".
         */
        async function findMutationSpectrumTrackIndex(): Promise<number> {
            const buttons = page.locator(
                '#oncoprintDiv .oncoprintjs__track_options__toggle_btn_img'
            );
            const count = await buttons.count();
            for (let i = 1; i <= count; i++) {
                const opts = getNthOncoprintTrackOptionsSelectors(i);
                await page.locator(opts.button).hover();
                await page.locator(opts.button).click();
                await expect(page.locator(opts.dropdown)).toBeVisible();
                const editColors = page.locator(`${opts.dropdown} li`, {
                    hasText: 'Edit Colors',
                });
                if ((await editColors.count()) === 0) {
                    await page.locator(opts.button).click();
                    await expect(page.locator(opts.dropdown)).toBeHidden();
                    continue;
                }
                await editColors.click();
                const title = page.locator('.modal-dialog h4');
                await expect(title).toBeVisible();
                const titleText = (await title.textContent()) || '';
                await page.locator('.modal button.close').click();
                await expect(page.locator('.modal-dialog')).toHaveCount(0);
                if (/mutation spectrum/i.test(titleText)) return i;
            }
            throw new Error('No Mutation Spectrum track found');
        }

        async function openColorEditor() {
            await page.locator(trackOpts.button).hover();
            await page.locator(trackOpts.button).click();
            await expect(page.locator(trackOpts.dropdown)).toBeVisible();
            await page
                .locator(`${trackOpts.dropdown} li`, { hasText: 'Edit Colors' })
                .click();
        }

        async function pickColor(n: number, hex: string) {
            await page
                .locator(COLOR_PICKER_ICON)
                .nth(n)
                .click();
            await expect(page.locator('.circle-picker').first()).toBeVisible();
            await page.locator(`.circle-picker [title="${hex}"]`).click();
            await waitForOncoprint(page);
            // Close swatch so subsequent clicks aren't intercepted.
            await page
                .locator(COLOR_PICKER_ICON)
                .nth(n)
                .click();
            await expect(page.locator('.circle-picker')).toHaveCount(0);
        }

        test('color modal reflects user-selected colors', async () => {
            // Add the "Mutation Spectrum" clinical track first — it's the
            // one with three categorical values perfect for a color test.
            await page.locator('#addTracksDropdown').click();
            const option = byTestHandle(
                page,
                'add-chart-option-mutation-spectrum'
            );
            await expect(option).toBeVisible();
            await option.locator('label').click();

            const updateTracks = byTestHandle(page, 'update-tracks');
            await expect(updateTracks).toBeVisible();
            await updateTracks.click();
            await waitForOncoprint(page);

            const idx = await findMutationSpectrumTrackIndex();
            trackOpts = getNthOncoprintTrackOptionsSelectors(idx);

            await openColorEditor();
            await page.waitForTimeout(1000);

            await pickColor(0, '#990099');
            await pickColor(1, '#109618');
            await pickColor(2, '#8b0707');

            await expect(
                page
                    .locator(COLOR_PICKER_ICON)
                    .nth(0)
                    .locator('rect')
            ).toHaveAttribute('fill', '#990099');
            await expect(
                page
                    .locator(COLOR_PICKER_ICON)
                    .nth(1)
                    .locator('rect')
            ).toHaveAttribute('fill', '#109618');
            await expect(
                page
                    .locator(COLOR_PICKER_ICON)
                    .nth(2)
                    .locator('rect')
            ).toHaveAttribute('fill', '#8b0707');
        });

        test('oncoprint reflects user-selected colors', async () => {
            await page.locator('.modal button.close').click();
            await expectOncoprintScreenshot(
                page,
                'results-oncoprint-custom-colors.png'
            );
        });

        test('"Reset Colors" is visible when defaults are overridden', async () => {
            await openColorEditor();
            await expect(byTestHandle(page, 'resetColors')).toBeVisible({
                timeout: 10000,
            });
        });

        test('modal reflects default colors after reset', async () => {
            await byTestHandle(page, 'resetColors').click();
            await waitForOncoprint(page);
            await page.waitForTimeout(500);

            await expect(
                page
                    .locator(COLOR_PICKER_ICON)
                    .nth(0)
                    .locator('rect')
            ).toHaveAttribute('fill', '#3d6eb1');
            await expect(
                page
                    .locator(COLOR_PICKER_ICON)
                    .nth(1)
                    .locator('rect')
            ).toHaveAttribute('fill', '#8ebfdc');
            await expect(
                page
                    .locator(COLOR_PICKER_ICON)
                    .nth(2)
                    .locator('rect')
            ).toHaveAttribute('fill', '#dff1f8');
        });

        test('oncoprint reflects default colors', async () => {
            await page.locator('.modal button.close').click();
            await expectOncoprintScreenshot(
                page,
                'results-oncoprint-default-colors.png'
            );
        });

        test('"Reset Colors" is hidden when defaults are used', async () => {
            await openColorEditor();
            await expect(byTestHandle(page, 'resetColors')).toBeHidden({
                timeout: 15000,
            });
        });
    }
);

test.describe.serial('oncoprint white background for glyphs toggle', () => {
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto(ONCOPRINT_URL);
        await waitForOncoprint(page);
    });

    test.afterAll(async () => {
        await page.close();
    });

    async function toggleWhiteBackground() {
        const viewBtn = page.locator('#viewDropdownButton');
        await viewBtn.click();
        await waitForOncoprint(page);
        await byTestHandle(page, 'toggleWhiteBackgroundForGlyphs').click();
        await viewBtn.click();
    }

    test('white backgrounds on', async () => {
        await toggleWhiteBackground();
        await expectOncoprintScreenshot(page, 'oncoprint-white-bg-glyphs.png');
    });

    test('white backgrounds off (default)', async () => {
        await toggleWhiteBackground();
        await expectOncoprintScreenshot(
            page,
            'oncoprint-default-bg-glyphs.png'
        );
    });
});
