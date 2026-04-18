import { test, expect, Page } from '@playwright/test';
import { expectElementScreenshot, waitForNetworkQuiet } from './common';
import { setSettingsMenuOpen, waitForOncoprint } from './oncoprint';

/**
 * Shared results-view screenshot suite, ported from
 * end-to-end-test/remote/specs/core/screenshot.spec.js.
 *
 * Extracted into a helper so each URL config (no-session, session,
 * excluding-unprofiled) can live in its own spec file and run on a
 * separate worker. Within a single config the tests still share one
 * page via describe.serial because they depend on cumulative state.
 */

export const NO_SESSION_URL =
    '/index.do?tab_index=tab_visualize&cancer_study_list=coadread_tcga_pub' +
    '&cancer_study_id=coadread_tcga_pub' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations' +
    '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic' +
    '&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut' +
    '&gene_list=KRAS+NRAS+BRAF&gene_set_choice=user-defined-list' +
    '&Action=Submit&show_samples=false&';

export const SESSION_URL = '/results?session_id=5bbe8197498eb8b3d5684271';

export const HIDE_UNPROFILED_URL =
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0' +
    '&cancer_study_list=gbm_tcga&case_set_id=gbm_tcga_all&data_priority=0' +
    '&gene_list=EGFR%250APTEN%250AIDH1%250ATP53&geneset_list=%20' +
    '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=gbm_tcga_gistic' +
    '&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=gbm_tcga_mrna_median_all_sample_Zscores' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=gbm_tcga_mutations' +
    '&hide_unprofiled_samples=false&profileFilter=0&tab_index=tab_visualize';

export const hideUnprofiledPreLoad = async (page: Page) => {
    await setSettingsMenuOpen(page, true);
    await expect(
        page.locator('input[data-test="HideUnprofiled"]')
    ).toBeAttached();
    await page.locator('input[data-test="HideUnprofiled"]').click();
    await waitForOncoprint(page);
    await setSettingsMenuOpen(page, false);
};

async function snapshot(
    page: Page,
    selector: string,
    name: string,
    hide: string[] = []
) {
    await expectElementScreenshot(page, selector, name, { hide });
}

export function runResultsTestSuite(
    prefix: string,
    url: string,
    opts: {
        mrnaEnrichmentsRowSelector?: string;
        preLoad?: (page: Page) => Promise<void>;
    } = {}
) {
    test.describe.serial(`${prefix} results-page screenshots`, () => {
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage({
                viewport: { width: 1600, height: 1000 },
            });
            await page.goto(url);
            await waitForOncoprint(page);
            if (opts.preLoad) await opts.preLoad(page);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('oncoprint', async () => {
            await waitForOncoprint(page);
            await page.waitForTimeout(100);
            await snapshot(
                page,
                '.oncoprintContainer',
                `${prefix}-oncoprint.png`
            );
        });

        test('igv tab', async () => {
            await page.locator('a.tabAnchor_cnSegments').click();
            await expect(page.locator('.igv-column-container')).toBeVisible();
            // IGV loads tracks asynchronously and `.pillTabs` keeps growing
            // as tracks render. Wait for the network to quiet then for the
            // element height to stabilize before snapshotting.
            await waitForNetworkQuiet(page);
            await page.waitForFunction(
                () => {
                    const el = document.querySelector('.pillTabs');
                    if (!el) return false;
                    const h = (el as HTMLElement).getBoundingClientRect()
                        .height;
                    const last = (window as any).__lastPillTabsHeight;
                    (window as any).__lastPillTabsHeight = h;
                    return last !== undefined && Math.abs(h - last) < 1;
                },
                null,
                { polling: 500, timeout: 30000 }
            );
            await snapshot(page, '.pillTabs', `${prefix}-igv.png`);
        });

        test('cancer type summary', async () => {
            await page.locator('a.tabAnchor_cancerTypesSummary').click();
            await expect(
                page.locator('[data-test="cancerTypeSummaryChart"]')
            ).toBeVisible({ timeout: 10000 });
            await expect(
                page.locator('[data-test="cancerTypeSummaryWrapper"]')
            ).toBeAttached();
            await snapshot(
                page,
                '[data-test="cancerTypeSummaryWrapper"]',
                `${prefix}-cancer-type-summary.png`
            );
        });

        test('mutex tab', async () => {
            await page.locator('a.tabAnchor_mutualExclusivity').click();
            await snapshot(
                page,
                '[data-test="mutualExclusivityTabDiv"]',
                `${prefix}-mutex.png`
            );
        });

        test('plots tab', async () => {
            await page.locator('a.tabAnchor_plots').click();
            await expect(
                page.locator('div[data-test="PlotsTabPlotDiv"]')
            ).toBeVisible({ timeout: 100000 });
            await snapshot(
                page,
                'div[data-test="PlotsTabEntireDiv"]',
                `${prefix}-plots.png`
            );
        });

        test('mutation tab', async () => {
            await page.locator('a.tabAnchor_mutations').click();
            await expect(
                page.locator('div[data-test="LollipopPlot"]')
            ).toBeVisible({ timeout: 20000 });
            await snapshot(
                page,
                '[data-test="mutationsTabDiv"]',
                `${prefix}-mutations.png`
            );
        });

        test('coexpression tab', async () => {
            await page.locator('a.tabAnchor_coexpression').click();
            await expect(
                page.locator('div[data-test="CoExpressionPlot"]')
            ).toBeVisible({ timeout: 120000 });
            await snapshot(
                page,
                '[data-test="coExpressionTabDiv"]',
                `${prefix}-coexpression.png`
            );
        });

        test('comparison overlap', async () => {
            await page.locator('a.tabAnchor_comparison').click();
            await expect(
                page.locator('div[data-test="ComparisonPageOverlapTabContent"]')
            ).toBeVisible();
            await snapshot(
                page,
                'div[data-test="ComparisonTabDiv"]',
                `${prefix}-comparison-overlap.png`
            );
        });

        test('comparison clinical', async () => {
            await page
                .locator('.comparisonTabSubTabs .tabAnchor_clinical')
                .click();
            await expect(
                page.locator('div[data-test="ComparisonPageClinicalTabDiv"]')
            ).toBeVisible();
            await snapshot(
                page,
                'div[data-test="ComparisonTabDiv"]',
                `${prefix}-comparison-clinical.png`
            );
        });

        test('comparison alterations sample mode', async () => {
            await page
                .locator('.comparisonTabSubTabs .tabAnchor_alterations')
                .click();
            await expect(
                page
                    .locator(
                        'div[data-test="GroupComparisonAlterationEnrichments"]'
                    )
                    .first()
            ).toBeVisible({ timeout: 60000 });
            await waitForNetworkQuiet(page);
            await page.waitForTimeout(500);
            await snapshot(
                page,
                'div[data-test="ComparisonTabDiv"]',
                `${prefix}-comparison-alterations-sample.png`,
                ['.qtip']
            );
        });

        test('comparison alterations patient mode', async () => {
            await page.evaluate(() => {
                (window as any).comparisonTab.store.setUsePatientLevelEnrichments(
                    true
                );
            });
            await expect(
                page
                    .locator(
                        'div[data-test="GroupComparisonAlterationEnrichments"]'
                    )
                    .first()
            ).toBeVisible({ timeout: 60000 });
            await waitForNetworkQuiet(page);
            await page.waitForTimeout(500);
            await snapshot(
                page,
                'div[data-test="ComparisonTabDiv"]',
                `${prefix}-comparison-alterations-patient.png`,
                ['.qtip']
            );
        });

        test('comparison mrna enrichments', async () => {
            await page.locator('.comparisonTabSubTabs .tabAnchor_mrna').click();
            await expect(
                page
                    .locator('div[data-test="GroupComparisonMRNAEnrichments"]')
                    .first()
            ).toBeVisible({ timeout: 60000 });
            // Wait for the enrichments table to actually populate rows
            // (the wrapper div appears before the data finishes loading).
            await expect(
                page
                    .locator(
                        'div[data-test="GroupComparisonMRNAEnrichments"] tbody tr'
                    )
                    .first()
            ).toBeVisible({ timeout: 60000 });
            await waitForNetworkQuiet(page);
            const rowSel =
                opts.mrnaEnrichmentsRowSelector ?? 'b:text-is("ETV5")';
            await expect(page.locator(rowSel).first()).toBeVisible({
                timeout: 60000,
            });
            await page
                .locator(rowSel)
                .first()
                .click();
            await expect(
                page.locator('div[data-test="MiniBoxPlot"]')
            ).toBeVisible();
            await snapshot(
                page,
                'div[data-test="ComparisonTabDiv"]',
                `${prefix}-comparison-mrna.png`
            );
        });

        test('survival tab', async () => {
            await page
                .locator('.comparisonTabSubTabs a.tabAnchor_survival')
                .click();
            await expect(
                page
                    .locator('[data-test="ComparisonPageSurvivalTabDiv"] svg')
                    .first()
            ).toBeVisible({ timeout: 10000 });
            await snapshot(
                page,
                '[data-test="ComparisonTabDiv"]',
                `${prefix}-survival.png`
            );
        });

        test('pathwaymapper tab', async () => {
            await expect(page.locator('a.tabAnchor_pathways')).toBeVisible();
            await page.locator('a.tabAnchor_pathways').click();
            await expect(page.locator('#cy')).toBeVisible({ timeout: 10000 });
            await waitForNetworkQuiet(page, 30000);
            await snapshot(
                page,
                '[data-test="pathwayMapperTabDiv"]',
                `${prefix}-pathways.png`,
                ['.qtip', '.__react_component_tooltip', '.rc-tooltip']
            );
        });

        test('data_download tab', async () => {
            await page.locator('a.tabAnchor_download').click();
            await expect(
                page.locator("[data-test='downloadTabDiv']")
            ).toBeVisible({ timeout: 20000 });
            await snapshot(
                page,
                "[data-test='downloadTabDiv']",
                `${prefix}-download.png`
            );
        });
    });
}
