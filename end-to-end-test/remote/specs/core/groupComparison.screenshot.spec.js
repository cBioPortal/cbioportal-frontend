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
var {
    jsApiClick,
    jsApiHover,
    getElementByTestHandle,
} = require('../../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('group comparison page screenshot tests', function() {
    describe('general screenshot tests', function() {
        before(function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison?sessionId=5ce411c7e4b0ab4137874076`
            );
            $('div[data-test="ComparisonPageOverlapTabDiv"]').waitForDisplayed({
                timeout: 100000,
            });
        });
        it('group comparison page overlap tab upset plot view', function() {
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = browser.checkElement(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page survival tab exclude overlapping samples', () => {
            assert($('a.tabAnchor_survival').isDisplayed());
            $('a.tabAnchor_survival').click();
            $(
                'div[data-test="ComparisonPageSurvivalTabDiv"]'
            ).waitForDisplayed({ timeout: 60000 });
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = browser.checkElement(
                'div[data-test="ComparisonPageSurvivalTabDiv"]',
                '',
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
            $('div[data-test="ComparisonPageSurvivalTabDiv"]').waitForExist({
                timeout: 60000,
            });
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = checkElementWithMouseDisabled(
                'div[data-test="ComparisonPageSurvivalTabDiv"]',
                0,
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page clinical tab include overlapping samples Kruskal Wallis test', function() {
            assert($('a.tabAnchor_clinical').isDisplayed());
            $('a.tabAnchor_clinical').click();
            waitForNetworkQuiet();
            $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
            ).waitForDisplayed({ timeout: 20000 });
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page clinical tab swaped axes Kruskal Wallis test', function() {
            $(
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="SwapAxes"]'
            ).click();
            $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
            ).waitForDisplayed({ timeout: 20000 });
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page clinical tab log scale  Kruskal Wallis test', function() {
            $(
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="logScale"]'
            ).click();
            $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
            ).waitForDisplayed({ timeout: 20000 });
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
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
            $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
            ).waitForDisplayed({ timeout: 20000 });
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page clinical tab bar chart Chi squared test', function() {
            var plotTypeSelector = $(
                '[data-test="plotTypeSelector"] .Select-input input'
            );
            plotTypeSelector.setValue('Bar chart');
            $('[data-test="plotTypeSelector"] .Select-option').click();
            $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
            ).waitForDisplayed({ timeout: 20000 });
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page clinical tab stacked bar chart Chi squared test', function() {
            var plotTypeSelector = $(
                '[data-test="plotTypeSelector"] .Select-input input'
            );
            plotTypeSelector.setValue('Stacked bar chart');
            $('[data-test="plotTypeSelector"] .Select-option').click();
            $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
            ).waitForDisplayed({ timeout: 20000 });
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page clinical tab stacked bar chart swaped axes Chi squared test', function() {
            $(
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="SwapAxes"]'
            ).click();
            $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
            ).waitForDisplayed({ timeout: 20000 });
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page clinical tab stacked bar chart horizontal bars Chi squared test', function() {
            $(
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="SwapAxes"]'
            ).click();
            $(
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="HorizontalBars"]'
            ).click();
            $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
            ).waitForDisplayed({ timeout: 20000 });
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page mrna enrichments tab several groups', function() {
            $('.tabAnchor_mrna').click();
            $(
                'div[data-test="GroupComparisonMRNAEnrichments"]'
            ).waitForDisplayed({ timeout: 20000 });
            $('b=BTN3A3').waitForDisplayed({ timeout: 10000 });
            $('b=BTN3A3').click();
            $('div[data-test="MiniBoxPlot"]').waitForDisplayed({
                timeout: 20000,
            });
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

        it('group comparison page protein enrichments tab several groups', function() {
            $('.tabAnchor_protein').click();
            $(
                'div[data-test="GroupComparisonProteinEnrichments"]'
            ).waitForDisplayed({ timeout: 10000 });
            $('b=TUBA1B').waitForDisplayed({ timeout: 10000 });
            $('b=TUBA1B').click();
            $('div[data-test="MiniBoxPlot"]').waitForDisplayed({
                timeout: 20000,
            });
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

        it('group comparison page methylation enrichments tab several groups', function() {
            $('.tabAnchor_dna_methylation').click();
            $(
                'div[data-test="GroupComparisonMethylationEnrichments"]'
            ).waitForDisplayed({ timeout: 10000 });
            $('b=MTRF1L').waitForDisplayed({ timeout: 10000 });
            $('b=MTRF1L').click();
            $('div[data-test="MiniBoxPlot"]').waitForDisplayed({
                timeout: 20000,
            });
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

        it('group comparison page alteration enrichments tab two groups', function() {
            // deselect two groups
            $('button[data-test="groupSelectorButtonGARS mutant"]').click();
            $(
                'button[data-test="groupSelectorButtonZNF517 mutant"]'
            ).waitForExist({ timeout: 10000 });
            $('button[data-test="groupSelectorButtonZNF517 mutant"]').click();
            // go back to mutations tab
            $('.tabAnchor_alterations').waitForExist({ timeout: 10000 });
            $('.tabAnchor_alterations').click();
            $(
                'div[data-test="GroupComparisonAlterationEnrichments"]'
            ).waitForDisplayed({ timeout: 10000 });
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

        it('group comparison page cna enrichments tab two groups', function() {
            $('.tabAnchor_alterations').click();
            $(
                'div[data-test="GroupComparisonAlterationEnrichments"]'
            ).waitForDisplayed({ timeout: 10000 });
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

        it('group comparison page cna enrichments tab patient mode', function() {
            browser.execute(function() {
                groupComparisonStore.setUsePatientLevelEnrichments(true);
            });
            $(
                'div[data-test="GroupComparisonAlterationEnrichments"]'
            ).waitForDisplayed({ timeout: 30000 });
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

        it('group comparison page mrna enrichments tab two groups', function() {
            $('.tabAnchor_mrna').click();
            $(
                'div[data-test="GroupComparisonMRNAEnrichments"]'
            ).waitForDisplayed({ timeout: 10000 });
            $('b=RBMX2').waitForDisplayed({ timeout: 10000 });
            $('b=RBMX2').click();
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

        it('group comparison page protein enrichments tab two groups', function() {
            $('.tabAnchor_protein').click();
            $(
                'div[data-test="GroupComparisonProteinEnrichments"]'
            ).waitForDisplayed({ timeout: 10000 });
            $('b=ETS1').waitForDisplayed({ timeout: 10000 });
            $('b=ETS1').click();
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

        it('group comparison page methylation enrichments tab two groups', function() {
            $('.tabAnchor_dna_methylation').click();
            $(
                'div[data-test="GroupComparisonMethylationEnrichments"]'
            ).waitForDisplayed({ timeout: 10000 });
            $('b=BET1').waitForDisplayed({ timeout: 10000 });
            $('b=BET1').click();
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

        it('group comparison page microbiome signature tab several groups', function() {
            // use study blca_tcga_pan_can_atlas_2018 for microbiome signature tests
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison/generic_assay_microbiome_signature?sessionId=5d63f222e4b0d777deb05c78&unselectedGroups=%5B%22NA%22%5D`
            );
            $(
                'div[data-test="GroupComparisonGenericAssayEnrichments"]'
            ).waitForDisplayed({ timeout: 10000 });
            $(
                'div[data-test="GroupComparisonGenericAssayEnrichments"]'
            ).waitForDisplayed({ timeout: 10000 });
            $('b=Collimonas').waitForDisplayed({ timeout: 10000 });
            $('b=Collimonas').click();
            $('div[data-test="MiniBoxPlot"]').waitForDisplayed({
                timeout: 20000,
            });
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

        it('group comparison page microbiome signature tab two groups', function() {
            // use study blca_tcga_pan_can_atlas_2018 for microbiome signature tests
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison/generic_assay_microbiome_signature?sessionId=5d63f222e4b0d777deb05c78&unselectedGroups=%5B%22NA%22%2C%22White%22%5D`
            );
            $(
                'div[data-test="GroupComparisonGenericAssayEnrichments"]'
            ).waitForDisplayed({ timeout: 10000 });
            $('b=Lawsonia').waitForDisplayed({ timeout: 10000 });
            $('b=Lawsonia').click();
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

        it('group comparison page mutations tab two groups', function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison/mutations?sessionId=5cf89323e4b0ab413787436c&selectedGene=AR`
            );
            $('.borderedChart svg').waitForDisplayed({ timeout: 20000 });
            var res = browser.checkElement(
                '[data-test="ComparisonPageMutationsTabPlot"]',
                '',
                {
                    viewportChangePause: 4000,
                }
            ); // hide these things because the timing of data loading makes this test so flaky
            assertScreenShotMatch(res);
        });

        it('group comparison page mutations tab three groups first unselected', function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison/mutations?comparisonId=634006c24dd45f2bc4c3d4aa&unselectedGroups=%5B"Colon%20Adenocarcinoma"%5D`
            );
            $('.borderedChart svg').waitForDisplayed({ timeout: 20000 });
            jsApiHover(getElementByTestHandle('infoIcon'));

            getElementByTestHandle(
                'patientMultipleMutationsMessage'
            ).waitForExist();
            var res = browser.checkElement(
                '[data-test="ComparisonPageMutationsTabPlot"]',
                '',
                {
                    viewportChangePause: 4000,
                }
            ); // hide these things because the timing of data loading makes this test so flaky
            assertScreenShotMatch(res);
        });
    });

    describe('delete group from session', function() {
        before(function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison?sessionId=5ce411c7e4b0ab4137874076`
            );
            $('div[data-test="ComparisonPageOverlapTabDiv"]').waitForDisplayed({
                timeout: 20000,
            });
        });
        it('group comparison page delete group from session', function() {
            this.retries(0);
            $(
                'button[data-test="groupSelectorButtonGARS mutant"] [data-test="deleteButton"]'
            ).click();
            browser.pause(1000);
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
                $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
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
                $('svg#comparison-tab-overlap-svg').waitForDisplayed({
                    timeout: 6000,
                });
                jsApiClick('rect[data-test="sample0VennRegion"]');
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
                $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
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
                $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
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
                jsApiClick('rect[data-test="sample0,1,2VennRegion"]');
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });

            it('group comparison page overlap tab venn diagram view with overlap deselect active group', function() {
                $(
                    'button[data-test="groupSelectorButtonZFPM1 mutant"]'
                ).click();
                $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
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
                $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
            });
            it('group comparison complex venn BCD', function() {
                $(buttonA).click();
                $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('group comparison complex venn CD', function() {
                $(buttonB).click();
                $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('group comparison complex venn BC', function() {
                $(buttonB).click();
                $(buttonD).waitForDisplayed();
                $(buttonD).click();
                $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('group comparison complex venn ABC', function() {
                $(buttonA).click();
                $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('group comparison complex venn AB', function() {
                $(buttonC).click();
                $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('group comparison complex venn ABD', function() {
                $(buttonD).click();
                $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('group comparison complex venn AD', function() {
                $(buttonB).click();
                $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('group comparison complex venn ACD', function() {
                $(buttonC).click();
                $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
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
            $('div[data-test="ComparisonPageOverlapTabDiv"]').waitForDisplayed({
                timeout: 20000,
            });
        });

        it('group comparison page overlap tab upset groups selected', function() {
            jsApiClick('.sample_testGroup5_bar');
            jsApiClick('.sample_testGroup1_testGroup2_bar');
            jsApiClick('.patient_testGroup1_bar');
            var res = checkElementWithTemporaryClass(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                'disablePointerEvents',
                0
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page overlap tab upset deselect active group', function() {
            $('button[data-test="groupSelectorButtontestGroup4"]').click();
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
    $('[data-test=GroupComparisonAlterationEnrichments]').waitForDisplayed();
};
