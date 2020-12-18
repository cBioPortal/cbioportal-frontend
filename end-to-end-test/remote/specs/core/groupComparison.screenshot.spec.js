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

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('group comparison page screenshot tests', function() {
    describe('general screenshot tests', function() {
        before(function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison?sessionId=5ce411c7e4b0ab4137874076`
            );
            browser.waitForVisible(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                20000
            );
        });
        it('group comparison page overlap tab upset plot view', function() {
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page survival tab exclude overlapping samples', () => {
            assert(browser.isVisible('a.tabAnchor_survival'));
            browser.click('a.tabAnchor_survival');
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

        it('group comparison page survival tab include overlapping samples', function() {
            browser.execute(function() {
                groupComparisonPage.onOverlapStrategySelect({
                    value: 'Include',
                });
            });
            waitForNetworkQuiet();
            browser.waitForExist(
                'div[data-test="ComparisonPageSurvivalTabDiv"]',
                60000
            );
            browser.moveToObject('body', 0, 0);
            var res = checkElementWithMouseDisabled(
                'div[data-test="ComparisonPageSurvivalTabDiv"]',
                0,
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page clinical tab include overlapping samples Kruskal Wallis test', function() {
            assert(browser.isVisible('a.tabAnchor_clinical'));
            browser.click('a.tabAnchor_clinical');
            waitForNetworkQuiet();
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

        it('group comparison page clinical tab swaped axes Kruskal Wallis test', function() {
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

        it('group comparison page clinical tab log scale  Kruskal Wallis test', function() {
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

        it('group comparison page clinical tab percentage stacked bar chart exclude overlapping samples Chi squared test', function() {
            browser.execute(function() {
                groupComparisonPage.onOverlapStrategySelect({
                    value: 'Exclude',
                });
            });
            waitForNetworkQuiet();
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

        it('group comparison page clinical tab bar chart Chi squared test', function() {
            var plotTypeSelector = $(
                '[data-test="plotTypeSelector"] .Select-input input'
            );
            plotTypeSelector.setValue('Bar chart');
            browser.click('[data-test="plotTypeSelector"] .Select-option');
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

        it('group comparison page clinical tab stacked bar chart Chi squared test', function() {
            var plotTypeSelector = $(
                '[data-test="plotTypeSelector"] .Select-input input'
            );
            plotTypeSelector.setValue('Stacked bar chart');
            browser.click('[data-test="plotTypeSelector"] .Select-option');
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

        it('group comparison page clinical tab stacked bar chart swaped axes Chi squared test', function() {
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

        it('group comparison page clinical tab stacked bar chart horizontal bars Chi squared test', function() {
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

        it.omit(
            'group comparison page mutation enrichments tab several groups',
            function() {
                browser.click('.tabAnchor_alterations');
                browser.waitForVisible(
                    'div[data-test="GroupComparisonAlterationEnrichments"]',
                    10000
                );
                clickTypeSelectorCheckBox('Copy Number Alterations');
                submitEnrichmentRequest();
                browser.moveToObject('body', 0, 0);
                var res = browser.checkElement(
                    '.msk-tab:not(.hiddenByPosition)',
                    {
                        hide: ['.qtip'],
                    }
                );
                assertScreenShotMatch(res);
            }
        );

        it.omit(
            'group comparison page mutation enrichments tab patient mode',
            function() {
                browser.execute(function() {
                    groupComparisonStore.setUsePatientLevelEnrichments(true);
                });
                browser.waitForVisible(
                    'div[data-test="GroupComparisonAlterationEnrichments"]',
                    10000
                );
                browser.moveToObject('body', 0, 0);
                var res = browser.checkElement(
                    '.msk-tab:not(.hiddenByPosition)',
                    {
                        hide: ['.qtip'],
                    }
                );
                assertScreenShotMatch(res);
            }
        );

        it.omit(
            'group comparison page mutation enrichments tab 20 genes with highest frequency in any group',
            function() {
                browser.execute(function() {
                    groupComparisonStore.setUsePatientLevelEnrichments(false);
                });
                browser.waitForVisible(
                    'div[data-test="GroupComparisonAlterationEnrichments"]',
                    10000
                );
                browser.click('[data-test="selectGenes"]');
                var input = $('input[data-test=numberOfGenes]');
                input.setValue('20\n');
                browser.waitForEnabled(
                    '[data-test="addGenestoBarPlot"]',
                    10000
                );
                browser.click('[data-test="addGenestoBarPlot"]');
                browser.waitForVisible(
                    'div[data-test="GeneBarPlotDiv"]',
                    10000
                );
                browser.moveToObject('body', 0, 0);
                var res = browser.checkElement(
                    'div[data-test="GeneBarPlotDiv"]',
                    {
                        hide: ['.qtip'],
                    }
                );
                assertScreenShotMatch(res);
            }
        );

        it.omit(
            'group comparison page mutation enrichments tab gene box highest average frequency',
            function() {
                browser.click('[data-test="selectGenes"]');
                browser.execute(function() {
                    genesSelection.onGeneListOptionChange({
                        label: 'Genes with highest average frequency',
                    });
                });
                waitForNetworkQuiet();
                browser.waitForEnabled(
                    '[data-test="addGenestoBarPlot"]',
                    10000
                );
                browser.click('[data-test="addGenestoBarPlot"]');
                browser.waitForVisible(
                    'div[data-test="GeneBarPlotDiv"]',
                    10000
                );
                browser.moveToObject('body', 0, 0);
                var res = browser.checkElement(
                    'div[data-test="GeneBarPlotDiv"]',
                    {
                        hide: ['.qtip'],
                    }
                );
                assertScreenShotMatch(res);
            }
        );

        it.omit(
            'group comparison page mutation enrichments tab gene box most significant pValues',
            function() {
                browser.click('[data-test="selectGenes"]');
                browser.execute(function() {
                    genesSelection.onGeneListOptionChange({
                        label: 'Genes with most significant p-value',
                    });
                });
                waitForNetworkQuiet();
                browser.waitForEnabled(
                    '[data-test="addGenestoBarPlot"]',
                    10000
                );
                browser.click('[data-test="addGenestoBarPlot"]');
                browser.waitForVisible(
                    'div[data-test="GeneBarPlotDiv"]',
                    10000
                );
                browser.moveToObject('body', 0, 0);
                var res = browser.checkElement(
                    'div[data-test="GeneBarPlotDiv"]',
                    {
                        hide: ['.qtip'],
                    }
                );
                assertScreenShotMatch(res);
            }
        );

        it.omit(
            'group comparison page mutation enrichments tab gene box user-defined genes',
            function() {
                browser.click('[data-test="selectGenes"]');
                setInputText(
                    'textarea[data-test="geneSet"]',
                    'MUC16 MUC4 ERCC2 TP53 ZNRF3 CTNNB1'
                );
                waitForNetworkQuiet();
                browser.waitForEnabled(
                    '[data-test="addGenestoBarPlot"]',
                    10000
                );
                browser.click('[data-test="addGenestoBarPlot"]');
                browser.waitForVisible(
                    'div[data-test="GeneBarPlotDiv"]',
                    10000
                );
                browser.moveToObject('body', 0, 0);
                var res = browser.checkElement(
                    'div[data-test="GeneBarPlotDiv"]',
                    {
                        hide: ['.qtip'],
                    }
                );
                assertScreenShotMatch(res);
            }
        );

        it.omit(
            'group comparison page cna enrichments tab several groups',
            function() {
                clickTypeSelectorCheckBox('Mutations');
                clickTypeSelectorCheckBox('Copy Number Alterations');
                submitEnrichmentRequest();
                browser.moveToObject('body', 0, 0);
                var res = browser.checkElement(
                    '.msk-tab:not(.hiddenByPosition)',
                    {
                        hide: ['.qtip'],
                    }
                );
                assertScreenShotMatch(res);
            }
        );

        it('group comparison page mrna enrichments tab several groups', function() {
            browser.click('.tabAnchor_mrna');
            browser.waitForVisible(
                'div[data-test="GroupComparisonMRNAEnrichments"]',
                10000
            );
            browser.waitForVisible('b=BTN3A3', 10000);
            browser.click('b=BTN3A3');
            browser.waitForVisible('div[data-test="MiniBoxPlot"]', 20000);
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('group comparison page protein enrichments tab several groups', function() {
            browser.click('.tabAnchor_protein');
            browser.waitForVisible(
                'div[data-test="GroupComparisonProteinEnrichments"]',
                10000
            );
            browser.waitForVisible('b=TUBA1B', 10000);
            browser.click('b=TUBA1B');
            browser.waitForVisible('div[data-test="MiniBoxPlot"]', 20000);
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('group comparison page methylation enrichments tab several groups', function() {
            browser.click('.tabAnchor_dna_methylation');
            browser.waitForVisible(
                'div[data-test="GroupComparisonMethylationEnrichments"]',
                10000
            );
            browser.waitForVisible('b=MTRF1L', 10000);
            browser.click('b=MTRF1L');
            browser.waitForVisible('div[data-test="MiniBoxPlot"]', 20000);
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('group comparison page mutation enrichments tab two groups', function() {
            // deselect two groups
            browser.click('button[data-test="groupSelectorButtonGARS mutant"]');
            browser.waitForExist(
                'button[data-test="groupSelectorButtonZNF517 mutant"]',
                10000
            );
            browser.click(
                'button[data-test="groupSelectorButtonZNF517 mutant"]'
            );
            // go back to mutations tab
            browser.waitForExist('.tabAnchor_alterations', 10000);
            browser.click('.tabAnchor_alterations');
            browser.waitForVisible(
                'div[data-test="GroupComparisonAlterationEnrichments"]',
                10000
            );
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('group comparison page cna enrichments tab two groups', function() {
            browser.click('.tabAnchor_alterations');
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

        it('group comparison page cna enrichments tab patient mode', function() {
            browser.execute(function() {
                groupComparisonStore.setUsePatientLevelEnrichments(true);
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

        it('group comparison page mrna enrichments tab two groups', function() {
            browser.click('.tabAnchor_mrna');
            browser.waitForVisible(
                'div[data-test="GroupComparisonMRNAEnrichments"]',
                10000
            );
            browser.waitForVisible('b=RBMX2', 10000);
            browser.click('b=RBMX2');
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('group comparison page protein enrichments tab two groups', function() {
            browser.click('.tabAnchor_protein');
            browser.waitForVisible(
                'div[data-test="GroupComparisonProteinEnrichments"]',
                10000
            );
            browser.waitForVisible('b=ETS1', 10000);
            browser.click('b=ETS1');
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('group comparison page methylation enrichments tab two groups', function() {
            browser.click('.tabAnchor_dna_methylation');
            browser.waitForVisible(
                'div[data-test="GroupComparisonMethylationEnrichments"]',
                10000
            );
            browser.waitForVisible('b=BET1', 10000);
            browser.click('b=BET1');
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('group comparison page microbiome signature tab several groups', function() {
            // use study blca_tcga_pan_can_atlas_2018 for microbiome signature tests
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison/generic_assay_microbiome_signature?sessionId=5d63f222e4b0d777deb05c78&unselectedGroups=%5B%22NA%22%5D`
            );
            browser.waitForVisible(
                'div[data-test="GroupComparisonGenericAssayEnrichments"]',
                10000
            );
            browser.waitForVisible(
                'div[data-test="GroupComparisonGenericAssayEnrichments"]',
                10000
            );
            browser.waitForVisible('b=Collimonas', 10000);
            browser.click('b=Collimonas');
            browser.waitForVisible('div[data-test="MiniBoxPlot"]', 20000);
            browser.moveToObject('body', 0, 0);
            var res = browser.checkElement('.msk-tab:not(.hiddenByPosition)', {
                hide: ['.qtip'],
            });
            assertScreenShotMatch(res);
        });

        it('group comparison page microbiome signature tab two groups', function() {
            // use study blca_tcga_pan_can_atlas_2018 for microbiome signature tests
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison/generic_assay_microbiome_signature?sessionId=5d63f222e4b0d777deb05c78&unselectedGroups=%5B%22NA%22%2C%22White%22%5D`
            );
            browser.waitForVisible(
                'div[data-test="GroupComparisonGenericAssayEnrichments"]',
                10000
            );
            browser.waitForVisible('b=Lawsonia', 10000);
            browser.click('b=Lawsonia');
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
                `${CBIOPORTAL_URL}/comparison?sessionId=5ce411c7e4b0ab4137874076`
            );
            browser.waitForVisible(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                20000
            );
        });
        it('group comparison page delete group from session', function() {
            browser.click(
                'button[data-test="groupSelectorButtonGARS mutant"] [data-test="deleteButton"]'
            );
            var res = checkElementWithMouseDisabled('div.mainContainer');
            assertScreenShotMatch(res);
        });
    });

    describe('overlap venn diagram', function() {
        describe('disjoint diagram', function() {
            before(function() {
                goToUrlAndSetLocalStorage(
                    `${CBIOPORTAL_URL}/comparison?sessionId=5cf8b1b3e4b0ab413787436f`
                );
                browser.waitForVisible(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    20000
                );
            });

            it('group comparison page overlap tab disjoint venn diagram view', function() {
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });

            it('group comparison page overlap tab disjoint venn diagram view with a group selected view', function() {
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
            it('group comparison page overlap tab 3 disjoint venn diagram', function() {
                goToUrlAndSetLocalStorage(
                    `${CBIOPORTAL_URL}/comparison?sessionId=5d28f03be4b0ab413787b1ef`
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
                    `${CBIOPORTAL_URL}/comparison/overlap?sessionId=5cf6bcf0e4b0ab413787430c`
                );
                browser.waitForVisible(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    20000
                );
            });

            it('group comparison page overlap tab venn diagram with overlap view', function() {
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });

            it('group comparison page overlap tab venn diagram view with overlap and session selected view', function() {
                browser.leftClick('text[data-test="sample0,1,2VennLabel"]');
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });

            it('group comparison page overlap tab venn diagram view with overlap deselect active group', function() {
                browser.click(
                    'button[data-test="groupSelectorButtonZFPM1 mutant"]'
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

        describe('venn diagram with complex overlaps', function() {
            const buttonA = 'button[data-test="groupSelectorButtonAll Cases"]';
            const buttonB = 'button[data-test="groupSelectorButtonMetastasis"]';
            const buttonC =
                'button[data-test="groupSelectorButtonoverlapping patients"]';
            const buttonD = 'button[data-test="groupSelectorButtonPrimary"]';

            before(function() {
                goToUrlAndSetLocalStorage(
                    `${CBIOPORTAL_URL}/comparison/overlap?sessionId=5d1bc517e4b0ab413787924a`
                );
                browser.waitForVisible(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    20000
                );
            });
            it('group comparison complex venn BCD', function() {
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
            it('group comparison complex venn CD', function() {
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
            it('group comparison complex venn BC', function() {
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
            it('group comparison complex venn ABC', function() {
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
            it('group comparison complex venn AB', function() {
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
            it('group comparison complex venn ABD', function() {
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
            it('group comparison complex venn AD', function() {
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
            it('group comparison complex venn ACD', function() {
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
                `${CBIOPORTAL_URL}/comparison?sessionId=5d0bc0c5e4b0ab4137876bc3`
            );
            browser.waitForVisible(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                20000
            );
        });

        it('group comparison page overlap tab upset groups selected', function() {
            browser.leftClick('.sample_testGroup5_bar');
            browser.leftClick('.sample_testGroup1_testGroup2_bar');
            browser.leftClick('.patient_testGroup1_bar');
            var res = checkElementWithTemporaryClass(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                'disablePointerEvents',
                0
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page overlap tab upset deselect active group', function() {
            browser.click('button[data-test="groupSelectorButtontestGroup4"]');
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

var clickTypeSelectorCheckBox = name => {
    $('label=' + name)
        .$('input')
        .click();
};

var submitEnrichmentRequest = () => {
    $('[data-test=changeSortOrderButton]').click();
    browser.waitForVisible('[data-test=GroupComparisonAlterationEnrichments]');
};
