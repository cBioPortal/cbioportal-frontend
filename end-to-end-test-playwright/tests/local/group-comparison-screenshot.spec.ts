// Source: end-to-end-test/local/specs/core/groupComparison.screenshot.spec.js
import { test, expect, Page } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';
import {
    expectElementScreenshot,
    setDropdownOpen,
    setInputText,
    waitForGroupComparisonTabOpen,
    waitForNetworkQuiet,
} from '../helpers/common';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

async function openGroupComparison(
    page: Page,
    studyViewUrl: string,
    chartDataTest: string,
    timeout = 10000
) {
    await goToUrlAndSetLocalStorage(page, studyViewUrl, true);
    await expect(page.locator('[data-test=summary-tab-content]')).toBeVisible({
        timeout: 20000,
    });
    await waitForNetworkQuiet(page, 20000);

    const chart = `[data-test=${chartDataTest}]`;
    await expect(page.locator(chart)).toBeVisible({ timeout });
    await page.mouse.move(0, 0);
    await page.locator(chart).scrollIntoViewIfNeeded();

    await page.locator(chart).dispatchEvent('mouseover');

    const hamburgerIcon = `${chart} [data-test=chart-header-hamburger-icon]`;
    await expect(page.locator(hamburgerIcon)).toBeVisible({ timeout });
    await page.locator(hamburgerIcon).hover();

    const compareGroupsItem = page.locator(`${hamburgerIcon} li`).nth(1);
    await expect(compareGroupsItem).toBeVisible();

    const popupPromise = page.context().waitForEvent('page');
    await compareGroupsItem.click();
    const newPage = await popupPromise;
    await newPage.waitForLoadState('load');
    await waitForGroupComparisonTabOpen(newPage, timeout);
    return newPage;
}

async function openGeneSelectorMenu(page: Page) {
    await setDropdownOpen(
        page,
        true,
        '[data-test="selectGenes"]',
        'input[data-test=numberOfGenes]'
    );
}

async function checkClinicalTabPlot(page: Page, snapshotName: string) {
    await expectElementScreenshot(
        page,
        'div[data-test="ClinicalTabPlotDiv"]',
        snapshotName
    );
}

async function selectClinicalTabNumericalDisplayType(page: Page, type: string) {
    await setDropdownOpen(
        page,
        true,
        '[data-test="numericalVisualisationTypeSelector"] .Select-arrow-zone',
        '[data-test="numericalVisualisationTypeSelector"] .Select-menu'
    );
    await page
        .locator(
            `[data-test="numericalVisualisationTypeSelector"] .Select-option[aria-label="${type}"]`
        )
        .click();
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

test.describe('group comparison page screenshot tests', () => {
    test.describe.serial('Alteration enrichments tab', () => {
        test.describe.configure({ retries: 0 });
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            const studyPage = await browser.newPage();
            page = await openGroupComparison(
                studyPage,
                `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`,
                'chart-container-ONCOTREE_CODE',
                10000
            );
            await page.locator('.tabAnchor_alterations').click();
            await page
                .locator('[data-test="GroupComparisonAlterationEnrichments"]')
                .first()
                .waitFor({ state: 'attached', timeout: 20000 });
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('group comparison page alteration enrichments tab several groups', async () => {
            await page.mouse.move(0, 0);
            await expectElementScreenshot(
                page,
                '.msk-tab:not(.hiddenByPosition)',
                'group-comparison-alteration-enrichments-several.png'
            );
        });

        test('group comparison page alteration enrichments tab patient mode', async () => {
            await page.evaluate(() => {
                (window as any).groupComparisonStore.setUsePatientLevelEnrichments(
                    true
                );
            });
            await page
                .locator('[data-test="GroupComparisonAlterationEnrichments"]')
                .first()
                .waitFor({ state: 'attached', timeout: 20000 });
            await page.mouse.move(0, 0);
            await expectElementScreenshot(
                page,
                '.msk-tab:not(.hiddenByPosition)',
                'group-comparison-alteration-enrichments-patient-mode.png'
            );
        });

        test('group comparison page alteration enrichments tab 2 genes with highest frequency in any group', async () => {
            await page.evaluate(() => {
                (window as any).groupComparisonStore.setUsePatientLevelEnrichments(
                    false
                );
            });
            await openGeneSelectorMenu(page);
            await page.locator('input[data-test=numberOfGenes]').fill('2\n');
            await expect(
                page.locator('[data-test="addGenestoBarPlot"]')
            ).toBeEnabled({ timeout: 10000 });
            await page.locator('[data-test="addGenestoBarPlot"]').click();
            await expect(
                page.locator('div[data-test="GeneBarPlotDiv"]')
            ).toBeVisible({ timeout: 10000 });
            await page.mouse.move(0, 0);
            await expectElementScreenshot(
                page,
                'div[data-test="GeneBarPlotDiv"]',
                'group-comparison-alteration-enrichments-2genes-highest-freq.png'
            );
        });

        test('group comparison page alteration enrichments tab gene box highest average frequency', async () => {
            await openGeneSelectorMenu(page);
            await page.evaluate(() => {
                (window as any).genesSelection.onGeneListOptionChange({
                    label: 'Genes with highest average frequency',
                });
            });
            await waitForNetworkQuiet(page);
            await expect(
                page.locator('[data-test="addGenestoBarPlot"]')
            ).toBeEnabled({ timeout: 10000 });
            await page.locator('[data-test="addGenestoBarPlot"]').click();
            await expect(
                page.locator('div[data-test="GeneBarPlotDiv"]')
            ).toBeVisible({ timeout: 10000 });
            await page.mouse.move(0, 0);
            await expectElementScreenshot(
                page,
                'div[data-test="GeneBarPlotDiv"]',
                'group-comparison-alteration-enrichments-highest-avg-freq.png'
            );
        });

        test('group comparison page alteration enrichments tab gene box most significant pValues', async () => {
            await openGeneSelectorMenu(page);
            await page.evaluate(() => {
                (window as any).genesSelection.onGeneListOptionChange({
                    label: 'Genes with most significant p-value',
                });
            });
            await waitForNetworkQuiet(page);
            await expect(
                page.locator('[data-test="addGenestoBarPlot"]')
            ).toBeEnabled({ timeout: 10000 });
            await page.locator('[data-test="addGenestoBarPlot"]').click();
            await expect(
                page.locator('div[data-test="GeneBarPlotDiv"]')
            ).toBeVisible({ timeout: 10000 });
            await page.mouse.move(0, 0);
            await expectElementScreenshot(
                page,
                'div[data-test="GeneBarPlotDiv"]',
                'group-comparison-alteration-enrichments-most-sig-pvalues.png'
            );
        });

        test('group comparison page alteration enrichments tab gene box user-defined genes', async () => {
            await openGeneSelectorMenu(page);
            await setInputText(page, 'textarea[data-test="geneSet"]', 'TP53');
            await waitForNetworkQuiet(page);
            await expect(
                page.locator('[data-test="addGenestoBarPlot"]')
            ).toBeEnabled({ timeout: 10000 });
            await page.locator('[data-test="addGenestoBarPlot"]').click();
            await expect(
                page.locator('div[data-test="GeneBarPlotDiv"]')
            ).toBeVisible({ timeout: 10000 });
            await page.mouse.move(0, 0);
            await expectElementScreenshot(
                page,
                'div[data-test="GeneBarPlotDiv"]',
                'group-comparison-alteration-enrichments-user-defined-genes.png'
            );
        });

        test('group comparison alteration enrichments two groups', async () => {
            await page.locator('[data-test="groupSelectorButtonGB"]').click();
            await page.locator('[data-test="groupSelectorButtonOAST"]').click();
            await page.locator('[data-test="groupSelectorButtonODG"]').click();

            await page
                .locator('[data-test="GroupComparisonAlterationEnrichments"]')
                .first()
                .waitFor({ state: 'attached', timeout: 20000 });
            await page.mouse.move(0, 0);
            await expectElementScreenshot(
                page,
                '.msk-tab:not(.hiddenByPosition)',
                'group-comparison-alteration-enrichments-two-groups.png'
            );
        });
    });

    test.describe.serial('Clinical tab', () => {
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            const studyPage = await browser.newPage();
            page = await openGroupComparison(
                studyPage,
                `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`,
                'chart-container-ONCOTREE_CODE',
                10000
            );
            await page.locator('.tabAnchor_clinical').click();
            await page
                .locator('[data-test="ComparisonPageClinicalTabDiv"]')
                .waitFor({ state: 'attached', timeout: 20000 });
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('shows box plot for numerical data', async () => {
            await page.locator('[data-test="Mutation Count"]').click();
            await checkClinicalTabPlot(
                page,
                'group-comparison-clinical-box-plot-numerical.png'
            );
        });

        test('shows table when selecting table visualisation', async () => {
            await page.locator('[data-test="Mutation Count"]').click();
            await selectClinicalTabNumericalDisplayType(page, 'Table');
            await checkClinicalTabPlot(
                page,
                'group-comparison-clinical-table-visualisation.png'
            );
        });

        test('displays 100 percent stacked bar chart for categorical data', async () => {
            await page.locator('[data-test="Oncotree Code"]').click();
            await checkClinicalTabPlot(
                page,
                'group-comparison-clinical-100pct-stacked-bar.png'
            );
        });

        test('displays heatmap when picked from categorical plot type dropdown', async () => {
            await page.locator('[data-test="Oncotree Code"]').click();
            await selectClinicalTabPlotType(page, 'Heatmap');
            await checkClinicalTabPlot(
                page,
                'group-comparison-clinical-heatmap.png'
            );
        });
    });
});
