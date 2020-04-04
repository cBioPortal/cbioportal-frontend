var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('../../../shared/specUtils')
    .waitForNetworkQuiet;
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
var setInputText = require('../../../shared/specUtils').setInputText;
var checkElementWithTemporaryClass = require('../../../shared/specUtils')
    .checkElementWithTemporaryClass;
var checkElementWithMouseDisabled = require('../../../shared/specUtils')
    .checkElementWithMouseDisabled;
var setDropdownOpen = require('../../../shared/specUtils').setDropdownOpen;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

function selectClinicalTabPlotType(type) {
    setDropdownOpen(
        true,
        '[data-test="plotTypeSelector"] .Select-arrow-zone',
        '[data-test="plotTypeSelector"] .Select-menu',
        "Couldn't open clinical tab chart type dropdown"
    );
    browser.click(
        `[data-test="plotTypeSelector"] .Select-option[aria-label="${type}"]`
    );
}

describe('results view comparison tab screenshot tests', function() {
    describe('general screenshot tests', function() {
        before(function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Altered%20group"%2C"Unaltered%20group"%2C"KRAS"%2C"NRAS"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
            );
            browser.waitForVisible(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                20000
            );
        });
        it('results view comparison tab overlap tab upset plot view', function() {
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab survival tab exclude overlapping samples', () => {
            assert(
                browser.isVisible('.comparisonTabSubTabs a.tabAnchor_survival')
            );
            browser.click('.comparisonTabSubTabs a.tabAnchor_survival');
            browser.waitForVisible(
                'div[data-test="ComparisonPageSurvivalTabDiv"]',
                60000
            );
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement(
                'div[data-test="ComparisonPageSurvivalTabDiv"]',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab survival tab include overlapping samples', function() {
            browser.execute(function() {
                comparisonTab.store.updateOverlapStrategy('Include');
            });
            browser.waitForExist(
                'div[data-test="ComparisonPageSurvivalTabDiv"]',
                60000
            );
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement(
                'div[data-test="ComparisonPageSurvivalTabDiv"]',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab include overlapping samples Kruskal Wallis test', function() {
            assert(
                browser.isVisible('.comparisonTabSubTabs a.tabAnchor_clinical')
            );
            browser.click('.comparisonTabSubTabs a.tabAnchor_clinical');
            browser.waitForVisible(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]',
                20000
            );
            browser.waitForVisible(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="LazyMobXTable"] span[data-test="Mutation Count"]'
            );
            browser.click(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="LazyMobXTable"] span[data-test="Mutation Count"]'
            );
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab swaped axes Kruskal Wallis test', function() {
            browser.click(
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="SwapAxes"]'
            );
            browser.waitForVisible(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]',
                20000
            );
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab log scale  Kruskal Wallis test', function() {
            browser.click(
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="logScale"]'
            );
            browser.waitForVisible(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]',
                20000
            );
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab percentage stacked bar chart exclude overlapping samples Chi squared test', function() {
            browser.execute(function() {
                comparisonTab.store.updateOverlapStrategy('Exclude');
            });
            browser.waitForVisible(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]',
                20000
            );
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab bar chart Chi squared test', function() {
            selectClinicalTabPlotType('Bar chart');
            browser.waitForVisible(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]',
                20000
            );
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab stacked bar chart Chi squared test', function() {
            selectClinicalTabPlotType('Stacked bar chart');
            browser.waitForVisible(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]',
                20000
            );
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab stacked bar chart swaped axes Chi squared test', function() {
            browser.click(
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="SwapAxes"]'
            );
            browser.waitForVisible(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]',
                20000
            );
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab stacked bar chart horizontal bars Chi squared test', function() {
            browser.click(
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="SwapAxes"]'
            );
            browser.click(
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="HorizontalBars"]'
            );
            browser.waitForVisible(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]',
                20000
            );
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab mutation enrichments tab several groups', function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"KRAS"%2C"NRAS"%2C"BRAF"%5D&comparison_subtab=mutations&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
            );
            browser.waitForVisible(
                'div[data-test="GroupComparisonMutationEnrichments"]',
                10000
            );
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('results view comparison tab mutation enrichments tab patient mode', function() {
            browser.execute(function() {
                comparisonTab.store.setUsePatientLevelEnrichments(true);
            });
            browser.waitForVisible(
                'div[data-test="GroupComparisonMutationEnrichments"]',
                10000
            );
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('results view comparison tab mutation enrichments tab 20 genes with highest frequency in any group', function() {
            browser.execute(function() {
                comparisonTab.store.setUsePatientLevelEnrichments(false);
            });
            browser.waitForVisible(
                'div[data-test="GroupComparisonMutationEnrichments"]',
                10000
            );
            browser.click('[data-test="selectGenes"]');
            var input = $('input[data-test=numberOfGenes]');
            input.setValue('20\n');
            browser.waitForEnabled('[data-test="addGenestoBarPlot"]', 10000);
            browser.click('[data-test="addGenestoBarPlot"]');
            browser.waitForVisible('div[data-test="GeneBarPlotDiv"]', 10000);
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('div[data-test="GeneBarPlotDiv"]', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('results view comparison tab mutation enrichments tab gene box highest average frequency', function() {
            browser.click('[data-test="selectGenes"]');
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

        it('results view comparison tab mutation enrichments tab gene box most significant pValues', function() {
            browser.click('[data-test="selectGenes"]');
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

        it('results view comparison tab mutation enrichments tab gene box user-defined genes', function() {
            browser.click('[data-test="selectGenes"]');
            setInputText(
                'textarea[data-test="geneSet"]',
                'MUC16 MUC4 ERCC2 TP53 ZNRF3 CTNNB1'
            );
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

        it('results view comparison tab cna enrichments tab several groups', function() {
            browser.click('.comparisonTabSubTabs .tabAnchor_cna');
            browser.waitForVisible(
                'div[data-test="GroupComparisonCopyNumberEnrichments"]',
                10000
            );
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('results view comparison tab mrna enrichments tab several groups', function() {
            browser.click('.comparisonTabSubTabs .tabAnchor_mrna');
            browser.waitForVisible(
                'div[data-test="GroupComparisonMRNAEnrichments"]',
                10000
            );
            browser.waitForVisible('b=TYMP', 10000);
            browser.click('b=TYMP');
            browser.waitForVisible('div[data-test="MiniBoxPlot"]', 20000);
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('results view comparison tab mutation enrichments tab two groups', function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Altered%20group"%2C"Unaltered%20group"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&comparison_subtab=mutations`
            );
            browser.waitForVisible(
                'div[data-test="GroupComparisonMutationEnrichments"]',
                10000
            );
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('results view comparison tab cna enrichments tab two groups', function() {
            browser.click('.comparisonTabSubTabs .tabAnchor_cna');
            browser.waitForVisible(
                'div[data-test="GroupComparisonCopyNumberEnrichments"]',
                30000
            );
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('results view comparison tab cna enrichments tab patient mode', function() {
            browser.execute(function() {
                comparisonTab.store.setUsePatientLevelEnrichments(true);
            });
            browser.waitForVisible(
                'div[data-test="GroupComparisonCopyNumberEnrichments"]',
                30000
            );
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('results view comparison tab mrna enrichments tab two groups', function() {
            browser.click('.comparisonTabSubTabs .tabAnchor_mrna');
            browser.waitForVisible(
                'div[data-test="GroupComparisonMRNAEnrichments"]',
                10000
            );
            browser.waitForVisible('b=MERTK', 10000);
            browser.click('b=MERTK');
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('results view comparison tab protein enrichments tab several groups', function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=blca_tcga_pub_2017&case_set_id=blca_tcga_pub_2017_all&comparison_selectedGroups=%5B"KRAS"%2C"NRAS"%2C"BRAF"%5D&comparison_subtab=protein&data_priority=0&gene_list=KRAS%2520NRAS%2520BRAF&gene_set_choice=user-defined-list&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=blca_tcga_pub_2017_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=blca_tcga_pub_2017_rna_seq_v2_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=blca_tcga_pub_2017_mutations&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=blca_tcga_pub_2017_rppa_Zscores&profileFilter=0&tab_index=tab_visualize`
            );
            browser.waitForVisible(
                'div[data-test="GroupComparisonProteinEnrichments"]',
                10000
            );
            browser.waitForVisible('b=SCD', 10000);
            browser.click('b=SCD');
            browser.waitForVisible('div[data-test="MiniBoxPlot"]', 20000);
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('results view comparison tab protein enrichments tab two groups', function() {
            // deselect a group
            browser.click('button[data-test="groupSelectorButtonBRAF"]');

            browser.waitForVisible(
                'div[data-test="GroupComparisonProteinEnrichments"]',
                10000
            );
            browser.waitForVisible('b=FASN', 10000);
            browser.click('b=FASN');
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });
    });

    describe('delete group from session', function() {
        before(function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Altered%20group"%2C"Unaltered%20group"%2C"KRAS"%2C"NRAS"%5D&comparison_subtab=overlap&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&comparison_createdGroupsSessionId=5e74f264e4b0ff7ef5fdb27f`
            );
            browser.waitForVisible(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                20000
            );
        });
        it('results view comparison tab delete group from session', function() {
            browser.click(
                'button[data-test="groupSelectorButtontest"] [data-test="deleteButton"]'
            );
            var res = checkElementWithMouseDisabled('div.mainContainer');
            assertScreenShotMatch(res);
        });
    });

    describe('overlap venn diagram', function() {
        describe('disjoint diagram', function() {
            before(function() {
                goToUrlAndSetLocalStorage(
                    `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
                );
                browser.waitForVisible(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    20000
                );
            });

            it('results view comparison tab overlap tab disjoint venn diagram view', function() {
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });

            it('results view comparison tab overlap tab disjoint venn diagram view with a group selected view', function() {
                browser.waitForVisible('svg#comparison-tab-overlap-svg', 6000);
                browser.leftClick('text[data-test="sample0VennLabel"]');
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab overlap tab 3 disjoint venn diagram', function() {
                goToUrlAndSetLocalStorage(
                    `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Unaltered%20group"%2C"KRAS"%2C"BRAF"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
                );
                browser.waitForVisible(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    20000
                );
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
        });

        describe('venn diagram with overlap', function() {
            before(function() {
                goToUrlAndSetLocalStorage(
                    `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"KRAS"%2C"NRAS"%2C"Altered%20group"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
                );
                browser.waitForVisible(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    20000
                );
            });

            it('results view comparison tab overlap tab venn diagram with overlap view', function() {
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });

            it('results view comparison tab overlap tab venn diagram view with overlap and session selected view', function() {
                browser.leftClick('text[data-test="sample0,1,2VennLabel"]');
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });

            it('results view comparison tab overlap tab venn diagram view with overlap deselect active group', function() {
                browser.click('button[data-test="groupSelectorButtonKRAS"]');
                browser.waitForVisible(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    20000
                );
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
        });

        describe('venn diagram with complex overlaps', function() {
            const buttonA =
                'button[data-test="groupSelectorButtonAltered group"]';
            const buttonB =
                'button[data-test="groupSelectorButtonUnaltered group"]';
            const buttonC = 'button[data-test="groupSelectorButtonKRAS"]';
            const buttonD = 'button[data-test="groupSelectorButtonNRAS"]';
            const buttonE = 'button[data-test="groupSelectorButtonBRAF"]';

            before(function() {
                goToUrlAndSetLocalStorage(
                    `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Unaltered%20group"%2C"KRAS"%2C"NRAS"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
                );
                browser.waitForVisible(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    20000
                );
            });
            it('results view comparison tab complex venn BCD', function() {
                browser.waitForVisible(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    20000
                );
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab complex venn CD', function() {
                browser.click(buttonB);
                browser.waitForVisible(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    20000
                );
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab complex venn BC', function() {
                browser.click(buttonB);
                browser.waitForVisible(buttonD);
                browser.click(buttonD);
                browser.waitForVisible(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    20000
                );
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab complex venn ABC', function() {
                browser.click(buttonA);
                browser.waitForVisible(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    20000
                );
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab complex venn AB', function() {
                browser.click(buttonC);
                browser.waitForVisible(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    20000
                );
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab complex venn ABD', function() {
                browser.click(buttonD);
                browser.waitForVisible(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    20000
                );
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab complex venn AD', function() {
                browser.click(buttonB);
                browser.waitForVisible(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    20000
                );
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab complex venn ACD', function() {
                browser.click(buttonC);
                browser.waitForVisible(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    20000
                );
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
        });
    });

    describe('overlap upset diagram group selection', function() {
        before(function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Unaltered%20group"%2C"KRAS"%2C"NRAS"%2C"Altered%20group"%2C"BRAF"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
            );
            browser.waitForVisible(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                20000
            );
        });

        it('results view comparison tab overlap tab upset groups selected', function() {
            browser.leftClick('.sample_Unaltered_group_bar');
            browser.leftClick('.sample_Altered_group_KRAS_bar');
            browser.leftClick('.patient_Altered_group_NRAS_bar');
            var res = checkElementWithTemporaryClass(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                'disablePointerEvents',
                0
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab overlap tab upset deselect active group', function() {
            browser.click('button[data-test="groupSelectorButtonNRAS"]');
            var res = checkElementWithTemporaryClass(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                'disablePointerEvents',
                0
            );
            assertScreenShotMatch(res);
        });
    });
});
