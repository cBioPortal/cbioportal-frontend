var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('./specUtils').waitForOncoprint;
var goToUrlAndSetLocalStorage = require('./specUtils').goToUrlAndSetLocalStorage;
var assertScreenShotMatch = require('../lib/testUtils').assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

function runResultsTests(){

    it('render the oncoprint', function(){
        waitForOncoprint();
        browser.pause(2000);
        var res = browser.checkElement('#oncoprint');
        assertScreenShotMatch(res);
    });

    // can't get it to pass reliably
    it.skip('igv_tab tab', function(){
        browser.click("[href='#igv_tab']");
        browser.waitForExist('#cnSegmentsFrame', 20000);
        var res = browser.checkElement('#igv_tab',{hide:['.qtip'] });
        assertScreenShotMatch(res);
    });

    it('cancer type summary', function(){
        browser.click("[href='#pancancer_study_summary']");
        browser.waitForVisible('[data-test="cancerTypeSummaryChart"]',10000);
        var res = browser.checkElement('#pancancer_study_summary', { hide:['.qtip'] });
        assertScreenShotMatch(res);
    });

    it('mutex tab', function(){
        browser.click("[href='#mutex']");
        var res = browser.checkElement('#mutex',{ hide:['.qtip'] });
        assertScreenShotMatch(res);
    });

    it('plots tab', function(){
        browser.click("[href='#plots']");
        browser.waitForExist('#plots-box svg',10000);
        var res = browser.checkElement('#plots', { hide:['.qtip'], misMatchTolerance:1 });
        assertScreenShotMatch(res);
    });

    it('mutation tab', function(){
        browser.click("[href='#mutation_details']");
        browser.waitForVisible('.borderedChart svg',20000);
        var res = browser.checkElement('#mutation_details',{hide:['.qtip'] });
        assertScreenShotMatch(res);
    });

    it('coexpression tab', function(){
        browser.click("[href='#coexp']");
        browser.waitForVisible('#coexp_table_div_KRAS',10000);
        var res = browser.checkElement('#coexp',{hide:['.qtip'] });
        assertScreenShotMatch(res);
    });

    it('survival tab', function(){
        browser.click("[href='#survival']");
        browser.waitForVisible('[data-test=SurvivalChart] svg',10000);
        var res = browser.checkElement('#survival');
        assertScreenShotMatch(res);
    });

    it('network tab', function(){
        browser.click("[href='#network']");
        browser.waitForVisible('#cytoscapeweb canvas',20000);
        var res = browser.checkElement("#network",{hide:['.qtip','canvas'] });
        assertScreenShotMatch(res);
    });

    it.skip('data_download tab', function(){
        browser.click("[href='#data_download']");
        //  browser.pause(1000);
        browser.waitForExist("#text_area_gene_alteration_freq",20000);
        browser.waitUntil(function(){ return browser.getValue("#text_area_gene_alteration_freq").length > 0 },20000);
        var res = browser.checkElement('#data_download',{hide:['.qtip'] });
        assertScreenShotMatch(res);
    });

}

describe('result page screenshot tests', function(){
    before(function(){
        var url = `${CBIOPORTAL_URL}/index.do?tab_index=tab_visualize&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&case_ids=&gene_list=KRAS+NRAS+BRAF&gene_set_choice=user-defined-list&Action=Submit&show_samples=false&`;
        goToUrlAndSetLocalStorage(url);
    });

    runResultsTests()


});

describe("oncoprint screenshot tests", function() {
    it("coadread_tcga_pub with clinical and heatmap tracks", ()=>{
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=1&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=coadread_tcga_pub_rna_seq_mrna_median_Zscores&show_samples=false&clinicallist=0%2C2%2CMETHYLATION_SUBTYPE&heatmap_track_groups=coadread_tcga_pub_rna_seq_mrna_median_Zscores%2CKRAS%2CNRAS%2CBRAF&`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(10000);
        var res = browser.checkElement('#oncoprint');
        assertScreenShotMatch(res);
    });
    it("acc_tcga with clinical and heatmap tracks", ()=>{
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=acc_tcga&Z_SCORE_THRESHOLD=1&RPPA_SCORE_THRESHOLD=1&data_priority=0&case_set_id=acc_tcga_all&gene_list=SOX9%20RAN%20TNK2%20EP300%20PXN%20NCOA2%20AR%20NRIP1%20NCOR1%20NCOR2&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=acc_tcga_rna_seq_v2_mrna_median_Zscores&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=acc_tcga_rppa_Zscores&show_samples=false&clinicallist=0%2C1%2CMETASTATIC_DX_CONFIRMED_BY&heatmap_track_groups=acc_tcga_rna_seq_v2_mrna_median_Zscores%2CSOX9%2CRAN%2CTNK2%2CEP300%2CPXN%2CNCOA2%2CAR%2CNRIP1%2CNCOR1%2CNCOR2`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(10000);
        var res = browser.checkElement('#oncoprint');
        assertScreenShotMatch(res);
    });
    it("blca_tcga with clinical and heatmap tracks", ()=>{
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=blca_tcga_pub&Z_SCORE_THRESHOLD=1&RPPA_SCORE_THRESHOLD=1&data_priority=0&case_set_id=blca_tcga_pub_all&gene_list=SOX9%20RAN%20TNK2%20EP300%20PXN%20NCOA2%20AR%20NRIP1%20NCOR1%20NCOR2&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=blca_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=blca_tcga_pub_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=blca_tcga_pub_rna_seq_mrna_median_Zscores&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=blca_tcga_pub_rppa_Zscores&show_samples=false&heatmap_track_groups=blca_tcga_pub_rna_seq_mrna_median_Zscores%2CSOX9%2CRAN%2CTNK2%2CEP300%2CPXN%2CNCOA2%2CAR%2CNRIP1%2CNCOR1%2CNCOR2&clinicallist=CANCER_TYPE_DETAILED%2CMETASTATIC_SITE_OTHER%2CNEW_TUMOR_EVENT_AFTER_INITIAL_TREATMENT`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(10000);
        var res = browser.checkElement('#oncoprint');
        assertScreenShotMatch(res);
    });
});

describe('patient view page screenshot test', function(){
    before(function(){
        var url = `${CBIOPORTAL_URL}/case.do#/patient?studyId=lgg_ucsf_2014&caseId=P04`;
        goToUrlAndSetLocalStorage(url);
    });

    it('patient view lgg_ucsf_2014 P04', function() {
        // find oncokb image
        var oncokbIndicator = $('[data-test="oncogenic-icon-image"]');
        oncokbIndicator.waitForExist(30000);
        // find vaf plot
        var vafPlot = $('.vafPlot');
        vafPlot.waitForExist(30000);

        var res = browser.checkElement('#mainColumn', {hide:['.qtip'] });
        assertScreenShotMatch(res);
    });
});

describe('study view screenshot test', function(){
    before(function(){
        var url = `${CBIOPORTAL_URL}/study.do?cancer_study_id=lgg_ucsf_2014`;
        goToUrlAndSetLocalStorage(url);
    });

    it('study view lgg_ucsf_2014', function() {
        // assume that when mutated genes header is loaded the full page is
        // done loading
        var mutatedGenesHeader = $('#chart-new-mutated_genes-chart-header');
        mutatedGenesHeader.waitForExist(30000);

        // give charts time to render
        browser.setViewportSize({ height: 1600, width: 1000 })
        browser.pause(5000);

        var res = browser.checkElement('#page_wrapper_table', {hide:['.qtip'] });
        assertScreenShotMatch(res);
    });
});

describe('result page tabs, loading from session id', function(){
    before(function(){
        var url = `${CBIOPORTAL_URL}/index.do?session_id=596f9fa3498e5df2e292bdfd`;
        goToUrlAndSetLocalStorage(url);
    });

    runResultsTests();

});
