import { test, expect, Page } from '@playwright/test';
import { expectElementScreenshot, waitForNetworkQuiet } from './helpers/common';
import { setSettingsMenuOpen, waitForOncoprint } from './helpers/oncoprint';

/**
 * Port of end-to-end-test/remote/specs/core/screenshot.spec.js.
 *
 * Screenshots the main tabs of the results-view (no session, session,
 * and "excluding unprofiled samples" config) plus a handful of
 * download/enrichments/patient/pathways views. Each runResultsTab*
 * test clicks into a tab and snapshots the signature pane.
 *
 * The three result-view configs run sequentially inside their own
 * describe.serial so they can share a single page load + state
 * mutation — cold-loading each tab combo would triple the wall time.
 */

const NO_SESSION_URL =
    '/index.do?tab_index=tab_visualize&cancer_study_list=coadread_tcga_pub' +
    '&cancer_study_id=coadread_tcga_pub' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations' +
    '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic' +
    '&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut' +
    '&gene_list=KRAS+NRAS+BRAF&gene_set_choice=user-defined-list' +
    '&Action=Submit&show_samples=false&';

const SESSION_URL = '/results?session_id=5bbe8197498eb8b3d5684271';

const HIDE_UNPROFILED_URL =
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0' +
    '&cancer_study_list=gbm_tcga&case_set_id=gbm_tcga_all&data_priority=0' +
    '&gene_list=EGFR%250APTEN%250AIDH1%250ATP53&geneset_list=%20' +
    '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=gbm_tcga_gistic' +
    '&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=gbm_tcga_mrna_median_all_sample_Zscores' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=gbm_tcga_mutations' +
    '&hide_unprofiled_samples=false&profileFilter=0&tab_index=tab_visualize';

async function snapshot(
    page: Page,
    selector: string,
    name: string,
    hide: string[] = []
) {
    await expectElementScreenshot(page, selector, name, { hide });
}

function runResultsTestSuite(
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

runResultsTestSuite('no-session', NO_SESSION_URL);
runResultsTestSuite('session', SESSION_URL);
runResultsTestSuite('excluding-unprofiled', HIDE_UNPROFILED_URL, {
    // The top gene depends on live cbioportal.org data with patient_enrichments=true
    // (set by the preceding alterations-patient-mode test). KRT17P5 is the
    // current top hit; if it shifts, swap for whatever the table now ranks first.
    mrnaEnrichmentsRowSelector: 'b:text-is("KRT17P5")',
    preLoad: async page => {
        await setSettingsMenuOpen(page, true);
        await expect(
            page.locator('input[data-test="HideUnprofiled"]')
        ).toBeAttached();
        await page.locator('input[data-test="HideUnprofiled"]').click();
        await waitForOncoprint(page);
        await setSettingsMenuOpen(page, false);
    },
});

test.describe('download tab screenshot tests', () => {
    const downloadCases = [
        {
            name: 'msk_impact_2017-ALK-SOS1',
            url:
                '/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2' +
                '&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_all' +
                '&gene_list=ALK%2520SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit' +
                '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna',
            clickDownloadTab: true,
        },
        {
            name: 'nsclc_tcga_broad_2016-TP53',
            url:
                '/results/download?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0' +
                '&cancer_study_list=nsclc_tcga_broad_2016&case_set_id=nsclc_tcga_broad_2016_cnaseq' +
                '&data_priority=0&gene_list=TP53&geneset_list=%20' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=nsclc_tcga_broad_2016_cna' +
                '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=nsclc_tcga_broad_2016_mutations' +
                '&tab_index=tab_visualize',
        },
        {
            name: 'nsclc_tcga_broad_2016-merged-track',
            url:
                '/results/download?Action=Submit' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=nsclc_tcga_broad_2016_cna' +
                '&Z_SCORE_THRESHOLD=2.0&tab_index=tab_visualize&data_priority=0' +
                '&case_set_id=nsclc_tcga_broad_2016_cnaseq' +
                '&gene_list=CDKN2A%2520MDM2%2520%255B%2522MERGED%2522%2520MDM4%2520TP53%255D' +
                '&RPPA_SCORE_THRESHOLD=2.0&cancer_study_list=nsclc_tcga_broad_2016' +
                '&geneset_list=%20&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=nsclc_tcga_broad_2016_mutations',
        },
        {
            name: 'nsclc_tcga_broad_2016-EGFR-T790M-AMP',
            url:
                '/results/download?Action=Submit' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=nsclc_tcga_broad_2016_cna' +
                '&Z_SCORE_THRESHOLD=2.0&tab_index=tab_visualize&data_priority=0' +
                '&case_set_id=nsclc_tcga_broad_2016_cnaseq' +
                '&gene_list=EGFR%253A%2520MUT%253DT790M%2520AMP&RPPA_SCORE_THRESHOLD=2.0' +
                '&cancer_study_list=nsclc_tcga_broad_2016&geneset_list=%20' +
                '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=nsclc_tcga_broad_2016_mutations',
        },
        {
            name: 'nsclc_tcga_broad_2016-overlapping-TP53',
            url:
                '/results/download?Action=Submit' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=nsclc_tcga_broad_2016_cna' +
                '&Z_SCORE_THRESHOLD=2.0&tab_index=tab_visualize&data_priority=0' +
                '&case_set_id=nsclc_tcga_broad_2016_cnaseq' +
                '&gene_list=TP53%250ATP53%253A%2520AMP%250ATP53%253A%2520MUT' +
                '&RPPA_SCORE_THRESHOLD=2.0&cancer_study_list=nsclc_tcga_broad_2016' +
                '&geneset_list=%20&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=nsclc_tcga_broad_2016_mutations',
        },
    ];

    for (const c of downloadCases) {
        test(`download tab — ${c.name}`, async ({ browser }) => {
            const page = await browser.newPage({
                viewport: { width: 1600, height: 1000 },
            });
            await page.goto(c.url);
            if (c.clickDownloadTab) {
                await expect(page.locator('a.tabAnchor_download')).toBeVisible({
                    timeout: 10000,
                });
                await page.locator('a.tabAnchor_download').click();
            }
            await expect(
                page
                    .locator(
                        '[data-test="dataDownloadGeneAlterationTable"] tr > td > svg'
                    )
                    .first()
            ).toBeAttached({ timeout: 30000 });
            await expect(
                page.locator('[data-test="downloadTabDiv"]')
            ).toBeVisible({ timeout: 15000 });
            await snapshot(
                page,
                '[data-test="downloadTabDiv"]',
                `download-${c.name}.png`
            );
            await page.close();
        });
    }
});

test.describe('patient view screenshot tests', () => {
    test('patient view lgg_ucsf_2014 P04', async ({ browser }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto('/patient?studyId=lgg_ucsf_2014&caseId=P04');
        await expect(
            page.locator('[data-test="oncogenic-icon-image"]').first()
        ).toBeAttached({ timeout: 30000 });
        await expect(page.locator('.vafPlotThumbnail').first()).toBeAttached({
            timeout: 30000,
        });
        await snapshot(page, '#mainColumn', 'patient-lgg-ucsf-2014-P04.png');
        await page.close();
    });

    test('patient view with 0 mutations msk_impact_2017 P-0000053-T01-IM3', async ({
        browser,
    }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto(
            '/patient?sampleId=P-0000053-T01-IM3&studyId=msk_impact_2017'
        );
        await expect(
            page.locator('span:has-text("0 Mutations")')
        ).toBeAttached();
        await expect(
            page.locator('div:has-text("21.6%")').first()
        ).toBeAttached();
        await snapshot(
            page,
            '#mainColumn',
            'patient-msk-impact-0-mutations.png',
            ['.qtip']
        );
        await page.close();
    });

    test('patient view pathways tab msk_impact_2017 P-0000377', async ({
        browser,
    }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto(
            '/patient/pathways?studyId=msk_impact_2017&caseId=P-0000377'
        );
        await expect(page.locator('#cy')).toBeVisible({ timeout: 10000 });
        await snapshot(
            page,
            '[data-test="pathwayMapperTabDiv"]',
            'patient-pathways-P-0000377.png',
            ['.qtip', '.__react_component_tooltip', '.rc-tooltip']
        );
        await page.close();
    });

    test('patient view pathways tab msk_impact_2017 P-0000377-T03-IM3', async ({
        browser,
    }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto(
            '/patient/pathways?studyId=msk_impact_2017&sampleId=P-0000377-T03-IM3'
        );
        await expect(page.locator('#cy')).toBeVisible({ timeout: 10000 });
        await snapshot(
            page,
            '[data-test="pathwayMapperTabDiv"]',
            'patient-pathways-P-0000377-T03-IM3.png',
            ['.qtip', '.__react_component_tooltip', '.rc-tooltip']
        );
        await page.close();
    });
});

test.describe('enrichments tab screenshot tests', () => {
    test('enrichments tab coadread_tcga_pub mRNA profile (MERTK)', async ({
        browser,
    }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto(
            '/results/enrichments?tab_index=tab_visualize' +
                '&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub' +
                '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic' +
                '&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut' +
                '&gene_list=KRAS+NRAS+BRAF&gene_set_choice=user-defined-list&Action=Submit'
        );
        await expect(
            page.locator('.comparisonTabSubTabs .tabAnchor_mrna')
        ).toBeVisible();
        await page.locator('.comparisonTabSubTabs .tabAnchor_mrna').click();
        await expect(
            page.locator('div[data-test="GroupComparisonMRNAEnrichments"]')
        ).toBeVisible();
        await page.locator('b:text-is("MERTK")').click();
        await expect(
            page.locator('div[data-test="MiniBoxPlot"]')
        ).toBeVisible();
        await snapshot(
            page,
            'div[data-test="ComparisonTabDiv"]',
            'enrichments-mrna-MERTK.png'
        );
        await page.close();
    });
});

test.describe('results page pathways tab with unprofiled genes', () => {
    test('renders without runtime errors', async ({ browser }) => {
        const page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto(
            '/results/pathways?cancer_study_list=msk_impact_2017&Z_SCORE_THRESHOLD=2.0' +
                '&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cfusion%2Ccna' +
                '&case_set_id=msk_impact_2017_cnaseq' +
                '&gene_list=EGFR%2520ERBB2%2520PDGFRA%2520MET%2520KRAS%2520NRAS%2520HRAS%2520NF1%2520SPRY2%2520FOXO1%2520FOXO3%2520AKT1%2520AKT2%2520AKT3%2520PIK3R1%2520PIK3CA%2520PTEN' +
                '&geneset_list=%20&tab_index=tab_visualize&Action=Submit'
        );
        await expect(page.locator('#cy')).toBeVisible({ timeout: 30000 });
        await waitForNetworkQuiet(page, 30000);
        await snapshot(
            page,
            '[data-test="pathwayMapperTabDiv"]',
            'pathways-unprofiled-genes.png',
            ['.qtip', '.__react_component_tooltip', '.rc-tooltip']
        );
        await page.close();
    });
});
