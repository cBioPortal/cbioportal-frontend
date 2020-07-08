var assert = require('assert');
var useExternalFrontend = require('../../shared/specUtils').useExternalFrontend;
var goToUrlAndSetLocalStorage = require('../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var waitForOncoprint = require('../../shared/specUtils').waitForOncoprint;
var waitForPlotsTab = require('../../shared/specUtils').waitForPlotsTab;
var reactSelectOption = require('../../shared/specUtils').reactSelectOption;
var selectReactSelectOption = require('../../shared/specUtils')
    .selectReactSelectOption;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const oncoprintTabUrl =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic&data_priority=0&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize';
const plotsTabUrl =
    CBIOPORTAL_URL +
    '/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&clinicallist=PROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic&data_priority=0&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize&generic_assay_groups=study_es_0_treatment_ic50,Afatinib-1,Afatinib-2';

describe('treatment feature', function() {
    //this.retries(2);

    if (useExternalFrontend) {
        describe('oncoprint tab', () => {
            beforeEach(() => {
                goToUrlAndSetLocalStorage(oncoprintTabUrl);
                waitForOncoprint();
            });

            it('shows treatment data type option in heatmap menu', () => {
                openHeatmapMenu();
                assert(
                    reactSelectOption(
                        $('.oncoprint__controls__heatmap_menu'),
                        'EC50 values of compounds on cellular phenotype readout'
                    )
                );
                assert(
                    reactSelectOption(
                        $('.oncoprint__controls__heatmap_menu'),
                        'IC50 values of compounds on cellular phenotype readout'
                    )
                );
            });

            it('shows treatment selection box in heatmap menu when treatment data type is selected', () => {
                openHeatmapMenu();
                selectReactSelectOption(
                    $('.oncoprint__controls__heatmap_menu'),
                    'IC50 values of compounds on cellular phenotype readout'
                );
                assert(
                    $(
                        '.oncoprint__controls__heatmap_menu.generic-assay-selector'
                    )
                );
            });

            it('shows all treatments in generic assay selector', () => {
                openHeatmapMenu();
                selectReactSelectOption(
                    $('.oncoprint__controls__heatmap_menu'),
                    'IC50 values of compounds on cellular phenotype readout'
                );
                // wait for generic assay data loading complete
                $(
                    '.oncoprint__controls__heatmap_menu .generic-assay-selector'
                ).waitForExist();
                $('.generic-assay-selector div[class$="control"]').click();
                var options = $$('div[class$="option"]');
                assert.equal(options.length, 10);
            });

            it('select one treatment in generic assay selector', () => {
                openHeatmapMenu();
                selectReactSelectOption(
                    $('.oncoprint__controls__heatmap_menu'),
                    'IC50 values of compounds on cellular phenotype readout'
                );
                // wait for generic assay data loading complete
                $(
                    '.oncoprint__controls__heatmap_menu .generic-assay-selector'
                ).waitForExist();
                $('.oncoprint__controls__heatmap_menu input').setValue(
                    '17-AAG'
                );
                var options = $$('div[class$="option"]');
                options[1].click();
                $('div[class$="multiValue"]').waitForExist();
                var selectedOptions = $$('div[class$="multiValue"]');
                assert.equal(selectedOptions.length, 1);
            });

            it('select multiple filtered treatment in generic assay selector', () => {
                openHeatmapMenu();
                selectReactSelectOption(
                    $('.oncoprint__controls__heatmap_menu'),
                    'IC50 values of compounds on cellular phenotype readout'
                );
                // wait for generic assay data loading complete
                $(
                    '.oncoprint__controls__heatmap_menu .generic-assay-selector'
                ).waitForExist();
                $('.oncoprint__controls__heatmap_menu input').setValue('AZD');
                var options = $$('div[class$="option"]');
                options[0].click();
                $('div[class$="multiValue"]').waitForExist();
                var selectedOptions = $$('div[class$="multiValue"]');
                assert.equal(selectedOptions.length, 2);
            });

            it('select multiple filtered option removed after cleared the search text', () => {
                openHeatmapMenu();
                selectReactSelectOption(
                    $('.oncoprint__controls__heatmap_menu'),
                    'IC50 values of compounds on cellular phenotype readout'
                );
                // wait for generic assay data loading complete
                $(
                    '.oncoprint__controls__heatmap_menu .generic-assay-selector'
                ).waitForExist();
                $('.oncoprint__controls__heatmap_menu input').setValue('AZD');
                var options = $$('div[class$="option"]');
                assert.equal(options.length, 3);
                $('.oncoprint__controls__heatmap_menu input').setValue('');
                $('.generic-assay-selector div[class$="control"]').click();
                options = $$('div[class$="option"]');
                assert.equal(options.length, 10);
            });

            it('keeps the filtered treatments list open after selecting an option', () => {
                openHeatmapMenu();
                selectReactSelectOption(
                    $('.oncoprint__controls__heatmap_menu'),
                    'IC50 values of compounds on cellular phenotype readout'
                );
                // wait for generic assay data loading complete
                $(
                    '.oncoprint__controls__heatmap_menu .generic-assay-selector'
                ).waitForExist();
                $('.generic-assay-selector div[class$="control"]').click();
                var options = $$('div[class$="option"]');
                assert.equal(options.length, 10);

                options[0].click();
                options = $$('div[class$="option"]');
                assert.equal(options.length, 9);
            });

            it('initializes from `generic_assay_groups` URL parameter', () => {
                goToUrlAndSetLocalStorage(
                    oncoprintTabUrl.concat(
                        '&generic_assay_groups=study_es_0_treatment_ic50,17-AAG'
                    )
                );
                waitForOncoprint();
                openHeatmapMenu();
                selectReactSelectOption(
                    $('.oncoprint__controls__heatmap_menu'),
                    'IC50 values of compounds on cellular phenotype readout'
                );
                // wait for generic assay data loading complete
                $(
                    '.oncoprint__controls__heatmap_menu .generic-assay-selector'
                ).waitForExist();

                $('div[class$="multiValue"]').waitForExist();
                var selectedOptions = $$('div[class$="multiValue"]');
                assert.equal(selectedOptions.length, 1);
                assert.equal(
                    selectedOptions[0].getText(),
                    'Name of 17-AAG (17-AAG): Desc of 17-AAG'
                );
            });

            it('sets `generic_assay_groups` URL parameter', () => {
                openHeatmapMenu();
                selectReactSelectOption(
                    $('.oncoprint__controls__heatmap_menu'),
                    'IC50 values of compounds on cellular phenotype readout'
                );
                // wait for generic assay data loading complete
                $(
                    '.oncoprint__controls__heatmap_menu .generic-assay-selector'
                ).waitForExist();
                $('.oncoprint__controls__heatmap_menu input').setValue(
                    '17-AAG'
                );
                var options = $$('div[class$="option"]');
                options[0].click();
                var indicators = $$('div[class$="indicatorContainer"]');
                // close the dropdown
                indicators[1].click();
                var selectedOptions = $$('div[class$="multiValue"]');
                assert.equal(selectedOptions.length, 1);

                $('button=Add Treatment Responses to Heatmap').click();
                waitForOncoprint();
                var url = browser.url().value;
                var regex = /generic_assay_groups=study_es_0_treatment_ic50%2C17-AAG/;
                assert(url.match(regex));
            });
        });

        describe('plots tab', () => {
            beforeEach(() => {
                goToUrlAndSetLocalStorage(plotsTabUrl);
                waitForPlotsTab();
            });

            it('shows treatment option in horizontal data type selection box', () => {
                var select = $('[name=h-profile-type-selector]').$('..');
                assert(reactSelectOption(select, 'Treatment Response'));
            });

            it('shows treatment option in vertical data type selection box', () => {
                var select = $('[name=v-profile-type-selector]').$('..');
                assert(reactSelectOption(select, 'Treatment Response'));
            });

            it('horizontal axis menu shows treatments in profile menu', () => {
                var horzDataSelect = $('[name=h-profile-type-selector]').$(
                    '..'
                );
                selectReactSelectOption(horzDataSelect, 'Treatment Response');

                var horzProfileSelect = $('[name=h-profile-name-selector]').$(
                    '..'
                );
                assert(
                    reactSelectOption(
                        horzProfileSelect,
                        'EC50 values of compounds on cellular phenotype readout'
                    )
                );
                assert(
                    reactSelectOption(
                        horzProfileSelect,
                        'IC50 values of compounds on cellular phenotype readout'
                    )
                );
            });

            it('vertical axis menu shows treatments in profile menu', () => {
                var vertDataSelect = $('[name=v-profile-type-selector]').$(
                    '..'
                );
                selectReactSelectOption(vertDataSelect, 'Treatment Response');

                var vertProfileSelect = $('[name=h-profile-name-selector]').$(
                    '..'
                );
                assert(
                    reactSelectOption(
                        vertProfileSelect,
                        'EC50 values of compounds on cellular phenotype readout'
                    )
                );
                assert(
                    reactSelectOption(
                        vertProfileSelect,
                        'IC50 values of compounds on cellular phenotype readout'
                    )
                );
            });

            it('horizontal axis menu shows treatment entry in entity menu', () => {
                var horzDataSelect = $('[name=h-profile-type-selector]').$(
                    '..'
                );
                selectReactSelectOption(horzDataSelect, 'Treatment Response');

                var horzProfileSelect = $('[name=h-profile-name-selector]').$(
                    '..'
                );
                selectReactSelectOption(
                    horzProfileSelect,
                    'IC50 values of compounds on cellular phenotype readout'
                );

                $('[data-test=generic-assay-info-icon]').waitForExist();
                assert(
                    browser.execute(function() {
                        resultsViewPlotsTab.onHorizontalAxisGenericAssaySelect({
                            value: '17-AAG',
                            label: 'Name of 17-AAG',
                        });
                    })
                );
                assert(
                    browser.execute(function() {
                        resultsViewPlotsTab.onHorizontalAxisGenericAssaySelect({
                            value: 'AEW541',
                            label: 'Name of AEW541',
                        });
                    })
                );
            });

            it('vertical axis menu shows treatment entry in entity menu', () => {
                var vertDataSelect = $('[name=v-profile-type-selector]').$(
                    '..'
                );
                selectReactSelectOption(vertDataSelect, 'Treatment Response');

                var vertProfileSelect = $('[name=v-profile-name-selector]').$(
                    '..'
                );
                selectReactSelectOption(
                    vertProfileSelect,
                    'IC50 values of compounds on cellular phenotype readout'
                );

                $('[data-test=generic-assay-info-icon]').waitForExist();
                assert(
                    browser.execute(function() {
                        resultsViewPlotsTab.onVerticalAxisGenericAssaySelect({
                            value: '17-AAG',
                            label: 'Name of 17-AAG',
                        });
                    })
                );
                assert(
                    browser.execute(function() {
                        resultsViewPlotsTab.onVerticalAxisGenericAssaySelect({
                            value: 'AEW541',
                            label: 'Name of AEW541',
                        });
                    })
                );
            });

            it('has Ordered samples entry in vert. menu when treatment selected on horz. axis', () => {
                var vertDataSelect = $('[name=v-profile-type-selector]').$(
                    '..'
                );
                selectReactSelectOption(vertDataSelect, 'Treatment Response');

                var vertProfileSelect = $('[name=v-profile-name-selector]').$(
                    '..'
                );
                selectReactSelectOption(
                    vertProfileSelect,
                    'IC50 values of compounds on cellular phenotype readout'
                );

                $('[data-test=generic-assay-info-icon]').waitForExist();
                assert(
                    browser.execute(function() {
                        resultsViewPlotsTab.onVerticalAxisGenericAssaySelect({
                            value: 'AEW541',
                            label: 'Name of AEW541',
                        });
                    })
                );

                var horzDataSelect = $('[name=h-profile-type-selector]').$(
                    '..'
                );
                assert(reactSelectOption(horzDataSelect, 'Ordered samples'));
            });

            it('has `Ordered samples` entry in horz. menu when treatment selected on vert. axis', () => {
                var horzDataSelect = $('[name=h-profile-type-selector]').$(
                    '..'
                );
                selectReactSelectOption(horzDataSelect, 'Treatment Response');

                var horzProfileSelect = $('[name=h-profile-name-selector]').$(
                    '..'
                );
                selectReactSelectOption(
                    horzProfileSelect,
                    'IC50 values of compounds on cellular phenotype readout'
                );

                $('[data-test=generic-assay-info-icon]').waitForExist();
                assert(
                    browser.execute(function() {
                        resultsViewPlotsTab.onHorizontalAxisGenericAssaySelect({
                            value: 'AEW541',
                            label: 'Name of AEW541',
                        });
                    })
                );

                var vertDataSelect = $('[name=v-profile-type-selector]').$(
                    '..'
                );
                assert(reactSelectOption(vertDataSelect, 'Ordered samples'));
            });

            it('shows `Log Scale` checkbox when treatment selected on vert. axis', () => {
                var horzDataSelect = $('[name=h-profile-type-selector]').$(
                    '..'
                );
                selectReactSelectOption(horzDataSelect, 'Treatment Response');
                assert($('[data-test=HorizontalLogCheckbox]'));
            });

            it('shows `Log Scale` checkbox when treatment selected on horz. axis', () => {
                var vertDataSelect = $('[name=v-profile-type-selector]').$(
                    '..'
                );
                selectReactSelectOption(vertDataSelect, 'Treatment Response');
                assert($('[data-test=VerticalLogCheckbox]'));
            });

            it('shows checkbox for limit values (e.g., >8.00) checkbox when such profile selected on horz. axis', () => {
                var horzDataSelect = $('[name=h-profile-type-selector]').$(
                    '..'
                );
                selectReactSelectOption(horzDataSelect, 'Treatment Response');

                var horzProfileSelect = $('[name=h-profile-name-selector]').$(
                    '..'
                );
                selectReactSelectOption(
                    horzProfileSelect,
                    'EC50 values of compounds on cellular phenotype readout'
                );

                $('[data-test=generic-assay-info-icon]').waitForExist();
                assert(
                    browser.execute(function() {
                        resultsViewPlotsTab.onHorizontalAxisGenericAssaySelect({
                            value: 'AEW541',
                            label: 'Name of AEW541',
                        });
                    })
                );

                assert($('[data-test=ViewLimitValues]').isVisible());
            });

            it('shows checkbox for limit values (e.g., >8.00) checkbox when such profile selected on vert. axis', () => {
                var vertDataSelect = $('[name=v-profile-type-selector]').$(
                    '..'
                );
                selectReactSelectOption(vertDataSelect, 'Treatment Response');

                var vertProfileSelect = $('[name=v-profile-name-selector]').$(
                    '..'
                );
                selectReactSelectOption(
                    vertProfileSelect,
                    'EC50 values of compounds on cellular phenotype readout'
                );

                $('[data-test=generic-assay-info-icon]').waitForExist();
                assert(
                    browser.execute(function() {
                        resultsViewPlotsTab.onVerticalAxisGenericAssaySelect({
                            value: 'AEW541',
                            label: 'Name of AEW541',
                        });
                    })
                );

                assert($('[data-test=ViewLimitValues]').isVisible());
            });

            it('shows hint for handling of threshold values for treatment data in scatter plot', () => {
                assert($('label=Value >8.00 Labels **'));
                assert($('div*=** '));
            });

            it('shows gene selection box in utilities menu for waterfall plot', () => {
                selectTreamentsBothAxes();

                var horzDataSelect = $('[name=h-profile-type-selector]').$(
                    '..'
                );
                selectReactSelectOption(horzDataSelect, 'Ordered samples');
                assert($('.gene-select-container'));
                assert($('.gene-select-container'));
            });

            it('shows selected genes in gene selection box in utilities menu for waterfall plot', () => {
                selectTreamentsBothAxes();

                var horzDataSelect = $('[name=h-profile-type-selector]').$(
                    '..'
                );
                selectReactSelectOption(horzDataSelect, 'Ordered samples');

                $('.gene-select-container').waitForExist();
                var geneSelect = $('.gene-select-container');

                geneSelect.click();

                assert.equal(
                    $('#react-select-12-option-1-0').getText(),
                    'CDKN2A'
                );
                assert.equal(
                    $('#react-select-12-option-1-1').getText(),
                    'MDM2'
                );
                assert.equal(
                    $('#react-select-12-option-1-2').getText(),
                    'MDM4'
                );
                assert.equal(
                    $('#react-select-12-option-1-3').getText(),
                    'TP53'
                );
            });

            it('shows sort order button for waterfall plot when `Ordered samples` selected', () => {
                selectTreamentsBothAxes();
                var horzDataSelect = $('[name=h-profile-type-selector]').$(
                    '..'
                );
                selectReactSelectOption(horzDataSelect, 'Ordered samples');
                assert($('[data-test=changeSortOrderButton'));
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
    selectReactSelectOption(
        horzProfileSelect,
        'IC50 values of compounds on cellular phenotype readout'
    );

    var vertDataSelect = $('[name=v-profile-type-selector]').$('..');
    selectReactSelectOption(vertDataSelect, 'Treatment Response');
    var vertProfileSelect = $('[name=v-profile-name-selector]').$('..');
    selectReactSelectOption(
        vertProfileSelect,
        'IC50 values of compounds on cellular phenotype readout'
    );

    $('[data-test=generic-assay-info-icon]').waitForExist();
    browser.execute(function() {
        resultsViewPlotsTab.onHorizontalAxisGenericAssaySelect({
            value: 'AEW541',
            label: 'Name of AEW541',
        });
    });

    browser.execute(function() {
        resultsViewPlotsTab.onVerticalAxisGenericAssaySelect({
            value: 'AEW541',
            label: 'Name of AEW541',
        });
    });

    if (!$('[data-test=ViewLimitValues]').isSelected()) {
        $('[data-test=ViewLimitValues]').click();
    }

    if ($('[data-test=HorizontalLogCheckbox]').isSelected()) {
        $('[data-test=HorizontalLogCheckbox]').click();
    }

    if ($('[data-test=VerticalLogCheckbox]').isSelected()) {
        $('[data-test=VerticalLogCheckbox]').click();
    }
};

module.exports = {
    oncoprintTabUrl: oncoprintTabUrl,
    openHeatmapMenu: openHeatmapMenu,
    queryPageUrl: CBIOPORTAL_URL,
    plotsTabUrl: plotsTabUrl,
    selectTreamentsBothAxes: selectTreamentsBothAxes,
};
