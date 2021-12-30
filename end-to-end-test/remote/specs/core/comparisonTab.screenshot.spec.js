var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('../../../shared/specUtils')
    .waitForNetworkQuiet;
var setInputText = require('../../../shared/specUtils').setInputText;
var checkElementWithTemporaryClass = require('../../../shared/specUtils')
    .checkElementWithTemporaryClass;
var checkElementWithMouseDisabled = require('../../../shared/specUtils')
    .checkElementWithMouseDisabled;
var setDropdownOpen = require('../../../shared/specUtils').setDropdownOpen;
var { jsApiClick } = require('../../../shared/specUtils');
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

async function selectClinicalTabPlotType(type) {
    await setDropdownOpen(
        true,
        '[data-test="plotTypeSelector"] .Select-arrow-zone',
        '[data-test="plotTypeSelector"] .Select-menu',
        "Couldn't open clinical tab chart type dropdown"
    );
    await $(
        `[data-test="plotTypeSelector"] .Select-option[aria-label="${type}"]`
    ).click();
}

describe('results view comparison tab screenshot tests', function() {
    describe('general screenshot tests', function() {
        before(async function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Altered%20group"%2C"Unaltered%20group"%2C"KRAS"%2C"NRAS"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
            );
            await $(
                'div[data-test="ComparisonPageOverlapTabDiv"]'
            ).waitForDisplayed({
                timeout: 20000,
            });
        });
        it('results view comparison tab overlap tab upset plot view', async function() {
            await $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = await browser.checkElement(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab survival tab exclude overlapping samples', async () => {
            assert(
                await $(
                    '.comparisonTabSubTabs a.tabAnchor_survival'
                ).isDisplayed()
            );
            await $('.comparisonTabSubTabs a.tabAnchor_survival').click();
            await $(
                'div[data-test="ComparisonPageSurvivalTabDiv"]'
            ).waitForDisplayed({ timeout: 60000 });
            await $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = await browser.checkElement(
                'div[data-test="ComparisonPageSurvivalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab survival tab include overlapping samples', async function() {
            await browser.execute(function() {
                comparisonTab.store.updateOverlapStrategy('Include');
            });
            await $(
                'div[data-test="ComparisonPageSurvivalTabDiv"]'
            ).waitForExist({
                timeout: 60000,
            });
            await $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = await browser.checkElement(
                'div[data-test="ComparisonPageSurvivalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab include overlapping samples Kruskal Wallis test', async function() {
            assert(
                $('.comparisonTabSubTabs a.tabAnchor_clinical').isDisplayed()
            );
            await $('.comparisonTabSubTabs a.tabAnchor_clinical').click();
            await $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
            ).waitForDisplayed({ timeout: 20000 });
            await $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="LazyMobXTable"] span[data-test="Mutation Count"]'
            ).waitForDisplayed();
            await $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="LazyMobXTable"] span[data-test="Mutation Count"]'
            ).click();
            await $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = await browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab swaped axes Kruskal Wallis test', async function() {
            await $(
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="SwapAxes"]'
            ).click();
            await $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
            ).waitForDisplayed({ timeout: 20000 });
            await $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = await browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab log scale  Kruskal Wallis test', async function() {
            await $(
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="logScale"]'
            ).click();
            await $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
            ).waitForDisplayed({ timeout: 20000 });
            await $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = await browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab percentage stacked bar chart exclude overlapping samples Chi squared test', async function() {
            await browser.execute(function() {
                comparisonTab.store.updateOverlapStrategy('Exclude');
            });
            await $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
            ).waitForDisplayed({ timeout: 20000 });
            await $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = await browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab bar chart Chi squared test', async function() {
            await selectClinicalTabPlotType('Bar chart');
            await $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
            ).waitForDisplayed({ timeout: 20000 });
            await $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = await browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab stacked bar chart Chi squared test', async function() {
            await selectClinicalTabPlotType('Stacked bar chart');
            await $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
            ).waitForDisplayed({ timeout: 20000 });
            await $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = await browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab stacked bar chart swaped axes Chi squared test', async function() {
            await $(
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="SwapAxes"]'
            ).click();
            await $('body').moveTo({ xOffset: 0, yOffset: 0 });
            await $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
            ).waitForDisplayed({ timeout: 20000 });
            var res = await checkElementWithMouseDisabled(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                0,
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab stacked bar chart horizontal bars Chi squared test', async function() {
            await $(
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="SwapAxes"]'
            ).click();
            await $(
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="HorizontalBars"]'
            ).click();
            await $(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
            ).waitForDisplayed({ timeout: 20000 });
            await $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = await browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab alteration enrichments tab several groups', async function() {
            await $('.comparisonTabSubTabs .tabAnchor_alterations').click();
            await $(
                'div[data-test="GroupComparisonAlterationEnrichments"]'
            ).waitForDisplayed({ timeout: 10000 });
            var res = await browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });
        it('results view comparison tab alteration enrichments tab several groups only truncating', async function() {
            await $(
                '[data-test="AlterationTypeSelectorMenu"] [data-test="Mutations"]'
            ).click();
            await $(
                '[data-test="AlterationTypeSelectorMenu"] [data-test="CheckCopynumberAlterations"]'
            ).click();
            await $(
                '[data-test="AlterationTypeSelectorMenu"] [data-test="Truncating"]'
            ).click();

            await $(
                '[data-test="AlterationTypeSelectorMenu"] [data-test="buttonSelectAlterations"]'
            ).click();

            await $(
                'div[data-test="GroupComparisonAlterationEnrichments"]'
            ).waitForDisplayed({ timeout: 10000 });
            var res = await browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab mrna enrichments tab several groups', async function() {
            await $('.comparisonTabSubTabs .tabAnchor_mrna').click();
            await $(
                'div[data-test="GroupComparisonMRNAEnrichments"]'
            ).waitForDisplayed({ timeout: 30000 });
            await $('b=HOXB4').waitForDisplayed({ timeout: 10000 });
            await $('b=HOXB4').click();
            await $('div[data-test="MiniBoxPlot"]').waitForDisplayed({
                timeout: 20000,
            });
            await $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = await browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab mrna enrichments tab two groups', async function() {
            await $('.comparisonTabSubTabs .tabAnchor_mrna').click();
            await $(
                'div[data-test="GroupComparisonMRNAEnrichments"]'
            ).waitForDisplayed({ timeout: 30000 });
            await $('b=MERTK').waitForDisplayed({ timeout: 10000 });
            await $('b=MERTK').click();
            await $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = await browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab protein enrichments tab several groups', async function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=blca_tcga_pub_2017&case_set_id=blca_tcga_pub_2017_all&comparison_selectedGroups=%5B"KRAS"%2C"NRAS"%2C"BRAF"%5D&comparison_subtab=protein&data_priority=0&gene_list=KRAS%2520NRAS%2520BRAF&gene_set_choice=user-defined-list&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=blca_tcga_pub_2017_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=blca_tcga_pub_2017_rna_seq_v2_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=blca_tcga_pub_2017_mutations&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=blca_tcga_pub_2017_rppa_Zscores&profileFilter=0&tab_index=tab_visualize`
            );
            await $(
                'div[data-test="GroupComparisonProteinEnrichments"]'
            ).waitForDisplayed({ timeout: 30000 });
            await $('b=SCD').waitForDisplayed({ timeout: 10000 });
            await $('b=SCD').click();
            await $('div[data-test="MiniBoxPlot"]').waitForDisplayed({
                timeout: 20000,
            });
            await $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = await browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab protein enrichments tab two groups', async function() {
            // deselect a group
            await $('button[data-test="groupSelectorButtonBRAF"]').click();

            await $(
                'div[data-test="GroupComparisonProteinEnrichments"]'
            ).waitForDisplayed({ timeout: 10000 });
            await $('b=FASN').waitForDisplayed({ timeout: 10000 });
            await $('b=FASN').click();
            await $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = await browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab methylation enrichments tab several groups', async function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=blca_tcga_pub_2017&case_set_id=blca_tcga_pub_2017_all&comparison_selectedGroups=%5B"KRAS"%2C"NRAS"%2C"BRAF"%5D&comparison_subtab=dna_methylation&data_priority=0&gene_list=KRAS%2520NRAS%2520BRAF&gene_set_choice=user-defined-list&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=blca_tcga_pub_2017_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=blca_tcga_pub_2017_rna_seq_v2_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=blca_tcga_pub_2017_mutations&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=blca_tcga_pub_2017_rppa_Zscores&profileFilter=0&tab_index=tab_visualize`
            );
            await $(
                'div[data-test="GroupComparisonMethylationEnrichments"]'
            ).waitForDisplayed({ timeout: 20000 });
            await $('b=HDAC1').waitForDisplayed({ timeout: 10000 });
            await $('b=HDAC1').click();
            await $('div[data-test="MiniBoxPlot"]').waitForDisplayed({
                timeout: 20000,
            });
            await $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = await browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab methylation enrichments tab two groups', async function() {
            // deselect a group
            await $('button[data-test="groupSelectorButtonBRAF"]').click();

            await $(
                'div[data-test="GroupComparisonMethylationEnrichments"]'
            ).waitForDisplayed({ timeout: 20000 });
            await $('b=RER1').waitForDisplayed({ timeout: 10000 });
            await $('b=RER1').click();
            await $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = await browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab microbiome signature tab several groups', async function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=blca_tcga_pan_can_atlas_2018&case_set_id=blca_tcga_pan_can_atlas_2018_cnaseq&comparison_selectedGroups=%5B"CDKN2A"%2C"MDM2"%2C"MDM4"%5D&comparison_subtab=generic_assay_microbiome_signature&data_priority=0&gene_list=CDKN2A%2520MDM2%2520MDM4&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=blca_tcga_pan_can_atlas_2018_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=blca_tcga_pan_can_atlas_2018_mutations&profileFilter=0&tab_index=tab_visualize`
            );
            await $(
                'div[data-test="GroupComparisonGenericAssayEnrichments"]'
            ).waitForDisplayed({ timeout: 10000 });
            await $('b=Polyomavirus').waitForDisplayed({ timeout: 10000 });
            await $('b=Polyomavirus').click();
            await $('div[data-test="MiniBoxPlot"]').waitForDisplayed({
                timeout: 20000,
            });
            await $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = await browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab microbiome signature tab two groups', async function() {
            // deselect a group
            await $('button[data-test="groupSelectorButtonMDM4"]').click();

            await $(
                'div[data-test="GroupComparisonGenericAssayEnrichments"]'
            ).waitForDisplayed({ timeout: 10000 });
            await $('b=Wolbachia').waitForDisplayed({ timeout: 10000 });
            await $('b=Wolbachia').click();
            await $('body').moveTo({ xOffset: 0, yOffset: 0 });
            var res = await browser.checkElement(
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
        before(async function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Altered%20group"%2C"Unaltered%20group"%2C"KRAS"%2C"NRAS"%5D&comparison_subtab=overlap&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&comparison_createdGroupsSessionId=5e74f264e4b0ff7ef5fdb27f`
            );
            await $(
                'div[data-test="ComparisonPageOverlapTabDiv"]'
            ).waitForDisplayed({
                timeout: 20000,
            });
        });
        it('results view comparison tab delete group from session', async function() {
            await $(
                'button[data-test="groupSelectorButtontest"] [data-test="deleteButton"]'
            ).click();
            await browser.pause(1000);
            var res = await checkElementWithMouseDisabled('div.mainContainer');
            assertScreenShotMatch(res);
        });
    });

    describe('overlap venn diagram', function() {
        describe('disjoint diagram', function() {
            before(async function() {
                goToUrlAndSetLocalStorage(
                    `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
                );
                await $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
            });

            it('results view comparison tab overlap tab disjoint venn diagram view', async function() {
                var res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });

            it('results view comparison tab overlap tab disjoint venn diagram view with a group selected view', async function() {
                await $('svg#comparison-tab-overlap-svg').waitForDisplayed({
                    timeout: 6000,
                });
                await jsApiClick('rect[data-test="sample0VennRegion"]');
                var res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab overlap tab 3 disjoint venn diagram', async function() {
                goToUrlAndSetLocalStorage(
                    `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Unaltered%20group"%2C"KRAS"%2C"BRAF"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
                );
                await $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
                var res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
        });

        describe('venn diagram with overlap', async function() {
            before(async function() {
                goToUrlAndSetLocalStorage(
                    `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"KRAS"%2C"NRAS"%2C"Altered%20group"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
                );
                await $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
            });

            it('results view comparison tab overlap tab venn diagram with overlap view', async function() {
                var res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });

            it('results view comparison tab overlap tab venn diagram view with overlap and session selected view', async function() {
                await jsApiClick('rect[data-test="sample0,1,2VennRegion"]');
                var res = checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });

            it('results view comparison tab overlap tab venn diagram view with overlap deselect active group', async function() {
                await $('button[data-test="groupSelectorButtonKRAS"]').click();
                await $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
                var res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
        });

        describe('venn diagram with complex overlaps', async function() {
            const buttonA =
                'button[data-test="groupSelectorButtonAltered group"]';
            const buttonB =
                'button[data-test="groupSelectorButtonUnaltered group"]';
            const buttonC = 'button[data-test="groupSelectorButtonKRAS"]';
            const buttonD = 'button[data-test="groupSelectorButtonNRAS"]';
            const buttonE = 'button[data-test="groupSelectorButtonBRAF"]';

            before(async function() {
                goToUrlAndSetLocalStorage(
                    `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Unaltered%20group"%2C"KRAS"%2C"NRAS"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
                );
                await $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
            });
            it('results view comparison tab complex venn BCD', async function() {
                await $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
                var res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab complex venn CD', async function() {
                await $(buttonB).click();
                await $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
                var res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab complex venn BC', async function() {
                await $(buttonB).click();
                await $(buttonD).waitForDisplayed();
                await $(buttonD).click();
                await $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
                var res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab complex venn ABC', async function() {
                await $(buttonA).click();
                await $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
                var res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab complex venn AB', async function() {
                await $(buttonC).click();
                await $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
                var res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab complex venn ABD', async function() {
                await $(buttonD).click();
                await $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
                var res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab complex venn AD', async function() {
                await $(buttonB).click();
                await $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
                var res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab complex venn ACD', async function() {
                await $(buttonC).click();
                await $(
                    'div[data-test="ComparisonPageOverlapTabDiv"]'
                ).waitForDisplayed({ timeout: 20000 });
                var res = await checkElementWithTemporaryClass(
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
        before(async function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Unaltered%20group"%2C"KRAS"%2C"NRAS"%2C"Altered%20group"%2C"BRAF"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
            );
            await $(
                'div[data-test="ComparisonPageOverlapTabDiv"]'
            ).waitForDisplayed({
                timeout: 20000,
            });
        });

        it('results view comparison tab overlap tab upset groups selected', async function() {
            await jsApiClick('.sample_Unaltered_group_bar');
            await jsApiClick('.sample_Altered_group_KRAS_bar');
            await jsApiClick('.patient_Altered_group_NRAS_bar');
            var res = await checkElementWithTemporaryClass(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                'disablePointerEvents',
                0
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab overlap tab upset deselect active group', async function() {
            await $('button[data-test="groupSelectorButtonNRAS"]').click();
            var res = await checkElementWithTemporaryClass(
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
