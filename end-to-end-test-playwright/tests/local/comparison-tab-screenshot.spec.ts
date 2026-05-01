// Source: end-to-end-test/local/specs/core/comparisonTab.screenshot.spec.js
import { test, expect, Page } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';
import {
    expectElementScreenshot,
    setDropdownOpen,
    setInputText,
    waitForNetworkQuiet,
} from '../helpers/common';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

const SEVERAL_GROUPS_URL = `${CBIOPORTAL_URL}/results/comparison?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=lgg_ucsf_2014_test_generic_assay_mutations&cancer_study_list=lgg_ucsf_2014_test_generic_assay&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=lgg_ucsf_2014_test_generic_assay_sequenced&gene_list=TOPAZ1%2520ANK1%2520ACAN%2520INTS4&geneset_list=%20&tab_index=tab_visualize&Action=Submit&comparison_subtab=alterations&comparison_selectedGroups=%5B"TOPAZ1"%2C"ANK1"%2C"ACAN"%2C"INTS4"%5D`;

const TWO_GROUPS_URL = `${CBIOPORTAL_URL}/results/comparison?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=lgg_ucsf_2014_test_generic_assay_mutations&cancer_study_list=lgg_ucsf_2014_test_generic_assay&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=lgg_ucsf_2014_test_generic_assay_sequenced&gene_list=TOPAZ1%2520ANK1%2520ACAN%2520INTS4&geneset_list=%20&tab_index=tab_visualize&Action=Submit&comparison_subtab=alterations&comparison_selectedGroups=%5B"ACAN"%2C"INTS4"%5D`;

const MSK_TAB_ACTIVE = '.msk-tab:not(.hiddenByPosition) >> nth=0';

async function openGeneSelectorMenu(page: Page) {
    await setDropdownOpen(
        page,
        true,
        '[data-test="selectGenes"]',
        'input[data-test=numberOfGenes]'
    );
}

test.describe.serial('results view comparison tab screenshot tests', () => {
    test.describe.serial('general screenshot tests', () => {
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await goToUrlAndSetLocalStorage(page, SEVERAL_GROUPS_URL, true);
            await expect(
                page
                    .locator('[data-test=GroupComparisonAlterationEnrichments]')
                    .first()
            ).toBeVisible({ timeout: 20000 });
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('results view comparison tab alteration enrichments several groups', async () => {
            await page.mouse.move(0, 0);
            await expectElementScreenshot(
                page,
                MSK_TAB_ACTIVE,
                'results-view-comparison-tab-alteration-enrichments-several-groups.png'
            );
        });

        test('results view comparison tab alteration enrichments patient mode', async () => {
            await page.evaluate(() => {
                (window as any).comparisonTab.store.setUsePatientLevelEnrichments(
                    true
                );
            });
            await expect(
                page
                    .locator('[data-test=GroupComparisonAlterationEnrichments]')
                    .first()
            ).toBeVisible({ timeout: 20000 });
            await page.mouse.move(0, 0);
            await expectElementScreenshot(
                page,
                MSK_TAB_ACTIVE,
                'results-view-comparison-tab-alteration-enrichments-patient-mode.png'
            );
        });

        test('results view comparison tab alteration enrichments 2 genes with highest frequency in any group', async () => {
            await page.evaluate(() => {
                (window as any).comparisonTab.store.setUsePatientLevelEnrichments(
                    false
                );
            });
            await openGeneSelectorMenu(page);
            await setInputText(page, 'input[data-test=numberOfGenes]', '2\n');
            await expect(
                page.locator('[data-test="addGenestoBarPlot"]')
            ).toBeEnabled({ timeout: 30000 });
            await page.locator('[data-test="addGenestoBarPlot"]').click();
            await expect(
                page.locator('div[data-test="GeneBarPlotDiv"]')
            ).toBeVisible({ timeout: 30000 });
            await page.mouse.move(0, 0);
            await expectElementScreenshot(
                page,
                'div[data-test="GeneBarPlotDiv"]',
                'results-view-comparison-tab-alteration-enrichments-2-genes-with-highest-frequency-in-any-group.png'
            );
        });

        test('results view comparison tab alteration enrichments gene box highest average frequency', async () => {
            await openGeneSelectorMenu(page);
            await page.evaluate(() => {
                (window as any).genesSelection.onGeneListOptionChange({
                    label: 'Genes with highest average frequency',
                });
            });
            await waitForNetworkQuiet(page);
            await expect(
                page.locator('[data-test="addGenestoBarPlot"]')
            ).toBeEnabled({ timeout: 30000 });
            await page.locator('[data-test="addGenestoBarPlot"]').click();
            await expect(
                page.locator('div[data-test="GeneBarPlotDiv"]')
            ).toBeVisible({ timeout: 30000 });
            await page.mouse.move(0, 0);
            await expectElementScreenshot(
                page,
                'div[data-test="GeneBarPlotDiv"]',
                'results-view-comparison-tab-alteration-enrichments-gene-box-highest-average-frequency.png'
            );
        });

        test('results view comparison tab alteration enrichments gene box most significant pValues', async () => {
            await openGeneSelectorMenu(page);
            await page.evaluate(() => {
                (window as any).genesSelection.onGeneListOptionChange({
                    label: 'Genes with most significant p-value',
                });
            });
            await waitForNetworkQuiet(page);
            await expect(
                page.locator('[data-test="addGenestoBarPlot"]')
            ).toBeEnabled({ timeout: 30000 });
            await page.locator('[data-test="addGenestoBarPlot"]').click();
            await expect(
                page.locator('div[data-test="GeneBarPlotDiv"]')
            ).toBeVisible({ timeout: 30000 });
            await page.mouse.move(0, 0);
            await expectElementScreenshot(
                page,
                'div[data-test="GeneBarPlotDiv"]',
                'results-view-comparison-tab-alteration-enrichments-gene-box-most-significant-pvalues.png'
            );
        });

        test('results view comparison tab alteration enrichments gene box user-defined genes', async () => {
            await openGeneSelectorMenu(page);
            await setInputText(page, 'textarea[data-test="geneSet"]', 'TP53');
            await waitForNetworkQuiet(page);
            await expect(
                page.locator('[data-test="addGenestoBarPlot"]')
            ).toBeEnabled({ timeout: 30000 });
            await page.locator('[data-test="addGenestoBarPlot"]').click();
            await expect(
                page.locator('div[data-test="GeneBarPlotDiv"]')
            ).toBeVisible({ timeout: 30000 });
            await page.mouse.move(0, 0);
            await expectElementScreenshot(
                page,
                'div[data-test="GeneBarPlotDiv"]',
                'results-view-comparison-tab-alteration-enrichments-gene-box-user-defined-genes.png'
            );
        });

        test('results view comparison tab alteration enrichments two groups', async () => {
            await goToUrlAndSetLocalStorage(page, TWO_GROUPS_URL, true);
            await expect(
                page
                    .locator('[data-test=GroupComparisonAlterationEnrichments]')
                    .first()
            ).toBeVisible({ timeout: 20000 });
            await page.mouse.move(0, 0);
            await expectElementScreenshot(
                page,
                MSK_TAB_ACTIVE,
                'results-view-comparison-tab-alteration-enrichments-two-groups.png'
            );
        });
    });
});
