var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var assertScreenShotMatch = require('../../shared/lib/testUtils')
    .assertScreenShotMatch;
var waitForOncoprint = require('../../shared/specUtils').waitForOncoprint;
var waitForPlotsTab = require('../../shared/specUtils').waitForPlotsTab;
var selectReactSelectOption = require('../../shared/specUtils')
    .selectReactSelectOption;
var oncoprintTabUrl = require('./treatment.spec').oncoprintTabUrl;
var plotsTabUrl = require('./treatment.spec').plotsTabUrl;
var selectReactSelectOption = require('../../shared/specUtils')
    .selectReactSelectOption;
var openHeatmapMenu = require('./treatment.spec').openHeatmapMenu;
var selectTreamentsBothAxes = require('./treatment.spec')
    .selectTreamentsBothAxes;

describe('treatment feature', () => {
    describe('oncoprint tab', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorage(oncoprintTabUrl);
            waitForOncoprint();
        });

        it('shows treatment profile heatmap track for treatment', () => {
            openHeatmapMenu();
            selectReactSelectOption(
                $('.oncoprint__controls__heatmap_menu'),
                'IC50 values of compounds on cellular phenotype readout'
            );
            // wait for generic assay data loading complete
            $(
                '.oncoprint__controls__heatmap_menu .generic-assay-selector'
            ).waitForExist();
            $('.oncoprint__controls__heatmap_menu input').setValue('17-AAG');
            var options = $$('div[class$="option"]');
            options[0].click();
            var indicators = $$('div[class$="indicatorContainer"]');
            // close the dropdown
            indicators[1].click();
            var selectedOptions = $$('div[class$="multiValue"]');
            assert.equal(selectedOptions.length, 1);

            $('button=Add Treatment Responses to Heatmap').click();
            openHeatmapMenu();
            waitForOncoprint();
            var res = browser.checkElement('[id=oncoprintDiv]');
            assertScreenShotMatch(res);
        });
    });

    describe('plots tab', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorage(plotsTabUrl);
            waitForPlotsTab();
            selectTreamentsBothAxes();
        });

        it('shows `value >8.00` in figure legend and indicates sub-threshold data points in plot', () => {
            var res = browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });

        it('when option deselected, hides `value >8.00` in figure legend and sub-threshold data points in plot', () => {
            $('[data-test=ViewLimitValues]').waitForExist();
            $('[data-test=ViewLimitValues]').click();
            var res = browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });

        it('shows waterfall plot when `Ordered samples` option is selected', () => {
            var horzDataSelect = $('[name=h-profile-type-selector]').$('..');
            selectReactSelectOption(horzDataSelect, 'Ordered samples');

            // make sure bars become visible (no mut data is available)
            $('[data-test=ViewCopyNumber]').waitForExist();
            $('[data-test=ViewCopyNumber]').click();

            var res = browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });

        it('when option deselected, hides `value >8.00` in figure legend and sub-threshold data point indicators in waterfall plot', () => {
            var horzDataSelect = $('[name=h-profile-type-selector]').$('..');
            selectReactSelectOption(horzDataSelect, 'Ordered samples');

            // make sure bars become visible (no mut data is available)
            $('[data-test=ViewCopyNumber]').waitForExist();
            $('[data-test=ViewCopyNumber]').click();

            $('[data-test=ViewLimitValues]').click();

            var res = browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });

        it('rotates waterfall plot when swapping axes', () => {
            var horzDataSelect = $('[name=h-profile-type-selector]').$('..');
            selectReactSelectOption(horzDataSelect, 'Ordered samples');

            // make sure bars become visible (no mut data is available)
            $('[data-test=ViewCopyNumber]').waitForExist();
            $('[data-test=ViewCopyNumber]').click();

            $('[data-test=swapHorzVertButton]').click();

            var res = browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });

        it.skip('updates title of watefall plot when selecting a new gene', () => {
            var horzDataSelect = $('[name=h-profile-type-selector]').$('..');
            selectReactSelectOption(horzDataSelect, 'Ordered samples');

            // make sure bars become visible (no mut data is available)
            $('[data-test=ViewCopyNumber]').waitForExist();
            $('[data-test=ViewCopyNumber]').click();

            $('.gene-select').click();

            $('#react-select-13-option-1-3').click();

            var res = browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });

        it('applies log-scale in waterfall plot', () => {
            var horzDataSelect = $('[name=h-profile-type-selector]').$('..');
            selectReactSelectOption(horzDataSelect, 'Ordered samples');

            // make sure bars become visible (no mut data is available)
            $('[data-test=ViewCopyNumber]').waitForExist();
            $('[data-test=ViewCopyNumber]').click();

            $('[data-test=VerticalLogCheckbox]').click();

            var res = browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });

        it('reverses order of waterfall plot data when `Sort order` button pressed', () => {
            var horzDataSelect = $('[name=h-profile-type-selector]').$('..');
            selectReactSelectOption(horzDataSelect, 'Ordered samples');

            // make sure bars become visible (no mut data is available)
            $('[data-test=ViewCopyNumber]').waitForExist();
            $('[data-test=ViewCopyNumber]').click();

            $('[data-test=changeSortOrderButton]').click();

            var res = browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });

        it('shows a search indicator when sample search term is entered', () => {
            var horzDataSelect = $('[name=h-profile-type-selector]').$('..');
            selectReactSelectOption(horzDataSelect, 'Ordered samples');

            // make sure bars become visible (no mut data is available)
            $('[data-test=ViewCopyNumber]').waitForExist();
            $('[data-test=ViewCopyNumber]').click();

            var sampleSearch = $('label=Search Case(s)')
                .$('..')
                .$('input');
            sampleSearch.setValue('TCGA-A2-A04U-01 TCGA-A1-A0SE-01');

            var res = browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });
    });
});
