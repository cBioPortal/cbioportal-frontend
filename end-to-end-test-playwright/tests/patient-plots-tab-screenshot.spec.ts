import { test, expect, Page } from '../fixtures';
import { expectElementScreenshot, waitForNetworkQuiet } from './helpers/common';

/**
 * Screenshot tests for the Patient View Plots tab.
 *
 * The tab lives at /patient/plots?studyId=...&caseId=... (path-based tab
 * routing via PatientViewUrlWrapper). brca_tcga / TCGA-A2-A0T2 is used
 * throughout: it has mutation, CNA, and RNA-seq expression data, and the
 * study spans three cancer types (Breast Cancer, Breast Sarcoma, Skin Cancer
 * Non-Melanoma) so Reference Cohort changes produce clearly distinct plots.
 */

const PLOT_DIV = 'div[data-test="PlotsTabPlotDiv"]';
const ENTIRE_DIV = 'div[data-test="PlotsTabEntireDiv"]';

// TP53 (7157) vs BRCA1 (672) RNA-seq Z-scores scatter plot
const SCATTER_PLOT_URL =
    '/patient/plots?studyId=brca_tcga&caseId=TCGA-A2-A0T2' +
    '&plots_horz_selection=%7B"selectedGeneOption"%3A7157%2C"dataType"%3A"MRNA_EXPRESSION"%2C"selectedDataSourceOption"%3A"rna_seq_v2_mrna_median_Zscores"%7D' +
    '&plots_vert_selection=%7B"selectedGeneOption"%3A672%2C"dataType"%3A"MRNA_EXPRESSION"%2C"selectedDataSourceOption"%3A"rna_seq_v2_mrna_median_Zscores"%7D';

// BRCA1 expression boxed by Cancer Type Detailed
const BOX_PLOT_URL =
    '/patient/plots?studyId=brca_tcga&caseId=TCGA-A2-A0T2' +
    '&plots_horz_selection=%7B"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"CANCER_TYPE_DETAILED"%7D' +
    '&plots_vert_selection=%7B"selectedGeneOption"%3A672%2C"dataType"%3A"MRNA_EXPRESSION"%2C"selectedDataSourceOption"%3A"rna_seq_v2_mrna_median_Zscores"%7D';

// Cancer Type (X) vs Mutation Count (Y) — a box plot whose reference
// distribution changes visibly across the three cohort options:
//   Whole Study          → 3 boxes (Breast Cancer, Breast Sarcoma, Skin Cancer Non-Melanoma)
//   Cancer Type          → 1 box  (Breast Cancer only)
//   Cancer Type Detailed → 1 box  (patient's exact detailed subtype only)
const COHORT_BASE_URL =
    '/patient/plots?studyId=brca_tcga&caseId=TCGA-A2-A0T2' +
    '&plots_horz_selection=%7B"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"CANCER_TYPE"%7D' +
    '&plots_vert_selection=%7B"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"MUTATION_COUNT"%7D';

async function waitForPlotsTabReady(page: Page) {
    await expect(page.locator(PLOT_DIV)).toBeVisible({ timeout: 30000 });
    await waitForNetworkQuiet(page);
    // Give Plotly / d3 a frame to settle before snapshotting.
    await page.waitForTimeout(500);
}

async function snap(page: Page, name: string) {
    await waitForPlotsTabReady(page);
    await expectElementScreenshot(page, ENTIRE_DIV, name);
}

/**
 * Switch the Reference Cohort react-select to the option whose label contains
 * `optionText`. Scoped to `input[name="cohort-select"]` so it can't
 * accidentally interact with other Select widgets on the page.
 * After clicking, waits for the plot to re-render via waitForNetworkQuiet.
 */
async function selectCohort(page: Page, optionText: string) {
    const cohortSelect = page.locator(
        '.Select:has(input[name="cohort-select"])'
    );
    await cohortSelect.locator('.Select-control').click();
    // Use exact string match via hasText to avoid 'Cancer Type:' matching
    // 'Cancer Type Detailed:' as a substring.
    await page
        .locator('.Select-option', { hasText: optionText })
        .first()
        .click();
    // Wait for new cohort data to load and the plot to re-render.
    await waitForNetworkQuiet(page);
    await page.waitForTimeout(500);
}

test.describe('Patient View Plots Tab', () => {
    test.describe.serial('scatter plot tests', () => {
        test.describe.configure({ retries: 0 });
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await page.goto(SCATTER_PLOT_URL);
            await waitForPlotsTabReady(page);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('default scatter plot', async () => {
            await snap(page, 'patient-plots-tab-default-scatter.png');
        });

        test('patient samples highlighted on plot', async () => {
            // The patient's own samples are highlighted by default in the
            // cohort scatter; capture just the plot area to verify this.
            await expectElementScreenshot(
                page,
                PLOT_DIV,
                'patient-plots-tab-highlighted-samples.png',
                { pauseMs: 200 }
            );
        });

        test('swap axes', async () => {
            await page.locator('[data-test="swapHorzVertButton"]').click();
            await snap(page, 'patient-plots-tab-swapped-axes.png');
            // Restore for subsequent tests.
            await page.locator('[data-test="swapHorzVertButton"]').click();
            await waitForPlotsTabReady(page);
        });

        test('mutation type coloring', async () => {
            await page.locator('input[data-test="ViewMutationType"]').click();
            await snap(page, 'patient-plots-tab-mutation-type-coloring.png');
        });

        test('copy number coloring', async () => {
            // Turn off mutation type first, then enable copy number.
            await page.locator('input[data-test="ViewMutationType"]').click();
            await page.locator('input[data-test="ViewCopyNumber"]').click();
            await snap(page, 'patient-plots-tab-copy-number-coloring.png');
            // Restore for any tests that might follow.
            await page.locator('input[data-test="ViewCopyNumber"]').click();
            await waitForPlotsTabReady(page);
        });
    });

    test.describe('box plot tests', () => {
        test('box plot', async ({ page }) => {
            await page.goto(BOX_PLOT_URL);
            await snap(page, 'patient-plots-tab-box-plot.png');
        });
    });

    test.describe.serial('reference cohort selector tests', () => {
        test.describe.configure({ retries: 0 });
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await page.goto(COHORT_BASE_URL);
            await waitForPlotsTabReady(page);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('whole study cohort (default)', async () => {
            // All three cancer-type groups visible as reference distribution.
            await snap(page, 'patient-plots-tab-cohort-whole-study.png');
        });

        test('cancer type cohort', async () => {
            // Breast Sarcoma and Skin Cancer boxes should disappear.
            await selectCohort(page, 'Cancer Type:');
            await expectElementScreenshot(
                page,
                ENTIRE_DIV,
                'patient-plots-tab-cohort-cancer-type.png'
            );
        });

        test('cancer type detailed cohort', async () => {
            // Narrows further to the patient's specific detailed subtype.
            await selectCohort(page, 'Cancer Type Detailed:');
            await expectElementScreenshot(
                page,
                ENTIRE_DIV,
                'patient-plots-tab-cohort-cancer-type-detailed.png'
            );
        });
    });
});
