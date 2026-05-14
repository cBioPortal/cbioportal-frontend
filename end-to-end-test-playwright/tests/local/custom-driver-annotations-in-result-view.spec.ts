// Source: end-to-end-test/local/specs/custom-driver-annotations-in-result-view.spec.js
import { test, expect, Page } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';
import { waitForOncoprint, setSettingsMenuOpen } from '../helpers/oncoprint';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

const oncoprintTabUrl =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&data_priority=0&gene_list=ABLIM1%250ATMEM247&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize';

const oncoprintTabUrlCna =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&data_priority=0&gene_list=ACAP3%2520AGRN&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize&show_samples=true';

const oncoprintTabUrlStructVar =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&cancer_study_list=study_es_0&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cstructural_variants%2Cgistic&case_set_id=study_es_0_cnaseq&gene_list=TMPRSS2&geneset_list=%20&tab_index=tab_visualize';

function class1Input(page: Page) {
    return page.locator('label:has-text("Class 1")').locator('input');
}

function class2Input(page: Page) {
    return page.locator('label:has-text("Class 2")').locator('input');
}

test.describe('custom driver annotations feature in result view', () => {
    test.describe('oncoprint tab - mutations', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(page, oncoprintTabUrl, true);
            await waitForOncoprint(page);
            await setSettingsMenuOpen(page, true, 'GlobalSettingsButton');
        });

        test('shows custom driver annotation elements in config menu', async ({
            page,
        }) => {
            await expect(
                page.locator('input[data-test=annotateCustomBinary]')
            ).toBeChecked();
            const tiersCheckboxes = page
                .locator('span[data-test=annotateCustomTiers]')
                .locator('input');
            await expect(tiersCheckboxes.nth(0)).toBeChecked();
            await expect(tiersCheckboxes.nth(1)).toBeChecked();
        });

        test('allows deselection of Tiers checkboxes', async ({ page }) => {
            await class1Input(page).click();
            await waitForOncoprint(page);
            await expect(class1Input(page)).not.toBeChecked();

            await class2Input(page).click();
            await waitForOncoprint(page);
            await expect(class2Input(page)).not.toBeChecked();
        });

        test('updates selected samples when VUS alterations are excluded', async ({
            page,
        }) => {
            await page.locator('input[data-test=annotateHotspots]').click();
            await class1Input(page).click();
            await class2Input(page).click();

            await page.locator('input[data-test=HideVUS]').click();
            await waitForOncoprint(page);
            await expect(
                page.locator('div.alert-info:has-text("1 mutation")')
            ).toBeAttached();
            await class1Input(page).click();
            await waitForOncoprint(page);
            await expect(
                page.locator('div.alert-info:has-text("1 mutation")')
            ).toBeAttached();

            await class2Input(page).click();
            await waitForOncoprint(page);
            await expect(page.locator('div.alert-info')).toHaveCount(0);
        });
    });

    test.describe('oncoprint tab - discrete CNA', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(page, oncoprintTabUrlCna, true);
            await waitForOncoprint(page);
            await setSettingsMenuOpen(page, true, 'GlobalSettingsButton');
        });

        test('shows custom driver annotation elements in config menu', async ({
            page,
        }) => {
            await expect(
                page.locator('input[data-test=annotateCustomBinary]')
            ).toBeChecked();
            const tiersCheckboxes = page
                .locator('span[data-test=annotateCustomTiers]')
                .locator('input');
            await expect(tiersCheckboxes.nth(0)).toBeChecked();
            await expect(tiersCheckboxes.nth(1)).toBeChecked();
        });

        test('allows deselection of Tiers checkboxes', async ({ page }) => {
            await class1Input(page).click();
            await waitForOncoprint(page);
            await expect(class1Input(page)).not.toBeChecked();

            await class2Input(page).click();
            await waitForOncoprint(page);
            await expect(class2Input(page)).not.toBeChecked();
        });

        test('updates selected samples when VUS alterations are excluded', async ({
            page,
        }) => {
            await page.locator('input[data-test=annotateHotspots]').click();
            await class1Input(page).click();
            await class2Input(page).click();

            await page.locator('input[data-test=HideVUS]').click();
            await waitForOncoprint(page);
            await expect(
                page.locator(
                    'div.alert-info:has-text("17 copy number alterations")'
                )
            ).toBeAttached();

            await class1Input(page).click();
            await waitForOncoprint(page);
            await expect(
                page.locator(
                    'div.alert-info:has-text("17 copy number alterations")'
                )
            ).toBeAttached();

            await class2Input(page).click();
            await waitForOncoprint(page);
            await expect(
                page.locator(
                    'div.alert-info:has-text("16 copy number alterations")'
                )
            ).toBeAttached();
        });
    });

    test.describe('oncoprint tab - structural variants', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(
                page,
                oncoprintTabUrlStructVar,
                true
            );
            await waitForOncoprint(page);
            await setSettingsMenuOpen(page, true, 'GlobalSettingsButton');
        });

        test('shows custom driver annotation elements in config menu', async ({
            page,
        }) => {
            await expect(
                page.locator('input[data-test=annotateCustomBinary]')
            ).toBeChecked();
            const tiersCheckboxes = page
                .locator('span[data-test=annotateCustomTiers]')
                .locator('input');
            await expect(tiersCheckboxes.nth(0)).toBeChecked();
        });

        test('allows deselection of Tiers checkboxes', async ({ page }) => {
            await class1Input(page).click();
            await waitForOncoprint(page);
            await expect(class1Input(page)).not.toBeChecked();
        });

        test('updates selected samples when VUS alterations are excluded', async ({
            page,
        }) => {
            await page.locator('input[data-test=annotateHotspots]').click();
            await page.locator('input[data-test=annotateOncoKb]').click();
            await page.locator('input[data-test=HideVUS]').click();
            await waitForOncoprint(page);
            await expect(
                page.locator('div.alert-info:has-text("1 structural variant")')
            ).toBeAttached();

            await class1Input(page).click();
            await waitForOncoprint(page);
            await expect(
                page.locator('div.alert-info:has-text("2 structural variants")')
            ).toBeAttached();
        });
    });
});
