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
var goToTreatmentTab = require('./treatment.spec').goToTreatmentTab;
var selectTreamentsBothAxes = require('./treatment.spec')
    .selectTreamentsBothAxes;

const GENERIC_ASSAY_ENTITY_SELECTOR =
    '[data-test="GenericAssayEntitySelection"]';

describe('treatment feature', () => {
    describe('oncoprint tab', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorage(oncoprintTabUrl, true);
            waitForOncoprint();
        });

        it('shows treatment profile heatmap track for treatment', () => {
            goToTreatmentTab();
            $(GENERIC_ASSAY_ENTITY_SELECTOR).click();
            $('[data-test="GenericAssayEntitySelection"] input').setValue(
                '17-AAG'
            );
            var options = $(GENERIC_ASSAY_ENTITY_SELECTOR).$$(
                'div[class$="option"]'
            );
            options[0].click();
            var indicators = $(GENERIC_ASSAY_ENTITY_SELECTOR).$$(
                'div[class$="indicatorContainer"]'
            );
            // close the dropdown
            indicators[0].click();
            var selectedOptions = $(GENERIC_ASSAY_ENTITY_SELECTOR).$$(
                'div[class$="multiValue"]'
            );
            assert.equal(selectedOptions.length, 1);

            $('button=Add Track').click();
            // close add tracks menu
            var addTracksButton = browser.$('button[id=addTracksDropdown]');
            addTracksButton.click();
            waitForOncoprint();
            var res = browser.checkElement('[id=oncoprintDiv]');
            assertScreenShotMatch(res);
        });
    });

    describe('plots tab', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorage(plotsTabUrl, true);
            waitForPlotsTab();
            selectTreamentsBothAxes();
        });

        it('shows `value larger_than_8.00` in figure legend and indicates sub-threshold data points in plot', () => {
            var res = browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });

        it('when option deselected, hides `value larger_than_8.00` in figure legend and sub-threshold data points in plot', () => {
            $('[data-test=ViewLimitValues]').waitForExist(10000);
            $('[data-test=ViewLimitValues]').click();
            var res = browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });

        it('shows waterfall plot when `Ordered samples` option is selected', () => {
            var horzDataSelect = $('[name=h-profile-type-selector]').$('..');
            selectReactSelectOption(horzDataSelect, 'Ordered samples');

            // make sure bars become visible (no mut data is available)
            $('[data-test=ViewCopyNumber]').waitForExist(10000);
            $('[data-test=ViewCopyNumber]').click();

            var res = browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });

        it('when option deselected, hides `value larger_than_8.00` in figure legend and sub-threshold data point indicators in waterfall plot', () => {
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

        it('updates title of watefall plot when selecting a new gene', () => {
            var horzDataSelect = $('[name=h-profile-type-selector]').$('..');
            selectReactSelectOption(horzDataSelect, 'Ordered samples');

            // make sure bars become visible (no mut data is available)
            $('[data-test=ViewCopyNumber]').waitForExist();
            $('[data-test=ViewCopyNumber]').click();

            $('.gene-select').click();

            // select gene menu entries
            var geneMenuEntries = $('[data-test=GeneColoringMenu]')
                .$('div=Genes')
                .$('..')
                .$$('div')[1]
                .$$('div');
            geneMenuEntries[3].click();

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
