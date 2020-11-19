var goToUrlAndSetLocalStorage = require('../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var assertScreenShotMatch = require('../../shared/lib/testUtils')
    .assertScreenShotMatch;
var waitForStudyQueryPage = require('../../shared/specUtils')
    .waitForStudyQueryPage;
var waitForOncoprint = require('../../shared/specUtils').waitForOncoprint;
var waitForPlotsTab = require('../../shared/specUtils').waitForPlotsTab;
var waitForCoExpressionTab = require('../../shared/specUtils')
    .waitForCoExpressionTab;
var checkTestStudy = require('./gsva.spec').checkTestStudy;
var checkGSVAprofile = require('./gsva.spec').checkGSVAprofile;
var queryPageUrl = require('./gsva.spec').queryPageUrl;
var plotsTabUrl = require('./gsva.spec').plotsTabUrl;
var oncoprintTabUrl = require('./gsva.spec').oncoprintTabUrl;
var coexpressionTabUrl = require('./gsva.spec').coexpressionTabUrl;
var selectReactSelectOption = require('../../shared/specUtils')
    .selectReactSelectOption;
var showGsva = require('../../shared/specUtils').showGsva;

describe('gsva feature', () => {
    describe('GenesetVolcanoPlotSelector', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorage(queryPageUrl);
            showGsva();
            waitForStudyQueryPage(20000);
            checkTestStudy();
            checkGSVAprofile();
            browser.$('button[data-test=GENESET_VOLCANO_BUTTON]').click();
            $('div.modal-dialog').waitForExist();
        });

        it('shows volcano plot for gene sets selection', () => {
            var res = browser.checkElement('div.VictoryContainer');
            assertScreenShotMatch(res);
        });

        it('updates volcano plot after change of `percentile of score calculation`', () => {
            var modal = $('div.modal-body');
            modal.$('.Select-value-label').waitForExist();
            modal.$('.Select-value-label').click();
            modal.$('.Select-option=50%').waitForExist();
            modal.$('.Select-option=50%').click();
            var res = browser.checkElement('div.VictoryContainer');
            assertScreenShotMatch(res);
        });
    });

    describe('oncoprint tab', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorage(oncoprintTabUrl);
            waitForOncoprint(20000);
        });

        it('shows GSVA heatmap track', () => {
            var res = browser.checkElement('div[id=oncoprintDiv]');
            assertScreenShotMatch(res);
        });
    });

    describe('plots tab', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorage(plotsTabUrl);
            waitForPlotsTab(20000);
        });

        it('shows gsva profile data on horizontal and vertical axes', () => {
            var horzDataSelect = $('[name=h-profile-type-selector]').$('..');
            horzDataSelect.$('.Select-arrow-zone').click();
            horzDataSelect.$('.Select-option=Gene Sets').click();

            var vertDataSelect = $('[name=v-profile-type-selector]').$('..');
            vertDataSelect.$('.Select-arrow-zone').click();
            vertDataSelect.$('.Select-option=Gene Sets').click();

            browser.pause(1000);

            var res = browser.checkElement('div[data-test="PlotsTabPlotDiv"]');
            assertScreenShotMatch(res);
        });
    });

    describe('co-expression tab', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorage(coexpressionTabUrl);
            waitForCoExpressionTab(20000);
        });

        it('shows GSVA scores in scatterplot', () => {
            selectReactSelectOption(
                $('.coexpression-select-query-profile'),
                'GSVA scores on oncogenic signatures gene sets (5 samples)'
            );
            $('//*[@id="coexpressionTabGeneTabs"]').waitForExist();
            var res = browser.checkElement('//*[@id="coexpression-plot-svg"]');
            assertScreenShotMatch(res);
        });
    });
});
