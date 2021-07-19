var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;

var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('../../../shared/specUtils').waitForOncoprint;
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('Results Page', function() {
    //this.retries(2);

    before(function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}`);
    });

    describe('Cancer Type Summary Bar Chart', () => {
        describe('single study query with four genes', () => {
            before(() => {
                var url = `${CBIOPORTAL_URL}/results/cancerTypesSummary?tab_index=tab_visualize&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=BRAF+KRAS+NRAS&gene_set_choice=user-defined-list&Action=Submit`;
                goToUrlAndSetLocalStorage(url);
                $('[data-test="cancerTypeSummaryChart"]').waitForDisplayed({
                    timeout: 10000,
                });
            });

            it('defaults to cancerTypeDetailed', () => {
                var el = $('[data-value="cancerTypeDetailed"]');
                assert.equal(el.isSelected(), true);
            });

            it('three gene tabs plus "all genes" equals four total tabs, in order of genes in oql', () => {
                var tabs = $$(
                    "[data-test='cancerTypeSummaryWrapper'] .nav li a"
                );
                assert.equal(
                    tabs.length,
                    4,
                    'three gene tabs plus "all genes" equals four total tabs'
                );
                assert.equal(tabs[0].getText(), 'All Queried Genes');
                assert.deepEqual(
                    tabs.map(tab => tab.getText()),
                    ['All Queried Genes', 'BRAF', 'KRAS', 'NRAS'],
                    'we have all genes and genes in order of oql'
                );
            });
        });

        describe('cross study query', () => {
            before(() => {
                var url = `${CBIOPORTAL_URL}/results/cancerTypesSummary?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=all&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=%20&tab_index=tab_visualize&Action=Submit&cancer_study_list=coadread_tcga_pub%2Ccellline_nci60&show_samples=false&clinicallist=CANCER_STUDY`;
                goToUrlAndSetLocalStorage(url);
                $('[data-test=cancerTypeSummaryChart]').waitForDisplayed({
                    timeout: 10000,
                });
            });

            it("defaults to grouping by studyId when there's more than one study", function() {
                var el = $('[data-value="studyId"]');
                assert.equal(el.isSelected(), true);
            });
        });

        describe('single study with multiple cancer types', () => {
            before(() => {
                var url = `${CBIOPORTAL_URL}/results/cancerTypesSummary?cancer_study_id=brca_metabric&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=brca_metabric_cnaseq&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_metabric_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_metabric_cna`;
                goToUrlAndSetLocalStorage(url);
                $('[data-test=cancerTypeSummaryChart]').waitForDisplayed({
                    timeout: 10000,
                });
            });

            it("defaults to cancerType grouping when there's more than one cancer type in query", function() {
                var el = $('[data-value="cancerType"]');
                assert.equal(el.isSelected(), true);
            });
        });

        describe('query with genes that have no alterations', () => {
            before(() => {
                var url = `${CBIOPORTAL_URL}/results/cancerTypesSummary?cancer_study_id=chol_nccs_2013&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=chol_nccs_2013_sequenced&gene_list=CDKN2A%2520CDKN2B%2520CDKN2C%2520CDK4%2520CDK6%2520CCND2%2520RB1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=chol_nccs_2013_mutations`;
                goToUrlAndSetLocalStorage(url);
                $('[data-test=cancerTypeSummaryChart]').waitForDisplayed({
                    timeout: 10000,
                });
            });

            it('shows an alert message on tabs for missing genes', function() {
                $('=CDKN2A').click();
                $('body').moveTo({ xOffset: 0, yOffset: 0 });
                var res = browser.checkElement(
                    '[data-test="cancerTypeSummaryWrapper"]',
                    '',
                    { hide: ['.qtip'] }
                );
                assertScreenShotMatch(res);
            });
        });

        describe('customization functionality', () => {
            before(() => {
                var url = `${CBIOPORTAL_URL}/results/cancerTypesSummary?cancer_study_id=brca_metabric&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=brca_metabric_cnaseq&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_metabric_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_metabric_cna`;
                goToUrlAndSetLocalStorage(url);
                $('[data-test=cancerTypeSummaryChart]').waitForDisplayed({
                    timeout: 10000,
                });
            });

            it('group by detailed type', function() {
                var el = $('[data-value="cancerTypeDetailed"]');
                el.click();
                var res = browser.checkElement(
                    '[data-test="cancerTypeSummaryWrapper"]',
                    '',
                    { hide: ['.qtip'] }
                );
                assertScreenShotMatch(res);
            });

            it('handles change to absolute value yaxis', function() {
                $('[data-test="cancerSummaryYAxisSelect"]').selectByIndex(1);
                var res = browser.checkElement(
                    '[data-test="cancerTypeSummaryWrapper"]',
                    '',
                    { hide: ['.qtip'] }
                );
                assertScreenShotMatch(res);
            });

            it('handles change to sort of xaxis', function() {
                $('[data-test="cancerSummaryXAxisSelect"]').selectByIndex(1);
                var res = browser.checkElement(
                    '[data-test="cancerTypeSummaryWrapper"]',
                    '',
                    { hide: ['.qtip'] }
                );
                assertScreenShotMatch(res);
            });

            it('handles change to alteration threshold', function() {
                $("[data-test='alterationThresholdInput']").setValue(300);
                browser.keys('Enter');
                var res = browser.checkElement(
                    '[data-test="cancerTypeSummaryWrapper"]',
                    '',
                    { hide: ['.qtip'] }
                );
                // now cleanup
                $("[data-test='alterationThresholdInput']").setValue(0);
                browser.keys('Enter');
            });

            it('handles change to sample total threshold', function() {
                $("[data-test='sampleTotalThresholdInput']").setValue(312);
                browser.keys('Enter');
                var res = browser.checkElement(
                    '[data-test="cancerTypeSummaryWrapper"]',
                    '',
                    { hide: ['.qtip'] }
                );
                assertScreenShotMatch(res);
            });
        });
    });

    describe('Mutations Tab', () => {
        describe('3D structure visualizer', () => {
            before(() => {
                var url = `${CBIOPORTAL_URL}/results/mutations?tab_index=tab_visualize&cancer_study_list=ov_tcga_pub&cancer_study_id=ov_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ov_tcga_pub_mutations&Z_SCORE_THRESHOLD=2.0&case_set_id=ov_tcga_pub_3way_complete&gene_list=BRCA1+BRCA2&gene_set_choice=user-defined-list&Action=Submit`;
                browser.url(url);
                $('[data-test=view3DStructure]').waitForExist({
                    timeout: 10000,
                });
                $('[data-test=view3DStructure]').waitForEnabled({
                    timeout: 10000,
                });
            });

            it('populates PDB info properly', () => {
                $('[data-test=view3DStructure]').click();
                browser.waitUntil(
                    () =>
                        $('[data-test=pdbChainInfoText]').getText() !==
                        'LOADING',
                    10000
                );
                const text = $('[data-test="pdbChainInfoText"]')
                    .getText()
                    .trim();
                assert.ok(
                    text.startsWith(
                        'complex structure of brca1 brct with singly'
                    )
                );
            });
        });

        describe('Lollipop Plot Tracks', () => {
            before(() => {
                var url = `${CBIOPORTAL_URL}/results/mutations?tab_index=tab_visualize&cancer_study_list=ov_tcga_pub&cancer_study_id=ov_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ov_tcga_pub_mutations&Z_SCORE_THRESHOLD=2.0&case_set_id=ov_tcga_pub_3way_complete&gene_list=TP53+PTEN&gene_set_choice=user-defined-list&Action=Submit`;
                browser.url(url);
                $('[data-test=view3DStructure]').waitForExist({
                    timeout: 10000,
                });
                $('[data-test=view3DStructure]').waitForEnabled({
                    timeout: 10000,
                });
                $('[data-test=oncogenic-icon-image]').waitForDisplayed({
                    timeout: 10000,
                });
            });

            it('shows tracks when the corresponding dropdown menu options selected', () => {
                $('.annotation-track-selector').click();

                // open Hotspots track
                $('.//*[text()[contains(.,"Cancer Hotspots")]]').click();
                $('[class=cancer-hotspot-0]').waitForExist({ timeout: 10000 });

                // open OncoKB track
                $('.//*[text()[contains(.,"OncoKB")]]').click();
                $('[class=onco-kb-0]').waitForExist({ timeout: 10000 });

                // open PTM track
                $(
                    './/*[text()[contains(.,"Post Translational Modifications")]]'
                ).click();
                $('[class=ptm-0-0]').waitForExist({ timeout: 10000 });

                // open 3D visualizer via tracks menu
                $('.//*[text()[contains(.,"3D Structure")]]').click();
                $('[class=chain-0]').waitForExist({ timeout: 10000 });
            });

            it('keeps tracks selection state when switching to another gene tab', () => {
                // switch to the PTEN tab
                $('.tabAnchor_PTEN').click();

                // check if the selected tracks still exist on this tab
                $('[class=cancer-hotspot-0]').waitForExist({ timeout: 10000 });
                $('[class=onco-kb-0]').waitForExist({ timeout: 10000 });
                $('[class=chain-0]').waitForExist({ timeout: 10000 });
                $('[class=ptm-0-0]').waitForExist({ timeout: 10000 });
            });
        });
    });

    describe('oql status banner', function() {
        const yesBannerSelector = 'div[data-test="OqlStatusBannerYes"]';
        const noBannerSelector = 'div[data-test="OqlStatusBannerNo"]';
        const unaffectedBannerSelector =
            'div[data-test="OqlStatusBannerUnaffected"]';
        const simpleQueryUrl = `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`;
        const explicitOqlQueryUrl = `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%2520NRAS%2520%250ABRAF%253AMUT&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`;

        before(() => {
            goToUrlAndSetLocalStorage(simpleQueryUrl);
            waitForOncoprint(10000);
        });

        it('should not be present in oncoprint tab with simple query', function() {
            assert(
                !$(
                    `${yesBannerSelector}.oncoprint-oql-status-banner`
                ).isDisplayed()
            );
            assert(
                !$(
                    `${noBannerSelector}.oncoprint-oql-status-banner`
                ).isDisplayed()
            );
        });
        it('should not be present in cancer types summary with simple query', function() {
            $('.tabAnchor_cancerTypesSummary').click();
            browser.pause(500);
            assert(
                !$(
                    `${yesBannerSelector}.cancer-types-summary-oql-status-banner`
                ).isDisplayed()
            );
            assert(
                !$(
                    `${noBannerSelector}.cancer-types-summary-oql-status-banner`
                ).isDisplayed()
            );
        });
        it('should not be present in mutual exclusivity tab with simple query', function() {
            $('.tabAnchor_mutualExclusivity').click();
            browser.pause(500);
            assert(
                !$(`${yesBannerSelector}.mutex-oql-status-banner`).isDisplayed()
            );
            assert(
                !$(`${noBannerSelector}.mutex-oql-status-banner`).isDisplayed()
            );
        });
        it('should not be present in plots tab with simple query', function() {
            $('.tabAnchor_plots').click();
            browser.pause(500);
            assert(
                !$(`${yesBannerSelector}.plots-oql-status-banner`).isDisplayed()
            );
            assert(
                !$(`${noBannerSelector}.plots-oql-status-banner`).isDisplayed()
            );
        });
        it('should not be present in mutations tab with simple query', function() {
            $('.tabAnchor_mutations').click();
            browser.pause(500);
            assert(
                !$(
                    `${yesBannerSelector}.mutations-oql-status-banner`
                ).isDisplayed()
            );
            assert(
                !$(
                    `${noBannerSelector}.mutations-oql-status-banner`
                ).isDisplayed()
            );
            assert(
                !$(
                    `${unaffectedBannerSelector}.mutations-oql-status-banner`
                ).isDisplayed()
            );
        });
        it('should not be present in coexpression tab with simple query', function() {
            $('.tabAnchor_coexpression').click();
            browser.pause(500);
            assert(
                !$(`${yesBannerSelector}.coexp-oql-status-banner`).isDisplayed()
            );
            assert(
                !$(`${noBannerSelector}.coexp-oql-status-banner`).isDisplayed()
            );
        });
        it('should not be present in alteration enrichments tab with simple query', function() {
            $('.tabAnchor_comparison').click();
            $(
                '.comparisonTabSubTabs .tabAnchor_alterations'
            ).waitForDisplayed();
            $('.comparisonTabSubTabs .tabAnchor_alterations').click();
            browser.pause(500);
            assert(
                !$(
                    `${yesBannerSelector}.comparison-oql-status-banner`
                ).isDisplayed()
            );
            assert(
                !$(
                    `${noBannerSelector}.comparison-oql-status-banner`
                ).isDisplayed()
            );
        });
        it('should not be present in survival tab with simple query', function() {
            $('.comparisonTabSubTabs .tabAnchor_survival').click();
            browser.pause(500);
            assert(
                !$(
                    `${yesBannerSelector}.survival-oql-status-banner`
                ).isDisplayed()
            );
            assert(
                !$(
                    `${noBannerSelector}.survival-oql-status-banner`
                ).isDisplayed()
            );
        });
        it('should not be present in download tab with simple query', function() {
            $('.tabAnchor_download').click();
            browser.pause(500);
            assert(
                !$(
                    `${yesBannerSelector}.download-oql-status-banner`
                ).isDisplayed()
            );
            assert(
                !$(
                    `${noBannerSelector}.download-oql-status-banner`
                ).isDisplayed()
            );
        });

        it('should be present in oncoprint tab with explicit query', function() {
            goToUrlAndSetLocalStorage(explicitOqlQueryUrl);
            waitForOncoprint(10000);
            assert(
                $(
                    `${yesBannerSelector}.oncoprint-oql-status-banner`
                ).isDisplayed()
            );
            assert(
                !$(
                    `${noBannerSelector}.oncoprint-oql-status-banner`
                ).isDisplayed()
            );
        });
        it('should be present in cancer types summary with explicit query', function() {
            $('.tabAnchor_cancerTypesSummary').click();
            $(
                `${yesBannerSelector}.cancer-types-summary-oql-status-banner`
            ).waitForDisplayed({ timeout: 10000 });
            assert(
                $(
                    `${yesBannerSelector}.cancer-types-summary-oql-status-banner`
                ).isDisplayed()
            );
            assert(
                !$(
                    `${noBannerSelector}.cancer-types-summary-oql-status-banner`
                ).isDisplayed()
            );
        });
        it('should be present in mutual exclusivity tab with explicit query', function() {
            $('.tabAnchor_mutualExclusivity').click();
            $(`${yesBannerSelector}.mutex-oql-status-banner`).waitForDisplayed({
                timeout: 10000,
            });
            assert(
                $(`${yesBannerSelector}.mutex-oql-status-banner`).isDisplayed()
            );
            assert(
                !$(`${noBannerSelector}.mutex-oql-status-banner`).isDisplayed()
            );
        });
        it('should be present in plots tab with explicit query', function() {
            $('.tabAnchor_plots').click();
            $(`${noBannerSelector}.plots-oql-status-banner`).waitForDisplayed({
                timeout: 10000,
            });
            assert(
                !$(`${yesBannerSelector}.plots-oql-status-banner`).isDisplayed()
            );
            assert(
                $(`${noBannerSelector}.plots-oql-status-banner`).isDisplayed()
            );
        });
        it('should be present in alterations tab with explicit query', function() {
            $('.tabAnchor_comparison').click();
            $('.tabAnchor_alterations').waitForDisplayed();
            $('.tabAnchor_alterations').click();

            $(
                `${yesBannerSelector}.comparison-oql-status-banner`
            ).waitForDisplayed({ timeout: 10000 });
            assert(
                !$(
                    `${unaffectedBannerSelector}.comparison-oql-status-banner`
                ).isDisplayed()
            );
            assert(
                !$(
                    `${noBannerSelector}.comparison-oql-status-banner`
                ).isDisplayed()
            );
            assert(
                $(
                    `${yesBannerSelector}.comparison-oql-status-banner`
                ).isDisplayed()
            );
        });
        it('should be present in coexpression tab with explicit query', function() {
            $('.tabAnchor_coexpression').click();
            $(`${noBannerSelector}.coexp-oql-status-banner`).waitForDisplayed({
                timeout: 10000,
            });
            assert(
                !$(`${yesBannerSelector}.coexp-oql-status-banner`).isDisplayed()
            );
            assert(
                $(`${noBannerSelector}.coexp-oql-status-banner`).isDisplayed()
            );
        });
        it('should be present in alteration enrichments tab with explicit query', function() {
            $('.tabAnchor_comparison').click();
            $(
                '.comparisonTabSubTabs .tabAnchor_alterations'
            ).waitForDisplayed();
            $('.comparisonTabSubTabs .tabAnchor_alterations').click();
            $(
                `${yesBannerSelector}.comparison-oql-status-banner`
            ).waitForDisplayed({ timeout: 10000 });
            assert(
                $(
                    `${yesBannerSelector}.comparison-oql-status-banner`
                ).isDisplayed()
            );
            assert(
                !$(
                    `${noBannerSelector}.comparison-oql-status-banner`
                ).isDisplayed()
            );
        });
        it('should be present in survival tab with explicit query', function() {
            $('.comparisonTabSubTabs .tabAnchor_survival').click();
            $(
                `${yesBannerSelector}.comparison-oql-status-banner`
            ).waitForDisplayed({ timeout: 10000 });
            assert(
                $(
                    `${yesBannerSelector}.comparison-oql-status-banner`
                ).isDisplayed()
            );
            assert(
                !$(
                    `${noBannerSelector}.comparison-oql-status-banner`
                ).isDisplayed()
            );
        });
        it('should be present in download tab with explicit query', function() {
            $('.tabAnchor_download').click();
            $(
                `${yesBannerSelector}.download-oql-status-banner`
            ).waitForDisplayed({ timeout: 10000 });
            assert(
                $(
                    `${yesBannerSelector}.download-oql-status-banner`
                ).isDisplayed()
            );
            assert(
                !$(
                    `${noBannerSelector}.download-oql-status-banner`
                ).isDisplayed()
            );
        });
    });
});
