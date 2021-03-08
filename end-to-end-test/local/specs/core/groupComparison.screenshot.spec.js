var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('../../../shared/specUtils')
    .waitForNetworkQuiet;
var openGroupComparison = require('../../../shared/specUtils')
    .openGroupComparison;
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
var setInputText = require('../../../shared/specUtils').setInputText;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const selectGenesDropdownButton = '[data-test="selectGenes"]';

describe('group comparison page screenshot tests', function() {
    describe('Alteration enrichments tab', function() {
        before(function() {
            openGroupComparison(
                `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`,
                'chart-container-ONCOTREE_CODE',
                5000
            );
            browser.click('.tabAnchor_alterations');
            $(
                '[data-test="GroupComparisonAlterationEnrichments"]'
            ).waitForExist(20000);
        });

        it('group comparison page alteration enrichments tab several groups', function() {
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });
        it('group comparison page alteration enrichments tab patient mode', function() {
            browser.execute(function() {
                groupComparisonStore.setUsePatientLevelEnrichments(true);
            });
            $(
                '[data-test="GroupComparisonAlterationEnrichments"]'
            ).waitForExist(20000);
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('group comparison page alteration enrichments tab 2 genes with highest frequency in any group', function() {
            browser.execute(function() {
                groupComparisonStore.setUsePatientLevelEnrichments(false);
            });
            openGeneSelectorMenu();
            $('input[data-test=numberOfGenes]').setValue('2\n');
            browser.waitForEnabled('[data-test="addGenestoBarPlot"]', 10000);
            browser.click('[data-test="addGenestoBarPlot"]');
            browser.waitForVisible('div[data-test="GeneBarPlotDiv"]', 10000);
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('div[data-test="GeneBarPlotDiv"]', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('group comparison page alteration enrichments tab gene box highest average frequency', function() {
            openGeneSelectorMenu();
            browser.execute(function() {
                genesSelection.onGeneListOptionChange({
                    label: 'Genes with highest average frequency',
                });
            });
            waitForNetworkQuiet();
            browser.waitForEnabled('[data-test="addGenestoBarPlot"]', 10000);
            browser.click('[data-test="addGenestoBarPlot"]');
            browser.waitForVisible('div[data-test="GeneBarPlotDiv"]', 10000);
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('div[data-test="GeneBarPlotDiv"]', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('group comparison page alteration enrichments tab gene box most significant pValues', function() {
            openGeneSelectorMenu();
            browser.execute(function() {
                genesSelection.onGeneListOptionChange({
                    label: 'Genes with most significant p-value',
                });
            });
            waitForNetworkQuiet();
            browser.waitForEnabled('[data-test="addGenestoBarPlot"]', 10000);
            browser.click('[data-test="addGenestoBarPlot"]');
            browser.waitForVisible('div[data-test="GeneBarPlotDiv"]', 10000);
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('div[data-test="GeneBarPlotDiv"]', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('group comparison page alteration enrichments tab gene box user-defined genes', function() {
            openGeneSelectorMenu();
            setInputText('textarea[data-test="geneSet"]', 'TP53');
            waitForNetworkQuiet();
            browser.waitForEnabled('[data-test="addGenestoBarPlot"]', 10000);
            browser.click('[data-test="addGenestoBarPlot"]');
            browser.waitForVisible('div[data-test="GeneBarPlotDiv"]', 10000);
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('div[data-test="GeneBarPlotDiv"]', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('group comparison alteration enrichments two groups', function() {
            goToUrlAndSetLocalStorage(
                `${browser.getUrl()}&unselectedGroups=%5B"GB"%2C"OAST"%2C"ODG"%5D`,
                true
            );
            $(
                '[data-test="GroupComparisonAlterationEnrichments"]'
            ).waitForExist(20000);
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });
    });
});

function openGeneSelectorMenu() {
    const selectGenesDropdownButton = '[data-test="selectGenes"]';
    $(selectGenesDropdownButton).waitForExist(30000);
    browser.click(selectGenesDropdownButton);
    $('input[data-test=numberOfGenes]').waitForExist();
}
