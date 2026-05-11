import { test, expect, Page } from '../fixtures';
import { expectElementScreenshot, setInputText } from './helpers/common';
import { waitForOncoprint } from './helpers/oncoprint';

/**
 * Port of end-to-end-test/remote/specs/core/results.spec.js.
 *
 * Three groups of tests on the results page:
 *   1. Cancer Type Summary Bar Chart — defaults across study/gene combos
 *      and the customization controls (sub-bar grouping, axis selectors,
 *      thresholds). Mostly logic + a handful of screenshots.
 *   2. Mutations Tab — 3D structure visualizer text content, and the
 *      lollipop track-selector dropdown across gene-tab navigation.
 *   3. OQL status banner — for simple vs explicit OQL queries, the
 *      "yes/no/unaffected" banners must (or must not) appear on each
 *      results-view sub-tab.
 */

test.describe('Cancer Type Summary Bar Chart', () => {
    test.describe('single study query with four genes', () => {
        const url =
            '/results/cancerTypesSummary?tab_index=tab_visualize' +
            '&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub' +
            '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations' +
            '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic' +
            '&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut' +
            '&gene_list=BRAF+KRAS+NRAS&gene_set_choice=user-defined-list&Action=Submit';

        test.beforeEach(async ({ page }) => {
            await page.goto(url);
            await expect(
                page.locator('[data-test="cancerTypeSummaryChart"]').first()
            ).toBeVisible({ timeout: 30000 });
        });

        test('defaults to cancerTypeDetailed', async ({ page }) => {
            await expect(
                page.locator('[data-value="cancerTypeDetailed"]')
            ).toBeChecked();
        });

        test('three gene tabs plus "all genes" equals four total tabs, in order of OQL', async ({
            page,
        }) => {
            const tabs = page.locator(
                "[data-test='cancerTypeSummaryWrapper'] .nav li a"
            );
            await expect(tabs).toHaveCount(4);
            await expect(tabs).toHaveText([
                'All Queried Genes',
                'BRAF',
                'KRAS',
                'NRAS',
            ]);
        });
    });

    test('cross study query defaults to grouping by studyId', async ({
        browser,
    }) => {
        const page = await browser.newPage();
        await page.goto(
            '/results/cancerTypesSummary?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2' +
                '&data_priority=0&case_set_id=all&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=%20' +
                '&tab_index=tab_visualize&Action=Submit' +
                '&cancer_study_list=coadread_tcga_pub%2Ccellline_nci60' +
                '&show_samples=false&clinicallist=CANCER_STUDY'
        );
        await expect(
            page.locator('[data-test=cancerTypeSummaryChart]').first()
        ).toBeVisible({ timeout: 30000 });
        await expect(page.locator('[data-value="studyId"]')).toBeChecked();
        await page.close();
    });

    test('single study with multiple cancer types defaults to cancerType grouping', async ({
        browser,
    }) => {
        const page = await browser.newPage();
        await page.goto(
            '/results/cancerTypesSummary?cancer_study_list=brca_tcga&Z_SCORE_THRESHOLD=2.0' +
                '&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cgistic' +
                '&case_set_id=brca_tcga_cnaseq' +
                '&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=%20' +
                '&tab_index=tab_visualize&Action=Submit'
        );
        await expect(
            page.locator('[data-test=cancerTypeSummaryChart]').first()
        ).toBeVisible({ timeout: 30000 });
        await expect(page.locator('[data-value="cancerType"]')).toBeChecked();
        await page.close();
    });

    test('shows an alert message on tabs for missing genes (no-alterations query)', async ({
        browser,
    }) => {
        const page = await browser.newPage();
        await page.goto(
            '/results/cancerTypesSummary?cancer_study_id=chol_nccs_2013&Z_SCORE_THRESHOLD=2' +
                '&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=chol_nccs_2013_sequenced' +
                '&gene_list=CDKN2A%2520CDKN2B%2520CDKN2C%2520CDK4%2520CDK6%2520CCND2%2520RB1' +
                '&geneset_list=+&tab_index=tab_visualize&Action=Submit' +
                '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=chol_nccs_2013_mutations'
        );
        await expect(
            page.locator('[data-test=cancerTypeSummaryChart]').first()
        ).toBeVisible({ timeout: 30000 });
        await page
            .locator(
                "[data-test='cancerTypeSummaryWrapper'] .nav a:text-is('CDKN2A')"
            )
            .click();
        await expectElementScreenshot(
            page,
            '[data-test="cancerTypeSummaryWrapper"]',
            'results-cancer-type-summary-no-alterations.png'
        );
        await page.close();
    });

    test.describe.serial('customization functionality', () => {
        test.describe.configure({ retries: 0 });
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await page.goto(
                '/results/cancerTypesSummary?cancer_study_id=brca_metabric&Z_SCORE_THRESHOLD=2.0' +
                    '&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=brca_metabric_cnaseq' +
                    '&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=+' +
                    '&tab_index=tab_visualize&Action=Submit' +
                    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_metabric_mutations' +
                    '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_metabric_cna'
            );
            await expect(
                page.locator('[data-test=cancerTypeSummaryChart]').first()
            ).toBeVisible({ timeout: 30000 });
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('group by detailed type', async () => {
            await page.locator('[data-value="cancerTypeDetailed"]').click();
            await expectElementScreenshot(
                page,
                '[data-test="cancerTypeSummaryWrapper"]',
                'results-cancer-type-summary-grouped-by-detailed.png'
            );
        });

        test('handles change to absolute value yaxis', async () => {
            await page
                .locator('[data-test="cancerSummaryYAxisSelect"]')
                .selectOption({ index: 1 });
            await expectElementScreenshot(
                page,
                '[data-test="cancerTypeSummaryWrapper"]',
                'results-cancer-type-summary-absolute-yaxis.png'
            );
        });

        test('handles change to sort of xaxis', async () => {
            await page
                .locator('[data-test="cancerSummaryXAxisSelect"]')
                .selectOption({ index: 1 });
            await expectElementScreenshot(
                page,
                '[data-test="cancerTypeSummaryWrapper"]',
                'results-cancer-type-summary-xaxis-sort.png'
            );
        });

        test('handles change to alteration threshold', async () => {
            await setInputText(
                page,
                "[data-test='alterationThresholdInput']",
                '300'
            );
            await page
                .locator("[data-test='alterationThresholdInput']")
                .press('Enter');
            await expectElementScreenshot(
                page,
                '[data-test="cancerTypeSummaryWrapper"]',
                'results-cancer-type-summary-alteration-threshold.png'
            );
            // Reset for the next test (matches the wdio cleanup).
            await setInputText(
                page,
                "[data-test='alterationThresholdInput']",
                '0'
            );
            await page
                .locator("[data-test='alterationThresholdInput']")
                .press('Enter');
        });

        test('handles change to sample total threshold', async () => {
            await setInputText(
                page,
                "[data-test='sampleTotalThresholdInput']",
                '312'
            );
            await page
                .locator("[data-test='sampleTotalThresholdInput']")
                .press('Enter');
            await page.waitForTimeout(1000);
            await expectElementScreenshot(
                page,
                '[data-test="cancerTypeSummaryWrapper"]',
                'results-cancer-type-summary-sample-threshold.png'
            );
        });
    });
});

test.describe('Mutations Tab', () => {
    test('3D structure visualizer populates PDB info properly', async ({
        browser,
    }) => {
        const page = await browser.newPage();
        await page.goto(
            '/results/mutations?tab_index=tab_visualize&cancer_study_list=ov_tcga_pub' +
                '&cancer_study_id=ov_tcga_pub' +
                '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ov_tcga_pub_mutations' +
                '&Z_SCORE_THRESHOLD=2.0&case_set_id=ov_tcga_pub_3way_complete' +
                '&gene_list=BRCA1+BRCA2&gene_set_choice=user-defined-list&Action=Submit'
        );
        const button = page.locator('[data-test=view3DStructure]');
        await expect(button).toBeEnabled({ timeout: 30000 });
        await button.click();

        // The same data-test handle renders both as the visible header
        // and inside each PDB-chain table row; scope to the first match
        // (the header) to mirror the wdio assertion.
        const pdbInfo = page.locator('[data-test="pdbChainInfoText"]').first();
        await expect(pdbInfo).not.toHaveText('LOADING', { timeout: 10000 });
        const text = (await pdbInfo.textContent())?.trim() ?? '';
        expect(text.toLowerCase()).toMatch(
            /^complex structure of brca1 brct with singly/
        );
        await page.close();
    });

    test.describe.serial('Lollipop Plot Tracks', () => {
        test.describe.configure({ retries: 0 });
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await page.goto(
                '/results/mutations?tab_index=tab_visualize&cancer_study_list=ov_tcga_pub' +
                    '&cancer_study_id=ov_tcga_pub' +
                    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ov_tcga_pub_mutations' +
                    '&Z_SCORE_THRESHOLD=2.0&case_set_id=ov_tcga_pub_3way_complete' +
                    '&gene_list=TP53+PTEN&gene_set_choice=user-defined-list&Action=Submit'
            );
            await expect(
                page.locator('[data-test=view3DStructure]')
            ).toBeVisible({ timeout: 30000 });
            await expect(
                page.locator('[data-test=oncogenic-icon-image]').first()
            ).toBeVisible({ timeout: 30000 });
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('shows tracks when the corresponding dropdown menu options selected', async () => {
            await page.locator('.annotation-track-selector').click();

            // Cancer Hotspots
            await page
                .locator('xpath=.//*[text()[contains(.,"Cancer Hotspots")]]')
                .first()
                .click();
            await expect(page.locator('.cancer-hotspot-0')).toBeAttached({
                timeout: 30000,
            });

            // OncoKB
            await page
                .locator('xpath=.//*[text()[contains(.,"OncoKB")]]')
                .first()
                .click();
            await expect(page.locator('.onco-kb-0')).toBeAttached({
                timeout: 30000,
            });

            // PTM
            await page
                .locator(
                    'xpath=.//*[text()[contains(.,"Post Translational Modifications")]]'
                )
                .first()
                .click();
            await expect(page.locator('.ptm-0-0')).toBeAttached({
                timeout: 30000,
            });

            // 3D Structure
            await page
                .locator('xpath=.//*[text()[contains(.,"3D Structure")]]')
                .first()
                .click();
            await expect(page.locator('.chain-0')).toBeAttached({
                timeout: 30000,
            });
        });

        test('keeps tracks selection state when switching to another gene tab', async () => {
            await page.locator('.tabAnchor_PTEN').click();
            await expect(page.locator('.cancer-hotspot-0')).toBeAttached({
                timeout: 30000,
            });
            await expect(page.locator('.onco-kb-0')).toBeAttached({
                timeout: 30000,
            });
            await expect(page.locator('.chain-0')).toBeAttached({
                timeout: 30000,
            });
            await expect(page.locator('.ptm-0-0')).toBeAttached({
                timeout: 30000,
            });
        });
    });
});

test.describe('oql status banner', () => {
    const yesBanner = 'div[data-test="OqlStatusBannerYes"]';
    const noBanner = 'div[data-test="OqlStatusBannerNo"]';
    const unaffectedBanner = 'div[data-test="OqlStatusBannerUnaffected"]';
    const SIMPLE =
        '/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2' +
        '&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut' +
        '&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=+&tab_index=tab_visualize&Action=Submit' +
        '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations' +
        '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic';
    const EXPLICIT =
        '/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2' +
        '&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut' +
        '&gene_list=KRAS%2520NRAS%2520%250ABRAF%253AMUT&geneset_list=+' +
        '&tab_index=tab_visualize&Action=Submit' +
        '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations' +
        '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic';

    test.describe('with simple query (no banners on any tab)', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto(SIMPLE);
            await waitForOncoprint(page);
        });

        test('not present in oncoprint tab', async ({ page }) => {
            await expect(
                page.locator(`${yesBanner}.oncoprint-oql-status-banner`)
            ).toBeHidden();
            await expect(
                page.locator(`${noBanner}.oncoprint-oql-status-banner`)
            ).toBeHidden();
        });

        test('not present in cancer types summary', async ({ page }) => {
            await page.locator('.tabAnchor_cancerTypesSummary').click();
            await page.waitForTimeout(500);
            await expect(
                page.locator(
                    `${yesBanner}.cancer-types-summary-oql-status-banner`
                )
            ).toBeHidden();
            await expect(
                page.locator(
                    `${noBanner}.cancer-types-summary-oql-status-banner`
                )
            ).toBeHidden();
        });

        test('not present in mutual exclusivity tab', async ({ page }) => {
            await page.locator('.tabAnchor_mutualExclusivity').click();
            await page.waitForTimeout(500);
            await expect(
                page.locator(`${yesBanner}.mutex-oql-status-banner`)
            ).toBeHidden();
            await expect(
                page.locator(`${noBanner}.mutex-oql-status-banner`)
            ).toBeHidden();
        });

        test('not present in plots tab', async ({ page }) => {
            await page.locator('.tabAnchor_plots').click();
            await page.waitForTimeout(500);
            await expect(
                page.locator(`${yesBanner}.plots-oql-status-banner`)
            ).toBeHidden();
            await expect(
                page.locator(`${noBanner}.plots-oql-status-banner`)
            ).toBeHidden();
        });

        test('not present in mutations tab', async ({ page }) => {
            await page.locator('.tabAnchor_mutations').click();
            await page.waitForTimeout(500);
            await expect(
                page.locator(`${yesBanner}.mutations-oql-status-banner`)
            ).toBeHidden();
            await expect(
                page.locator(`${noBanner}.mutations-oql-status-banner`)
            ).toBeHidden();
            await expect(
                page.locator(`${unaffectedBanner}.mutations-oql-status-banner`)
            ).toBeHidden();
        });

        test('not present in coexpression tab', async ({ page }) => {
            await page.locator('.tabAnchor_coexpression').click();
            await page.waitForTimeout(500);
            await expect(
                page.locator(`${yesBanner}.coexp-oql-status-banner`)
            ).toBeHidden();
            await expect(
                page.locator(`${noBanner}.coexp-oql-status-banner`)
            ).toBeHidden();
        });

        test('not present in alteration enrichments tab', async ({ page }) => {
            await page.locator('.tabAnchor_comparison').click();
            await expect(
                page.locator('.comparisonTabSubTabs .tabAnchor_alterations')
            ).toBeVisible({ timeout: 30000 });
            await page
                .locator('.comparisonTabSubTabs .tabAnchor_alterations')
                .click();
            await page.waitForTimeout(500);
            await expect(
                page.locator(`${yesBanner}.comparison-oql-status-banner`)
            ).toBeHidden();
            await expect(
                page.locator(`${noBanner}.comparison-oql-status-banner`)
            ).toBeHidden();
        });

        test('not present in survival tab', async ({ page }) => {
            await page.locator('.tabAnchor_comparison').click();
            await expect(
                page.locator('.comparisonTabSubTabs .tabAnchor_survival')
            ).toBeVisible({ timeout: 30000 });
            await page
                .locator('.comparisonTabSubTabs .tabAnchor_survival')
                .click();
            await page.waitForTimeout(500);
            await expect(
                page.locator(`${yesBanner}.survival-oql-status-banner`)
            ).toBeHidden();
            await expect(
                page.locator(`${noBanner}.survival-oql-status-banner`)
            ).toBeHidden();
        });

        test('not present in download tab', async ({ page }) => {
            await page.locator('.tabAnchor_download').click();
            await page.waitForTimeout(500);
            await expect(
                page.locator(`${yesBanner}.download-oql-status-banner`)
            ).toBeHidden();
            await expect(
                page.locator(`${noBanner}.download-oql-status-banner`)
            ).toBeHidden();
        });
    });

    test.describe('with explicit query (banners appear)', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto(EXPLICIT);
            await waitForOncoprint(page);
        });

        test('present in oncoprint tab', async ({ page }) => {
            await page.waitForTimeout(2000);
            await expect(
                page.locator(`${yesBanner}.oncoprint-oql-status-banner`)
            ).toBeVisible();
            await expect(
                page.locator(`${noBanner}.oncoprint-oql-status-banner`)
            ).toBeHidden();
        });

        test('present in cancer types summary', async ({ page }) => {
            await page.locator('.tabAnchor_cancerTypesSummary').click();
            await expect(
                page.locator(
                    `${yesBanner}.cancer-types-summary-oql-status-banner`
                )
            ).toBeVisible({ timeout: 30000 });
            await expect(
                page.locator(
                    `${noBanner}.cancer-types-summary-oql-status-banner`
                )
            ).toBeHidden();
        });

        test('present in mutual exclusivity tab', async ({ page }) => {
            await page.locator('.tabAnchor_mutualExclusivity').click();
            await expect(
                page.locator(`${yesBanner}.mutex-oql-status-banner`)
            ).toBeVisible({ timeout: 30000 });
            await expect(
                page.locator(`${noBanner}.mutex-oql-status-banner`)
            ).toBeHidden();
        });

        test('present in plots tab (no banner is the explicit "no" variant)', async ({
            page,
        }) => {
            await page.locator('.tabAnchor_plots').click();
            await expect(
                page.locator(`${noBanner}.plots-oql-status-banner`)
            ).toBeVisible({ timeout: 30000 });
            await expect(
                page.locator(`${yesBanner}.plots-oql-status-banner`)
            ).toBeHidden();
        });

        test('present in alterations tab', async ({ page }) => {
            await page.locator('.tabAnchor_comparison').click();
            await expect(
                page.locator('.tabAnchor_alterations').first()
            ).toBeVisible({ timeout: 30000 });
            await page
                .locator('.tabAnchor_alterations')
                .first()
                .click();
            await expect(
                page.locator(`${yesBanner}.comparison-oql-status-banner`)
            ).toBeVisible({ timeout: 30000 });
            await expect(
                page.locator(`${unaffectedBanner}.comparison-oql-status-banner`)
            ).toBeHidden();
            await expect(
                page.locator(`${noBanner}.comparison-oql-status-banner`)
            ).toBeHidden();
        });

        test('present in coexpression tab (explicit "no" variant)', async ({
            page,
        }) => {
            await page.locator('.tabAnchor_coexpression').click();
            await expect(
                page.locator(`${noBanner}.coexp-oql-status-banner`)
            ).toBeVisible({ timeout: 30000 });
            await expect(
                page.locator(`${yesBanner}.coexp-oql-status-banner`)
            ).toBeHidden();
        });

        test('present in alteration enrichments tab', async ({ page }) => {
            await page.locator('.tabAnchor_comparison').click();
            await expect(
                page.locator('.comparisonTabSubTabs .tabAnchor_alterations')
            ).toBeVisible({ timeout: 30000 });
            await page
                .locator('.comparisonTabSubTabs .tabAnchor_alterations')
                .click();
            await expect(
                page.locator(`${yesBanner}.comparison-oql-status-banner`)
            ).toBeVisible({ timeout: 30000 });
            await expect(
                page.locator(`${noBanner}.comparison-oql-status-banner`)
            ).toBeHidden();
        });

        test('present in survival tab', async ({ page }) => {
            await page.locator('.tabAnchor_comparison').click();
            await expect(
                page.locator('.comparisonTabSubTabs .tabAnchor_survival')
            ).toBeVisible({ timeout: 30000 });
            await page
                .locator('.comparisonTabSubTabs .tabAnchor_survival')
                .click();
            await expect(
                page.locator(`${yesBanner}.comparison-oql-status-banner`)
            ).toBeVisible({ timeout: 30000 });
            await expect(
                page.locator(`${noBanner}.comparison-oql-status-banner`)
            ).toBeHidden();
        });

        test('present in download tab', async ({ page }) => {
            await page.locator('.tabAnchor_download').click();
            await expect(
                page.locator(`${yesBanner}.download-oql-status-banner`)
            ).toBeVisible({ timeout: 30000 });
            await expect(
                page.locator(`${noBanner}.download-oql-status-banner`)
            ).toBeHidden();
        });
    });
});
