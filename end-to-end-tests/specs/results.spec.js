var assertScreenShotMatch = require('../lib/testUtils').assertScreenShotMatch;

var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('./specUtils').waitForOncoprint;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

describe('Results Page', function() {

    //this.retries(2);

    before(function(){
        var url = `${CBIOPORTAL_URL}`;
        browser.url(url);
        browser.localStorage('POST', {key: 'localdev', value: 'true'});
        browser.refresh();
    });

    describe("Cancer Type Summary Bar Chart", ()=>{


        describe('single study query with four genes', ()=>{
            before(()=>{
                var url = `${CBIOPORTAL_URL}/index.do?tab_index=tab_visualize&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&case_ids=&gene_list=BRAF+KRAS+NRAS&gene_set_choice=user-defined-list&Action=Submit#pancancer_study_summary`;
                browser.url(url);
                browser.waitForVisible('[data-test=cancerTypeSummaryChart]',10000)
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
                var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=all&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=%20&tab_index=tab_visualize&Action=Submit&cancer_study_list=coadread_tcga_pub%2Ccellline_nci60&show_samples=false&clinicallist=CANCER_STUDY#pancancer_study_summary`;
                browser.url(url);
                browser.waitForVisible('[data-test=cancerTypeSummaryChart]',10000)
            });

            it("defaults to grouping by studyId when there's more than one study",function(){
                var el = browser.elements('[data-value="studyId"]');
                assert.equal(el.isSelected(), true);
            });

        });

        describe('single study with multiple cancer types', ()=>{
            before(()=>{
                var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=brca_metabric&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=brca_metabric_cnaseq&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_metabric_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_metabric_cna#pancancer_study_summary`;
                browser.url(url);
                browser.waitForVisible('[data-test=cancerTypeSummaryChart]',10000)
            });

            it("defaults to cancerType grouping when there's more than one cancer type in query",function(){
                var el = browser.elements('[data-value="cancerType"]');
                assert.equal(el.isSelected(), true);
            });

        });

        describe('query with genes that have no alterations', ()=>{
            before(()=>{
                var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=chol_nccs_2013&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=chol_nccs_2013_sequenced&gene_list=CDKN2A%2520CDKN2B%2520CDKN2C%2520CDK4%2520CDK6%2520CCND2%2520RB1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=chol_nccs_2013_mutations#pancancer_study_summary`;
                browser.url(url);
                browser.waitForVisible('[data-test=cancerTypeSummaryChart]',10000)
            });

            it("shows an alert message on tabs for missing genes",function(){
                browser.click('=CDKN2A');
                var res = browser.checkElement('#pancancer_study_summary', { hide:['.qtip'] });
                assertScreenShotMatch(res);
            });
        });
        
       
        describe('customization functionality', ()=>{
            before(()=>{
                var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=brca_metabric&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=brca_metabric_cnaseq&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_metabric_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_metabric_cna#pancancer_study_summary`;
                browser.url(url);
                browser.waitForVisible('[data-test=cancerTypeSummaryChart]',10000)
            });

            it("group by detailed type and opens cancer type summary custom controls",function(){
                var el = browser.element('[data-value="cancerTypeDetailed"]');
                el.click();
                var customizeButton = browser.elements('.cancer-summary--chart-buttons button').value[0];
                customizeButton.click();
                var res = browser.checkElement('#pancancer_study_summary', { hide:['.qtip'] });
                assertScreenShotMatch(res);
            });

            it('handles change to absolute value yaxis',function(){
                browser.selectByIndex('[data-test="cancerSummaryYAxisSelect"]',1);
                var res = browser.checkElement('#pancancer_study_summary', { hide:['.qtip'] });
                console.log(res);
                assertScreenShotMatch(res);
            });

            it('handles change to sort of xaxis',function(){
                browser.selectByIndex('[data-test="cancerSummaryXAxisSelect"]',1);
                var res = browser.checkElement('#pancancer_study_summary', { hide:['.qtip'] });
                assertScreenShotMatch(res);
            });

            it('handles change to alteration threshold',function(){
                browser.setValue("[data-test='alterationThresholdInput']",300)
                browser.keys("Enter");
                var res = browser.checkElement('#pancancer_study_summary', { hide:['.qtip'] });
                // now cleanup
                browser.setValue("[data-test='alterationThresholdInput']",0)
                browser.keys("Enter");
            });

            it('handles change to sample total threshold',function(){
                browser.setValue("[data-test='sampleTotalThresholdInput']",312)
                browser.keys("Enter");
                var res = browser.checkElement('#pancancer_study_summary', { hide:['.qtip'] });
                assertScreenShotMatch(res);
            });

        });


    });

});