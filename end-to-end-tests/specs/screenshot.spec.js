var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('./specUtils').waitForOncoprint;
var goToUrlAndSetLocalStorage = require('./specUtils').goToUrlAndSetLocalStorage;
var sessionServiceIsEnabled = require('./specUtils').sessionServiceIsEnabled;
var assertScreenShotMatch = require('../lib/testUtils').assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");


function runResultsTestSuite(prefix){

    it(`${prefix} render the oncoprint`, function(){
        waitForOncoprint(10000);
        var res = browser.checkElement('#oncoprint', { hide:['.oncoprint__controls']}); // just hide the controls bc for some reason they keep showing up transparent in this test only
        assertScreenShotMatch(res);
    });

    // can't get it to pass reliably
    it.skip(`${prefix} igv_tab tab`, function(){
        browser.click("[href='#igv_tab']");
        browser.waitForExist('#cnSegmentsFrame', 20000);
        var res = browser.checkElement('#igv_tab',{hide:['.qtip'] });
        assertScreenShotMatch(res);
    });

    it(`${prefix} cancer type summary`, function(){
        browser.click("[href='#pancancer_study_summary']");
        browser.waitForVisible('[data-test="cancerTypeSummaryChart"]',10000);
        var res = browser.checkElement('#pancancer_study_summary', { hide:['.qtip'] });
        assertScreenShotMatch(res);
    });

    it(`${prefix} mutex tab`, function(){
        browser.click("[href='#mutex']");
        var res = browser.checkElement('#mutex',{ hide:['.qtip'] });
        assertScreenShotMatch(res);
    });

    it(`${prefix} plots tab`, function(){
        browser.click("[href='#plots']");
        waitForAndCheckPlotsTab();
    });

    it(`${prefix} mutation tab`, function(){
        browser.click("[href='#mutation_details']");
        browser.waitForVisible('.borderedChart svg',20000);
        var res = browser.checkElement('#mutation_details',{hide:['.qtip', '[data-test=view3DStructure]', '[data-test=GeneSummaryUniProt]'], viewportChangePause:4000}); // hide these things because the timing of data loading makes this test so flaky
        assertScreenShotMatch(res);
    });

    it(`${prefix} coexpression tab`, function(){
        browser.click("[href='#coexp']");
        browser.waitForVisible('div[data-test="CoExpressionPlot"]',10000);
        var res = browser.checkElement('#coexp', { hide:['.qtip'] } );
        assertScreenShotMatch(res);
    });

    it(`${prefix} enrichments tab`, function(){
        browser.click("[href='#enrichementTabDiv']");
        browser.waitForVisible('div[data-test="MutationEnrichmentsTab"]',10000);
        browser.click('b=CDK14');
        var res = browser.checkElement('#enrichementTabDiv', { hide:['.qtip'] } );
        assertScreenShotMatch(res);
    });

    it(`${prefix} survival tab`, function(){
        browser.click("[href='#survival']");
        browser.waitForVisible('[data-test=SurvivalChart] svg',10000);
        var res = browser.checkElement('#survival', { hide:['.qtip'] } );
        assertScreenShotMatch(res);
    });

    it(`${prefix} network tab`, function(){

        browser.click("[href='#network']");

        browser.waitForExist('iframe#networkFrame', 10000);

        browser.frame('networkFrame', function(err, result) {
                if (err) console.log(err);
            })
        browser.waitForVisible('#cytoscapeweb canvas',60000);
        browser.execute(function(){
            $("<style>canvas { visibility: hidden} </style>").appendTo("body");
        });
        browser.frame(null);
        var res = browser.checkElement("#network",{hide:['.qtip','canvas'] });

        assertScreenShotMatch(res);
    });

    it.skip(`${prefix} data_download tab`, function(){
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

    runResultsTestSuite('no session')

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
    it("msk_impact_2017 query STK11:HOMDEL MUT", ()=>{
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_Non-Small_Cell_Lung_Cancer&gene_list=STK11%253A%2520HOMDEL%2520MUT&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`);
        waitForOncoprint(20000);
        var res = browser.checkElement('#oncoprint');
        assertScreenShotMatch(res);
    });
    it("hcc_inserm_fr_2015 with genes including TERT - it should show orange promoter mutations in TERT", function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/index.do?cancer_study_id=hcc_inserm_fr_2015&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=hcc_inserm_fr_2015_sequenced&gene_list=SOX9%2520RAN%2520TNK2%2520EP300%2520PXN%2520NCOA2%2520AR%2520NRIP1%2520NCOR1%2520NCOR2%2520TERT&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=hcc_inserm_fr_2015_mutations`);
        waitForOncoprint(20000);
        var res = browser.checkElement('#oncoprint');
        assertScreenShotMatch(res);
    });
    it("msk_impact_2017 with SOS1 - SOS1 should be not sequenced", function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_all&gene_list=SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(20000);
        var res = browser.checkElement("#oncoprint");
        assertScreenShotMatch(res);
    });
    it("msk_impact_2017 with ALK and SOS1 - SOS1 should be not sequenced", function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_all&gene_list=ALK%2520SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(20000);
        var res = browser.checkElement("#oncoprint");
        assertScreenShotMatch(res);
    });
    it("msk_impact_2017 with SOS1 with CNA profile - SOS1 should not be sequenced", function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_all&gene_list=SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(20000);
        var res = browser.checkElement("#oncoprint");
        assertScreenShotMatch(res);
    });
    it("brca_tcga_pub with KRAS NRAS BRAF and methylation heatmap tracks", function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=brca_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=brca_tcga_pub_cnaseq&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_tcga_pub_gistic&show_samples=false&heatmap_track_groups=brca_tcga_pub_methylation_hm27%2CKRAS%2CNRAS%2CBRAF%2CTP53%2CBRCA1%2CBRCA2`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(10000);
        var res = browser.checkElement("#oncoprint");
        assertScreenShotMatch(res);
    });
    it("'profiled in' tracks in msk impact with 3 n/p genes", function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=msk_impact_2017_cnaseq&gene_list=AKR1C1%2520AKR1C2%2520AKR1C4&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(20000);
        var res = browser.checkElement("#oncoprint");
        assertScreenShotMatch(res);
    });
    it("'profiled in' tracks in multiple study with SOS1", function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=all&gene_list=SOS1&geneset_list=%20&tab_index=tab_visualize&Action=Submit&cancer_study_list=msk_impact_2017%2Cbrca_bccrc&show_samples=false&clinicallist=CANCER_STUDY%2CPROFILED_IN_MUTATION_EXTENDED%2CPROFILED_IN_msk_impact_2017_cna#summary`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(20000);
        var res = browser.checkElement("#oncoprint");
        assertScreenShotMatch(res);
    });
});

describe("download tab screenshot tests", function() {
    it("download tab - msk_impact_2017 with ALK and SOS1 - SOS1 should be not sequenced", function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_all&gene_list=ALK%2520SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`;
        goToUrlAndSetLocalStorage(url);
        browser.click("[href='#data_download']");
        browser.waitForExist('[data-test="dataDownloadGeneAlterationTable"] tr > td > svg', 20000);
        var res = browser.checkElement('#data_download',{hide:['.qtip'] });
        assertScreenShotMatch(res);
    });
});

describe('patient view page screenshot test', function(){
    before(function(){
        var url = `${CBIOPORTAL_URL}/patient?studyId=lgg_ucsf_2014&caseId=P04`;
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

        var res = browser.checkElement('#page_wrapper_table', {hide:['.qtip', '#footer-span-version'] });
        assertScreenShotMatch(res);
    });
});

describe("coexpression tab screenshot tests", function() {
    before(function() {
        var url = `${CBIOPORTAL_URL}/index.do?tab_index=tab_visualize&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&case_ids=&gene_list=KRAS+NRAS+BRAF&gene_set_choice=user-defined-list&Action=Submit#coexp`;
        goToUrlAndSetLocalStorage(url);
    });
    it('coexpression tab coadread_tcga_pub initial load', function() {
        browser.waitForExist('div[data-test="CoExpressionPlot"]', 10000); // wait for plot to show up
        var res = browser.checkElement('div[data-test="CoExpressionGeneTabContent"]');
        assertScreenShotMatch(res);
    });
    it('coexpression tab coadread_tcga_pub log scale x and y mutations on', function() {
        browser.click('div[data-test="CoExpressionGeneTabContent"] input[data-test="logScale"]');
        var res = browser.checkElement('div[data-test="CoExpressionGeneTabContent"]');
        assertScreenShotMatch(res);
    });
    it('coexpression tab coadread_tcga_pub loc scale x and y mutations off', function() {
        browser.click('div[data-test="CoExpressionGeneTabContent"] input[data-test="ShowMutations"]');
        var res = browser.checkElement('div[data-test="CoExpressionGeneTabContent"]');
        assertScreenShotMatch(res);
    });
    it('coexpression tab coadread_tcga_pub switch tabs', function() {
        browser.click('#coexpressionTabGeneTabs>ul>li:nth-child(2)>a');// click on NRAS
        browser.pause(100); // give time to start loading
        browser.waitForExist('div[data-test="CoExpressionPlot"]', 10000); // wait for plot to show up
        var res = browser.checkElement('div[data-test="CoExpressionGeneTabContent"]');
        assertScreenShotMatch(res);
    });
    it('coexpression tab coadread_tcga_pub switch profiles', function() {
        browser.execute(function() { resultsViewCoExpressionTab.onSelectDataSet({ value: "coadread_tcga_pub_mrna"}); });
        browser.pause(100); // give time to start loading
        browser.waitForExist('div[data-test="CoExpressionPlot"]', 10000); // wait for plot to show up
        var res = browser.checkElement('div[data-test="CoExpressionGeneTabContent"]');
        assertScreenShotMatch(res);
    });
    it('coexpression tab coadread_tcga_pub with a lot of genes', function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=AKR1C3%2520AR%2520CYB5A%2520CYP11A1%2520CYP11B1%2520CYP11B2%2520CYP17A1%2520CYP19A1%2520CYP21A2%2520HSD17B1%2520HSD17B10%2520HSD17B11%2520HSD17B12%2520HSD17B13%2520HSD17B14%2520HSD17B2%2520HSD17B3%2520HSD17B4%2520HSD17B6%2520HSD17B7%2520HSD17B8%2520HSD3B1%2520HSD3B2%2520HSD3B7%2520RDH5%2520SHBG%2520SRD5A1%2520SRD5A2%2520SRD5A3%2520STAR&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic#coexp`);
        browser.waitForExist('div[data-test="CoExpressionPlot"]', 10000); // wait for plot to show up
        var res = browser.checkElement('div[data-test="CoExpressionGeneTabContent"]');
        assertScreenShotMatch(res);
    });
});

describe("enrichments tab screenshot tests", function() {
    before(function() {
        var url = `${CBIOPORTAL_URL}/index.do?tab_index=tab_visualize&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&case_ids=&gene_list=KRAS+NRAS+BRAF&gene_set_choice=user-defined-list&Action=Submit#enrichementTabDiv`;
        goToUrlAndSetLocalStorage(url);
    });
    it('enrichments tab coadread_tcga_pub mRNA profile', function(){
        browser.waitForVisible('div[data-test="MutationEnrichmentsTab"]',10000);
        browser.click('a=mRNA');
        browser.waitForVisible('div[data-test="MRNAEnrichmentsTab"]',10000);
        browser.click('b=MERTK');
        var res = browser.checkElement('#enrichementTabDiv', { hide:['.qtip'] } );
        assertScreenShotMatch(res);
    });
});

function waitForAndCheckPlotsTab() {
    browser.waitForVisible('div[data-test="PlotsTabPlotDiv"]', 10000);
    var res = browser.checkElement('div[data-test="PlotsTabEntireDiv"]', { hide:['.qtip'] });
    assertScreenShotMatch(res);
}

describe("plots tab screenshot tests", function() {
    before(function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/index.do?cancer_study_id=brca_tcga&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=brca_tcga_cnaseq&gene_list=TP53%2520MDM2&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_tcga_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_tcga_gistic#plots`);
        browser.waitForVisible('div[data-test="PlotsTabPlotDiv"]', 20000);
    });
    it("plots tab mutation type view", function() {
        waitForAndCheckPlotsTab();
    });
    it("plots tab molecular vs molecular same gene", function() {
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({ value: "MRNA_EXPRESSION" }); });
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({ value: "brca_tcga_mrna" }); });
        waitForAndCheckPlotsTab();
    });
    it("plots tab molecular vs molecular same gene changed gene", function() {
        browser.execute(function() { resultsViewPlotsTab.test__selectGeneOption(false, 4193); });
        waitForAndCheckPlotsTab();
    });
    it("plots tab copy number view", function() {
        browser.click('input[data-test="ViewMutationType"]');
        waitForAndCheckPlotsTab();
    });
    it("plots tab molecular vs molecular different genes", function() {
        browser.execute(function() { resultsViewPlotsTab.test__selectGeneOption(true, 7157); });
        waitForAndCheckPlotsTab();
    });
    it("plots tab molecular vs molecular different genes different profiles", function() {
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({ value: "brca_tcga_rna_seq_v2_mrna" }); });
        waitForAndCheckPlotsTab();
    });
    it("plots tab molecular vs molecular swapped axes", function() {
        browser.click('[data-test="swapHorzVertButton"]');
        waitForAndCheckPlotsTab();
    });
    it("plots tab search case id", function() {
        browser.click('input[data-test="ViewMutationType"]');
        browser.execute(function() { resultsViewPlotsTab.executeSearchCase("TCGA-E2 TCGA-A8-A08G"); });
        waitForAndCheckPlotsTab();
    });
    it("plots tab search case id and mutation", function() {
        browser.execute(function() { resultsViewPlotsTab.executeSearchMutation("I195T H179R apsdoifjapsoid"); });
        waitForAndCheckPlotsTab();
    });
    it("plots tab search mutation", function() {
        browser.execute(function() { resultsViewPlotsTab.executeSearchCase(""); });
        waitForAndCheckPlotsTab();
    });
    it("plots tab log scale off", function() {
        browser.click('input[data-test="VerticalLogCheckbox"]');
        waitForAndCheckPlotsTab();
    });
    it("plots tab clinical vs molecular", function() {
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({ value: "clinical_attribute" }); });
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({ value: "AGE" }); });
        waitForAndCheckPlotsTab();
    });
    it("plots tab clinical vs molecular boxplot", function() {
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({ value: "AJCC_PATHOLOGIC_TUMOR_STAGE" }); });
        waitForAndCheckPlotsTab();
    });
    it("plots tab molecular vs clinical boxplot, mutation search off", function() {
        browser.execute(function() { resultsViewPlotsTab.executeSearchMutation(""); });
        browser.click('[data-test="swapHorzVertButton"]');
        waitForAndCheckPlotsTab();
    });
    it("plots tab clinical vs clinical boxplot", function() {
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({ value: "clinical_attribute" }); });
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({ value: "AGE" }); });
        waitForAndCheckPlotsTab();
    });
    it("plots tab search case id in clinical vs clinical boxplot", function() {
        browser.execute(function() { resultsViewPlotsTab.executeSearchCase("kjpoij12     TCGA-B6 asdfas TCGA-A7-A13"); });
        waitForAndCheckPlotsTab();
    });
    it("plots tab clinical vs clinical table plot", function() {
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({ value: "AJCC_TUMOR_PATHOLOGIC_PT" }); });
        waitForAndCheckPlotsTab();
    });
    it("plots tab copy number vs clinical table plot", function() {
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({ value: "COPY_NUMBER_ALTERATION" }); });
        waitForAndCheckPlotsTab();
    });
});

describe('result page tabs, loading from session id', function(){
    before(function(){
        var url = `${CBIOPORTAL_URL}/index.do?session_id=596f9fa3498e5df2e292bdfd`;
        goToUrlAndSetLocalStorage(url);

        // only run these tests if session service is enabled
        if (sessionServiceIsEnabled() === false) {
            this.skip();
        }
    });

    runResultsTestSuite('session');
});
