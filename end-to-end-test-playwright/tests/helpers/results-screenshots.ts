import { Page } from '@playwright/test';
import { test, expect } from '../../fixtures';
import {
    expectElementScreenshot,
    waitForIgvRendered,
    waitForNetworkQuiet,
} from './common';
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

// The public CI browser cannot reach UCSC's cytoband endpoint reliably. IGV
// waits for that optional metadata before laying out its tracks, leaving only
// the toolbar mounted. Keep the screenshot test deterministic by serving the
// hg19 chromosome used by this URL locally; segment data still comes from the
// public cBioPortal API.
const HG19_CYTOBAND_URL =
    'https://hgdownload.soe.ucsc.edu/goldenPath/hg19/database/cytoBand.txt.gz';
const HG19_CHR7_CYTOBANDS = `chr7\t0\t2800000\tp22.3\tgneg
chr7\t2800000\t4500000\tp22.2\tgpos25
chr7\t4500000\t7300000\tp22.1\tgneg
chr7\t7300000\t13800000\tp21.3\tgpos100
chr7\t13800000\t16500000\tp21.2\tgneg
chr7\t16500000\t20900000\tp21.1\tgpos100
chr7\t20900000\t25500000\tp15.3\tgneg
chr7\t25500000\t28000000\tp15.2\tgpos50
chr7\t28000000\t28800000\tp15.1\tgneg
chr7\t28800000\t35000000\tp14.3\tgpos75
chr7\t35000000\t37200000\tp14.2\tgneg
chr7\t37200000\t43300000\tp14.1\tgpos75
chr7\t43300000\t45400000\tp13\tgneg
chr7\t45400000\t49000000\tp12.3\tgpos75
chr7\t49000000\t50500000\tp12.2\tgneg
chr7\t50500000\t54000000\tp12.1\tgpos75
chr7\t54000000\t58000000\tp11.2\tgneg
chr7\t58000000\t59900000\tp11.1\tacen
chr7\t59900000\t61700000\tq11.1\tacen
chr7\t61700000\t67000000\tq11.21\tgneg
chr7\t67000000\t72200000\tq11.22\tgpos50
chr7\t72200000\t77500000\tq11.23\tgneg
chr7\t77500000\t86400000\tq21.11\tgpos100
chr7\t86400000\t88200000\tq21.12\tgneg
chr7\t88200000\t91100000\tq21.13\tgpos75
chr7\t91100000\t92800000\tq21.2\tgneg
chr7\t92800000\t98000000\tq21.3\tgpos75
chr7\t98000000\t103800000\tq22.1\tgneg
chr7\t103800000\t104500000\tq22.2\tgpos50
chr7\t104500000\t107400000\tq22.3\tgneg
chr7\t107400000\t114600000\tq31.1\tgpos75
chr7\t114600000\t117400000\tq31.2\tgneg
chr7\t117400000\t121100000\tq31.31\tgpos75
chr7\t121100000\t123800000\tq31.32\tgneg
chr7\t123800000\t127100000\tq31.33\tgpos75
chr7\t127100000\t129200000\tq32.1\tgneg
chr7\t129200000\t130400000\tq32.2\tgpos25
chr7\t130400000\t132600000\tq32.3\tgneg
chr7\t132600000\t138200000\tq33\tgpos50
chr7\t138200000\t143100000\tq34\tgneg
chr7\t143100000\t147900000\tq35\tgpos75
chr7\t147900000\t152600000\tq36.1\tgneg
chr7\t152600000\t155100000\tq36.2\tgpos25
chr7\t155100000\t159138663\tq36.3\tgneg`;

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

async function waitForResultsTabBar(page: Page, timeout = 30000) {
    const tab = page.locator('a.tabAnchor_oncoprint');
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            await expect(tab).toBeVisible({ timeout });
            return;
        } catch (error) {
            const upstreamError = await page
                .locator(
                    'h4:has-text("Oops. There was an error retrieving data.")'
                )
                .isVisible()
                .catch(() => false);
            if (!upstreamError || attempt === 2) throw error;

            // The public portal occasionally returns a transient 502 while
            // loading the initial molecular-data request. Reload the same
            // deterministic URL before allowing the test to fail.
            await page.reload({ waitUntil: 'domcontentloaded' });
        }
    }
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
            await page.route(HG19_CYTOBAND_URL, route =>
                route.fulfill({
                    status: 200,
                    contentType: 'text/plain',
                    body: HG19_CHR7_CYTOBANDS,
                })
            );
            await page.goto(url);
            // Only confirm the results-page tab bar mounted; don't wait for
            // the full oncoprint to render. 14 of the 15 tests in this
            // suite immediately switch to a different tab and never look at
            // the oncoprint. The two cases that do need it
            // (test('oncoprint') and hideUnprofiledPreLoad) call
            // waitForOncoprint themselves.
            await waitForResultsTabBar(page);
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
            // IGV initializes after the tab switch and can be delayed by the
            // public server's segment/profile requests. Give the container
            // the same headroom as the subsequent settled-frame wait.
            await waitForIgvRendered(page, 60000);
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
            await expect(page.locator('#cy')).toBeVisible({ timeout: 30000 });
            await waitForNetworkQuiet(page, 30000);
            // Cytoscape and the pathway alteration store can finish after
            // ajaxQuiet flips true. Do not capture the intermediate loading
            // banner; wait for that state to clear, then allow a render frame
            // before capturing the canvas-backed view.
            await page.waitForFunction(
                () => {
                    const banner = document.querySelector(
                        '[data-test="pathwayMapperMessageBox"]'
                    );
                    return (
                        !banner ||
                        !banner.textContent?.includes('Loading alteration data')
                    );
                },
                null,
                { timeout: 60000 }
            );
            await page.waitForTimeout(1000);
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
