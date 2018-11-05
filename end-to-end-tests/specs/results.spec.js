var assertScreenShotMatch = require('../lib/testUtils').assertScreenShotMatch;

var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('./specUtils').waitForOncoprint;
var goToUrlAndSetLocalStorage = require('./specUtils').goToUrlAndSetLocalStorage;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

describe('Results Page', function() {

    //this.retries(2);

    before(function(){
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}`);
    });

    describe("Cancer Type Summary Bar Chart", ()=>{


        describe('single study query with four genes', ()=>{
            before(()=>{
                var url = `${CBIOPORTAL_URL}/results/cancerTypesSummary?tab_index=tab_visualize&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&case_ids=&gene_list=BRAF+KRAS+NRAS&gene_set_choice=user-defined-list&Action=Submit`;
                goToUrlAndSetLocalStorage(url);
                browser.waitForVisible('[data-test="cancerTypeSummaryChart"]',10000)
            });

            it('defaults to cancerTypeDetailed', ()=>{
                var el = browser.elements('[data-value="cancerTypeDetailed"]');
                assert.equal(el.isSelected(), true);
            });

            it('three gene tabs plus "all genes" equals four total tabs, in order of genes in oql', ()=>{
                var tabs = browser.elements("[data-test='cancerTypeSummaryWrapper'] .nav li a");
                assert.equal(tabs.value.length, 4, 'three gene tabs plus "all genes" equals four total tabs');
                assert.equal(tabs.value[0].getText(), 'All Queried Genes');
                assert.deepEqual( tabs.value.map((tab)=>tab.getText()), ['All Queried Genes','BRAF','KRAS','NRAS'], 'we have all genes and genes in order of oql' )
            });

        });

        describe('cross study query', ()=>{
            before(()=>{
                var url = `${CBIOPORTAL_URL}/results/cancerTypesSummary?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=all&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=%20&tab_index=tab_visualize&Action=Submit&cancer_study_list=coadread_tcga_pub%2Ccellline_nci60&show_samples=false&clinicallist=CANCER_STUDY`;
                goToUrlAndSetLocalStorage(url);
                browser.waitForVisible('[data-test=cancerTypeSummaryChart]',10000)
            });

            it("defaults to grouping by studyId when there's more than one study",function(){
                var el = browser.elements('[data-value="studyId"]');
                assert.equal(el.isSelected(), true);
            });

        });

        describe('single study with multiple cancer types', ()=>{
            before(()=>{
                var url = `${CBIOPORTAL_URL}/results/cancerTypesSummary?cancer_study_id=brca_metabric&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=brca_metabric_cnaseq&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_metabric_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_metabric_cna`;
                goToUrlAndSetLocalStorage(url);
                browser.waitForVisible('[data-test=cancerTypeSummaryChart]',10000)
            });

            it("defaults to cancerType grouping when there's more than one cancer type in query",function(){
                var el = browser.elements('[data-value="cancerType"]');
                assert.equal(el.isSelected(), true);
            });

        });

        describe('query with genes that have no alterations', ()=>{
            before(()=>{
                var url = `${CBIOPORTAL_URL}/results/cancerTypesSummary?cancer_study_id=chol_nccs_2013&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=chol_nccs_2013_sequenced&gene_list=CDKN2A%2520CDKN2B%2520CDKN2C%2520CDK4%2520CDK6%2520CCND2%2520RB1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=chol_nccs_2013_mutations`;
                goToUrlAndSetLocalStorage(url);
                browser.waitForVisible('[data-test=cancerTypeSummaryChart]',10000)
            });

            it("shows an alert message on tabs for missing genes",function(){
                browser.click('=CDKN2A');
                var res = browser.checkElement('[data-test="cancerTypeSummaryWrapper"]', { hide:['.qtip'] });
                assertScreenShotMatch(res);
            });
        });


        describe('customization functionality', ()=>{
            before(()=>{
                var url = `${CBIOPORTAL_URL}/results/cancerTypesSummary?cancer_study_id=brca_metabric&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=brca_metabric_cnaseq&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_metabric_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_metabric_cna`;
                goToUrlAndSetLocalStorage(url);
                browser.waitForVisible('[data-test=cancerTypeSummaryChart]',10000)
            });

            it("group by detailed type",function(){
                var el = browser.element('[data-value="cancerTypeDetailed"]');
                el.click();
                var res = browser.checkElement('[data-test="cancerTypeSummaryWrapper"]', { hide:['.qtip'] });
                assertScreenShotMatch(res);
            });

            it('handles change to absolute value yaxis',function(){
                browser.selectByIndex('[data-test="cancerSummaryYAxisSelect"]',1);
                var res = browser.checkElement('[data-test="cancerTypeSummaryWrapper"]', { hide:['.qtip'] });
                console.log(res);
                assertScreenShotMatch(res);
            });

            it('handles change to sort of xaxis',function(){
                browser.selectByIndex('[data-test="cancerSummaryXAxisSelect"]',1);
                var res = browser.checkElement('[data-test="cancerTypeSummaryWrapper"]', { hide:['.qtip'] });
                assertScreenShotMatch(res);
            });

            it('handles change to alteration threshold',function(){
                browser.setValue("[data-test='alterationThresholdInput']",300)
                browser.keys("Enter");
                var res = browser.checkElement('[data-test="cancerTypeSummaryWrapper"]', { hide:['.qtip'] });
                // now cleanup
                browser.setValue("[data-test='alterationThresholdInput']",0)
                browser.keys("Enter");
            });

            it('handles change to sample total threshold',function(){
                browser.setValue("[data-test='sampleTotalThresholdInput']",312)
                browser.keys("Enter");
                var res = browser.checkElement('[data-test="cancerTypeSummaryWrapper"]', { hide:['.qtip'] });
                assertScreenShotMatch(res);
            });

        });


    });

    describe("Mutations Tab", () => {

        describe('3D structure visualizer', () => {
            before(() => {
                var url = `${CBIOPORTAL_URL}/results/mutations?tab_index=tab_visualize&cancer_study_list=ov_tcga_pub&cancer_study_id=ov_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ov_tcga_pub_mutations&Z_SCORE_THRESHOLD=2.0&case_set_id=ov_tcga_pub_3way_complete&case_ids=&gene_list=BRCA1+BRCA2&gene_set_choice=user-defined-list&Action=Submit`;
                browser.url(url);
                browser.waitForExist('[data-test=view3DStructure]', 10000);
                browser.waitForEnabled('[data-test=view3DStructure]', 10000);
            });

            it('populates PDB info properly', () => {
                browser.click('[data-test=view3DStructure]');
                browser.waitUntil(() => (browser.getText('[data-test=pdbChainInfoText]') !== "LOADING"), 10000);
                const text = browser.elements('[data-test="pdbChainInfoText"]').value[0].getText().trim();
                assert.ok(text.startsWith('complex structure of brca1 brct with singly'));
            });

        });

    });

    describe('oql status banner', function() {
        const yesBannerSelector = 'div[data-test="OqlStatusBannerYes"]';
        const noBannerSelector = 'div[data-test="OqlStatusBannerNo"]';
        const unaffectedBannerSelector = 'div[data-test="OqlStatusBannerUnaffected"]';
        const simpleQueryUrl = `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`;
        const explicitOqlQueryUrl = `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%2520NRAS%2520%250ABRAF%253AMUT&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`;

        before(()=>{
            goToUrlAndSetLocalStorage(simpleQueryUrl);
            waitForOncoprint(10000);
        });

        it("should not be present in oncoprint tab with simple query", function() {
            assert(!browser.isVisible(`${yesBannerSelector}.oncoprint-oql-status-banner`));
            assert(!browser.isVisible(`${noBannerSelector}.oncoprint-oql-status-banner`));
        });
        it("should not be present in cancer types summary with simple query", function() {
            browser.click("a.tabAnchor_cancerTypesSummary");
            browser.pause(500);
            assert(!browser.isVisible(`${yesBannerSelector}.cancer-types-summary-oql-status-banner`));
            assert(!browser.isVisible(`${noBannerSelector}.cancer-types-summary-oql-status-banner`));
        });
        it("should not be present in mutual exclusivity tab with simple query", function() {
            browser.click("a.tabAnchor_mutualExclusivity");
            browser.pause(500);
            assert(!browser.isVisible(`${yesBannerSelector}.mutex-oql-status-banner`));
            assert(!browser.isVisible(`${noBannerSelector}.mutex-oql-status-banner`));
        });
        it("should not be present in plots tab with simple query", function(){
            browser.click("a.tabAnchor_plots");
            browser.pause(500);
            assert(!browser.isVisible(`${yesBannerSelector}.plots-oql-status-banner`));
            assert(!browser.isVisible(`${noBannerSelector}.plots-oql-status-banner`));
        });
        it("should not be present in mutations tab with simple query", function(){
            browser.click("a.tabAnchor_mutations");
            browser.pause(500);
            assert(!browser.isVisible(`${yesBannerSelector}.mutations-oql-status-banner`));
            assert(!browser.isVisible(`${noBannerSelector}.mutations-oql-status-banner`));
            assert(!browser.isVisible(`${unaffectedBannerSelector}.mutations-oql-status-banner`));
        });
        it("should not be present in coexpression tab with simple query", function(){
            browser.click("a.tabAnchor_coexpression");
            browser.pause(500);
            assert(!browser.isVisible(`${yesBannerSelector}.coexp-oql-status-banner`));
            assert(!browser.isVisible(`${noBannerSelector}.coexp-oql-status-banner`));
        });
        it("should not be present in enrichments tab with simple query", function(){
            browser.click("a.tabAnchor_enrichments");
            browser.pause(500);
            assert(!browser.isVisible(`${yesBannerSelector}.enrichments-oql-status-banner`));
            assert(!browser.isVisible(`${noBannerSelector}.enrichments-oql-status-banner`));
        });
        it("should not be present in survival tab with simple query", function(){
            browser.click("a.tabAnchor_survival");
            browser.pause(500);
            assert(!browser.isVisible(`${yesBannerSelector}.survival-oql-status-banner`));
            assert(!browser.isVisible(`${noBannerSelector}.survival-oql-status-banner`));
        });
        it("should not be present in download tab with simple query", function(){
            browser.click("a.tabAnchor_download");
            browser.pause(500);
            assert(!browser.isVisible(`${yesBannerSelector}.download-oql-status-banner`));
            assert(!browser.isVisible(`${noBannerSelector}.download-oql-status-banner`));
        });
        it("should not be present in expression tab with simple query", function() {
            goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/results/expression?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=all&gene_list=TP53&geneset_list=+&tab_index=tab_visualize&Action=Submit&cancer_study_list=acc_tcga%2Cchol_tcga%2Cesca_tcga`);
            browser.waitForVisible(".borderedChart svg", 10000);
            assert(!browser.isVisible(`${yesBannerSelector}.expression-oql-status-banner`));
            assert(!browser.isVisible(`${noBannerSelector}.expression-oql-status-banner`));
        });


        it("should be present in oncoprint tab with explicit query", function() {
            goToUrlAndSetLocalStorage(explicitOqlQueryUrl);
            waitForOncoprint(10000);
            assert(browser.isVisible(`${yesBannerSelector}.oncoprint-oql-status-banner`));
            assert(!browser.isVisible(`${noBannerSelector}.oncoprint-oql-status-banner`));
        });
        it("should be present in cancer types summary with explicit query", function() {
            browser.click("a.tabAnchor_cancerTypesSummary");
            browser.waitForVisible(`${yesBannerSelector}.cancer-types-summary-oql-status-banner`, 10000);
            assert(browser.isVisible(`${yesBannerSelector}.cancer-types-summary-oql-status-banner`));
            assert(!browser.isVisible(`${noBannerSelector}.cancer-types-summary-oql-status-banner`));
        });
        it("should be present in mutual exclusivity tab with explicit query", function() {
            browser.click("a.tabAnchor_mutualExclusivity");
            browser.waitForVisible(`${yesBannerSelector}.mutex-oql-status-banner`, 10000);
            assert(browser.isVisible(`${yesBannerSelector}.mutex-oql-status-banner`));
            assert(!browser.isVisible(`${noBannerSelector}.mutex-oql-status-banner`));
        });
        it("should be present in plots tab with explicit query", function(){
            browser.click("a.tabAnchor_plots");
            browser.waitForVisible(`${noBannerSelector}.plots-oql-status-banner`, 10000);
            assert(!browser.isVisible(`${yesBannerSelector}.plots-oql-status-banner`));
            assert(browser.isVisible(`${noBannerSelector}.plots-oql-status-banner`));
        });
        it("should be present in mutations tab with explicit query", function(){
            browser.click("a.tabAnchor_mutations");
            browser.waitForVisible(`${unaffectedBannerSelector}.mutations-oql-status-banner`, 10000);
            assert(!browser.isVisible(`${yesBannerSelector}.mutations-oql-status-banner`));
            assert(!browser.isVisible(`${noBannerSelector}.mutations-oql-status-banner`));
            assert(browser.isVisible(`${unaffectedBannerSelector}.mutations-oql-status-banner`));
        });
        it("should be present in coexpression tab with explicit query", function(){
            browser.click("a.tabAnchor_coexpression");
            browser.waitForVisible(`${noBannerSelector}.coexp-oql-status-banner`, 10000);
            assert(!browser.isVisible(`${yesBannerSelector}.coexp-oql-status-banner`));
            assert(browser.isVisible(`${noBannerSelector}.coexp-oql-status-banner`));
        });
        it("should be present in enrichments tab with explicit query", function(){
            browser.click("a.tabAnchor_enrichments");
            browser.waitForVisible(`${yesBannerSelector}.enrichments-oql-status-banner`, 10000);
            assert(browser.isVisible(`${yesBannerSelector}.enrichments-oql-status-banner`));
            assert(!browser.isVisible(`${noBannerSelector}.enrichments-oql-status-banner`));
        });
        it("should be present in survival tab with explicit query", function(){
            browser.click("a.tabAnchor_survival");
            browser.waitForVisible(`${yesBannerSelector}.survival-oql-status-banner`, 10000);
            assert(browser.isVisible(`${yesBannerSelector}.survival-oql-status-banner`));
            assert(!browser.isVisible(`${noBannerSelector}.survival-oql-status-banner`));
        });
        it("should be present in download tab with explicit query", function(){
            browser.click("a.tabAnchor_download");
            browser.waitForVisible(`${yesBannerSelector}.download-oql-status-banner`, 10000);
            assert(browser.isVisible(`${yesBannerSelector}.download-oql-status-banner`));
            assert(!browser.isVisible(`${noBannerSelector}.download-oql-status-banner`));
        });
        it("should be present in expression tab with explicit query", function() {
            goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/results/expression?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=all&gene_list=TP53%253AMUT%253B&geneset_list=+&tab_index=tab_visualize&Action=Submit&cancer_study_list=acc_tcga%2Cchol_tcga%2Cesca_tcga`);
            browser.waitForVisible(`${noBannerSelector}.expression-oql-status-banner`, 10000);
            assert(!browser.isVisible(`${yesBannerSelector}.expression-oql-status-banner`));
            assert(browser.isVisible(`${noBannerSelector}.expression-oql-status-banner`));
        });
    });

});


