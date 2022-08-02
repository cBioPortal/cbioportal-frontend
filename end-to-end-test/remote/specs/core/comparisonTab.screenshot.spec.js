var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var checkElementWithTemporaryClass = require('../../../shared/specUtils')
    .checkElementWithTemporaryClass;
var checkElementWithMouseDisabled = require('../../../shared/specUtils')
    .checkElementWithMouseDisabled;
var {
    jsApiClick,
    selectClinicalTabPlotType,
} = require('../../../shared/specUtils');
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('results view comparison tab screenshot tests', function() {
    describe('general screenshot tests', function() {
        before(function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Altered%20group"%2C"Unaltered%20group"%2C"KRAS"%2C"NRAS"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
            );
            $('div[data-test="ComparisonPageOverlapTabDiv"]').waitForDisplayed({
                timeout: 20000,
            });
        });
        it('results view comparison tab overlap tab upset plot view', function() {
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = browser.checkElement(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab survival tab exclude overlapping samples', () => {
            assert(
                $('.comparisonTabSubTabs a.tabAnchor_survival').isDisplayed()
            );
            $('.comparisonTabSubTabs a.tabAnchor_survival').click();
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

        it('results view comparison tab survival tab include overlapping samples', function() {
            browser.execute(function() {
                comparisonTab.store.updateOverlapStrategy('Include');
            });
            $('div[data-test="ComparisonPageSurvivalTabDiv"]').waitForExist({
                timeout: 60000,
            });
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = browser.checkElement(
                'div[data-test="ComparisonPageSurvivalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab include overlapping samples Kruskal Wallis test', function() {
            assert(
                $('.comparisonTabSubTabs a.tabAnchor_clinical').isDisplayed()
            );
            $('.comparisonTabSubTabs a.tabAnchor_clinical').click();
            $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
            ).waitForDisplayed({ timeout: 20000 });
            $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="LazyMobXTable"] span[data-test="Mutation Count"]'
            ).waitForDisplayed();
            $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="LazyMobXTable"] span[data-test="Mutation Count"]'
            ).click();
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab swaped axes Kruskal Wallis test', function() {
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

        it('results view comparison tab clinical tab log scale  Kruskal Wallis test', function() {
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

        it('results view comparison tab clinical tab percentage stacked bar chart exclude overlapping samples Chi squared test', function() {
            browser.execute(function() {
                comparisonTab.store.updateOverlapStrategy('Exclude');
            });
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

        it('results view comparison tab clinical tab bar chart Chi squared test', function() {
            selectClinicalTabPlotType('Bar chart');
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

        it('results view comparison tab clinical tab stacked bar chart Chi squared test', function() {
            selectClinicalTabPlotType('Stacked bar chart');
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

        it('results view comparison tab clinical tab stacked bar chart swaped axes Chi squared test', function() {
            $(
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="SwapAxes"]'
            ).click();
            $('body').moveTo({ xOffset: 0, yOffset: 0 });
            $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
            ).waitForDisplayed({ timeout: 20000 });
            var res = checkElementWithMouseDisabled(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                0,
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab stacked bar chart horizontal bars Chi squared test', function() {
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

        it('results view comparison tab alteration enrichments tab several groups', function() {
            $('.comparisonTabSubTabs .tabAnchor_alterations').click();
            $(
                'div[data-test="GroupComparisonAlterationEnrichments"]'
            ).waitForDisplayed({ timeout: 10000 });
            var res = browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });
        it('results view comparison tab alteration enrichments tab several groups only truncating', function() {
            $(
                '[data-test="AlterationTypeSelectorMenu"] [data-test="Mutations"]'
            ).click();
            $(
                '[data-test="AlterationTypeSelectorMenu"] [data-test="CheckCopynumberAlterations"]'
            ).click();
            $(
                '[data-test="AlterationTypeSelectorMenu"] [data-test="Truncating"]'
            ).click();

            $(
                '[data-test="AlterationTypeSelectorMenu"] [data-test="buttonSelectAlterations"]'
            ).click();

            $(
                'div[data-test="GroupComparisonAlterationEnrichments"]'
            ).waitForDisplayed({ timeout: 10000 });
            var res = browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab mrna enrichments tab several groups', function() {
            $('.comparisonTabSubTabs .tabAnchor_mrna').click();
            $(
                'div[data-test="GroupComparisonMRNAEnrichments"]'
            ).waitForDisplayed({ timeout: 30000 });
            $('b=HOXB4').waitForDisplayed({ timeout: 10000 });
            $('b=HOXB4').click();
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

        it('results view comparison tab mrna enrichments tab two groups', function() {
            $('.comparisonTabSubTabs .tabAnchor_mrna').click();
            $(
                'div[data-test="GroupComparisonMRNAEnrichments"]'
            ).waitForDisplayed({ timeout: 30000 });
            $('b=MERTK').waitForDisplayed({ timeout: 10000 });
            $('b=MERTK').click();
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

        it('results view comparison tab protein enrichments tab several groups', function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=blca_tcga_pub_2017&case_set_id=blca_tcga_pub_2017_all&comparison_selectedGroups=%5B"KRAS"%2C"NRAS"%2C"BRAF"%5D&comparison_subtab=protein&data_priority=0&gene_list=KRAS%2520NRAS%2520BRAF&gene_set_choice=user-defined-list&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=blca_tcga_pub_2017_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=blca_tcga_pub_2017_rna_seq_v2_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=blca_tcga_pub_2017_mutations&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=blca_tcga_pub_2017_rppa_Zscores&profileFilter=0&tab_index=tab_visualize`
            );
            $(
                'div[data-test="GroupComparisonProteinEnrichments"]'
            ).waitForDisplayed({ timeout: 30000 });
            $('b=SCD').waitForDisplayed({ timeout: 10000 });
            $('b=SCD').click();
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

        it('results view comparison tab protein enrichments tab two groups', function() {
            // deselect a group
            $('button[data-test="groupSelectorButtonBRAF"]').click();

            $(
                'div[data-test="GroupComparisonProteinEnrichments"]'
            ).waitForDisplayed({ timeout: 10000 });
            $('b=FASN').waitForDisplayed({ timeout: 10000 });
            $('b=FASN').click();
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

        it('results view comparison tab methylation enrichments tab several groups', function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=blca_tcga_pub_2017&case_set_id=blca_tcga_pub_2017_all&comparison_selectedGroups=%5B"KRAS"%2C"NRAS"%2C"BRAF"%5D&comparison_subtab=dna_methylation&data_priority=0&gene_list=KRAS%2520NRAS%2520BRAF&gene_set_choice=user-defined-list&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=blca_tcga_pub_2017_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=blca_tcga_pub_2017_rna_seq_v2_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=blca_tcga_pub_2017_mutations&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=blca_tcga_pub_2017_rppa_Zscores&profileFilter=0&tab_index=tab_visualize`
            );
            $(
                'div[data-test="GroupComparisonMethylationEnrichments"]'
            ).waitForDisplayed({ timeout: 20000 });
            $('b=HDAC1').waitForDisplayed({ timeout: 10000 });
            $('b=HDAC1').click();
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

        it('results view comparison tab methylation enrichments tab two groups', function() {
            // deselect a group
            $('button[data-test="groupSelectorButtonBRAF"]').click();

            $(
                'div[data-test="GroupComparisonMethylationEnrichments"]'
            ).waitForDisplayed({ timeout: 20000 });
            $('b=RER1').waitForDisplayed({ timeout: 10000 });
            $('b=RER1').click();
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

        it('results view comparison tab microbiome signature tab several groups', function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=blca_tcga_pan_can_atlas_2018&case_set_id=blca_tcga_pan_can_atlas_2018_cnaseq&comparison_selectedGroups=%5B"CDKN2A"%2C"MDM2"%2C"MDM4"%5D&comparison_subtab=generic_assay_microbiome_signature&data_priority=0&gene_list=CDKN2A%2520MDM2%2520MDM4&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=blca_tcga_pan_can_atlas_2018_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=blca_tcga_pan_can_atlas_2018_mutations&profileFilter=0&tab_index=tab_visualize`
            );
            $(
                'div[data-test="GroupComparisonGenericAssayEnrichments"]'
            ).waitForDisplayed({ timeout: 10000 });
            $('b=Polyomavirus').waitForDisplayed({ timeout: 10000 });
            $('b=Polyomavirus').click();
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

        it('results view comparison tab microbiome signature tab two groups', function() {
            // deselect a group
            $('button[data-test="groupSelectorButtonMDM4"]').click();

            $(
                'div[data-test="GroupComparisonGenericAssayEnrichments"]'
            ).waitForDisplayed({ timeout: 10000 });
            $('b=Wolbachia').waitForDisplayed({ timeout: 10000 });
            $('b=Wolbachia').click();
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

    describe('delete group from session', function() {
        before(function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Altered%20group"%2C"Unaltered%20group"%2C"KRAS"%2C"NRAS"%5D&comparison_subtab=overlap&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&comparison_createdGroupsSessionId=5e74f264e4b0ff7ef5fdb27f`
            );
            $('div[data-test="ComparisonPageOverlapTabDiv"]').waitForDisplayed({
                timeout: 20000,
            });
        });
        it('results view comparison tab delete group from session', function() {
            $(
                'button[data-test="groupSelectorButtontest"] [data-test="deleteButton"]'
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
                    `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
                );
                $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
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
            it('results view comparison tab overlap tab 3 disjoint venn diagram', function() {
                goToUrlAndSetLocalStorage(
                    `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Unaltered%20group"%2C"KRAS"%2C"BRAF"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
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
                    `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"KRAS"%2C"NRAS"%2C"Altered%20group"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
                );
                $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
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
                jsApiClick('rect[data-test="sample0,1,2VennRegion"]');
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });

            it('results view comparison tab overlap tab venn diagram view with overlap deselect active group', function() {
                $('button[data-test="groupSelectorButtonKRAS"]').click();
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
                $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
            });
            it('results view comparison tab complex venn BCD', function() {
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
            it('results view comparison tab complex venn CD', function() {
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
            it('results view comparison tab complex venn BC', function() {
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
            it('results view comparison tab complex venn ABC', function() {
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
            it('results view comparison tab complex venn AB', function() {
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
            it('results view comparison tab complex venn ABD', function() {
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
            it('results view comparison tab complex venn AD', function() {
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
            it('results view comparison tab complex venn ACD', function() {
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
                `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Unaltered%20group"%2C"KRAS"%2C"NRAS"%2C"Altered%20group"%2C"BRAF"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
            );
            $('div[data-test="ComparisonPageOverlapTabDiv"]').waitForDisplayed({
                timeout: 20000,
            });
        });

        it('results view comparison tab overlap tab upset groups selected', function() {
            jsApiClick('.sample_Unaltered_group_bar');
            jsApiClick('.sample_Altered_group_KRAS_bar');
            jsApiClick('.patient_Altered_group_NRAS_bar');
            var res = checkElementWithTemporaryClass(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                'disablePointerEvents',
                0
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab overlap tab upset deselect active group', function() {
            $('button[data-test="groupSelectorButtonNRAS"]').click();
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

var clickCheckBox = name => {
    $('label=' + name)
        .$('input')
        .click();
};

var submit = () => {
    $('[data-test=changeSortOrderButton]').click();
    $('[data-test=GroupComparisonAlterationEnrichments]').waitForDisplayed();
};
