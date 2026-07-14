// Source: end-to-end-test/local/specs/core/plotstab.spec.js
import { Locator, Page, expect } from '@playwright/test';
import { test } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';
import { expectElementScreenshot } from '../helpers/common';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

async function loadPlotsTab(page: Page, url: string) {
    await goToUrlAndSetLocalStorage(page, url, true);
    await expect(page.locator('div[data-test="PlotsTabPlotDiv"]')).toBeVisible({
        timeout: 30000,
    });
}

async function selectReactSelectOption(parent: Locator, optionText: string) {
    await parent.locator('.Select-control').click();
    await parent
        .locator('.Select-option', { hasText: new RegExp(`^${optionText}$`) })
        .click();
}

async function selectTreatmentProfile(page: Page) {
    const vertDataSelect = page
        .locator('[name=v-profile-type-selector]')
        .locator('..');
    await selectReactSelectOption(vertDataSelect, 'Treatment Response');
    await expect(
        page.locator('div[data-test="PlotsTabPlotDiv"]')
    ).toBeVisible();
}

test.describe('plots tab', () => {
    test.describe('utilities menu', () => {
        test('is shown when plot data available', async ({ page }) => {
            await loadPlotsTab(
                page,
                `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic%2CPROFILED_IN_study_es_0_mrna_median_Zscores&data_priority=0&gene_list=RPS11&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=study_es_0_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize`
            );
            await expect(
                page.locator('div.color-samples-toolbar-elt')
            ).toBeAttached();
        });

        test('is hidden when plot data unavailable', async ({ page }) => {
            await goToUrlAndSetLocalStorage(
                page,
                `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic%2CPROFILED_IN_study_es_0_mrna_median_Zscores&data_priority=0&gene_list=AR%2520RPS11&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=study_es_0_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize`,
                true
            );
            await expect(
                page.locator('div[data-test="PlotsTabNoDataDiv"]')
            ).toBeVisible({ timeout: 30000 });
        });

        test('shows gene selection box and radio buttons in clinical attribute vs treatment plot', async ({
            page,
        }) => {
            await loadPlotsTab(
                page,
                `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic%2CPROFILED_IN_study_es_0_mrna_median_Zscores&data_priority=0&gene_list=RPS11&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=study_es_0_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&heatmap_track_groups=study_es_0_treatment_ic50%2CErlotinib&show_samples=false&tab_index=tab_visualize&treatment_list=Erlotinib`
            );
            await selectTreatmentProfile(page);
            await expect(page.locator('div.coloring-menu')).toBeAttached();
            expect(
                await page
                    .locator('div.coloring-menu input[type="checkbox"]')
                    .count()
            ).toBe(3);
        });

        test('shows mutation and copy number by default', async ({ page }) => {
            await loadPlotsTab(
                page,
                `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic%2CPROFILED_IN_study_es_0_mrna_median_Zscores&data_priority=0&gene_list=RPS11&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=study_es_0_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&heatmap_track_groups=study_es_0_treatment_ic50%2CErlotinib&show_samples=false&tab_index=tab_visualize&treatment_list=Erlotinib&plots_horz_selection=%7B"dataType"%3A"clinical_attribute"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A6205%2C"dataType"%3A"TREATMENT_RESPONSE"%7D&plots_coloring_selection=%7B%7D&profileFilter=0`
            );
            await selectTreatmentProfile(page);
            await expectElementScreenshot(
                page,
                '[id=plots-tab-plot-svg]',
                'shows-mutation-and-copy-number-by-default.png'
            );
        });

        test('shows only mutation types when copy number is de-selected', async ({
            page,
        }) => {
            await loadPlotsTab(
                page,
                `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic%2CPROFILED_IN_study_es_0_mrna_median_Zscores&data_priority=0&gene_list=RPS11&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=study_es_0_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&heatmap_track_groups=study_es_0_treatment_ic50%2CErlotinib&show_samples=false&tab_index=tab_visualize&treatment_list=Erlotinib&plots_horz_selection=%7B"dataType"%3A"clinical_attribute"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A6205%2C"dataType"%3A"TREATMENT_RESPONSE"%7D&plots_coloring_selection=%7B"colorByCopyNumber"%3A"false"%2C"colorBySv"%3A"false"%7D&profileFilter=0`
            );
            await selectTreatmentProfile(page);
            await page.locator('input[data-test="ViewCopyNumber"]').click();
            await expectElementScreenshot(
                page,
                '[id=plots-tab-plot-svg]',
                'shows-only-mutation-types-when-copy-number-deselected.png'
            );
        });

        test('shows only CNA types when mutation checkbox is deselected', async ({
            page,
        }) => {
            await loadPlotsTab(
                page,
                `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic%2CPROFILED_IN_study_es_0_mrna_median_Zscores&data_priority=0&gene_list=RPS11&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=study_es_0_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&heatmap_track_groups=study_es_0_treatment_ic50%2CErlotinib&show_samples=false&tab_index=tab_visualize&treatment_list=Erlotinib&plots_horz_selection=%7B"dataType"%3A"clinical_attribute"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A6205%2C"dataType"%3A"TREATMENT_RESPONSE"%7D&plots_coloring_selection=%7B"colorByMutationType"%3A"false"%2C"colorBySv"%3A"false"%7D&profileFilter=0`
            );
            await selectTreatmentProfile(page);
            await page.locator('input[data-test="ViewMutationType"]').click();
            await expectElementScreenshot(
                page,
                '[id=plots-tab-plot-svg]',
                'shows-only-cna-types-when-mutation-deselected.png'
            );
        });

        test('removes sample stylings when selecting None in gene selection box', async ({
            page,
        }) => {
            await loadPlotsTab(
                page,
                `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic%2CPROFILED_IN_study_es_0_mrna_median_Zscores&data_priority=0&gene_list=RPS11&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=study_es_0_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&heatmap_track_groups=study_es_0_treatment_ic50%2CErlotinib&show_samples=false&tab_index=tab_visualize&treatment_list=Erlotinib&plots_horz_selection=%7B"dataType"%3A"clinical_attribute"%7D&plots_vert_selection=%7B"dataType"%3A"TREATMENT_RESPONSE"%7D&plots_coloring_selection=%7B"selectedOption"%3A"6205_undefined"%7D&profileFilter=0`
            );
            await selectTreatmentProfile(page);
            await page.locator('.gene-select').click();
            const genesParent = page
                .locator('[data-test=GeneColoringMenu]')
                .locator('div', { hasText: /^Genes$/ })
                .locator('..');
            const geneMenuEntry = genesParent
                .locator('div')
                .nth(1)
                .locator('div')
                .first();
            await geneMenuEntry.click();
            await expect(
                page.locator('[data-test=PlotsTabPlotDiv]')
            ).toBeVisible();
            await expectElementScreenshot(
                page,
                '[id=plots-tab-plot-svg]',
                'removes-sample-stylings-when-selecting-none.png'
            );
        });
    });
});
