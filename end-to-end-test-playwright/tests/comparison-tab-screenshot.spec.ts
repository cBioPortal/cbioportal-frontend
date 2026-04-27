import { test, expect, Locator, Page } from '@playwright/test';
import {
    expectElementScreenshot,
    setCheckboxChecked,
    setDropdownOpen,
    waitForGroupComparisonTabOpen,
    waitForNetworkQuiet,
} from './helpers/common';

/**
 * Port of end-to-end-test/remote/specs/core/comparisonTab.screenshot.spec.js.
 *
 * Heavy screenshot spec exercising the results-view Comparison tab:
 *  - general flows (overlap, survival, clinical, enrichments variants)
 *  - delete-group-from-session
 *  - overlap venn diagrams (disjoint, with-overlap, complex A/B/C/D/E)
 *  - overlap upset diagram group selection
 *
 * wdio used `$(selector).addClass('disablePointerEvents')` before each
 * venn screenshot to suppress SVG hover highlights that randomized the
 * capture. The helper below applies the same class through page.evaluate.
 */

const OVERLAP_DIV = 'div[data-test="ComparisonPageOverlapTabDiv"]';
const SURVIVAL_DIV = 'div[data-test="ComparisonPageSurvivalTabDiv"]';
const CLINICAL_DIV = 'div[data-test="ComparisonPageClinicalTabDiv"]';
const CLINICAL_PLOT_DIV = `${CLINICAL_DIV} div[data-test="ClinicalTabPlotDiv"]`;
const ALTERATION_ENRICH_DIV =
    'div[data-test="GroupComparisonAlterationEnrichments"]';
const MRNA_ENRICH_DIV = 'div[data-test="GroupComparisonMRNAEnrichments"]';
const PROTEIN_ENRICH_DIV = '[data-test="GroupComparisonProteinEnrichments"]';
const METHYLATION_ENRICH_DIV =
    'div[data-test="GroupComparisonMethylationEnrichments"]';
// Comparison tab nests its own msk-tab sub-tabs inside the outer msk-tab, so
// :not(.hiddenByPosition) matches 2 — select the first (outermost active tab)
// to mirror the wdio selector.
const MSK_TAB_ACTIVE = '.msk-tab:not(.hiddenByPosition) >> nth=0';

const GENERAL_URL =
    '/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Altered%20group"%2C"Unaltered%20group"%2C"KRAS"%2C"NRAS"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations';

const PROTEIN_URL =
    '/results/comparison?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=blca_tcga_pub_2017&case_set_id=blca_tcga_pub_2017_all&comparison_selectedGroups=%5B"KRAS"%2C"NRAS"%2C"BRAF"%5D&comparison_subtab=protein&data_priority=0&gene_list=KRAS%2520NRAS%2520BRAF&gene_set_choice=user-defined-list&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=blca_tcga_pub_2017_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=blca_tcga_pub_2017_rna_seq_v2_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=blca_tcga_pub_2017_mutations&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=blca_tcga_pub_2017_rppa_Zscores&profileFilter=0&tab_index=tab_visualize';

const METHYLATION_URL =
    '/results/comparison?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=blca_tcga_pub_2017&case_set_id=blca_tcga_pub_2017_all&comparison_selectedGroups=%5B"KRAS"%2C"NRAS"%2C"BRAF"%5D&comparison_subtab=dna_methylation&data_priority=0&gene_list=KRAS%2520NRAS%2520BRAF&gene_set_choice=user-defined-list&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=blca_tcga_pub_2017_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=blca_tcga_pub_2017_rna_seq_v2_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=blca_tcga_pub_2017_mutations&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=blca_tcga_pub_2017_rppa_Zscores&profileFilter=0&tab_index=tab_visualize';

const DELETE_GROUP_URL =
    '/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Altered%20group"%2C"Unaltered%20group"%2C"KRAS"%2C"NRAS"%5D&comparison_subtab=overlap&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&comparison_createdGroupsSessionId=5e74f264e4b0ff7ef5fdb27f';

const DISJOINT_VENN_URL =
    '/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations';

const THREE_DISJOINT_VENN_URL =
    '/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Unaltered%20group"%2C"KRAS"%2C"BRAF"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations';

const OVERLAP_VENN_URL =
    '/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"KRAS"%2C"NRAS"%2C"Altered%20group"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations';

const COMPLEX_VENN_URL =
    '/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Unaltered%20group"%2C"KRAS"%2C"NRAS"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations';

const UPSET_URL =
    '/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Unaltered%20group"%2C"KRAS"%2C"NRAS"%2C"Altered%20group"%2C"BRAF"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations';

/** SVG <rect>s in the venn diagram ignore ordinary click handlers. */
async function dispatchSvgClick(page: Page, selector: string) {
    await page.locator(selector).dispatchEvent('click');
    await page.waitForTimeout(100);
}

/**
 * Apply `disablePointerEvents` class to the target before snapshotting —
 * matches wdio's `checkElementWithTemporaryClass`, used to freeze hover
 * highlights on the venn diagrams.
 */
async function snapWithFrozenHover(
    page: Page,
    selector: string,
    snapshotName: string
) {
    await page.evaluate(sel => {
        document
            .querySelectorAll(sel)
            .forEach(el => el.classList.add('disablePointerEvents'));
    }, selector);
    try {
        await expectElementScreenshot(page, selector, snapshotName);
    } finally {
        await page.evaluate(sel => {
            document
                .querySelectorAll(sel)
                .forEach(el => el.classList.remove('disablePointerEvents'));
        }, selector);
    }
}

/** Mirrors the wdio `selectClinicalTabPlotType` helper. */
async function selectClinicalTabPlotType(page: Page, type: string) {
    await setDropdownOpen(
        page,
        true,
        '[data-test="plotTypeSelector"] .Select-arrow-zone',
        '[data-test="plotTypeSelector"] .Select-menu'
    );
    await page
        .locator(
            `[data-test="plotTypeSelector"] .Select-option[aria-label="${type}"]`
        )
        .click();
}

async function clickBoldByText(page: Page, text: string) {
    const b = page.locator(`b:text-is("${text}")`).first();
    await expect(b).toBeVisible({ timeout: 15000 });
    await b.click();
}

test.describe('results view comparison tab screenshot tests', () => {
    test.describe.serial('general screenshot tests', () => {
        test.describe.configure({ retries: 0 });
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage({
                viewport: { width: 1600, height: 1000 },
            });
            await page.goto(GENERAL_URL);
            await waitForGroupComparisonTabOpen(page, 20000);
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('overlap tab upset plot view', async () => {
            await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                timeout: 20000,
            });
            await expectElementScreenshot(
                page,
                OVERLAP_DIV,
                'comparison-tab-overlap-upset.png'
            );
        });

        test('survival tab exclude overlapping samples', async () => {
            await expect(
                page.locator('.comparisonTabSubTabs a.tabAnchor_survival')
            ).toBeVisible();
            await page
                .locator('.comparisonTabSubTabs a.tabAnchor_survival')
                .click();
            await expect(page.locator(SURVIVAL_DIV)).toBeVisible({
                timeout: 60000,
            });
            await expectElementScreenshot(
                page,
                SURVIVAL_DIV,
                'comparison-tab-survival-exclude.png'
            );
        });

        test('survival tab include overlapping samples', async () => {
            await page.evaluate(() => {
                (window as any).comparisonTab.store.updateOverlapStrategy(
                    'Include'
                );
            });
            await expect(page.locator(SURVIVAL_DIV)).toBeVisible({
                timeout: 60000,
            });
            await waitForNetworkQuiet(page);
            await expectElementScreenshot(
                page,
                SURVIVAL_DIV,
                'comparison-tab-survival-include.png'
            );
        });

        test('clinical tab include overlapping Kruskal-Wallis', async () => {
            await expect(
                page.locator('.comparisonTabSubTabs a.tabAnchor_clinical')
            ).toBeVisible();
            await page
                .locator('.comparisonTabSubTabs a.tabAnchor_clinical')
                .click();
            await expect(page.locator(CLINICAL_PLOT_DIV)).toBeVisible({
                timeout: 20000,
            });
            const mutCount = page.locator(
                `${CLINICAL_DIV} div[data-test="LazyMobXTable"] span[data-test="Mutation Count"]`
            );
            await expect(mutCount).toBeVisible();
            await mutCount.click();
            await expectElementScreenshot(
                page,
                CLINICAL_DIV,
                'comparison-tab-clinical-kruskal-wallis.png'
            );
        });

        test('clinical tab swapped axes Kruskal-Wallis', async () => {
            await setCheckboxChecked(
                page,
                true,
                `${CLINICAL_DIV} input[data-test="SwapAxes"]`
            );
            await expect(page.locator(CLINICAL_PLOT_DIV)).toBeVisible({
                timeout: 20000,
            });
            await expectElementScreenshot(
                page,
                CLINICAL_DIV,
                'comparison-tab-clinical-kruskal-swapped.png'
            );
        });

        test('clinical tab log scale Kruskal-Wallis', async () => {
            await setCheckboxChecked(
                page,
                true,
                `${CLINICAL_DIV} input[data-test="logScale"]`
            );
            await expect(page.locator(CLINICAL_PLOT_DIV)).toBeVisible({
                timeout: 20000,
            });
            await expectElementScreenshot(
                page,
                CLINICAL_DIV,
                'comparison-tab-clinical-log-scale.png'
            );
        });

        test('clinical tab percentage stacked bar chart Chi-squared (exclude)', async () => {
            await page.evaluate(() => {
                (window as any).comparisonTab.store.updateOverlapStrategy(
                    'Exclude'
                );
            });
            await expect(page.locator(CLINICAL_PLOT_DIV)).toBeVisible({
                timeout: 20000,
            });
            await expectElementScreenshot(
                page,
                CLINICAL_DIV,
                'comparison-tab-clinical-pct-stacked.png'
            );
        });

        test('clinical tab bar chart Chi-squared', async () => {
            await selectClinicalTabPlotType(page, 'Bar chart');
            await expect(page.locator(CLINICAL_PLOT_DIV)).toBeVisible({
                timeout: 20000,
            });
            await expectElementScreenshot(
                page,
                CLINICAL_DIV,
                'comparison-tab-clinical-bar-chart.png'
            );
        });

        test('clinical tab stacked bar chart Chi-squared', async () => {
            await selectClinicalTabPlotType(page, 'Stacked bar chart');
            await expect(page.locator(CLINICAL_PLOT_DIV)).toBeVisible({
                timeout: 20000,
            });
            await expectElementScreenshot(
                page,
                CLINICAL_DIV,
                'comparison-tab-clinical-stacked-bar.png'
            );
        });

        test('clinical tab stacked bar chart swapped axes Chi-squared', async () => {
            await setCheckboxChecked(
                page,
                true,
                `${CLINICAL_DIV} input[data-test="SwapAxes"]`
            );
            await expect(page.locator(CLINICAL_PLOT_DIV)).toBeVisible({
                timeout: 20000,
            });
            await expectElementScreenshot(
                page,
                CLINICAL_DIV,
                'comparison-tab-clinical-stacked-bar-swapped.png'
            );
        });

        test('clinical tab stacked bar chart horizontal bars Chi-squared', async () => {
            await setCheckboxChecked(
                page,
                false,
                `${CLINICAL_DIV} input[data-test="SwapAxes"]`
            );
            await setCheckboxChecked(
                page,
                true,
                `${CLINICAL_DIV} input[data-test="HorizontalBars"]`
            );
            await expect(page.locator(CLINICAL_PLOT_DIV)).toBeVisible({
                timeout: 20000,
            });
            await expectElementScreenshot(
                page,
                CLINICAL_DIV,
                'comparison-tab-clinical-stacked-horiz.png'
            );
        });

        test('alteration enrichments tab several groups', async () => {
            await page
                .locator('.comparisonTabSubTabs .tabAnchor_alterations')
                .click();
            // Two enrichment divs render — one in the active msk-tab, one in a
            // hidden sibling — pick the active one.
            await expect(
                page.locator(ALTERATION_ENRICH_DIV).first()
            ).toBeVisible({
                timeout: 10000,
            });
            await expectElementScreenshot(
                page,
                MSK_TAB_ACTIVE,
                'comparison-tab-alteration-enrichments.png'
            );
        });

        test('alteration enrichments tab several groups only truncating', async () => {
            await page
                .locator(
                    '[data-test="AlterationTypeSelectorMenu"] [data-test="Mutations"]'
                )
                .click();
            await page
                .locator(
                    '[data-test="AlterationTypeSelectorMenu"] [data-test="CheckCopynumberAlterations"]'
                )
                .click();
            await page
                .locator(
                    '[data-test="AlterationTypeSelectorMenu"] [data-test="Truncating"]'
                )
                .click();
            await page
                .locator(
                    '[data-test="AlterationTypeSelectorMenu"] [data-test="buttonSelectAlterations"]'
                )
                .click();

            await expect(
                page.locator(ALTERATION_ENRICH_DIV).first()
            ).toBeVisible({
                timeout: 10000,
            });
            await expectElementScreenshot(
                page,
                MSK_TAB_ACTIVE,
                'comparison-tab-alteration-enrichments-truncating.png'
            );
        });

        test('mrna enrichments tab several groups', async () => {
            await page.locator('.comparisonTabSubTabs .tabAnchor_mrna').click();
            await expect(page.locator(MRNA_ENRICH_DIV).first()).toBeVisible({
                timeout: 30000,
            });
            await clickBoldByText(page, 'HOXB4');
            await expect(
                page.locator('div[data-test="MiniBoxPlot"]')
            ).toBeVisible({ timeout: 20000 });
            await expectElementScreenshot(
                page,
                MSK_TAB_ACTIVE,
                'comparison-tab-mrna-enrichments-several.png'
            );
        });

        test('mrna enrichments tab two groups', async () => {
            await page.locator('.comparisonTabSubTabs .tabAnchor_mrna').click();
            await expect(page.locator(MRNA_ENRICH_DIV).first()).toBeVisible({
                timeout: 30000,
            });
            await clickBoldByText(page, 'MERTK');
            await expectElementScreenshot(
                page,
                MSK_TAB_ACTIVE,
                'comparison-tab-mrna-enrichments-two.png'
            );
        });

        test('protein enrichments tab several groups', async () => {
            await page.goto(PROTEIN_URL);
            await expect(page.locator(PROTEIN_ENRICH_DIV).first()).toBeVisible({
                timeout: 30000,
            });
            await clickBoldByText(page, 'SCD');
            await expect(
                page.locator('div[data-test="MiniBoxPlot"]')
            ).toBeVisible({ timeout: 20000 });
            await expectElementScreenshot(
                page,
                MSK_TAB_ACTIVE,
                'comparison-tab-protein-enrichments-several.png'
            );
        });

        test('protein enrichments tab two groups', async () => {
            await page
                .locator('button[data-test="groupSelectorButtonBRAF"]')
                .click();
            await expect(
                page
                    .locator(
                        'div[data-test="GroupComparisonProteinEnrichments"]'
                    )
                    .first()
            ).toBeVisible({ timeout: 10000 });
            await clickBoldByText(page, 'FASN');
            await expectElementScreenshot(
                page,
                MSK_TAB_ACTIVE,
                'comparison-tab-protein-enrichments-two.png'
            );
        });

        test('methylation enrichments tab several groups', async () => {
            await page.goto(METHYLATION_URL);
            await expect(
                page.locator(METHYLATION_ENRICH_DIV).first()
            ).toBeVisible({
                timeout: 20000,
            });
            await clickBoldByText(page, 'HDAC1');
            await expect(
                page.locator('div[data-test="MiniBoxPlot"]')
            ).toBeVisible({ timeout: 20000 });
            await page.waitForTimeout(100);
            await expectElementScreenshot(
                page,
                MSK_TAB_ACTIVE,
                'comparison-tab-methylation-enrichments.png'
            );
        });
    });

    test.describe.serial('delete group from session', () => {
        test.describe.configure({ retries: 0 });
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage({
                viewport: { width: 1600, height: 1000 },
            });
            await page.goto(DELETE_GROUP_URL);
            await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                timeout: 20000,
            });
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('delete group from session', async () => {
            const deleteBtn = page.locator(
                'button[data-test="groupSelectorButtontest"] [data-test="deleteButton"]'
            );
            await expect(deleteBtn).toBeAttached();
            await deleteBtn.click();
            await page.waitForTimeout(1000);
            await expectElementScreenshot(
                page,
                'div.mainContainer',
                'comparison-tab-delete-group.png'
            );
        });
    });

    test.describe('overlap venn diagram', () => {
        test.describe('disjoint diagram', () => {
            test.use({ viewport: { width: 1600, height: 1000 } });

            test('disjoint venn diagram view', async ({ page }) => {
                await page.goto(DISJOINT_VENN_URL);
                await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                    timeout: 20000,
                });
                await snapWithFrozenHover(
                    page,
                    OVERLAP_DIV,
                    'comparison-tab-venn-disjoint.png'
                );
            });

            test('disjoint venn diagram with a group selected view', async ({
                page,
            }) => {
                await page.goto(DISJOINT_VENN_URL);
                await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                    timeout: 20000,
                });
                await expect(
                    page.locator('svg#comparison-tab-overlap-svg')
                ).toBeVisible({ timeout: 6000 });
                await dispatchSvgClick(
                    page,
                    'rect[data-test="sample0VennRegion"]'
                );
                await snapWithFrozenHover(
                    page,
                    OVERLAP_DIV,
                    'comparison-tab-venn-disjoint-selected.png'
                );
            });

            test('3 disjoint venn diagram', async ({ page }) => {
                await page.goto(THREE_DISJOINT_VENN_URL);
                await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                    timeout: 20000,
                });
                await snapWithFrozenHover(
                    page,
                    OVERLAP_DIV,
                    'comparison-tab-venn-three-disjoint.png'
                );
            });
        });

        test.describe.serial('venn diagram with overlap', () => {
            test.describe.configure({ retries: 0 });
            let page: Page;

            test.beforeAll(async ({ browser }) => {
                page = await browser.newPage({
                    viewport: { width: 1600, height: 1000 },
                });
                await page.goto(OVERLAP_VENN_URL);
                await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                    timeout: 20000,
                });
            });

            test.afterAll(async () => {
                await page.close();
            });

            test('venn diagram with overlap view', async () => {
                await snapWithFrozenHover(
                    page,
                    OVERLAP_DIV,
                    'comparison-tab-venn-overlap.png'
                );
            });

            test('venn diagram with overlap session selected view', async () => {
                await dispatchSvgClick(
                    page,
                    'rect[data-test="sample0,1,2VennRegion"]'
                );
                await snapWithFrozenHover(
                    page,
                    OVERLAP_DIV,
                    'comparison-tab-venn-overlap-selected.png'
                );
            });

            test('venn diagram with overlap deselect active group', async () => {
                await page
                    .locator('button[data-test="groupSelectorButtonKRAS"]')
                    .click();
                await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                    timeout: 20000,
                });
                await snapWithFrozenHover(
                    page,
                    OVERLAP_DIV,
                    'comparison-tab-venn-overlap-deselect.png'
                );
            });
        });

        test.describe.serial('venn diagram with complex overlaps', () => {
            test.describe.configure({ retries: 0 });
            let page: Page;
            const buttonA =
                'button[data-test="groupSelectorButtonAltered group"]';
            const buttonB =
                'button[data-test="groupSelectorButtonUnaltered group"]';
            const buttonC = 'button[data-test="groupSelectorButtonKRAS"]';
            const buttonD = 'button[data-test="groupSelectorButtonNRAS"]';

            test.beforeAll(async ({ browser }) => {
                page = await browser.newPage({
                    viewport: { width: 1600, height: 1000 },
                });
                await page.goto(COMPLEX_VENN_URL);
                await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                    timeout: 20000,
                });
            });

            test.afterAll(async () => {
                await page.close();
            });

            test('complex venn BCD', async () => {
                await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                    timeout: 20000,
                });
                await snapWithFrozenHover(
                    page,
                    OVERLAP_DIV,
                    'comparison-tab-venn-complex-bcd.png'
                );
            });

            test('complex venn CD', async () => {
                await page.locator(buttonB).click();
                await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                    timeout: 20000,
                });
                await snapWithFrozenHover(
                    page,
                    OVERLAP_DIV,
                    'comparison-tab-venn-complex-cd.png'
                );
            });

            test('complex venn BC', async () => {
                await page.locator(buttonB).click();
                await expect(page.locator(buttonD)).toBeVisible();
                await page.locator(buttonD).click();
                await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                    timeout: 20000,
                });
                await snapWithFrozenHover(
                    page,
                    OVERLAP_DIV,
                    'comparison-tab-venn-complex-bc.png'
                );
            });

            test('complex venn ABC', async () => {
                await page.locator(buttonA).click();
                await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                    timeout: 20000,
                });
                await snapWithFrozenHover(
                    page,
                    OVERLAP_DIV,
                    'comparison-tab-venn-complex-abc.png'
                );
            });

            test('complex venn AB', async () => {
                await page.locator(buttonC).click();
                await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                    timeout: 20000,
                });
                await snapWithFrozenHover(
                    page,
                    OVERLAP_DIV,
                    'comparison-tab-venn-complex-ab.png'
                );
            });

            test('complex venn ABD', async () => {
                await page.locator(buttonD).click();
                await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                    timeout: 20000,
                });
                await snapWithFrozenHover(
                    page,
                    OVERLAP_DIV,
                    'comparison-tab-venn-complex-abd.png'
                );
            });

            test('complex venn AD', async () => {
                await page.locator(buttonB).click();
                await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                    timeout: 20000,
                });
                await snapWithFrozenHover(
                    page,
                    OVERLAP_DIV,
                    'comparison-tab-venn-complex-ad.png'
                );
            });

            test('complex venn ACD', async () => {
                await page.locator(buttonC).click();
                await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                    timeout: 20000,
                });
                await snapWithFrozenHover(
                    page,
                    OVERLAP_DIV,
                    'comparison-tab-venn-complex-acd.png'
                );
            });
        });
    });

    test.describe.serial('overlap upset diagram group selection', () => {
        test.describe.configure({ retries: 0 });
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage({
                viewport: { width: 1600, height: 1000 },
            });
            await page.goto(UPSET_URL);
            await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                timeout: 20000,
            });
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('overlap upset groups selected', async () => {
            await dispatchSvgClick(page, '.sample_Unaltered_group_bar');
            await dispatchSvgClick(page, '.sample_Altered_group_KRAS_bar');
            await dispatchSvgClick(page, '.patient_Altered_group_NRAS_bar');
            await snapWithFrozenHover(
                page,
                OVERLAP_DIV,
                'comparison-tab-upset-groups-selected.png'
            );
        });

        test('overlap upset deselect active group', async () => {
            await page
                .locator('button[data-test="groupSelectorButtonNRAS"]')
                .click();
            await snapWithFrozenHover(
                page,
                OVERLAP_DIV,
                'comparison-tab-upset-deselect.png'
            );
        });
    });
});
