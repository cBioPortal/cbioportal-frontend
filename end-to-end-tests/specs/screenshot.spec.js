var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('./specUtils').waitForOncoprint;
var goToUrlAndSetLocalStorage = require('./specUtils').goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('./specUtils').waitForNetworkQuiet;
var sessionServiceIsEnabled = require('./specUtils').sessionServiceIsEnabled;
var assertScreenShotMatch = require('../lib/testUtils').assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");


function runResultsTestSuite(prefix){

    it(`${prefix} render the oncoprint`, function(){
        waitForOncoprint(10000);
        var res = browser.checkElement('.oncoprintContainer', { hide:['.oncoprint__controls']}); // just hide the controls bc for some reason they keep showing up transparent in this test only
        assertScreenShotMatch(res);
    });

    // can't get it to pass reliably
    it.skip(`${prefix} igv_tab tab`, function(){
        browser.click("a.tabAnchor_cnSegments");
        browser.waitForExist('#cnSegmentsFrame', 20000);
        var res = browser.checkElement('.cnSegmentsMSKTabs',{hide:['.qtip'] });
        assertScreenShotMatch(res);
    });

    it(`${prefix} cancer type summary`, function(){
        browser.click("a.tabAnchor_cancerTypesSummary");
        browser.waitForVisible('[data-test="cancerTypeSummaryChart"]',10000);
        browser.waitForExist('[data-test="cancerTypeSummaryWrapper"]', 5000);
        var res = browser.checkElement('[data-test="cancerTypeSummaryWrapper"]', { hide:['.qtip'] });
        assertScreenShotMatch(res);
    });

    it(`${prefix} mutex tab`, function(){
        browser.click("a.tabAnchor_mutualExclusivity");
        var res = browser.checkElement('[data-test="mutualExclusivityTabDiv"]',{ hide:['.qtip'] });
        assertScreenShotMatch(res);
    });

    it(`${prefix} plots tab`, function(){
        browser.click("a.tabAnchor_plots");
        waitForAndCheckPlotsTab();
    });

    it(`${prefix} mutation tab`, function(){
        browser.click("a.tabAnchor_mutations");
        browser.waitForVisible('.borderedChart svg',20000);
        var res = browser.checkElement('[data-test="mutationsTabDiv"]',{hide:['.qtip', '[data-test=view3DStructure]', '[data-test=GeneSummaryUniProt]'], viewportChangePause:4000}); // hide these things because the timing of data loading makes this test so flaky
        assertScreenShotMatch(res);
    });

    it(`${prefix} coexpression tab`, function(){
        browser.click("a.tabAnchor_coexpression");
        browser.waitForVisible('div[data-test="CoExpressionPlot"]',10000);
        var res = browser.checkElement('[data-test="coExpressionTabDiv"]', { hide:['.qtip'] } );
        assertScreenShotMatch(res);
    });

    it(`${prefix} enrichments tab`, function(){
        browser.click("a.tabAnchor_enrichments");
        browser.waitForVisible('div[data-test="MutationEnrichmentsTab"]',10000);
        browser.click('b=CDK14');
        browser.waitForExist('[data-test="enrichmentsTabDiv"]', 10000);
        var res = browser.checkElement('[data-test="enrichmentsTabDiv"]', { hide:['.qtip'] } );
        assertScreenShotMatch(res);
    });

    it(`${prefix} survival tab`, function(){
        browser.click("a.tabAnchor_survival");
        browser.waitForVisible('[data-test=SurvivalChart] svg',10000);
        var res = browser.checkElement('[data-test="survivalTabDiv"]', { hide:['.qtip'] } );
        assertScreenShotMatch(res);
    });

    it.skip(`${prefix} network tab`, function(){
        // TODO: unskip this when bug is fixed

        browser.click("a.tabAnchor_network");

        browser.waitForExist('iframe#networkFrame', 10000);

        browser.frame('networkFrame', function(err, result) {
                if (err) console.log(err);
            });
        browser.waitForVisible('#cytoscapeweb canvas',60000);
        browser.execute(function(){
            $("<style>canvas { visibility: hidden} </style>").appendTo("body");
        });
        browser.frame(null);
        var res = browser.checkElement("#networkFrame",{hide:['.qtip','canvas'] });

        assertScreenShotMatch(res);
    });

    it.skip(`${prefix} data_download tab`, function(){
        browser.click("a.tabAnchor_download");
        //  browser.pause(1000);
        browser.waitForExist("#text_area_gene_alteration_freq",20000);
        browser.waitUntil(function(){ return browser.getValue("#text_area_gene_alteration_freq").length > 0 },20000);
        var res = browser.checkElement('[data-test="downloadTabDiv"]',{hide:['.qtip'] });
        assertScreenShotMatch(res);
    });
}

describe('result page screenshot tests', function(){
    before(function(){
        var url = `${CBIOPORTAL_URL}/index.do?tab_index=tab_visualize&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&case_ids=&gene_list=KRAS+NRAS+BRAF&gene_set_choice=user-defined-list&Action=Submit&show_samples=false&`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(10000);
    });

    runResultsTestSuite('no session')

});

describe('expression tab', function() {
    it("expression tab with complex oql", ()=>{
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/results/expression?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=all&gene_list=TP53%3AMUT%3B&geneset_list=%20&tab_index=tab_visualize&Action=Submit&cancer_study_list=acc_tcga%2Cchol_tcga%2Cesca_tcga&show_samples=false`);
        browser.waitForExist(".borderedChart svg", 10000);
        var res = browser.checkElement('[data-test="expressionTabDiv"]');
        assertScreenShotMatch(res);
    });
});

describe("oncoprint screenshot tests", function() {
    it("coadread_tcga_pub with clinical and heatmap tracks", ()=>{
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=1&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=coadread_tcga_pub_rna_seq_mrna_median_Zscores&show_samples=false&clinicallist=0%2C2%2CMETHYLATION_SUBTYPE&heatmap_track_groups=coadread_tcga_pub_rna_seq_mrna_median_Zscores%2CKRAS%2CNRAS%2CBRAF&`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(10000);
        var res = browser.checkElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it("acc_tcga with clinical and heatmap tracks", ()=>{
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=acc_tcga&Z_SCORE_THRESHOLD=1&RPPA_SCORE_THRESHOLD=1&data_priority=0&case_set_id=acc_tcga_all&gene_list=SOX9%20RAN%20TNK2%20EP300%20PXN%20NCOA2%20AR%20NRIP1%20NCOR1%20NCOR2&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=acc_tcga_rna_seq_v2_mrna_median_Zscores&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=acc_tcga_rppa_Zscores&show_samples=false&clinicallist=0%2C1%2CMETASTATIC_DX_CONFIRMED_BY&heatmap_track_groups=acc_tcga_rna_seq_v2_mrna_median_Zscores%2CSOX9%2CRAN%2CTNK2%2CEP300%2CPXN%2CNCOA2%2CAR%2CNRIP1%2CNCOR1%2CNCOR2`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(10000);
        var res = browser.checkElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it("blca_tcga with clinical and heatmap tracks", ()=>{
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=blca_tcga_pub&Z_SCORE_THRESHOLD=1&RPPA_SCORE_THRESHOLD=1&data_priority=0&case_set_id=blca_tcga_pub_all&gene_list=SOX9%20RAN%20TNK2%20EP300%20PXN%20NCOA2%20AR%20NRIP1%20NCOR1%20NCOR2&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=blca_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=blca_tcga_pub_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=blca_tcga_pub_rna_seq_mrna_median_Zscores&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=blca_tcga_pub_rppa_Zscores&show_samples=false&heatmap_track_groups=blca_tcga_pub_rna_seq_mrna_median_Zscores%2CSOX9%2CRAN%2CTNK2%2CEP300%2CPXN%2CNCOA2%2CAR%2CNRIP1%2CNCOR1%2CNCOR2&clinicallist=CANCER_TYPE_DETAILED%2CMETASTATIC_SITE_OTHER%2CNEW_TUMOR_EVENT_AFTER_INITIAL_TREATMENT`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(10000);
        var res = browser.checkElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it("msk_impact_2017 query STK11:HOMDEL MUT", ()=>{
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_Non-Small_Cell_Lung_Cancer&gene_list=STK11%253A%2520HOMDEL%2520MUT&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`);
        waitForOncoprint(20000);
        var res = browser.checkElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it("hcc_inserm_fr_2015 with genes including TERT - it should show orange promoter mutations in TERT", function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/index.do?cancer_study_id=hcc_inserm_fr_2015&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=hcc_inserm_fr_2015_sequenced&gene_list=SOX9%2520RAN%2520TNK2%2520EP300%2520PXN%2520NCOA2%2520AR%2520NRIP1%2520NCOR1%2520NCOR2%2520TERT&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=hcc_inserm_fr_2015_mutations`);
        waitForOncoprint(20000);
        var res = browser.checkElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it("msk_impact_2017 with SOS1 - SOS1 should be not sequenced", function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_all&gene_list=SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(20000);
        var res = browser.checkElement(".oncoprintContainer");
        assertScreenShotMatch(res);
    });
    it("msk_impact_2017 with ALK and SOS1 - SOS1 should be not sequenced", function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_all&gene_list=ALK%2520SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(20000);
        var res = browser.checkElement(".oncoprintContainer");
        assertScreenShotMatch(res);
    });
    it("msk_impact_2017 with SOS1 with CNA profile - SOS1 should not be sequenced", function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_all&gene_list=SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(20000);
        var res = browser.checkElement(".oncoprintContainer");
        assertScreenShotMatch(res);
    });
    it("brca_tcga_pub with KRAS NRAS BRAF and methylation heatmap tracks", function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=brca_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=brca_tcga_pub_cnaseq&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_tcga_pub_gistic&show_samples=false&heatmap_track_groups=brca_tcga_pub_methylation_hm27%2CKRAS%2CNRAS%2CBRAF%2CTP53%2CBRCA1%2CBRCA2`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(10000);
        var res = browser.checkElement(".oncoprintContainer");
        assertScreenShotMatch(res);
    });
    it("profiled in tracks in msk impact with 3 not profiled genes", function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=msk_impact_2017_cnaseq&gene_list=AKR1C1%2520AKR1C2%2520AKR1C4&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(20000);
        var res = browser.checkElement(".oncoprintContainer");
        assertScreenShotMatch(res);
    });
    it("profiled in tracks in multiple study with SOS1", function() {
        var url = `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=msk_impact_2017%2Cbrca_tcga_pub&case_set_id=all&data_priority=0&gene_list=SOS1&geneset_list=%20&tab_index=tab_visualize`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(20000);
        var res = browser.checkElement(".oncoprintContainer");
        assertScreenShotMatch(res);
    });
});

describe("download tab screenshot tests", function() {
    it("download tab - msk_impact_2017 with ALK and SOS1 - SOS1 should be not sequenced", function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_all&gene_list=ALK%2520SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`;
        goToUrlAndSetLocalStorage(url);
        browser.waitForExist("a.tabAnchor_download", 10000);
        browser.click("a.tabAnchor_download");
        browser.waitForExist('[data-test="dataDownloadGeneAlterationTable"] tr > td > svg', 20000);
        browser.waitForExist('[data-test="downloadTabDiv"]', 5000);
        var res = browser.checkElement('[data-test="downloadTabDiv"]',{hide:['.qtip'] });
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

describe("coexpression tab screenshot tests", function() {
    before(function() {
        var url = `${CBIOPORTAL_URL}/results/coexpression?tab_index=tab_visualize&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&case_ids=&gene_list=KRAS+NRAS+BRAF&gene_set_choice=user-defined-list&Action=Submit`;
        goToUrlAndSetLocalStorage(url);
    });
    it('coexpression tab coadread_tcga_pub initial load', function() {
        browser.waitForExist('div[data-test="CoExpressionPlot"]', 20000); // wait for plot to show up
        var res = browser.checkElement('div[data-test="coExpressionTabDiv"]');
        assertScreenShotMatch(res);
    });
    it('coexpression tab coadread_tcga_pub log scale x and y mutations on', function() {
        browser.click('div[data-test="coExpressionTabDiv"] input[data-test="logScale"]');
        browser.moveToObject("body",0,0);
        var res = browser.checkElement('div[data-test="coExpressionTabDiv"]');
        assertScreenShotMatch(res);
    });
    it('coexpression tab coadread_tcga_pub loc scale x and y mutations off', function() {
        browser.click('div[data-test="coExpressionTabDiv"] input[data-test="ShowMutations"]');
        browser.moveToObject("body",0,0);
        var res = browser.checkElement('div[data-test="coExpressionTabDiv"]');
        assertScreenShotMatch(res);
    });
    it('coexpression tab coadread_tcga_pub switch tabs', function() {
        browser.click('#coexpressionTabGeneTabs>ul>li:nth-child(2)>a');// click on NRAS
        browser.moveToObject("body",0,0);
        browser.pause(100); // give time to start loading
        browser.waitForExist('div[data-test="CoExpressionPlot"]', 20000); // wait for plot to show up
        var res = browser.checkElement('div[data-test="coExpressionTabDiv"]');
        assertScreenShotMatch(res);
    });
    it('coexpression tab coadread_tcga_pub switch profiles', function() {
        browser.execute(function() { resultsViewCoExpressionTab.onSelectDataSet({ value: "coadread_tcga_pub_mrna"}); });
        browser.pause(100); // give time to start loading
        browser.waitForExist('div[data-test="CoExpressionPlot"]', 20000); // wait for plot to show up
        var res = browser.checkElement('div[data-test="coExpressionTabDiv"]');
        assertScreenShotMatch(res);
    });
    it('coexpression tab coadread_tcga_pub with a lot of genes', function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/results/coexpression?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=AKR1C3%2520AR%2520CYB5A%2520CYP11A1%2520CYP11B1%2520CYP11B2%2520CYP17A1%2520CYP19A1%2520CYP21A2%2520HSD17B1%2520HSD17B10%2520HSD17B11%2520HSD17B12%2520HSD17B13%2520HSD17B14%2520HSD17B2%2520HSD17B3%2520HSD17B4%2520HSD17B6%2520HSD17B7%2520HSD17B8%2520HSD3B1%2520HSD3B2%2520HSD3B7%2520RDH5%2520SHBG%2520SRD5A1%2520SRD5A2%2520SRD5A3%2520STAR&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`);
        browser.waitForExist('div[data-test="CoExpressionPlot"]', 20000); // wait for plot to show up
        var res = browser.checkElement('div[data-test="coExpressionTabDiv"]');
        assertScreenShotMatch(res);
    });
});

describe("enrichments tab screenshot tests", function() {
    before(function() {
        var url = `${CBIOPORTAL_URL}/results/enrichments?tab_index=tab_visualize&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&case_ids=&gene_list=KRAS+NRAS+BRAF&gene_set_choice=user-defined-list&Action=Submit`;
        goToUrlAndSetLocalStorage(url);
    });
    it('enrichments tab coadread_tcga_pub mRNA profile', function(){
        browser.waitForVisible('div[data-test="MutationEnrichmentsTab"]',10000);
        browser.click('a=mRNA');
        browser.waitForVisible('div[data-test="MRNAEnrichmentsTab"]',20000);
        browser.click('b=MERTK');
        browser.waitForVisible('div[data-test="MiniBoxPlot"]', 20000);
        var res = browser.checkElement('[data-test="enrichmentsTabDiv"]', { hide:['.qtip'] } );
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
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/results/plots?cancer_study_id=brca_tcga&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=brca_tcga_cnaseq&gene_list=TP53%20MDM2&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_tcga_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_tcga_gistic`);
        browser.waitForVisible('div[data-test="PlotsTabPlotDiv"]', 20000);
    });
    it("plots tab mutation type view", function() {
        waitForAndCheckPlotsTab();
    });
    it("plots tab molecular vs molecular same gene", function() {
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({ value: "MRNA_EXPRESSION" }); });
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({ value: "brca_tcga_mrna" }); });

        waitForNetworkQuiet();

        browser.waitForExist('input[data-test="ViewCopyNumber"]');
        browser.click('input[data-test="ViewCopyNumber"]');
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
        browser.click('input[data-test="HorizontalLogCheckbox"]');
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
    it("plots tab mutations vs clinical boxplot", function() {
        browser.click('[data-test="swapHorzVertButton"]');
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({ value: "AGE" }); });
        browser.click('[data-test="swapHorzVertButton"]');
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({ value: "MUTATION_EXTENDED" }); });
        waitForAndCheckPlotsTab();
    });
    it("plots tab mutations wild type mode vs clinical boxplot", function() {
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisMutationCountBySelect({ value: "MutatedVsWildType" }); });
        waitForAndCheckPlotsTab();
    });
    it("plots tab clinical vs clinical boxplot", function() {
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({ value: "clinical_attribute" }); });
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({ value: "AJCC_PATHOLOGIC_TUMOR_STAGE" }); });
        browser.click('[data-test="swapHorzVertButton"]');
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
    it("plots tab mutations wildtype mode vs clinical table plot", function() {
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisMutationCountBySelect({ value: "MutatedVsWildType" }); });
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({ value: "MUTATION_EXTENDED" }); });
        waitForAndCheckPlotsTab();
    });
    it("plots tab mutations vs clinical table plot", function() {
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisMutationCountBySelect({ value: "MutationType" }); });
        waitForAndCheckPlotsTab();
    });

    it("plots tab one box clinical vs clinical boxplot", function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/results/plots?cancer_study_id=lgg_ucsf_2014&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=lgg_ucsf_2014_sequenced&gene_list=SMARCA4%2520CIC&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=lgg_ucsf_2014_mutations&show_samples=true&clinicallist=MUTATION_COUNT`);
        browser.waitForVisible('div[data-test="PlotsTabPlotDiv"]', 20000);
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({ value: "clinical_attribute" }); });
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({ value: "CANCER_TYPE" }); });
        waitForAndCheckPlotsTab();
    });

    it("plots tab mutations profile with duplicates", function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/results/plots?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_Non-Small_Cell_Lung_Cancer&gene_list=TP53&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`);
        browser.waitForVisible('div[data-test="PlotsTabPlotDiv"]', 20000);
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({ value: "MUTATION_EXTENDED" }); });
        waitForAndCheckPlotsTab();
    });
});

describe('result page tabs, loading from session id', function(){
    before(function(){
        // only run these tests if session service is enabled
        if (sessionServiceIsEnabled() === false) {
            this.skip();
        }

        var url = `${CBIOPORTAL_URL}/results?session_id=5bbe8197498eb8b3d5684271`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(10000);
    });

    runResultsTestSuite('session');
});
