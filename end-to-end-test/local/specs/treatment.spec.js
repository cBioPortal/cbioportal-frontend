var assert = require('assert');
var useExternalFrontend = require('../../shared/specUtils').useExternalFrontend;
var goToUrlAndSetLocalStorage = require('../../shared/specUtils').goToUrlAndSetLocalStorage;
var waitForOncoprint = require('../../shared/specUtils').waitForOncoprint;
var waitForPlotsTab = require('../../shared/specUtils').waitForPlotsTab;
var reactSelectOption =  require('../../shared/specUtils').reactSelectOption;
var getReactSelectOptions =  require('../../shared/specUtils').getReactSelectOptions;
var selectReactSelectOption =  require('../../shared/specUtils').selectReactSelectOption;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");
const oncoprintTabUrl = CBIOPORTAL_URL+'/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic&data_priority=0&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize';
const plotsTabUrl = CBIOPORTAL_URL+'/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&clinicallist=PROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic&data_priority=0&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize&treatment_list=17-AAG%3BAEW541';

describe('treatment feature', function() {

    //this.retries(2);

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

            it('initializes from `treatment_list` URL parameter', () => {
                goToUrlAndSetLocalStorage(oncoprintTabUrl.concat('&treatment_list=17-AAG'));
                waitForOncoprint();
                openHeatmapMenu();
                selectReactSelectOption( $('.oncoprint__controls__heatmap_menu'), 'IC50 values of compounds on cellular phenotype readout');
                assert($('div.icon*=17-AAG').isExisting());
                var selectMenuEntry = reactSelectOption($('.oncoprint__controls__heatmap_menu .treatment-selector'), 'Name of 17-AAG', true);
                assert(selectMenuEntry.getAttribute('class').includes('is-selected'));
            });

            it('sets `treatment_list` URL parameter', () => {
                openHeatmapMenu();
                selectReactSelectOption( $('.oncoprint__controls__heatmap_menu'), 'IC50 values of compounds on cellular phenotype readout');
                $('.oncoprint__controls__heatmap_menu textarea').setValue('17-AAG');
                $('div.icon-area div.icon').waitForExist();
                $('button=Add Treatment Response to Heatmap').click();
                waitForOncoprint();
                var url = browser.url().value;
                var regex = /treatment_list=17-AAG/;
                assert(url.match(regex));
            });

        });

        describe('plots tab', () => {

            beforeEach(()=>{
                goToUrlAndSetLocalStorage(plotsTabUrl);
                waitForPlotsTab();
            });

            it('shows treatment option in horizontal data type selection box', () => {
                var select = $('[name=h-profile-type-selector]').$('..');
                assert( reactSelectOption(select, 'Treatment Response') );
            });

            it('shows treatment option in vertical data type selection box', () => {
                var select = $('[name=v-profile-type-selector]').$('..');
                assert( reactSelectOption(select, 'Treatment Response') );
            });

            it('horizontal axis menu shows treatments in profile menu', () => {
                var horzDataSelect = $('[name=h-profile-type-selector]').$('..');
                selectReactSelectOption(horzDataSelect, 'Treatment Response');

                var horzProfileSelect = $('[name=h-profile-name-selector]').$('..');
                assert( reactSelectOption(horzProfileSelect, 'EC50 values of compounds on cellular phenotype readout') );
                assert( reactSelectOption(horzProfileSelect, 'IC50 values of compounds on cellular phenotype readout') );
            });

            it('vertical axis menu shows treatments in profile menu', () => {
                var vertDataSelect = $('[name=v-profile-type-selector]').$('..');
                selectReactSelectOption(vertDataSelect, 'Treatment Response');

                var vertProfileSelect = $('[name=h-profile-name-selector]').$('..');
                assert( reactSelectOption(vertProfileSelect, 'EC50 values of compounds on cellular phenotype readout') );
                assert( reactSelectOption(vertProfileSelect, 'IC50 values of compounds on cellular phenotype readout') );
            });

            it('horizontal axis menu shows treatment entry in entity menu', () => {
                var horzDataSelect = $('[name=h-profile-type-selector]').$('..');
                selectReactSelectOption(horzDataSelect, 'Treatment Response');

                var horzProfileSelect = $('[name=h-profile-name-selector]').$('..');
                selectReactSelectOption(horzProfileSelect, 'IC50 values of compounds on cellular phenotype readout');

                var horzEntitySelect = $('[name=h-treatment-selector]').$('..');
                assert( reactSelectOption(horzEntitySelect, 'Name of 17-AAG') );
                assert( reactSelectOption(horzEntitySelect, 'Name of AEW541') );
            });

            it('vertical axis menu shows treatment entry in entity menu', () => {
                var vertDataSelect = $('[name=v-profile-type-selector]').$('..');
                selectReactSelectOption(vertDataSelect, 'Treatment Response');

                var vertProfileSelect = $('[name=v-profile-name-selector]').$('..');
                selectReactSelectOption(vertProfileSelect, 'IC50 values of compounds on cellular phenotype readout');

                var vertEntitySelect = $('[name=v-treatment-selector]').$('..');
                assert( reactSelectOption(vertEntitySelect, 'Name of 17-AAG') );
                assert( reactSelectOption(vertEntitySelect, 'Name of AEW541') );
            });

            it('has Ordered samples entry in vert. menu when treatment selected on horz. axis', () => {
                var vertDataSelect = $('[name=v-profile-type-selector]').$('..');
                selectReactSelectOption(vertDataSelect, 'Treatment Response');

                var vertProfileSelect = $('[name=v-profile-name-selector]').$('..');
                selectReactSelectOption(vertProfileSelect, 'IC50 values of compounds on cellular phenotype readout');

                var vertEntitySelect = $('[name=v-treatment-selector]').$('..');
                selectReactSelectOption( vertEntitySelect, 'Name of AEW541');

                var horzDataSelect = $('[name=h-profile-type-selector]').$('..');
                assert( reactSelectOption(horzDataSelect, 'Ordered samples') );
            });

            it('has `Ordered samples` entry in horz. menu when treatment selected on vert. axis', () => {
                var horzDataSelect = $('[name=h-profile-type-selector]').$('..');
                selectReactSelectOption(horzDataSelect, 'Treatment Response');

                var horzProfileSelect = $('[name=h-profile-name-selector]').$('..');
                selectReactSelectOption(horzProfileSelect, 'IC50 values of compounds on cellular phenotype readout');

                var horzEntitySelect = $('[name=h-treatment-selector]').$('..');
                selectReactSelectOption( horzEntitySelect, 'Name of AEW541');

                var vertDataSelect = $('[name=v-profile-type-selector]').$('..');
                assert( reactSelectOption(vertDataSelect, 'Ordered samples') );
            });

            it('shows `Log Scale` checkbox when treatment selected on vert. axis', () => {
                var horzDataSelect = $('[name=h-profile-type-selector]').$('..');
                selectReactSelectOption(horzDataSelect, 'Treatment Response');
                assert( $('[data-test=HorizontalLogCheckbox]') );
            });

            it('shows `Log Scale` checkbox when treatment selected on horz. axis', () => {
                var vertDataSelect = $('[name=v-profile-type-selector]').$('..');
                selectReactSelectOption(vertDataSelect, 'Treatment Response');
                assert( $('[data-test=VerticalLogCheckbox]') );
            });

            it('shows checkbox for limit values (e.g., >8.00) checkbox when such profile selected on horz. axis', () => {

                var horzDataSelect = $('[name=h-profile-type-selector]').$('..');
                selectReactSelectOption(horzDataSelect, 'Treatment Response');

                var horzProfileSelect = $('[name=h-profile-name-selector]').$('..');
                selectReactSelectOption(horzProfileSelect, 'EC50 values of compounds on cellular phenotype readout');

                var horzEntitySelect = $('[name=h-treatment-selector]').$('..');
                selectReactSelectOption(horzEntitySelect, 'Name of AEW541');

                assert( $('[data-test=ViewLimitValues]').isVisible() );
            });

            it('shows checkbox for limit values (e.g., >8.00) checkbox when such profile selected on vert. axis', () => {
                var vertDataSelect = $('[name=v-profile-type-selector]').$('..');
                selectReactSelectOption(vertDataSelect, 'Treatment Response');

                var vertProfileSelect = $('[name=v-profile-name-selector]').$('..');
                selectReactSelectOption(vertProfileSelect, 'EC50 values of compounds on cellular phenotype readout');

                var vertEntitySelect = $('[name=v-treatment-selector]').$('..');
                selectReactSelectOption(vertEntitySelect, 'Name of AEW541');

                assert( $('[data-test=ViewLimitValues]').isVisible() );
            });

            it('shows hint for handling of threshold values for treatment data in scatter plot', () => {
                assert( $('label=Value >8.00 Labels **') );
                assert( $('div*=** ') );
            });

            it('shows gene selection box in utilities menu for waterfall plot', () => {
                selectTreamentsBothAxes();

                var horzDataSelect = $('[name=h-profile-type-selector]').$('..');
                selectReactSelectOption(horzDataSelect, 'Ordered samples');
                assert( $('.gene-select-container') );
                assert( $('.gene-select-container') );
            });

            it('shows selected genes in gene selection box in utilities menu for waterfall plot', () => {
                selectTreamentsBothAxes();

                var horzDataSelect = $('[name=h-profile-type-selector]').$('..');
                selectReactSelectOption(horzDataSelect, 'Ordered samples');

                $('.gene-select-container').waitForExist();
                var geneSelect = $('.gene-select-container');
                geneSelect.$('.Select-value-label').click();

                var options = geneSelect.$$('.Select-option');

                assert.equal(options[0].getText(), 'CDKN2A');
                assert.equal(options[1].getText(), 'MDM2');
                assert.equal(options[2].getText(), 'MDM4');
                assert.equal(options[3].getText(), 'TP53');
            });

            it('shows sort order button for waterfall plot when `Ordered samples` selected', () => {
                selectTreamentsBothAxes();
                var horzDataSelect = $('[name=h-profile-type-selector]').$('..');
                selectReactSelectOption(horzDataSelect, 'Ordered samples');
                assert( $('[data-test=changeSortOrderButton') );
            });

        });

    }

});

var openHeatmapMenu = () => {
    var heatmapButton = browser.$('button[id=heatmapDropdown]');
    heatmapButton.click();
};

var selectTreamentsBothAxes = () => {
    var horzDataSelect = $('[name=h-profile-type-selector]').$('..');
    selectReactSelectOption(horzDataSelect, 'Treatment Response');
    var horzProfileSelect = $('[name=h-profile-name-selector]').$('..');
    selectReactSelectOption(horzProfileSelect, 'IC50 values of compounds on cellular phenotype readout');

    var vertDataSelect = $('[name=v-profile-type-selector]').$('..');
    selectReactSelectOption(vertDataSelect, 'Treatment Response');
    var vertProfileSelect = $('[name=v-profile-name-selector]').$('..');
    selectReactSelectOption(vertProfileSelect, 'IC50 values of compounds on cellular phenotype readout');

    var horzEntitySelect = $('[name=h-treatment-selector]').$('..');
    selectReactSelectOption(horzEntitySelect, 'Name of AEW541');

    var vertEntitySelect = $('[name=v-treatment-selector]').$('..');
    selectReactSelectOption(vertEntitySelect, 'Name of AEW541');

    if (! $('[data-test=ViewLimitValues]').isSelected()) {
        $('[data-test=ViewLimitValues]').click();
    }

    if ($('[data-test=HorizontalLogCheckbox]').isSelected()) {
        $('[data-test=HorizontalLogCheckbox]').click();
    }

    if ($('[data-test=VerticalLogCheckbox]').isSelected()) {
        $('[data-test=VerticalLogCheckbox]').click();
    }
}

module.exports = {
    oncoprintTabUrl: oncoprintTabUrl,
    openHeatmapMenu: openHeatmapMenu,
    queryPageUrl: CBIOPORTAL_URL,
    plotsTabUrl: plotsTabUrl,
    selectTreamentsBothAxes: selectTreamentsBothAxes,
};
