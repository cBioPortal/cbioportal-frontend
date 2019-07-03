var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../shared/specUtils').goToUrlAndSetLocalStorage;
var waitForOncoprint = require('../../shared/specUtils').waitForOncoprint;
var reactSelectOption =  require('../../shared/specUtils').reactSelectOption;
var getReactSelectOptions =  require('../../shared/specUtils').getReactSelectOptions;
var selectReactSelectOption =  require('../../shared/specUtils').selectReactSelectOption;
var useExternalFrontend = require('../../shared/specUtils').useExternalFrontend;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");
const oncoprintTabUrl = CBIOPORTAL_URL+'/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic&data_priority=0&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize'

describe('treatment feature', function() {

    this.retries(2);

    if (useExternalFrontend) {

        describe('oncoprint tab', () => {

            beforeEach(()=>{
                goToUrlAndSetLocalStorage(oncoprintTabUrl);
                waitForOncoprint();
            });

            it('shows treatment data type option in heatmap menu', () => {
                openHeatmapMenu();
                assert( reactSelectOption( $('.oncoprint__controls__heatmap_menu'), 'EC50 values of compounds on cellular phenotype readout') );
                assert( reactSelectOption( $('.oncoprint__controls__heatmap_menu'), 'IC50 values of compounds on cellular phenotype readout') );
            });

            it('shows treatment text area box in heatmap menu when treatment data type is selected', () => {
                openHeatmapMenu();
                selectReactSelectOption( $('.oncoprint__controls__heatmap_menu'), 'IC50 values of compounds on cellular phenotype readout');
                assert( $('.oncoprint__controls__heatmap_menu.text-icon-area') );
            });

            it('does not show genes of gene text area in treatment text area,and vice versa', () => {
                openHeatmapMenu();
                var geneText =  $('.oncoprint__controls__heatmap_menu textarea').getText();
                selectReactSelectOption( $('.oncoprint__controls__heatmap_menu'), 'IC50 values of compounds on cellular phenotype readout');
                var treatmentText =  $('.oncoprint__controls__heatmap_menu textarea').getText();
                assert.notEqual(geneText, treatmentText);
                selectReactSelectOption( $('.oncoprint__controls__heatmap_menu'), 'mRNA expression (microarray) Z-Score normalized');
                assert.equal($('.oncoprint__controls__heatmap_menu textarea').getText(), geneText);
            });

            it('shows treatment selection box in heatmap menu when treatment data type is selected', () => {
                openHeatmapMenu();
                selectReactSelectOption( $('.oncoprint__controls__heatmap_menu'), 'IC50 values of compounds on cellular phenotype readout');
                assert(  $('.oncoprint__controls__heatmap_menu.treatment-selector') );
            });

            it('adds icon when entering a valid treatment in treatment text area', () => {
                openHeatmapMenu();
                selectReactSelectOption( $('.oncoprint__controls__heatmap_menu'), 'IC50 values of compounds on cellular phenotype readout');
                $('.oncoprint__controls__heatmap_menu textarea').setValue('17-AAG');
                $('div.icon*=17-AAG').waitForExist();
                assert( $('div.icon*=17-AAG') );
            });

            it('click of icon remove button removes icon', () => {
                openHeatmapMenu();
                selectReactSelectOption( $('.oncoprint__controls__heatmap_menu'), 'IC50 values of compounds on cellular phenotype readout');
                $('.oncoprint__controls__heatmap_menu textarea').setValue('17-AAG');
                $('div.icon-area div.icon').waitForExist();
                var iconButton = $('div.icon-area div.icon-button');
                iconButton.click();
                $('div.icon-area div.icon').waitForExist(undefined, true);
                assert( ! $('div.icon-area div.icon').isExisting() );
            });
            
            it('removes valid treatment from treatment text area when recognized', () => {
                openHeatmapMenu();
                selectReactSelectOption( $('.oncoprint__controls__heatmap_menu'), 'IC50 values of compounds on cellular phenotype readout');
                $('.oncoprint__controls__heatmap_menu textarea').setValue('17-AAG');
                $('div.icon-area div.icon').waitForExist();
                assert( ! $('.oncoprint__controls__heatmap_menu textarea').getValue() );
            });
            
            it('shows all treatments in the treatment select box', () => {
                openHeatmapMenu();
                selectReactSelectOption( $('.oncoprint__controls__heatmap_menu'), 'IC50 values of compounds on cellular phenotype readout');
                var treatments = getReactSelectOptions( $('.oncoprint__controls__heatmap_menu .treatment-selector') );
                assert.equal(treatments.length, 10);
            });
            
            it('adds treatment to icons when selected in treatment select box', () => {
                openHeatmapMenu();
                selectReactSelectOption( $('.oncoprint__controls__heatmap_menu'), 'IC50 values of compounds on cellular phenotype readout');
                var treatments = getReactSelectOptions( $('.oncoprint__controls__heatmap_menu .treatment-selector') );
                var treatment = treatments[0];
                var treatmentName = treatment.getText();
                treatmentName = treatmentName.replace(/.*\((.*)\).*/, "$1")
                treatment.click();
                $('div.icon*='+treatmentName).waitForExist();
                assert( $('div.icon*='+treatmentName) );
            });

            it('filters treatment select options when using search of treatment select box', () => {
                openHeatmapMenu();
                selectReactSelectOption( $('.oncoprint__controls__heatmap_menu'), 'IC50 values of compounds on cellular phenotype readout');
                var searchBox = $('.oncoprint__controls__heatmap_menu .treatment-selector .Select-control input');
                searchBox.setValue('17-AAG');
                var treatments = getReactSelectOptions( $('.oncoprint__controls__heatmap_menu .treatment-selector') );
                assert(treatments.length, 1);
            });

            it('sets `treatment_list` URL parameter', () => {
                openHeatmapMenu();
                selectReactSelectOption( $('.oncoprint__controls__heatmap_menu'), 'IC50 values of compounds on cellular phenotype readout');
                $('.oncoprint__controls__heatmap_menu textarea').setValue('17-AAG');
                $('div.icon-area div.icon').waitForExist();
                $('button=Add Treatments to Heatmap').click();
                waitForOncoprint();
                var url = browser.url().value;
                var regex = /treatment_list=17-AAG/;
                assert(url.match(regex));
            });

        });

    }

});

var openHeatmapMenu = () => {
    var heatmapButton = browser.$('button[id=heatmapDropdown]');
    heatmapButton.click();
}

module.exports = {
    oncoprintTabUrl: oncoprintTabUrl,
    openHeatmapMenu: openHeatmapMenu,
};