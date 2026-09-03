import { test, expect } from '../fixtures';
import { byTestHandle } from './helpers/common';

/**
 * Port of end-to-end-test/remote/specs/core/plots.spec.js.
 *
 * DOM/logic tests for the results-view Plots tab: availability-alert
 * tooltip with correct sample counts across multiple studies, logscale
 * checkbox visibility per data type, and the default generic-assay
 * option that's auto-selected based on the picked gene.
 */

const METHYLATION_OPTION_SELECTION_BOX = 'div.genericAssaySelectBox';

const MULTI_STUDY_PLOTS_URL =
    '/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0' +
    '&cancer_study_list=lgg_ucsf_2014%2Cbrca_tcga&case_set_id=all&data_priority=0' +
    '&gene_list=TP53&geneset_list=%20&plots_coloring_selection=%7B%7D' +
    '&plots_horz_selection=%7B"selectedGeneOption"%3A7157%2C"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"CANCER_TYPE_DETAILED"%7D' +
    '&plots_vert_selection=%7B"selectedGeneOption"%3A7157%2C"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"CANCER_TYPE"%7D' +
    '&profileFilter=0&tab_index=tab_visualize';

const TMB_LOGSCALE_URL =
    '/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0' +
    '&cancer_study_list=lgg_ucsf_2014%2Cbrca_tcga&case_set_id=all&data_priority=0' +
    '&gene_list=TP53&geneset_list=%20&plots_coloring_selection=%7B%7D' +
    '&plots_horz_selection=%7B"selectedGeneOption"%3A7157%2C"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"TMB_NONSYNONYMOUS"%2C"logScale"%3A"false"%7D' +
    '&plots_vert_selection=%7B"selectedGeneOption"%3A7157%2C"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"CANCER_TYPE"%7D' +
    '&profileFilter=0&tab_index=tab_visualize';

const METHYLATION_DEFAULT_URL =
    '/results/plots?cancer_study_list=acc_tcga_pan_can_atlas_2018&tab_index=tab_visualize' +
    '&case_set_id=acc_tcga_pan_can_atlas_2018_all&Action=Submit&gene_list=TP53' +
    '&plots_horz_selection=%7B%22dataType%22%3A%22METHYLATION%22%7D' +
    '&plots_vert_selection=%7B%22selectedGeneOption%22%3A7157%7D' +
    '&plots_coloring_selection=%7B%7D';

test.describe('plots tab', () => {
    test('shows data availability alert tooltip for plots tab multiple studies', async ({
        page,
    }) => {
        await page.goto(MULTI_STUDY_PLOTS_URL);
        await expect(
            page.locator('div[data-test="PlotsTabPlotDiv"]')
        ).toBeVisible({ timeout: 20000 });

        // The tooltip is created on hover — hover the info icon and assert a
        // fresh `.rc-tooltip-inner` appears with the expected copy.
        await byTestHandle(page, 'dataAvailabilityAlertInfoIcon').hover();
        // The tooltip renders each line in its own element but `textContent`
        // concatenates them without newlines, so assert the substrings
        // instead of an exact multi-line match.
        const tooltip = page.locator('div.rc-tooltip-inner').last();
        await expect(tooltip).toContainText(
            'Data availability per profile/axis:'
        );
        await expect(tooltip).toContainText(
            'Horizontal Axis: 1164 samples from 2 studies'
        );
        await expect(tooltip).toContainText(
            'Vertical Axis: 1164 samples from 2 studies'
        );
        await expect(tooltip).toContainText(
            'Intersection of the two axes: 1164 samples from 2 studies'
        );
    });

    test('logscale available for raw data types that are numeric', async ({
        page,
    }) => {
        await page.goto(TMB_LOGSCALE_URL);
        await expect(
            page.locator('div[data-test="PlotsTabPlotDiv"]')
        ).toBeVisible({ timeout: 20000 });
        // TMB (numeric) → log-scale checkbox present on horizontal axis.
        await expect(byTestHandle(page, 'HorizontalLogCheckbox')).toHaveCount(
            1
        );
        // CANCER_TYPE (categorical) → no log-scale checkbox on vertical axis.
        await expect(byTestHandle(page, 'VerticalLogCheckbox')).toHaveCount(0);
    });

    test('selects gene-related generic assay default option', async ({
        page,
    }) => {
        await page.goto(METHYLATION_DEFAULT_URL);
        // waitForPlotsTab equivalent — horizontal + vertical axisBlocks both render.
        await expect(page.locator('div.axisBlock').first()).toBeVisible({
            timeout: 20000,
        });
        await expect(page.locator(METHYLATION_OPTION_SELECTION_BOX)).toHaveText(
            "TP53;WRAP53 (cg06587969): TSS1500;5'UTR;1stExon",
            { timeout: 20000 }
        );
    });
});
