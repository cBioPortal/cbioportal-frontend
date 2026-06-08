// Source: end-to-end-test/local/specs/core/plotstab.screenshot.spec.js
import { test, expect } from '../../fixtures';
import { Page } from '@playwright/test';
import { goToUrlAndSetLocalStorage } from './helpers';
import { expectElementScreenshot } from '../helpers/common';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

async function waitForAndCheckPlotsTab(page: Page, snapshotName: string) {
    await expect(page.locator('div[data-test="PlotsTabPlotDiv"]')).toBeVisible({
        timeout: 20000,
    });
    await expectElementScreenshot(
        page,
        'div[data-test="PlotsTabEntireDiv"]',
        snapshotName,
        { masks: ['.popover', '.qtip'] }
    );
}

test.describe('plots tab', () => {
    test.describe('generic assay categorical plots', () => {
        test('show category vs os status plot', async ({ page }) => {
            const url = `${CBIOPORTAL_URL}/results/plots?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=lgg_ucsf_2014_test_generic_assay_mutations&cancer_study_list=lgg_ucsf_2014_test_generic_assay&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=lgg_ucsf_2014_test_generic_assay_sequenced&gene_list=TP53&geneset_list=%20&tab_index=tab_visualize&Action=Submit&plots_horz_selection=%7B%22selectedGenericAssayOption%22%3A%22mutational_signature_category_1%22%2C%22dataType%22%3A%22MUTATIONAL_SIGNATURE_TEST%22%2C%22selectedDataSourceOption%22%3A%22mutational_signature_category_v2%22%7D&plots_vert_selection=%7B%22dataType%22%3A%22clinical_attribute%22%2C%22selectedDataSourceOption%22%3A%22OS_STATUS%22%7D&plots_coloring_selection=%7B%7D`;
            await goToUrlAndSetLocalStorage(page, url, true);
            await waitForAndCheckPlotsTab(
                page,
                'show-category-vs-os-status-plot.png'
            );
        });
        test('show category vs mutation count plot', async ({ page }) => {
            const url = `${CBIOPORTAL_URL}/results/plots?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=lgg_ucsf_2014_test_generic_assay_mutations&cancer_study_list=lgg_ucsf_2014_test_generic_assay&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=lgg_ucsf_2014_test_generic_assay_sequenced&gene_list=TP53&geneset_list=%20&tab_index=tab_visualize&Action=Submit&plots_horz_selection=%7B%22selectedGenericAssayOption%22%3A%22mutational_signature_category_1%22%2C%22dataType%22%3A%22MUTATIONAL_SIGNATURE_TEST%22%2C%22selectedDataSourceOption%22%3A%22mutational_signature_category_v2%22%7D&plots_vert_selection=%7B%22dataType%22%3A%22clinical_attribute%22%2C%22selectedDataSourceOption%22%3A%22MUTATION_COUNT%22%7D&plots_coloring_selection=%7B%7D`;
            await goToUrlAndSetLocalStorage(page, url, true);
            await waitForAndCheckPlotsTab(
                page,
                'show-category-vs-mutation-count-plot.png'
            );
        });
    });
    test.describe('generic assay binary plots', () => {
        test('show binary vs os status plot', async ({ page }) => {
            const url = `${CBIOPORTAL_URL}/results/plots?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=lgg_ucsf_2014_test_generic_assay_mutations&cancer_study_list=lgg_ucsf_2014_test_generic_assay&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=lgg_ucsf_2014_test_generic_assay_sequenced&gene_list=TP53&geneset_list=%20&tab_index=tab_visualize&Action=Submit&plots_horz_selection=%7B"dataType"%3A"MUTATIONAL_SIGNATURE_TEST"%2C"selectedDataSourceOption"%3A"mutational_signature_binary_v2"%7D&plots_vert_selection=%7B"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"OS_STATUS"%7D&plots_coloring_selection=%7B%7D`;
            await goToUrlAndSetLocalStorage(page, url, true);
            await waitForAndCheckPlotsTab(
                page,
                'show-binary-vs-os-status-plot.png'
            );
        });
        test('show binary vs mutation count plot', async ({ page }) => {
            const url = `${CBIOPORTAL_URL}/results/plots?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=lgg_ucsf_2014_test_generic_assay_mutations&cancer_study_list=lgg_ucsf_2014_test_generic_assay&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=lgg_ucsf_2014_test_generic_assay_sequenced&gene_list=TP53&geneset_list=%20&tab_index=tab_visualize&Action=Submit&plots_horz_selection=%7B"dataType"%3A"MUTATIONAL_SIGNATURE_TEST"%2C"selectedDataSourceOption"%3A"mutational_signature_binary_v2"%7D&plots_vert_selection=%7B"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"MUTATION_COUNT"%7D&plots_coloring_selection=%7B%7D`;
            await goToUrlAndSetLocalStorage(page, url, true);
            await waitForAndCheckPlotsTab(
                page,
                'show-binary-vs-mutation-count-plot.png'
            );
        });
    });
});
