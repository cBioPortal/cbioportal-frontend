var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var useExternalFrontend = require('../../../shared/specUtils')
    .useExternalFrontend;
var waitForPlotsTab = require('../../../shared/specUtils').waitForPlotsTab;
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
var selectReactSelectOption = require('../../../shared/specUtils')
    .selectReactSelectOption;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('plots tab', function() {
    if (useExternalFrontend) {
        describe('utilities menu', function() {
            it('is shown when plot data available', function() {
                var url = `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic%2CPROFILED_IN_study_es_0_mrna_median_Zscores&data_priority=0&gene_list=RPS11&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=study_es_0_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize`;
                goToUrlAndSetLocalStorage(url);
                browser.waitForVisible('div[data-test="PlotsTabPlotDiv"]');
                //browser.debug();
                assert($('div.color-samples-toolbar-elt').isExisting());
            });

            it('is hidden when plot data unavailable', function() {
                var url = `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic%2CPROFILED_IN_study_es_0_mrna_median_Zscores&data_priority=0&gene_list=AR%2520RPS11&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=study_es_0_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize`;
                goToUrlAndSetLocalStorage(url);
                browser.waitForVisible('div[data-test="PlotsTabPlotDiv"]');
                assert(!$('div.utilities-menu').isExisting());
            });

            it('shows gene selection box and radio buttons in clinical attribute vs treatment plot', () => {
                const url = `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic%2CPROFILED_IN_study_es_0_mrna_median_Zscores&data_priority=0&gene_list=RPS11&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=study_es_0_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&heatmap_track_groups=study_es_0_treatment_ic50%2CErlotinib&show_samples=false&tab_index=tab_visualize&treatment_list=Erlotinib`;
                goToUrlAndSetLocalStorage(url);
                browser.waitForVisible('div[data-test="PlotsTabPlotDiv"]');

                const vertDataSelect = $('[name=v-profile-type-selector]').$(
                    '..'
                );
                selectReactSelectOption(vertDataSelect, 'Treatment Response');
                browser.waitForVisible('div[data-test="PlotsTabPlotDiv"]');

                assert($('div.coloring-menu').isExisting());
                assert(
                    $('div.coloring-menu').$$('input[type="checkbox"]')
                        .length === 2
                );
            });

            it('shows mutation and copy number by default', () => {
                const res = browser.checkElement('[id=plots-tab-plot-svg]');
                assertScreenShotMatch(res);
            });

            it('shows only mutation types when copy number is de-selected', () => {
                $('input[data-test="ViewCopyNumber"]').click();
                const res = browser.checkElement('[id=plots-tab-plot-svg]');
                assertScreenShotMatch(res);
                // set it back
                $('input[data-test="ViewCopyNumber"]').click();
            });

            it('shows only CNA types when mutation checkbox is deselected', () => {
                $('input[data-test="ViewMutationType"]').click();
                const res = browser.checkElement('[id=plots-tab-plot-svg]');
                assertScreenShotMatch(res);
                $('input[data-test="ViewMutationType"]').click();
            });

            it('removes sample stylings when selecting None in gene selection box', () => {
                $('.gene-select').click();
                $('#react-select-4-option-0').click();
                const res = browser.checkElement('[id=plots-tab-plot-svg]');
                assertScreenShotMatch(res);
            });
        });
    }
});
