import { Page } from '@playwright/test';
import { test, expect } from '../../fixtures';
import { expectElementScreenshot, waitForNetworkQuiet } from './common';
import { setSettingsMenuOpen, waitForOncoprint } from './oncoprint';

/**
 * Shared results-view screenshot suite, ported from
 * end-to-end-test/remote/specs/core/screenshot.spec.js.
 *
 * Extracted into a helper so each URL config (no-session, session,
 * excluding-unprofiled) can live in its own spec file. Tests within a
 * config are independent — each gets a fresh `page` fixture and the
 * beforeEach navigates from scratch — so the describe is configured
 * parallel: the runner's --workers=2 then runs two tests concurrently
 * inside a shard, halving the wall-clock cost of this 15-test suite.
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
    // beforeEach used to call waitForOncoprint() unconditionally before any
    // preLoad ran. Now beforeEach only confirms the tab bar mounted (cheap)
    // because most tests in the suite immediately switch to a different tab
    // and don't need the oncoprint at all. Tests/preloads that DO need the
    // oncoprint must wait for it themselves — like this preload, which
    // toggles a setting that requires the oncoprint to be loaded first.
    await waitForOncoprint(page);
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
    test.describe(`${prefix} results-page screenshots`, () => {
        // Tests in this block don't share state — each gets a fresh page
        // and the beforeEach navigates from scratch. Opt into parallel
        // mode so --workers=N actually runs N at once. fullyParallel is
        // off globally; this opt-in keeps the rest of the suite serial.
        test.describe.configure({ mode: 'parallel' });

        test.use({ viewport: { width: 1600, height: 1000 } });

        test.beforeEach(async ({ page }) => {
            await page.goto(url);
            // Only confirm the results-page tab bar mounted; don't wait for
            // the full oncoprint to render. 14 of the 15 tests in this
            // suite immediately switch to a different tab and never look at
            // the oncoprint. The two cases that do need it
            // (test('oncoprint') and hideUnprofiledPreLoad) call
            // waitForOncoprint themselves.
            await expect(page.locator('a.tabAnchor_oncoprint')).toBeVisible({
                timeout: 30000,
            });
            if (opts.preLoad) await opts.preLoad(page);
        });

        const openComparison = async (page: Page) => {
            await page.locator('a.tabAnchor_comparison').click();
            await expect(
                page.locator('div[data-test="ComparisonPageOverlapTabContent"]')
            ).toBeVisible();
        };

        const openComparisonAlterations = async (page: Page) => {
            await openComparison(page);
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
        };

        test('oncoprint', async ({ page }) => {
            await waitForOncoprint(page);
            await page.waitForTimeout(100);
            await snapshot(
                page,
                '.oncoprintContainer',
                `${prefix}-oncoprint.png`
            );
        });

        test('igv tab', async ({ page }) => {
            await page.locator('a.tabAnchor_cnSegments').click();
            await expect(page.locator('.igv-column-container')).toBeVisible();
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

        test('cancer type summary', async ({ page }) => {
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

        test('mutex tab', async ({ page }) => {
            await page.locator('a.tabAnchor_mutualExclusivity').click();
            await snapshot(
                page,
                '[data-test="mutualExclusivityTabDiv"]',
                `${prefix}-mutex.png`
            );
        });

        test('plots tab', async ({ page }) => {
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

        test('mutation tab', async ({ page }) => {
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

        test('coexpression tab', async ({ page }) => {
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

        test('comparison overlap', async ({ page }) => {
            await openComparison(page);
            await snapshot(
                page,
                'div[data-test="ComparisonTabDiv"]',
                `${prefix}-comparison-overlap.png`
            );
        });

        test('comparison clinical', async ({ page }) => {
            await openComparison(page);
            await page
                .locator('.comparisonTabSubTabs .tabAnchor_clinical')
                .click();
            await expect(
                page.locator('div[data-test="ComparisonPageClinicalTabDiv"]')
            ).toBeVisible({ timeout: 30000 });
            // Kruskal-Wallis stats render asynchronously after the
            // tab activates — snapshotting before the network is
            // quiet captures an in-flight state and produces the
            // ~17,902-pixel diff we see flaking in CI. Sibling
            // 'comparison alterations sample mode' below already
            // uses this pattern.
            await waitForNetworkQuiet(page);
            await snapshot(
                page,
                'div[data-test="ComparisonTabDiv"]',
                `${prefix}-comparison-clinical.png`
            );
        });

        test('comparison alterations sample mode', async ({ page }) => {
            await openComparisonAlterations(page);
            await waitForNetworkQuiet(page);
            await page.waitForTimeout(500);
            await snapshot(
                page,
                'div[data-test="ComparisonTabDiv"]',
                `${prefix}-comparison-alterations-sample.png`,
                ['.qtip']
            );
        });

        test('comparison alterations patient mode', async ({ page }) => {
            await openComparisonAlterations(page);
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

        test('comparison mrna enrichments', async ({ page }) => {
            await openComparison(page);
            await page.locator('.comparisonTabSubTabs .tabAnchor_mrna').click();
            await expect(
                page
                    .locator('div[data-test="GroupComparisonMRNAEnrichments"]')
                    .first()
            ).toBeVisible({ timeout: 60000 });
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

        test('survival tab', async ({ page }) => {
            await openComparison(page);
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

        test('pathwaymapper tab', async ({ page }) => {
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

        test('data_download tab', async ({ page }) => {
            await page.locator('a.tabAnchor_download').click();
            await expect(
                page.locator("[data-test='downloadTabDiv']")
            ).toBeVisible({ timeout: 20000 });
            await waitForNetworkQuiet(page, 30000);
            await snapshot(
                page,
                "[data-test='downloadTabDiv']",
                `${prefix}-download.png`
            );
        });
    });
}
