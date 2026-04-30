// Source: end-to-end-test/local/specs/gsva.screenshot.spec.js
import { Locator, Page, expect } from '@playwright/test';
import { test } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';
import {
    expectElementScreenshot,
    setServerConfiguration,
} from '../helpers/common';
import {
    waitForOncoprint,
    expectOncoprintScreenshot,
    setDropdownOpen,
    getNthOncoprintTrackOptionsSelectors,
} from '../helpers/oncoprint';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

const queryPageUrl = CBIOPORTAL_URL;

const oncoprintTabUrl =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&data_priority=0&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=GO_ACYLGLYCEROL_HOMEOSTASIS%20GO_ANATOMICAL_STRUCTURE_FORMATION_INVOLVED_IN_MORPHOGENESIS%20GO_ANTEROGRADE_AXONAL_TRANSPORT%20GO_APICAL_PROTEIN_LOCALIZATION%20GO_ATP_DEPENDENT_CHROMATIN_REMODELING%20GO_CARBOHYDRATE_CATABOLIC_PROCESS%20GO_CARDIAC_CHAMBER_DEVELOPMENT&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&genetic_profile_ids_PROFILE_GENESET_SCORE=study_es_0_gsva_scores&tab_index=tab_visualize&show_samples=false&clinicallist=PROFILED_IN_study_es_0_gsva_scores%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic';

const plotsTabUrl =
    CBIOPORTAL_URL +
    '/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&clinicallist=PROFILED_IN_study_es_0_gsva_scores%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic&data_priority=0&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=GO_ACYLGLYCEROL_HOMEOSTASIS%20GO_ANATOMICAL_STRUCTURE_FORMATION_INVOLVED_IN_MORPHOGENESIS%20GO_ANTEROGRADE_AXONAL_TRANSPORT%20GO_APICAL_PROTEIN_LOCALIZATION%20GO_ATP_DEPENDENT_CHROMATIN_REMODELING%20GO_CARBOHYDRATE_CATABOLIC_PROCESS%20GO_CARDIAC_CHAMBER_DEVELOPMENT&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_GENESET_SCORE=study_es_0_gsva_scores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize';

const coexpressionTabUrl =
    CBIOPORTAL_URL +
    '/results/coexpression?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_gsva_scores%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic%2CPROFILED_IN_study_es_0_mrna_median_Zscores&data_priority=0&gene_list=CREB3L1%2520RPS11%2520PNMA1%2520MMP2%2520ZHX3%2520ERCC5&geneset_list=GO_ATP_DEPENDENT_CHROMATIN_REMODELING%20GO_ACYLGLYCEROL_HOMEOSTASIS%20GO_ANATOMICAL_STRUCTURE_FORMATION_INVOLVED_IN_MORPHOGENESIS%20GO_ANTEROGRADE_AXONAL_TRANSPORT%20GO_APICAL_PROTEIN_LOCALIZATION%20GO_CARBOHYDRATE_CATABOLIC_PROCESS%20GO_CARDIAC_CHAMBER_DEVELOPMENT&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_GENESET_SCORE=study_es_0_gsva_scores&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=study_es_0_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize%27';

async function showGsva(page: Page) {
    await setServerConfiguration(page, { skin_show_gsva: true });
}

async function clickQueryByGeneButton(page: Page) {
    const btn = page.locator('[data-test=queryByGeneButton]');
    await expect(btn).not.toHaveClass(/disabled/);
    await btn.click();
    await page.evaluate(() => window.scrollTo(0, 0));
}

async function waitForGeneQueryPage(page: Page, timeout = 10000) {
    await page.locator('[data-test=studyList]').waitFor({
        state: 'detached',
        timeout,
    });
    await page
        .locator('div[data-test="molecularProfileSelector"]')
        .waitFor({ state: 'attached', timeout });
}

async function waitForStudyQueryPage(page: Page, timeoutMs = 20000) {
    await expect(
        page.locator('[data-test="cancerTypeListContainer"]')
    ).toBeVisible({ timeout: timeoutMs });
}

async function waitForPlotsTab(page: Page, timeout = 20000) {
    await expect(page.locator('div.axisBlock').first()).toBeVisible({
        timeout,
    });
}

async function waitForCoExpressionTab(page: Page, timeout = 20000) {
    await page
        .locator('#coexpressionTabGeneTabs')
        .waitFor({ state: 'attached', timeout });
}

async function checkTestStudy(page: Page) {
    await page
        .locator('span', { hasText: /^Test study es_0$/ })
        .waitFor({ state: 'attached' });
    const checkbox = page
        .locator('span', { hasText: /^Test study es_0$/ })
        .locator('..')
        .locator('input[type=checkbox]');
    await checkbox.click();
    await clickQueryByGeneButton(page);
    await waitForGeneQueryPage(page);
}

async function checkGSVAprofile(page: Page) {
    await page
        .locator('[data-test=GENESET_SCORE]')
        .waitFor({ state: 'attached' });
    await page.locator('[data-test=GENESET_SCORE]').click();
    await page
        .locator('[data-test=GENESETS_TEXT_AREA]')
        .waitFor({ state: 'attached' });
}

async function selectReactSelectOption(parent: Locator, optionText: string) {
    await parent.locator('.Select-control').click();
    await parent
        .locator('.Select-option', { hasText: new RegExp(`^${optionText}$`) })
        .click();
}

test.describe('gsva feature', () => {
    test.describe('GenesetVolcanoPlotSelector', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(page, queryPageUrl, true);
            await showGsva(page);
            await waitForStudyQueryPage(page, 20000);
            await checkTestStudy(page);
            await checkGSVAprofile(page);
            await page
                .locator('button[data-test=GENESET_VOLCANO_BUTTON]')
                .click();
            await page
                .locator('div.modal-dialog')
                .waitFor({ state: 'attached' });
        });

        test('shows volcano plot for gene sets selection', async ({ page }) => {
            await expectElementScreenshot(
                page,
                'div.VictoryContainer',
                'shows-volcano-plot-for-gene-sets-selection.png'
            );
        });

        test('updates volcano plot after change of `percentile of score calculation`', async ({
            page,
        }) => {
            const modal = page.locator('div.modal-body');
            await modal
                .locator('.Select-value-label')
                .waitFor({ state: 'attached' });
            await modal.locator('.Select-value-label').click();
            await modal
                .locator('.Select-option', { hasText: /^50%$/ })
                .waitFor({ state: 'attached' });
            await modal.locator('.Select-option', { hasText: /^50%$/ }).click();
            await expectElementScreenshot(
                page,
                'div.VictoryContainer',
                'updates-volcano-plot-after-percentile-change.png'
            );
        });
    });

    test.describe('oncoprint tab', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(page, oncoprintTabUrl, true);
            await waitForOncoprint(page);
        });

        test('shows GSVA heatmap track', async ({ page }) => {
            await expectElementScreenshot(
                page,
                'div[id=oncoprintDiv]',
                'shows-gsva-heatmap-track.png'
            );
        });

        test('expands and shows correlation genes for GO_ATP_DEPENDENT_CHROMATIN_REMODELING', async ({
            page,
        }) => {
            const trackOptionsElts = getNthOncoprintTrackOptionsSelectors(12);
            await setDropdownOpen(
                page,
                true,
                trackOptionsElts.button,
                trackOptionsElts.dropdown
            );
            await expect(
                page.locator(`${trackOptionsElts.dropdown} li:nth-child(7)`)
            ).toBeVisible();
            await page
                .locator(`${trackOptionsElts.dropdown} li:nth-child(7)`)
                .click();

            await waitForOncoprint(page);
            await expectOncoprintScreenshot(
                page,
                'expands-and-shows-correlation-genes.png'
            );
        });
    });

    test.describe('plots tab', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(page, plotsTabUrl, true);
            await waitForPlotsTab(page, 20000);
        });

        test('shows gsva profile data on horizontal and vertical axes', async ({
            page,
        }) => {
            const horzDataSelect = page
                .locator('[name=h-profile-type-selector]')
                .locator('..');
            await horzDataSelect.locator('.Select-arrow-zone').click();
            await horzDataSelect
                .locator('.Select-option', { hasText: /^Gene Sets$/ })
                .click();

            const vertDataSelect = page
                .locator('[name=v-profile-type-selector]')
                .locator('..');
            await vertDataSelect.locator('.Select-arrow-zone').click();
            await vertDataSelect
                .locator('.Select-option', { hasText: /^Gene Sets$/ })
                .click();
            await expectElementScreenshot(
                page,
                'div[data-test="PlotsTabPlotDiv"]',
                'shows-gsva-profile-data-on-axes.png'
            );
        });
    });

    test.describe('co-expression tab', () => {
        test.beforeEach(async ({ page }) => {
            await goToUrlAndSetLocalStorage(page, coexpressionTabUrl, true);
            await waitForCoExpressionTab(page, 20000);
        });

        test('shows GSVA scores in scatterplot', async ({ page }) => {
            await selectReactSelectOption(
                page.locator('.coexpression-select-query-profile'),
                'GSVA scores on oncogenic signatures gene sets (5 samples)'
            );
            await page
                .locator('#coexpressionTabGeneTabs')
                .waitFor({ state: 'attached' });
            await expectElementScreenshot(
                page,
                '#coexpression-plot-svg',
                'shows-gsva-scores-in-scatterplot.png'
            );
        });
    });
});
