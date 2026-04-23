import { test, expect, Page } from '@playwright/test';
import {
    expectElementScreenshot,
    waitForGroupComparisonTabOpen,
    waitForNetworkQuiet,
} from './helpers/common';
import {
    ALTERATION_ENRICH_DIV,
    CLINICAL_DIV,
    CLINICAL_PLOT_DIV,
    clickBoldByText,
    GENERAL_URL,
    METHYLATION_ENRICH_DIV,
    MRNA_ENRICH_DIV,
    MSK_TAB_ACTIVE,
    OVERLAP_DIV,
    PROTEIN_ENRICH_DIV,
    selectClinicalTabPlotType,
    SURVIVAL_DIV,
} from './helpers/group-comparison';

/**
 * General-flow portion of the group-comparison screenshot suite —
 * one shared page walks through overlap/survival/clinical/enrichment
 * tabs in a fixed order, matching the original wdio spec's sequence.
 */

test.describe.serial('group comparison general screenshots', () => {
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
        await expect(page.locator(METHYLATION_ENRICH_DIV).first()).toBeVisible({
            timeout: 20000,
        });
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
            page.locator('button[data-test="groupSelectorButtonZNF517 mutant"]')
        ).toBeVisible({ timeout: 10000 });
        await page
            .locator('button[data-test="groupSelectorButtonZNF517 mutant"]')
            .click();
        await expect(page.locator('.tabAnchor_alterations')).toBeVisible({
            timeout: 10000,
        });
        await page.locator('.tabAnchor_alterations').click();
        await expect(page.locator(ALTERATION_ENRICH_DIV).first()).toBeVisible({
            timeout: 20000,
        });
        await expectElementScreenshot(
            page,
            MSK_TAB_ACTIVE,
            'group-comparison-alteration-enrichments-two.png'
        );
    });

    test('cna enrichments tab two groups', async () => {
        await page.locator('.tabAnchor_alterations').click();
        await expect(page.locator(ALTERATION_ENRICH_DIV).first()).toBeVisible({
            timeout: 20000,
        });
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
        await expect(page.locator(ALTERATION_ENRICH_DIV).first()).toBeVisible({
            timeout: 30000,
        });
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
        await expect(page.locator(METHYLATION_ENRICH_DIV).first()).toBeVisible({
            timeout: 20000,
        });
        await clickBoldByText(page, 'BET1');
        await expectElementScreenshot(
            page,
            MSK_TAB_ACTIVE,
            'group-comparison-methylation-enrichments-two.png'
        );
    });
});
