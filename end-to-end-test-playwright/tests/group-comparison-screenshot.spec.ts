import { test, expect, Page } from '@playwright/test';
import {
    expectElementScreenshot,
    setDropdownOpen,
    waitForGroupComparisonTabOpen,
    waitForNetworkQuiet,
} from './helpers/common';

/**
 * Port of end-to-end-test/remote/specs/core/groupComparison.screenshot.spec.js.
 *
 * Exercises the standalone group-comparison page (loaded by sessionId):
 *  - general flows (overlap, survival, clinical, mrna/protein/methylation/
 *    cna/alteration enrichments, mutations tab)
 *  - delete-group-from-session
 *  - overlap venn diagrams (disjoint, with-overlap, complex A/B/C/D)
 *  - overlap upset diagram group selection
 *  - clinical tab categorical-table render
 *
 * Mirrors the wdio `checkElementWithTemporaryClass(disablePointerEvents)`
 * dance for venn diagrams that randomize hover highlights.
 */

const OVERLAP_DIV = 'div[data-test="ComparisonPageOverlapTabDiv"]';
const SURVIVAL_DIV = 'div[data-test="ComparisonPageSurvivalTabDiv"]';
const CLINICAL_DIV = 'div[data-test="ComparisonPageClinicalTabDiv"]';
const CLINICAL_PLOT_DIV = `${CLINICAL_DIV} div[data-test="ClinicalTabPlotDiv"]`;
const ALTERATION_ENRICH_DIV =
    'div[data-test="GroupComparisonAlterationEnrichments"]';
const MRNA_ENRICH_DIV = 'div[data-test="GroupComparisonMRNAEnrichments"]';
const PROTEIN_ENRICH_DIV = 'div[data-test="GroupComparisonProteinEnrichments"]';
const METHYLATION_ENRICH_DIV =
    'div[data-test="GroupComparisonMethylationEnrichments"]';
const MUTATIONS_PLOT = '[data-test="ComparisonPageMutationsTabPlot"]';
// Standalone group-comparison page wraps content in a single .msk-tab — but
// the enrichments mini-box-plot opens a nested msk-tab, so :not(.hiddenByPosition)
// can match 2 elements. Use nth=0 to match wdio's `document.querySelector`.
const MSK_TAB_ACTIVE = '.msk-tab:not(.hiddenByPosition) >> nth=0';

const GENERAL_URL = '/comparison?sessionId=5ce411c7e4b0ab4137874076';
const DELETE_GROUP_URL = '/comparison?sessionId=5ce411c7e4b0ab4137874076';
const DISJOINT_VENN_URL = '/comparison?sessionId=5cf8b1b3e4b0ab413787436f';
const THREE_DISJOINT_VENN_URL =
    '/comparison?sessionId=5d28f03be4b0ab413787b1ef';
const OVERLAP_VENN_URL =
    '/comparison/overlap?sessionId=5cf6bcf0e4b0ab413787430c';
const COMPLEX_VENN_URL =
    '/comparison/overlap?sessionId=5d1bc517e4b0ab413787924a';
const UPSET_URL = '/comparison?sessionId=5d0bc0c5e4b0ab4137876bc3';
const CLINICAL_CATEGORICAL_URL =
    '/comparison?sessionId=67a22dd583e9543d61940572';
const MUTATIONS_TWO_GROUPS_URL =
    '/comparison/mutations?sessionId=5cf89323e4b0ab413787436c&selectedGene=AR';
const MUTATIONS_NO_TYPES_URL =
    '/comparison/mutations?sessionId=5cf89323e4b0ab413787436c&selectedEnrichmentEventTypes=%5B"HOMDEL"%2C"AMP"%2C"structural_variant"%5D';
const MUTATIONS_THREE_GROUPS_URL =
    '/comparison/mutations?comparisonId=634006c24dd45f2bc4c3d4aa&unselectedGroups=%5B"Colon%20Adenocarcinoma"%5D';

/** SVG <rect>s in the venn diagram ignore ordinary click handlers. */
async function dispatchSvgClick(page: Page, selector: string) {
    await page.locator(selector).dispatchEvent('click');
    await page.waitForTimeout(100);
}

/**
 * Apply `disablePointerEvents` class to the target before snapshotting —
 * mirrors wdio's `checkElementWithTemporaryClass`, used to freeze hover
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

test.describe('group comparison page screenshot tests', () => {
    test.describe.serial('general screenshot tests', () => {
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage({
                viewport: { width: 1600, height: 1000 },
            });
            await page.goto(GENERAL_URL);
            await waitForGroupComparisonTabOpen(page, 100000);
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
                'group-comparison-overlap-upset.png'
            );
        });

        test('survival tab exclude overlapping samples', async () => {
            await expect(page.locator('a.tabAnchor_survival')).toBeVisible();
            await page.locator('a.tabAnchor_survival').click();
            await expect(page.locator(SURVIVAL_DIV)).toBeVisible({
                timeout: 60000,
            });
            await expectElementScreenshot(
                page,
                SURVIVAL_DIV,
                'group-comparison-survival-exclude.png'
            );
        });

        test('survival tab include overlapping samples', async () => {
            await page.evaluate(() => {
                (window as any).groupComparisonPage.onOverlapStrategySelect({
                    value: 'Include',
                });
            });
            await waitForNetworkQuiet(page);
            await expect(page.locator(SURVIVAL_DIV)).toBeVisible({
                timeout: 60000,
            });
            await expectElementScreenshot(
                page,
                SURVIVAL_DIV,
                'group-comparison-survival-include.png'
            );
        });

        test('clinical tab Kruskal-Wallis (include)', async () => {
            await expect(page.locator('a.tabAnchor_clinical')).toBeVisible();
            await page.locator('a.tabAnchor_clinical').click();
            await waitForNetworkQuiet(page);
            await expect(page.locator(CLINICAL_PLOT_DIV)).toBeVisible({
                timeout: 20000,
            });
            await expectElementScreenshot(
                page,
                CLINICAL_DIV,
                'group-comparison-clinical-kruskal-wallis.png'
            );
        });

        test('clinical tab swapped axes Kruskal-Wallis', async () => {
            await page
                .locator(`${CLINICAL_DIV} input[data-test="SwapAxes"]`)
                .click();
            await expect(page.locator(CLINICAL_PLOT_DIV)).toBeVisible({
                timeout: 20000,
            });
            await expectElementScreenshot(
                page,
                CLINICAL_DIV,
                'group-comparison-clinical-kruskal-swapped.png'
            );
        });

        test('clinical tab log scale Kruskal-Wallis', async () => {
            await page
                .locator(`${CLINICAL_DIV} input[data-test="logScale"]`)
                .click();
            await expect(page.locator(CLINICAL_PLOT_DIV)).toBeVisible({
                timeout: 20000,
            });
            await expectElementScreenshot(
                page,
                CLINICAL_DIV,
                'group-comparison-clinical-log-scale.png'
            );
        });

        test('clinical tab percentage stacked bar (exclude) Chi-squared', async () => {
            await page.evaluate(() => {
                (window as any).groupComparisonPage.onOverlapStrategySelect({
                    value: 'Exclude',
                });
            });
            await waitForNetworkQuiet(page);
            await expect(page.locator(CLINICAL_PLOT_DIV)).toBeVisible({
                timeout: 20000,
            });
            await expectElementScreenshot(
                page,
                CLINICAL_DIV,
                'group-comparison-clinical-pct-stacked.png'
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
                'group-comparison-clinical-bar-chart.png'
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
                'group-comparison-clinical-stacked-bar.png'
            );
        });

        test('clinical tab stacked bar chart swapped axes Chi-squared', async () => {
            await page
                .locator(`${CLINICAL_DIV} input[data-test="SwapAxes"]`)
                .click();
            await expect(page.locator(CLINICAL_PLOT_DIV)).toBeVisible({
                timeout: 20000,
            });
            await expectElementScreenshot(
                page,
                CLINICAL_DIV,
                'group-comparison-clinical-stacked-bar-swapped.png'
            );
        });

        test('clinical tab stacked bar chart horizontal bars Chi-squared', async () => {
            await page
                .locator(`${CLINICAL_DIV} input[data-test="SwapAxes"]`)
                .click();
            await page
                .locator(`${CLINICAL_DIV} input[data-test="HorizontalBars"]`)
                .click();
            await expect(page.locator(CLINICAL_PLOT_DIV)).toBeVisible({
                timeout: 20000,
            });
            await expectElementScreenshot(
                page,
                CLINICAL_DIV,
                'group-comparison-clinical-stacked-horiz.png'
            );
        });

        test('mrna enrichments tab several groups', async () => {
            await page.locator('.tabAnchor_mrna').click();
            await expect(page.locator(MRNA_ENRICH_DIV).first()).toBeVisible({
                timeout: 20000,
            });
            await clickBoldByText(page, 'BTN3A3');
            await expect(
                page.locator('div[data-test="MiniBoxPlot"]').last()
            ).toBeVisible({ timeout: 20000 });
            await expectElementScreenshot(
                page,
                MSK_TAB_ACTIVE,
                'group-comparison-mrna-enrichments-several.png'
            );
        });

        test('protein enrichments tab several groups', async () => {
            await page.locator('.tabAnchor_protein').click();
            await expect(page.locator(PROTEIN_ENRICH_DIV).first()).toBeVisible({
                timeout: 20000,
            });
            await clickBoldByText(page, 'TUBA1B');
            await expect(
                page.locator('div[data-test="MiniBoxPlot"]').last()
            ).toBeVisible({ timeout: 20000 });
            await expectElementScreenshot(
                page,
                MSK_TAB_ACTIVE,
                'group-comparison-protein-enrichments-several.png'
            );
        });

        test('methylation enrichments tab several groups', async () => {
            await page.locator('.tabAnchor_dna_methylation').click();
            await expect(
                page.locator(METHYLATION_ENRICH_DIV).first()
            ).toBeVisible({ timeout: 20000 });
            await clickBoldByText(page, 'MTRF1L');
            await expect(
                page.locator('div[data-test="MiniBoxPlot"]').last()
            ).toBeVisible({ timeout: 20000 });
            await expectElementScreenshot(
                page,
                MSK_TAB_ACTIVE,
                'group-comparison-methylation-enrichments-several.png'
            );
        });

        test('alteration enrichments tab two groups', async () => {
            await page
                .locator('button[data-test="groupSelectorButtonGARS mutant"]')
                .click();
            await expect(
                page.locator(
                    'button[data-test="groupSelectorButtonZNF517 mutant"]'
                )
            ).toBeVisible({ timeout: 10000 });
            await page
                .locator('button[data-test="groupSelectorButtonZNF517 mutant"]')
                .click();
            await expect(page.locator('.tabAnchor_alterations')).toBeVisible({
                timeout: 10000,
            });
            await page.locator('.tabAnchor_alterations').click();
            await expect(
                page.locator(ALTERATION_ENRICH_DIV).first()
            ).toBeVisible({ timeout: 20000 });
            await expectElementScreenshot(
                page,
                MSK_TAB_ACTIVE,
                'group-comparison-alteration-enrichments-two.png'
            );
        });

        test('cna enrichments tab two groups', async () => {
            await page.locator('.tabAnchor_alterations').click();
            await expect(
                page.locator(ALTERATION_ENRICH_DIV).first()
            ).toBeVisible({ timeout: 20000 });
            await expectElementScreenshot(
                page,
                MSK_TAB_ACTIVE,
                'group-comparison-cna-enrichments-two.png'
            );
        });

        test('cna enrichments tab patient mode', async () => {
            await page.evaluate(() => {
                (window as any).groupComparisonStore.setUsePatientLevelEnrichments(
                    true
                );
            });
            await expect(
                page.locator(ALTERATION_ENRICH_DIV).first()
            ).toBeVisible({ timeout: 30000 });
            await expectElementScreenshot(
                page,
                MSK_TAB_ACTIVE,
                'group-comparison-cna-enrichments-patient.png'
            );
        });

        test('mrna enrichments tab two groups', async () => {
            await page.locator('.tabAnchor_mrna').click();
            await expect(page.locator(MRNA_ENRICH_DIV).first()).toBeVisible({
                timeout: 20000,
            });
            await clickBoldByText(page, 'RBMX2');
            await expect(
                page.locator('div[data-test="MiniBoxPlot"]').last()
            ).toBeVisible({ timeout: 20000 });
            await expectElementScreenshot(
                page,
                MSK_TAB_ACTIVE,
                'group-comparison-mrna-enrichments-two.png'
            );
        });

        test('protein enrichments tab two groups', async () => {
            await page.locator('.tabAnchor_protein').click();
            await expect(page.locator(PROTEIN_ENRICH_DIV).first()).toBeVisible({
                timeout: 20000,
            });
            await clickBoldByText(page, 'ETS1');
            await expectElementScreenshot(
                page,
                MSK_TAB_ACTIVE,
                'group-comparison-protein-enrichments-two.png'
            );
        });

        test('methylation enrichments tab two groups', async () => {
            await page.locator('.tabAnchor_dna_methylation').click();
            await expect(
                page.locator(METHYLATION_ENRICH_DIV).first()
            ).toBeVisible({ timeout: 20000 });
            await clickBoldByText(page, 'BET1');
            await expectElementScreenshot(
                page,
                MSK_TAB_ACTIVE,
                'group-comparison-methylation-enrichments-two.png'
            );
        });
    });

    test.describe('mutations tab', () => {
        test('two groups', async ({ page }) => {
            await page.goto(MUTATIONS_TWO_GROUPS_URL);
            await expect(
                page.locator('.borderedChart svg.lollipop-svgnode')
            ).toBeVisible({ timeout: 20000 });
            await page.waitForTimeout(4000);
            await expectElementScreenshot(
                page,
                MUTATIONS_PLOT,
                'group-comparison-mutations-two.png'
            );
        });

        test('two groups with no mutation types selected', async ({ page }) => {
            await page.goto(MUTATIONS_NO_TYPES_URL);
            await expect(
                page.locator('.borderedChart svg.lollipop-svgnode')
            ).toBeVisible({ timeout: 20000 });
            await page.waitForTimeout(4000);
            await expectElementScreenshot(
                page,
                MUTATIONS_PLOT,
                'group-comparison-mutations-no-types.png'
            );
        });

        test('three groups, first unselected', async ({ page }) => {
            await page.goto(MUTATIONS_THREE_GROUPS_URL);
            await expect(
                page.locator('.borderedChart svg.lollipop-svgnode')
            ).toBeVisible({ timeout: 20000 });
            const infoIcon = page.locator('[data-test="infoIcon"]').first();
            await expect(infoIcon).toBeVisible({ timeout: 20000 });
            await infoIcon.hover();
            await expect(
                page.locator('[data-test="patientMultipleMutationsMessage"]')
            ).toBeVisible();
            await page.waitForTimeout(4000);
            await expectElementScreenshot(
                page,
                MUTATIONS_PLOT,
                'group-comparison-mutations-three-first-unselected.png'
            );
        });
    });

    test.describe('delete group from session', () => {
        test('delete group from session', async ({ page }) => {
            await page.goto(DELETE_GROUP_URL);
            await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                timeout: 20000,
            });
            await page
                .locator(
                    'button[data-test="groupSelectorButtonGARS mutant"] [data-test="deleteButton"]'
                )
                .click();
            await page.waitForTimeout(1000);
            await expectElementScreenshot(
                page,
                'div.mainContainer',
                'group-comparison-delete-group.png'
            );
        });
    });

    test.describe('overlap venn diagram', () => {
        test.describe('disjoint diagram', () => {
            test('disjoint venn diagram view', async ({ page }) => {
                await page.goto(DISJOINT_VENN_URL);
                await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                    timeout: 20000,
                });
                await snapWithFrozenHover(
                    page,
                    OVERLAP_DIV,
                    'group-comparison-venn-disjoint.png'
                );
            });

            test('disjoint venn diagram with a group selected', async ({
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
                    'group-comparison-venn-disjoint-selected.png'
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
                    'group-comparison-venn-three-disjoint.png'
                );
            });
        });

        test.describe.serial('venn diagram with overlap', () => {
            let page: Page;

            test.beforeAll(async ({ browser }) => {
                page = await browser.newPage();
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
                    'group-comparison-venn-overlap.png'
                );
            });

            test('venn diagram with overlap and session selected view', async () => {
                await dispatchSvgClick(
                    page,
                    'rect[data-test="sample0,1,2VennRegion"]'
                );
                await snapWithFrozenHover(
                    page,
                    OVERLAP_DIV,
                    'group-comparison-venn-overlap-selected.png'
                );
            });

            test('venn diagram with overlap deselect active group', async () => {
                await page
                    .locator(
                        'button[data-test="groupSelectorButtonZFPM1 mutant"]'
                    )
                    .click();
                await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                    timeout: 20000,
                });
                await snapWithFrozenHover(
                    page,
                    OVERLAP_DIV,
                    'group-comparison-venn-overlap-deselect.png'
                );
            });
        });

        test.describe.serial('venn diagram with complex overlaps', () => {
            let page: Page;
            const buttonA = 'button[data-test="groupSelectorButtonAll Cases"]';
            const buttonB = 'button[data-test="groupSelectorButtonMetastasis"]';
            const buttonC =
                'button[data-test="groupSelectorButtonoverlapping patients"]';
            const buttonD = 'button[data-test="groupSelectorButtonPrimary"]';

            test.beforeAll(async ({ browser }) => {
                page = await browser.newPage();
                await page.goto(COMPLEX_VENN_URL);
                await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                    timeout: 20000,
                });
            });

            test.afterAll(async () => {
                await page.close();
            });

            test('complex venn BCD', async () => {
                await page.locator(buttonA).click();
                await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                    timeout: 20000,
                });
                await snapWithFrozenHover(
                    page,
                    OVERLAP_DIV,
                    'group-comparison-venn-complex-bcd.png'
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
                    'group-comparison-venn-complex-cd.png'
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
                    'group-comparison-venn-complex-bc.png'
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
                    'group-comparison-venn-complex-abc.png'
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
                    'group-comparison-venn-complex-ab.png'
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
                    'group-comparison-venn-complex-abd.png'
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
                    'group-comparison-venn-complex-ad.png'
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
                    'group-comparison-venn-complex-acd.png'
                );
            });
        });
    });

    test.describe.serial('overlap upset diagram group selection', () => {
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await page.goto(UPSET_URL);
            await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                timeout: 20000,
            });
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('overlap upset groups selected', async () => {
            await dispatchSvgClick(page, '.sample_testGroup5_bar');
            await dispatchSvgClick(page, '.sample_testGroup1_testGroup2_bar');
            await dispatchSvgClick(page, '.patient_testGroup1_bar');
            await snapWithFrozenHover(
                page,
                OVERLAP_DIV,
                'group-comparison-upset-groups-selected.png'
            );
        });

        test('overlap upset deselect active group', async () => {
            await page
                .locator('button[data-test="groupSelectorButtontestGroup4"]')
                .click();
            await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                timeout: 20000,
            });
            await snapWithFrozenHover(
                page,
                OVERLAP_DIV,
                'group-comparison-upset-deselect.png'
            );
        });
    });

    test.describe('clinical tab categorical table', () => {
        test('race plot type table', async ({ page }) => {
            await page.goto(CLINICAL_CATEGORICAL_URL);
            await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                timeout: 60000,
            });
            await expect(page.locator('a.tabAnchor_clinical')).toBeVisible();
            await page.locator('a.tabAnchor_clinical').click();
            await expect(page.locator(CLINICAL_PLOT_DIV)).toBeVisible({
                timeout: 20000,
            });
            await page
                .locator(`${CLINICAL_DIV} span[data-test="Race"]`)
                .click();
            await selectClinicalTabPlotType(page, 'Table');
            await expectElementScreenshot(
                page,
                CLINICAL_PLOT_DIV,
                'group-comparison-clinical-race-table.png'
            );
        });
    });
});
