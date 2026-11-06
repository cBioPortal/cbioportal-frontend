import { test, expect } from '../fixtures';
import { Locator, Page } from '@playwright/test';
import { waitForStudyView } from './helpers/common';
import {
    findOncoprintTrackIndexByLabel,
    waitForOncoprint,
} from './helpers/oncoprint';

/**
 * Generic Assay entity selectors in Study View (Add Chart), Results View
 * Oncoprint (Add Tracks) and the Plots tab.
 *
 * ccle_broad_2019 has 266 treatments per profile, more than the 100
 * options the selector lists at once, so these tests cover searching for
 * and restoring treatments that are not in the first 100.
 */

const STUDY_ID = 'ccle_broad_2019';
const IC50_PROFILE_ID = `${STUDY_ID}_CCLE_drug_treatment_IC50`;

// sorts after the first 100 treatments
const LATE_TREATMENT_ID = 'ZSTK474';
const LATE_TREATMENT_LABEL =
    'ZSTK474: Target:PI3K (class 1); Synonyms:KIN001-167, ZSTK-474, ZSTK 474';

const STUDY_VIEW_URL = `/study/summary?id=${STUDY_ID}`;
const ONCOPRINT_URL =
    `/results/oncoprint?cancer_study_list=${STUDY_ID}` +
    `&case_set_id=${STUDY_ID}_all&gene_list=EGFR&profileFilter=0` +
    '&tab_index=tab_visualize&Action=Submit';

const METHYLATION_STUDY_ID = 'acc_tcga_pan_can_atlas_2018';
const METHYLATION_ONCOPRINT_URL =
    `/results/oncoprint?cancer_study_list=${METHYLATION_STUDY_ID}` +
    `&case_set_id=${METHYLATION_STUDY_ID}_all&gene_list=TP53&profileFilter=0` +
    '&tab_index=tab_visualize&Action=Submit';

const ADD_CHART_BUTTON = "[data-test='add-charts-button']";
const ADD_CHART_TREATMENT_TAB = '.addChartTabs a.tabAnchor_TREATMENT_RESPONSE';
const ADD_TRACKS_BUTTON = 'button#addTracksDropdown';
const ADD_TRACKS_TREATMENT_TAB =
    '.oncoprintAddTracks a.tabAnchor_TREATMENT_RESPONSE';

// Large studies take a while to load on the public portal.
const LOAD_TIMEOUT = 60000;

function visibleSelection(page: Page) {
    const selection = page
        .locator('[data-test="GenericAssaySelection"]')
        .filter({ visible: true });
    const entity = selection.locator(
        '[data-test="GenericAssayEntitySelection"]'
    );
    return {
        selection,
        entity,
        input: entity.locator('input').first(),
        menu: entity.locator('[class*="-menu"]'),
        options: entity.locator('div[class$="option"]'),
        chips: entity.locator('div[class$="multiValue"]'),
        submit: selection.locator(
            '[data-test="GenericAssaySelectionSubmitButton"]'
        ),
    };
}

async function openMenu(entity: Locator, menu: Locator) {
    // the menu closes if another element takes focus while the page loads,
    // so click until it stays open
    await expect(async () => {
        if (!(await menu.isVisible())) {
            await entity
                .locator('[class*="-control"]')
                .first()
                .click();
        }
        await expect(menu).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: LOAD_TIMEOUT });
}

async function search(
    selector: ReturnType<typeof visibleSelection>,
    text: string
) {
    await openMenu(selector.entity, selector.menu);
    await selector.input.pressSequentially(text);
    await expect(selector.input).toHaveValue(text);
}

// the option menu covers the submit button; it closes when the input
// loses focus (Escape would also close the Add Tracks dropdown)
async function closeMenuAndSubmit(
    selector: ReturnType<typeof visibleSelection>
) {
    await selector.input.blur();
    await expect(selector.menu).toHaveCount(0);
    await selector.submit.click();
}

async function openStudyViewTreatmentTab(page: Page) {
    await page.goto(STUDY_VIEW_URL);
    await waitForStudyView(page, LOAD_TIMEOUT);
    await expect(async () => {
        if (!(await page.locator(ADD_CHART_TREATMENT_TAB).isVisible())) {
            await page.locator(ADD_CHART_BUTTON).click();
        }
        await expect(page.locator(ADD_CHART_TREATMENT_TAB)).toBeVisible({
            timeout: 5000,
        });
    }).toPass({ timeout: LOAD_TIMEOUT });
    await page.locator(ADD_CHART_TREATMENT_TAB).click();
}

async function openOncoprintTreatmentTab(page: Page, url = ONCOPRINT_URL) {
    await page.goto(url);
    await waitForOncoprint(page, LOAD_TIMEOUT);
    await page.locator(ADD_TRACKS_BUTTON).click();
    await page
        .locator(ADD_TRACKS_TREATMENT_TAB)
        .click({ timeout: LOAD_TIMEOUT });
}

test.describe('generic assay selection', () => {
    test.describe('study view add chart', () => {
        test('lists the first 100 treatments with the total count', async ({
            page,
        }) => {
            await openStudyViewTreatmentTab(page);
            const selector = visibleSelection(page);
            await openMenu(selector.entity, selector.menu);
            await expect(
                selector.menu
            ).toContainText(/Showing first 100 of \d+ results/, {
                timeout: LOAD_TIMEOUT,
            });
            await expect(selector.options).toHaveCount(100);
        });

        test('adds a chart for a treatment found by search', async ({
            page,
        }) => {
            await openStudyViewTreatmentTab(page);
            const selector = visibleSelection(page);
            await search(selector, LATE_TREATMENT_ID);
            const option = selector.options.filter({
                hasText: LATE_TREATMENT_LABEL,
            });
            await expect(option).toHaveCount(1, { timeout: LOAD_TIMEOUT });
            await expect(selector.options.first()).toHaveText(
                'Select all filtered options (1)'
            );

            await option.click();
            await expect(selector.chips).toHaveText([LATE_TREATMENT_LABEL]);
            await closeMenuAndSubmit(selector);

            await expect(
                page
                    .locator('[data-test^="chart-container-"]')
                    .filter({ hasText: LATE_TREATMENT_ID })
            ).toHaveCount(1, { timeout: LOAD_TIMEOUT });
        });
    });

    test.describe('oncoprint add tracks', () => {
        test('adds a heatmap track for a treatment found by search', async ({
            page,
        }) => {
            await openOncoprintTreatmentTab(page);
            const selector = visibleSelection(page);
            await search(selector, LATE_TREATMENT_ID);
            await selector.options
                .filter({ hasText: LATE_TREATMENT_LABEL })
                .click({ timeout: LOAD_TIMEOUT });
            await expect(selector.chips).toHaveText([LATE_TREATMENT_LABEL]);
            await closeMenuAndSubmit(selector);

            await waitForOncoprint(page, LOAD_TIMEOUT);
            await expect
                .poll(
                    () =>
                        findOncoprintTrackIndexByLabel(
                            page,
                            new RegExp(LATE_TREATMENT_ID)
                        ),
                    { timeout: LOAD_TIMEOUT }
                )
                .toBeGreaterThan(0);
        });

        test('lists methylation probes of the queried gene first', async ({
            page,
        }) => {
            // master loads every probe of the HM450 profile before showing
            // the tab
            test.setTimeout(240000);
            await page.goto(METHYLATION_ONCOPRINT_URL);
            await waitForOncoprint(page, LOAD_TIMEOUT);
            await page.locator(ADD_TRACKS_BUTTON).click();
            await page
                .locator('.oncoprintAddTracks a.tabAnchor_METHYLATION')
                .click({ timeout: 180000 });
            const selector = visibleSelection(page);
            await openMenu(selector.entity, selector.menu);
            await expect(selector.options.first()).toContainText(/^TP53[;\s]/, {
                timeout: LOAD_TIMEOUT,
            });
        });

        test('shows a treatment from the `generic_assay_groups` URL parameter', async ({
            page,
        }) => {
            await openOncoprintTreatmentTab(
                page,
                `${ONCOPRINT_URL}&generic_assay_groups=${IC50_PROFILE_ID},${LATE_TREATMENT_ID}`
            );
            const selector = visibleSelection(page);
            await selector.selection
                .locator('[data-test="GenericAssayProfileSelection"]')
                .click();
            await page
                .locator('div[class$="option"]', {
                    hasText: 'Treatment response: IC50',
                })
                .first()
                .click();
            await expect(selector.chips).toHaveText([LATE_TREATMENT_LABEL], {
                timeout: LOAD_TIMEOUT,
            });
        });
    });

    test.describe('plots tab', () => {
        const PLOTS_URL =
            `/results/plots?cancer_study_list=${STUDY_ID}` +
            `&case_set_id=${STUDY_ID}_all&gene_list=EGFR` +
            '&tab_index=tab_visualize&Action=Submit' +
            '&plots_vert_selection=%7B%22selectedGeneOption%22%3A1956%7D' +
            '&plots_coloring_selection=%7B%7D';
        // the first axis block is the horizontal axis
        const HORZ_SELECTION_BOX =
            'div.axisBlock >> nth=0 >> div.genericAssaySelectBox';

        test('shows a treatment from the `plots_horz_selection` URL parameter', async ({
            page,
        }) => {
            const horzSelection = encodeURIComponent(
                JSON.stringify({
                    dataType: 'TREATMENT_RESPONSE',
                    selectedDataSourceOption: IC50_PROFILE_ID,
                    selectedGenericAssayOption: LATE_TREATMENT_ID,
                })
            );
            await page.goto(
                `${PLOTS_URL}&plots_horz_selection=${horzSelection}`
            );
            await expect(
                page.locator(HORZ_SELECTION_BOX)
            ).toHaveText(LATE_TREATMENT_LABEL, { timeout: LOAD_TIMEOUT });
        });

        test('selects a treatment found by search', async ({ page }) => {
            const horzSelection = encodeURIComponent(
                JSON.stringify({
                    dataType: 'TREATMENT_RESPONSE',
                    selectedDataSourceOption: IC50_PROFILE_ID,
                })
            );
            await page.goto(
                `${PLOTS_URL}&plots_horz_selection=${horzSelection}`
            );
            const box = page.locator(HORZ_SELECTION_BOX);
            await expect(box).toBeVisible({ timeout: LOAD_TIMEOUT });
            await box.click();
            await box
                .locator('input')
                .first()
                .pressSequentially(LATE_TREATMENT_ID);
            await box
                .locator('div[class$="option"]', {
                    hasText: LATE_TREATMENT_LABEL,
                })
                .click({ timeout: LOAD_TIMEOUT });
            await expect(box).toHaveText(LATE_TREATMENT_LABEL);
            await expect(page).toHaveURL(
                new RegExp(
                    `selectedGenericAssayOption%22%3A%22${LATE_TREATMENT_ID}`
                )
            );
        });
    });
});
