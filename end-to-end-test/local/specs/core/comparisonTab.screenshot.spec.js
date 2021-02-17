var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('../../../shared/specUtils')
    .waitForNetworkQuiet;
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
var setInputText = require('../../../shared/specUtils').setInputText;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('results view comparison tab screenshot tests', function() {
    describe('general screenshot tests', function() {
        before(function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=lgg_ucsf_2014_test_generic_assay_mutations&cancer_study_list=lgg_ucsf_2014_test_generic_assay&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=lgg_ucsf_2014_test_generic_assay_sequenced&gene_list=TOPAZ1%2520ANK1%2520ACAN%2520INTS4&geneset_list=%20&tab_index=tab_visualize&Action=Submit&comparison_subtab=alterations&comparison_selectedGroups=%5B"TOPAZ1"%2C"ANK1"%2C"ACAN"%2C"INTS4"%5D`,
                true
            );
            $('[data-test=GroupComparisonAlterationEnrichments]').waitForExist(
                20000
            );
        });

        it('results view comparison tab alteration enrichments several groups', function() {
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('results view comparison tab alteration enrichments patient mode', function() {
            browser.execute(function() {
                comparisonTab.store.setUsePatientLevelEnrichments(true);
            });
            $('[data-test=GroupComparisonAlterationEnrichments]').waitForExist(
                20000
            );
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('results view comparison tab alteration enrichments 2 genes with highest frequency in any group', function() {
            browser.execute(function() {
                comparisonTab.store.setUsePatientLevelEnrichments(false);
            });
            openGeneSelectorMenu();
            $('input[data-test=numberOfGenes]').setValue('2\n');
            browser.waitForEnabled('[data-test="addGenestoBarPlot"]', 30000);
            browser.click('[data-test="addGenestoBarPlot"]');
            browser.waitForExist('div[data-test="GeneBarPlotDiv"]', 30000);
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('div[data-test="GeneBarPlotDiv"]', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('results view comparison tab alteration enrichments gene box highest average frequency', function() {
            openGeneSelectorMenu();
            browser.execute(function() {
                genesSelection.onGeneListOptionChange({
                    label: 'Genes with highest average frequency',
                });
            });
            waitForNetworkQuiet();
            browser.waitForEnabled('[data-test="addGenestoBarPlot"]', 30000);
            browser.click('[data-test="addGenestoBarPlot"]');
            browser.waitForExist('div[data-test="GeneBarPlotDiv"]', 30000);
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('div[data-test="GeneBarPlotDiv"]', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('results view comparison tab alteration enrichments gene box most significant pValues', function() {
            openGeneSelectorMenu();
            browser.execute(function() {
                genesSelection.onGeneListOptionChange({
                    label: 'Genes with most significant p-value',
                });
            });
            waitForNetworkQuiet();
            browser.waitForEnabled('[data-test="addGenestoBarPlot"]', 30000);
            browser.click('[data-test="addGenestoBarPlot"]');
            browser.waitForExist('div[data-test="GeneBarPlotDiv"]', 30000);
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('div[data-test="GeneBarPlotDiv"]', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('results view comparison tab alteration enrichments gene box user-defined genes', function() {
            openGeneSelectorMenu();
            setInputText('textarea[data-test="geneSet"]', 'TP53');
            waitForNetworkQuiet();
            browser.waitForEnabled('[data-test="addGenestoBarPlot"]', 30000);
            browser.click('[data-test="addGenestoBarPlot"]');
            browser.waitForExist('div[data-test="GeneBarPlotDiv"]', 30000);
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('div[data-test="GeneBarPlotDiv"]', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('results view comparison tab alteration enrichments two groups', function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=lgg_ucsf_2014_test_generic_assay_mutations&cancer_study_list=lgg_ucsf_2014_test_generic_assay&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=lgg_ucsf_2014_test_generic_assay_sequenced&gene_list=TOPAZ1%2520ANK1%2520ACAN%2520INTS4&geneset_list=%20&tab_index=tab_visualize&Action=Submit&comparison_subtab=alterations&comparison_selectedGroups=%5B"ACAN"%2C"INTS4"%5D`,
                true
            );
            $('[data-test=GroupComparisonAlterationEnrichments]').waitForExist(
                20000
            );
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
    browser.pause(3);
}
