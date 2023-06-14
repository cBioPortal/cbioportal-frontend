var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('../../../shared/specUtils')
    .waitForNetworkQuiet;
var openGroupComparison = require('../../../shared/specUtils')
    .openGroupComparison;
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
var setInputText = require('../../../shared/specUtils').setInputText;
var {
    setDropdownOpen,
    selectClinicalTabPlotType,
    getElementByTestHandle,
} = require('../../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const selectGenesDropdownButton = '[data-test="selectGenes"]';

describe('group comparison page screenshot tests', function() {
    describe('Alteration enrichments tab', function() {
        this.retries(0);

        before(function() {
            openGroupComparison(
                `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`,
                'chart-container-ONCOTREE_CODE',
                10000
            );
            $('.tabAnchor_alterations').click();
            $(
                '[data-test="GroupComparisonAlterationEnrichments"]'
            ).waitForExist({ timeout: 20000 });
        });

        it('group comparison page alteration enrichments tab several groups', function() {
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page alteration enrichments tab patient mode', function() {
            browser.execute(function() {
                groupComparisonStore.setUsePatientLevelEnrichments(true);
            });
            $(
                '[data-test="GroupComparisonAlterationEnrichments"]'
            ).waitForExist({ timeout: 20000 });
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page alteration enrichments tab 2 genes with highest frequency in any group', function() {
            browser.execute(function() {
                groupComparisonStore.setUsePatientLevelEnrichments(false);
            });
            openGeneSelectorMenu();
            $('input[data-test=numberOfGenes]').setValue('2\n');
            $('[data-test="addGenestoBarPlot"]').waitForEnabled({
                timeout: 10000,
            });
            $('[data-test="addGenestoBarPlot"]').click();
            $('div[data-test="GeneBarPlotDiv"]').waitForDisplayed({
                timeout: 10000,
            });
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = browser.checkElement(
                'div[data-test="GeneBarPlotDiv"]',
                '',
                {
                    hide: ['.qtip'],
                }
            );
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
            $('[data-test="addGenestoBarPlot"]').waitForEnabled({
                timeout: 10000,
            });
            $('[data-test="addGenestoBarPlot"]').click();
            $('div[data-test="GeneBarPlotDiv"]').waitForDisplayed({
                timeout: 10000,
            });
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = browser.checkElement(
                'div[data-test="GeneBarPlotDiv"]',
                '',
                {
                    hide: ['.qtip'],
                }
            );
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
            $('[data-test="addGenestoBarPlot"]').waitForEnabled({
                timeout: 10000,
            });
            $('[data-test="addGenestoBarPlot"]').click();
            $('div[data-test="GeneBarPlotDiv"]').waitForDisplayed({
                timeout: 10000,
            });
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = browser.checkElement(
                'div[data-test="GeneBarPlotDiv"]',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page alteration enrichments tab gene box user-defined genes', function() {
            openGeneSelectorMenu();
            setInputText('textarea[data-test="geneSet"]', 'TP53');
            waitForNetworkQuiet();
            $('[data-test="addGenestoBarPlot"]').waitForEnabled({
                timeout: 10000,
            });
            $('[data-test="addGenestoBarPlot"]').click();
            $('div[data-test="GeneBarPlotDiv"]').waitForDisplayed({
                timeout: 10000,
            });
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = browser.checkElement(
                'div[data-test="GeneBarPlotDiv"]',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison alteration enrichments two groups', function() {
            // this test will not work on retry because groups will be toggled back on
            this.retries(0);

            getElementByTestHandle('groupSelectorButtonGB').click();
            getElementByTestHandle('groupSelectorButtonOAST').click();
            getElementByTestHandle('groupSelectorButtonODG').click();

            $(
                '[data-test="GroupComparisonAlterationEnrichments"]'
            ).waitForExist({ timeout: 20000 });
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });
    });

    describe('Clinical tab', () => {
        before(function() {
            openGroupComparison(
                `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`,
                'chart-container-ONCOTREE_CODE',
                10000
            );
            $('.tabAnchor_clinical').click();
            $('[data-test="ComparisonPageClinicalTabDiv"]').waitForExist({
                timeout: 20000,
            });
        });

        it('shows box plot for numerical data', () => {
            $('[data-test="Mutation Count"]').click();
            const res = checkClinicalTabPlot();
            assertScreenShotMatch(res);
        });

        it('shows table when selecting table visualisation', () => {
            $('[data-test="Mutation Count"]').click();
            selectClinicalTabNumericalDisplayType('Table');
            const res = checkClinicalTabPlot();
            assertScreenShotMatch(res);
        });

        it('displays 100 percent stacked bar chart for categorical data', () => {
            $('[data-test="Oncotree Code"]').click();
            var res = checkClinicalTabPlot();
            assertScreenShotMatch(res);
        });

        it('displays heatmap when picked from categorical plot type dropdown', () => {
            $('[data-test="Oncotree Code"]').click();
            selectClinicalTabPlotType('Heatmap');

            var res = checkClinicalTabPlot();
            assertScreenShotMatch(res);
        });
    });
});

function openGeneSelectorMenu() {
    setDropdownOpen(
        true,
        '[data-test="selectGenes"]',
        'input[data-test=numberOfGenes]'
    );
}

function checkClinicalTabPlot() {
    return browser.checkElement('div[data-test="ClinicalTabPlotDiv"]', '', {
        hide: ['.qtip'],
    });
}

function selectClinicalTabNumericalDisplayType(type) {
    setDropdownOpen(
        true,
        '[data-test="numericalVisualisationTypeSelector"] .Select-arrow-zone',
        '[data-test="numericalVisualisationTypeSelector"] .Select-menu',
        "Couldn't open clinical tab chart type dropdown"
    );
    $(
        `[data-test="numericalVisualisationTypeSelector"] .Select-option[aria-label="${type}"]`
    ).click();
}

function checkClinicalTabPlot() {
    return browser.checkElement('div[data-test="ClinicalTabPlotDiv"]', '', {
        hide: ['.qtip'],
    });
}
