var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('./specUtils').waitForOncoprint;
var setOncoprintMutationsMenuOpen = require('./specUtils').setOncoprintMutationsMenuOpen;
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
        browser.waitForVisible('a=mRNA', 10000);
        browser.click('a=mRNA');
        browser.waitForVisible('div[data-test="MRNAEnrichmentsTab"]',20000);
        browser.waitForVisible('b=MERTK', 10000);
        browser.click('b=MERTK');
        browser.waitForVisible('div[data-test="MiniBoxPlot"]', 20000);
        var res = browser.checkElement('[data-test="enrichmentsTabDiv"]', { hide:['.qtip'] } );
        assertScreenShotMatch(res);
    });
});

describe("oncoprinter screenshot tests", function() {
    it("oncoprinter example data", function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist(".oncoprinterExampleData");
        browser.click(".oncoprinterExampleData");
        browser.click(".oncoprinterSubmit");
        waitForOncoprint(3000);

        var res = browser.checkElement('div#oncoprintDiv', { hide:['.qtip'] } );
        assertScreenShotMatch(res);
    });
    it("oncoprinter example data, then set gene order, including all genes", function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist(".oncoprinterExampleData");
        browser.click(".oncoprinterExampleData");
        browser.click(".oncoprinterSubmit");
        waitForOncoprint(3000);
        browser.setValue(".oncoprinterGenesInput", "BRCA1 PTEN TP53 BRCA2");
        browser.click(".oncoprinterSubmit");
        waitForOncoprint(3000);

        var res = browser.checkElement('div#oncoprintDiv', { hide:['.qtip'] } );
        assertScreenShotMatch(res);
    });
    it("oncoprinter example data, then set gene order, not including all genes", function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist(".oncoprinterExampleData");
        browser.click(".oncoprinterExampleData");
        browser.click(".oncoprinterSubmit");
        waitForOncoprint(3000);
        browser.setValue(".oncoprinterGenesInput", "BRCA1 PTEN");
        browser.click(".oncoprinterSubmit");
        waitForOncoprint(3000);

        var res = browser.checkElement('div#oncoprintDiv', { hide:['.qtip'] } );
        assertScreenShotMatch(res);
    });
    it("oncoprinter example data, then set sample order, including all samples", function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist(".oncoprinterExampleData");
        browser.click(".oncoprinterExampleData");
        browser.click(".oncoprinterSubmit");
        waitForOncoprint(3000);
        browser.setValue(".oncoprinterSamplesInput", "TCGA-25-2392-01,TCGA-25-2393-01,TCGA-04-1331-01,TCGA-04-1365-01,TCGA-04-1648-01,TCGA-09-1666-01,TCGA-13-0720-01,TCGA-13-0801-01,TCGA-13-0905-01,TCGA-13-0924-01,TCGA-13-1405-01,TCGA-13-1408-01,TCGA-13-1488-01,TCGA-23-1023-01,TCGA-23-1032-01,TCGA-23-1107-01,TCGA-23-1114-01,TCGA-23-1118-01,TCGA-23-1121-01,TCGA-23-2084-01,TCGA-24-0968-01,TCGA-24-0970-01,TCGA-24-1103-01,TCGA-24-1474-01,TCGA-24-1567-01,TCGA-24-2030-01,TCGA-24-2036-01,TCGA-24-2262-01,TCGA-24-2297-01,TCGA-25-1322-01,TCGA-25-2391-01,TCGA-25-2401-01,TCGA-29-1697-01,TCGA-29-1702-01,TCGA-29-1761-01,TCGA-30-1860-01,TCGA-31-1951-01,TCGA-31-1959-01,TCGA-36-1570-01,TCGA-57-1586-01,TCGA-61-1728-01,TCGA-61-1895-01,TCGA-61-1907-01,TCGA-61-2012-01,TCGA-61-2094-01,TCGA-61-2097-01,TCGA-25-1625-01,TCGA-04-1357-01,TCGA-13-0893-01,TCGA-61-2109-01,TCGA-13-0761-01,TCGA-29-2427-01,TCGA-23-1122-01,TCGA-23-1027-01,TCGA-25-1632-01,TCGA-23-1026-01,TCGA-13-0804-01,TCGA-24-2298-01,TCGA-61-2008-01,TCGA-09-2045-01,TCGA-04-1356-01,TCGA-25-1630-01,TCGA-24-1470-01,TCGA-13-0730-01,TCGA-13-0883-01,TCGA-13-0903-01,TCGA-13-0887-01,TCGA-13-1494-01,TCGA-09-2051-01,TCGA-23-2078-01,TCGA-23-2079-01,TCGA-10-0931-01,TCGA-59-2348-01,TCGA-23-2077-01,TCGA-09-1669-01,TCGA-23-2081-01,TCGA-13-1489-01,TCGA-25-1318-01,TCGA-13-0793-01,TCGA-24-1463-01,TCGA-13-0913-01,TCGA-04-1367-01,TCGA-24-1562-01,TCGA-13-0885-01,TCGA-13-0890-01,TCGA-13-1512-01,TCGA-23-1030-01,TCGA-25-1634-01,TCGA-24-1555-01,TCGA-13-0886-01,TCGA-13-0792-01,TCGA-24-2293-01,TCGA-23-1120-01,TCGA-57-1584-01,TCGA-13-0900-01,TCGA-24-2280-01,TCGA-24-0975-01,TCGA-24-2288-01,TCGA-24-1417-01,TCGA-13-1498-01,TCGA-13-1499-01,TCGA-13-0726-01,TCGA-25-2404-01,TCGA-13-1481-01,TCGA-10-0930-01,TCGA-13-1492-01,TCGA-13-1505-01,TCGA-04-1336-01,TCGA-24-2261-01,TCGA-13-0912-01,TCGA-36-1580-01,TCGA-59-2352-01,TCGA-25-2409-01,TCGA-61-1919-01,TCGA-13-0919-01,TCGA-09-2050-01,TCGA-25-1626-01,TCGA-09-2049-01,TCGA-24-1422-01,TCGA-24-1416-01,TCGA-24-1564-01,TCGA-61-2088-01,TCGA-10-0934-01,TCGA-61-2003-01,TCGA-13-0714-01,TCGA-13-1510-01,TCGA-36-1576-01,TCGA-25-1329-01,TCGA-04-1337-01,TCGA-24-1428-01,TCGA-04-1332-01,TCGA-04-1349-01,TCGA-13-0791-01,TCGA-24-2019-01,TCGA-24-1425-01,TCGA-24-1423-01,TCGA-10-0926-01,TCGA-13-0760-01,TCGA-24-1556-01,TCGA-24-1558-01,TCGA-24-1616-01,TCGA-24-1604-01,TCGA-09-1659-01,TCGA-24-1413-01,TCGA-09-1662-01,TCGA-13-0724-01,TCGA-13-1484-01,TCGA-24-2254-01,TCGA-61-2101-01,TCGA-09-0366-01,TCGA-09-2053-01,TCGA-24-2024-01,TCGA-57-1993-01,TCGA-13-0751-01,TCGA-10-0928-01,TCGA-04-1525-01,TCGA-23-1022-01,TCGA-30-1862-01,TCGA-13-0765-01,TCGA-31-1953-01,TCGA-04-1514-01,TCGA-13-1509-01,TCGA-24-1419-01,TCGA-25-1321-01,TCGA-20-0987-01,TCGA-23-1024-01,TCGA-24-2290-01,TCGA-23-1124-01,TCGA-61-1736-01,TCGA-13-0800-01,TCGA-24-1434-01,TCGA-04-1517-01,TCGA-09-1661-01,TCGA-61-1995-01,TCGA-24-1614-01,TCGA-36-1569-01,TCGA-24-2271-01,TCGA-23-1123-01,TCGA-13-1507-01,TCGA-13-0899-01,TCGA-23-1110-01,TCGA-25-1319-01,TCGA-24-1548-01,TCGA-13-0910-01,TCGA-04-1346-01,TCGA-04-1350-01,TCGA-25-1326-01,TCGA-24-1549-01,TCGA-13-0891-01,TCGA-13-1411-01,TCGA-24-2260-01,TCGA-04-1342-01,TCGA-13-0723-01,TCGA-24-2289-01,TCGA-59-2354-01,TCGA-59-2350-01,TCGA-59-2363-01,TCGA-13-0762-01,TCGA-59-2351-01,TCGA-25-2398-01,TCGA-25-1315-01,TCGA-13-1497-01,TCGA-30-1853-01,TCGA-57-1582-01,TCGA-24-0966-01,TCGA-24-1557-01,TCGA-59-2355-01,TCGA-10-0927-01,TCGA-09-2044-01,TCGA-13-0906-01,TCGA-25-1627-01,TCGA-13-1482-01,TCGA-24-2281-01,TCGA-13-0889-01,TCGA-61-2016-01,TCGA-04-1362-01,TCGA-13-0717-01,TCGA-61-2104-01,TCGA-10-0938-01,TCGA-24-2035-01,TCGA-24-1105-01,TCGA-24-0979-01,TCGA-04-1361-01,TCGA-25-1628-01,TCGA-13-1491-01,TCGA-25-1635-01,TCGA-13-1506-01,TCGA-24-1560-01,TCGA-13-1410-01,TCGA-24-1464-01,TCGA-10-0935-01,TCGA-36-1568-01,TCGA-23-2072-01,TCGA-13-1487-01,TCGA-24-1426-01,TCGA-13-0920-01,TCGA-25-1320-01,TCGA-23-1021-01,TCGA-04-1348-01,TCGA-04-1338-01,TCGA-23-1117-01,TCGA-36-1578-01,TCGA-36-1575-01,TCGA-36-1574-01,TCGA-25-2399-01,TCGA-30-1891-01,TCGA-36-1577-01,TCGA-24-1466-01,TCGA-61-2092-01,TCGA-04-1347-01,TCGA-20-0990-01,TCGA-24-1104-01,TCGA-24-1418-01,TCGA-57-1583-01,TCGA-13-0795-01,TCGA-13-1496-01,TCGA-25-1623-01,TCGA-24-1551-01,TCGA-24-1431-01,TCGA-13-2060-01,TCGA-25-1631-01,TCGA-13-1495-01,TCGA-24-1603-01,TCGA-04-1530-01,TCGA-04-1542-01,TCGA-24-1471-01,TCGA-61-2102-01,TCGA-24-1469-01,TCGA-13-1407-01,TCGA-23-1028-01,TCGA-13-0894-01,TCGA-13-1409-01,TCGA-24-0982-01,TCGA-61-2000-01,TCGA-61-2110-01,TCGA-31-1950-01,TCGA-24-1424-01,TCGA-24-1427-01,TCGA-61-1998-01,TCGA-13-0904-01,TCGA-13-0923-01,TCGA-24-1563-01,TCGA-13-1504-01,TCGA-25-1324-01,TCGA-13-0897-01,TCGA-10-0937-01,TCGA-04-1364-01,TCGA-20-0991-01,TCGA-24-2267-01,TCGA-13-1404-01,TCGA-13-0911-01,TCGA-25-1313-01,TCGA-36-1571-01,TCGA-13-0884-01,TCGA-13-1412-01,TCGA-24-1545-01,TCGA-24-1436-01,TCGA-25-2400-01,TCGA-13-1403-01,TCGA-23-1116-01,TCGA-10-0925-01,TCGA-10-0933-01,TCGA-20-1684-01,TCGA-20-1685-01,TCGA-20-1686-01,TCGA-20-1687-01,TCGA-23-1029-01,TCGA-23-1031-01,TCGA-23-1109-01,TCGA-23-1111-01,TCGA-23-1113-01,TCGA-23-1119-01,TCGA-23-1809-01,TCGA-23-2641-01,TCGA-23-2643-01,TCGA-23-2645-01,TCGA-23-2647-01,TCGA-23-2649-01,TCGA-24-0980-01,TCGA-24-0981-01,TCGA-24-1430-01,TCGA-24-1435-01,TCGA-24-1467-01,TCGA-24-1544-01,TCGA-24-1546-01,TCGA-24-1550-01,TCGA-24-1552-01,TCGA-24-1553-01,TCGA-24-1565-01,TCGA-24-1842-01,TCGA-24-1843-01,TCGA-24-1844-01,TCGA-24-1845-01,TCGA-24-1846-01,TCGA-24-1847-01,TCGA-24-1849-01,TCGA-24-1850-01,TCGA-24-1852-01,TCGA-24-1920-01,TCGA-24-1923-01,TCGA-24-1924-01,TCGA-24-1927-01,TCGA-24-1928-01,TCGA-24-1930-01,TCGA-24-2020-01,TCGA-24-2023-01,TCGA-24-2026-01,TCGA-24-2027-01,TCGA-24-2029-01,TCGA-24-2033-01,TCGA-24-2038-01,TCGA-24-2295-01,TCGA-25-1312-01,TCGA-25-1314-01,TCGA-25-1316-01,TCGA-25-1317-01,TCGA-25-1323-01,TCGA-25-1325-01,TCGA-25-1328-01,TCGA-25-1633-01,TCGA-25-1870-01,TCGA-25-1871-01,TCGA-25-1877-01,TCGA-25-1878-01,TCGA-25-2042-01,TCGA-25-2390-01,TCGA-25-2396-01,TCGA-25-2397-01");
        browser.click(".oncoprinterSubmit");
        waitForOncoprint(3000);

        var res = browser.checkElement('div#oncoprintDiv', { hide:['.qtip'] } );
        assertScreenShotMatch(res);
    });
    it("oncoprinter example data, then set sample order, not including all samples", function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist(".oncoprinterExampleData");
        browser.click(".oncoprinterExampleData");
        browser.click(".oncoprinterSubmit");
        waitForOncoprint(3000);
        browser.setValue(".oncoprinterSamplesInput", "TCGA-25-2393-01,TCGA-13-0730-01,TCGA-13-0761-01");
        browser.click(".oncoprinterSubmit");
        waitForOncoprint(3000);

        var res = browser.checkElement('div#oncoprintDiv', { hide:['.qtip'] } );
        assertScreenShotMatch(res);
    });
    it("oncoprinter example data, start by set gene order, then set sample order", function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist(".oncoprinterExampleData");
        browser.click(".oncoprinterExampleData");
        browser.setValue(".oncoprinterGenesInput", "BRCA1 PTEN TP53 BRCA2");
        browser.click(".oncoprinterSubmit");
        waitForOncoprint(3000);
        browser.setValue(".oncoprinterSamplesInput", "TCGA-25-2392-01,TCGA-25-2393-01,TCGA-04-1331-01,TCGA-04-1365-01,TCGA-04-1648-01,TCGA-09-1666-01,TCGA-13-0720-01,TCGA-13-0801-01,TCGA-13-0905-01,TCGA-13-0924-01,TCGA-13-1405-01,TCGA-13-1408-01,TCGA-13-1488-01,TCGA-23-1023-01,TCGA-23-1032-01,TCGA-23-1107-01,TCGA-23-1114-01,TCGA-23-1118-01,TCGA-23-1121-01,TCGA-23-2084-01,TCGA-24-0968-01,TCGA-24-0970-01,TCGA-24-1103-01,TCGA-24-1474-01,TCGA-24-1567-01,TCGA-24-2030-01,TCGA-24-2036-01,TCGA-24-2262-01,TCGA-24-2297-01,TCGA-25-1322-01,TCGA-25-2391-01,TCGA-25-2401-01,TCGA-29-1697-01,TCGA-29-1702-01,TCGA-29-1761-01,TCGA-30-1860-01,TCGA-31-1951-01,TCGA-31-1959-01,TCGA-36-1570-01,TCGA-57-1586-01,TCGA-61-1728-01,TCGA-61-1895-01,TCGA-61-1907-01,TCGA-61-2012-01,TCGA-61-2094-01,TCGA-61-2097-01,TCGA-25-1625-01,TCGA-04-1357-01,TCGA-13-0893-01,TCGA-61-2109-01,TCGA-13-0761-01,TCGA-29-2427-01,TCGA-23-1122-01,TCGA-23-1027-01,TCGA-25-1632-01,TCGA-23-1026-01,TCGA-13-0804-01,TCGA-24-2298-01,TCGA-61-2008-01,TCGA-09-2045-01,TCGA-04-1356-01,TCGA-25-1630-01,TCGA-24-1470-01,TCGA-13-0730-01,TCGA-13-0883-01,TCGA-13-0903-01,TCGA-13-0887-01,TCGA-13-1494-01,TCGA-09-2051-01,TCGA-23-2078-01,TCGA-23-2079-01,TCGA-10-0931-01,TCGA-59-2348-01,TCGA-23-2077-01,TCGA-09-1669-01,TCGA-23-2081-01,TCGA-13-1489-01,TCGA-25-1318-01,TCGA-13-0793-01,TCGA-24-1463-01,TCGA-13-0913-01,TCGA-04-1367-01,TCGA-24-1562-01,TCGA-13-0885-01,TCGA-13-0890-01,TCGA-13-1512-01,TCGA-23-1030-01,TCGA-25-1634-01,TCGA-24-1555-01,TCGA-13-0886-01,TCGA-13-0792-01,TCGA-24-2293-01,TCGA-23-1120-01,TCGA-57-1584-01,TCGA-13-0900-01,TCGA-24-2280-01,TCGA-24-0975-01,TCGA-24-2288-01,TCGA-24-1417-01,TCGA-13-1498-01,TCGA-13-1499-01,TCGA-13-0726-01,TCGA-25-2404-01,TCGA-13-1481-01,TCGA-10-0930-01,TCGA-13-1492-01,TCGA-13-1505-01,TCGA-04-1336-01,TCGA-24-2261-01,TCGA-13-0912-01,TCGA-36-1580-01,TCGA-59-2352-01,TCGA-25-2409-01,TCGA-61-1919-01,TCGA-13-0919-01,TCGA-09-2050-01,TCGA-25-1626-01,TCGA-09-2049-01,TCGA-24-1422-01,TCGA-24-1416-01,TCGA-24-1564-01,TCGA-61-2088-01,TCGA-10-0934-01,TCGA-61-2003-01,TCGA-13-0714-01,TCGA-13-1510-01,TCGA-36-1576-01,TCGA-25-1329-01,TCGA-04-1337-01,TCGA-24-1428-01,TCGA-04-1332-01,TCGA-04-1349-01,TCGA-13-0791-01,TCGA-24-2019-01,TCGA-24-1425-01,TCGA-24-1423-01,TCGA-10-0926-01,TCGA-13-0760-01,TCGA-24-1556-01,TCGA-24-1558-01,TCGA-24-1616-01,TCGA-24-1604-01,TCGA-09-1659-01,TCGA-24-1413-01,TCGA-09-1662-01,TCGA-13-0724-01,TCGA-13-1484-01,TCGA-24-2254-01,TCGA-61-2101-01,TCGA-09-0366-01,TCGA-09-2053-01,TCGA-24-2024-01,TCGA-57-1993-01,TCGA-13-0751-01,TCGA-10-0928-01,TCGA-04-1525-01,TCGA-23-1022-01,TCGA-30-1862-01,TCGA-13-0765-01,TCGA-31-1953-01,TCGA-04-1514-01,TCGA-13-1509-01,TCGA-24-1419-01,TCGA-25-1321-01,TCGA-20-0987-01,TCGA-23-1024-01,TCGA-24-2290-01,TCGA-23-1124-01,TCGA-61-1736-01,TCGA-13-0800-01,TCGA-24-1434-01,TCGA-04-1517-01,TCGA-09-1661-01,TCGA-61-1995-01,TCGA-24-1614-01,TCGA-36-1569-01,TCGA-24-2271-01,TCGA-23-1123-01,TCGA-13-1507-01,TCGA-13-0899-01,TCGA-23-1110-01,TCGA-25-1319-01,TCGA-24-1548-01,TCGA-13-0910-01,TCGA-04-1346-01,TCGA-04-1350-01,TCGA-25-1326-01,TCGA-24-1549-01,TCGA-13-0891-01,TCGA-13-1411-01,TCGA-24-2260-01,TCGA-04-1342-01,TCGA-13-0723-01,TCGA-24-2289-01,TCGA-59-2354-01,TCGA-59-2350-01,TCGA-59-2363-01,TCGA-13-0762-01,TCGA-59-2351-01,TCGA-25-2398-01,TCGA-25-1315-01,TCGA-13-1497-01,TCGA-30-1853-01,TCGA-57-1582-01,TCGA-24-0966-01,TCGA-24-1557-01,TCGA-59-2355-01,TCGA-10-0927-01,TCGA-09-2044-01,TCGA-13-0906-01,TCGA-25-1627-01,TCGA-13-1482-01,TCGA-24-2281-01,TCGA-13-0889-01,TCGA-61-2016-01,TCGA-04-1362-01,TCGA-13-0717-01,TCGA-61-2104-01,TCGA-10-0938-01,TCGA-24-2035-01,TCGA-24-1105-01,TCGA-24-0979-01,TCGA-04-1361-01,TCGA-25-1628-01,TCGA-13-1491-01,TCGA-25-1635-01,TCGA-13-1506-01,TCGA-24-1560-01,TCGA-13-1410-01,TCGA-24-1464-01,TCGA-10-0935-01,TCGA-36-1568-01,TCGA-23-2072-01,TCGA-13-1487-01,TCGA-24-1426-01,TCGA-13-0920-01,TCGA-25-1320-01,TCGA-23-1021-01,TCGA-04-1348-01,TCGA-04-1338-01,TCGA-23-1117-01,TCGA-36-1578-01,TCGA-36-1575-01,TCGA-36-1574-01,TCGA-25-2399-01,TCGA-30-1891-01,TCGA-36-1577-01,TCGA-24-1466-01,TCGA-61-2092-01,TCGA-04-1347-01,TCGA-20-0990-01,TCGA-24-1104-01,TCGA-24-1418-01,TCGA-57-1583-01,TCGA-13-0795-01,TCGA-13-1496-01,TCGA-25-1623-01,TCGA-24-1551-01,TCGA-24-1431-01,TCGA-13-2060-01,TCGA-25-1631-01,TCGA-13-1495-01,TCGA-24-1603-01,TCGA-04-1530-01,TCGA-04-1542-01,TCGA-24-1471-01,TCGA-61-2102-01,TCGA-24-1469-01,TCGA-13-1407-01,TCGA-23-1028-01,TCGA-13-0894-01,TCGA-13-1409-01,TCGA-24-0982-01,TCGA-61-2000-01,TCGA-61-2110-01,TCGA-31-1950-01,TCGA-24-1424-01,TCGA-24-1427-01,TCGA-61-1998-01,TCGA-13-0904-01,TCGA-13-0923-01,TCGA-24-1563-01,TCGA-13-1504-01,TCGA-25-1324-01,TCGA-13-0897-01,TCGA-10-0937-01,TCGA-04-1364-01,TCGA-20-0991-01,TCGA-24-2267-01,TCGA-13-1404-01,TCGA-13-0911-01,TCGA-25-1313-01,TCGA-36-1571-01,TCGA-13-0884-01,TCGA-13-1412-01,TCGA-24-1545-01,TCGA-24-1436-01,TCGA-25-2400-01,TCGA-13-1403-01,TCGA-23-1116-01,TCGA-10-0925-01,TCGA-10-0933-01,TCGA-20-1684-01,TCGA-20-1685-01,TCGA-20-1686-01,TCGA-20-1687-01,TCGA-23-1029-01,TCGA-23-1031-01,TCGA-23-1109-01,TCGA-23-1111-01,TCGA-23-1113-01,TCGA-23-1119-01,TCGA-23-1809-01,TCGA-23-2641-01,TCGA-23-2643-01,TCGA-23-2645-01,TCGA-23-2647-01,TCGA-23-2649-01,TCGA-24-0980-01,TCGA-24-0981-01,TCGA-24-1430-01,TCGA-24-1435-01,TCGA-24-1467-01,TCGA-24-1544-01,TCGA-24-1546-01,TCGA-24-1550-01,TCGA-24-1552-01,TCGA-24-1553-01,TCGA-24-1565-01,TCGA-24-1842-01,TCGA-24-1843-01,TCGA-24-1844-01,TCGA-24-1845-01,TCGA-24-1846-01,TCGA-24-1847-01,TCGA-24-1849-01,TCGA-24-1850-01,TCGA-24-1852-01,TCGA-24-1920-01,TCGA-24-1923-01,TCGA-24-1924-01,TCGA-24-1927-01,TCGA-24-1928-01,TCGA-24-1930-01,TCGA-24-2020-01,TCGA-24-2023-01,TCGA-24-2026-01,TCGA-24-2027-01,TCGA-24-2029-01,TCGA-24-2033-01,TCGA-24-2038-01,TCGA-24-2295-01,TCGA-25-1312-01,TCGA-25-1314-01,TCGA-25-1316-01,TCGA-25-1317-01,TCGA-25-1323-01,TCGA-25-1325-01,TCGA-25-1328-01,TCGA-25-1633-01,TCGA-25-1870-01,TCGA-25-1871-01,TCGA-25-1877-01,TCGA-25-1878-01,TCGA-25-2042-01,TCGA-25-2390-01,TCGA-25-2396-01,TCGA-25-2397-01");
        browser.click(".oncoprinterSubmit");
        waitForOncoprint(3000);

        var res = browser.checkElement('div#oncoprintDiv', { hide:['.qtip'] } );
        assertScreenShotMatch(res);
    });
    it("oncoprinter example data, start by set sample order, then set gene order", function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist(".oncoprinterExampleData");
        browser.click(".oncoprinterExampleData");
        browser.setValue(".oncoprinterSamplesInput", "TCGA-25-2392-01,TCGA-25-2393-01,TCGA-04-1331-01,TCGA-04-1365-01,TCGA-04-1648-01,TCGA-09-1666-01,TCGA-13-0720-01,TCGA-13-0801-01,TCGA-13-0905-01,TCGA-13-0924-01,TCGA-13-1405-01,TCGA-13-1408-01,TCGA-13-1488-01,TCGA-23-1023-01,TCGA-23-1032-01,TCGA-23-1107-01,TCGA-23-1114-01,TCGA-23-1118-01,TCGA-23-1121-01,TCGA-23-2084-01,TCGA-24-0968-01,TCGA-24-0970-01,TCGA-24-1103-01,TCGA-24-1474-01,TCGA-24-1567-01,TCGA-24-2030-01,TCGA-24-2036-01,TCGA-24-2262-01,TCGA-24-2297-01,TCGA-25-1322-01,TCGA-25-2391-01,TCGA-25-2401-01,TCGA-29-1697-01,TCGA-29-1702-01,TCGA-29-1761-01,TCGA-30-1860-01,TCGA-31-1951-01,TCGA-31-1959-01,TCGA-36-1570-01,TCGA-57-1586-01,TCGA-61-1728-01,TCGA-61-1895-01,TCGA-61-1907-01,TCGA-61-2012-01,TCGA-61-2094-01,TCGA-61-2097-01,TCGA-25-1625-01,TCGA-04-1357-01,TCGA-13-0893-01,TCGA-61-2109-01,TCGA-13-0761-01,TCGA-29-2427-01,TCGA-23-1122-01,TCGA-23-1027-01,TCGA-25-1632-01,TCGA-23-1026-01,TCGA-13-0804-01,TCGA-24-2298-01,TCGA-61-2008-01,TCGA-09-2045-01,TCGA-04-1356-01,TCGA-25-1630-01,TCGA-24-1470-01,TCGA-13-0730-01,TCGA-13-0883-01,TCGA-13-0903-01,TCGA-13-0887-01,TCGA-13-1494-01,TCGA-09-2051-01,TCGA-23-2078-01,TCGA-23-2079-01,TCGA-10-0931-01,TCGA-59-2348-01,TCGA-23-2077-01,TCGA-09-1669-01,TCGA-23-2081-01,TCGA-13-1489-01,TCGA-25-1318-01,TCGA-13-0793-01,TCGA-24-1463-01,TCGA-13-0913-01,TCGA-04-1367-01,TCGA-24-1562-01,TCGA-13-0885-01,TCGA-13-0890-01,TCGA-13-1512-01,TCGA-23-1030-01,TCGA-25-1634-01,TCGA-24-1555-01,TCGA-13-0886-01,TCGA-13-0792-01,TCGA-24-2293-01,TCGA-23-1120-01,TCGA-57-1584-01,TCGA-13-0900-01,TCGA-24-2280-01,TCGA-24-0975-01,TCGA-24-2288-01,TCGA-24-1417-01,TCGA-13-1498-01,TCGA-13-1499-01,TCGA-13-0726-01,TCGA-25-2404-01,TCGA-13-1481-01,TCGA-10-0930-01,TCGA-13-1492-01,TCGA-13-1505-01,TCGA-04-1336-01,TCGA-24-2261-01,TCGA-13-0912-01,TCGA-36-1580-01,TCGA-59-2352-01,TCGA-25-2409-01,TCGA-61-1919-01,TCGA-13-0919-01,TCGA-09-2050-01,TCGA-25-1626-01,TCGA-09-2049-01,TCGA-24-1422-01,TCGA-24-1416-01,TCGA-24-1564-01,TCGA-61-2088-01,TCGA-10-0934-01,TCGA-61-2003-01,TCGA-13-0714-01,TCGA-13-1510-01,TCGA-36-1576-01,TCGA-25-1329-01,TCGA-04-1337-01,TCGA-24-1428-01,TCGA-04-1332-01,TCGA-04-1349-01,TCGA-13-0791-01,TCGA-24-2019-01,TCGA-24-1425-01,TCGA-24-1423-01,TCGA-10-0926-01,TCGA-13-0760-01,TCGA-24-1556-01,TCGA-24-1558-01,TCGA-24-1616-01,TCGA-24-1604-01,TCGA-09-1659-01,TCGA-24-1413-01,TCGA-09-1662-01,TCGA-13-0724-01,TCGA-13-1484-01,TCGA-24-2254-01,TCGA-61-2101-01,TCGA-09-0366-01,TCGA-09-2053-01,TCGA-24-2024-01,TCGA-57-1993-01,TCGA-13-0751-01,TCGA-10-0928-01,TCGA-04-1525-01,TCGA-23-1022-01,TCGA-30-1862-01,TCGA-13-0765-01,TCGA-31-1953-01,TCGA-04-1514-01,TCGA-13-1509-01,TCGA-24-1419-01,TCGA-25-1321-01,TCGA-20-0987-01,TCGA-23-1024-01,TCGA-24-2290-01,TCGA-23-1124-01,TCGA-61-1736-01,TCGA-13-0800-01,TCGA-24-1434-01,TCGA-04-1517-01,TCGA-09-1661-01,TCGA-61-1995-01,TCGA-24-1614-01,TCGA-36-1569-01,TCGA-24-2271-01,TCGA-23-1123-01,TCGA-13-1507-01,TCGA-13-0899-01,TCGA-23-1110-01,TCGA-25-1319-01,TCGA-24-1548-01,TCGA-13-0910-01,TCGA-04-1346-01,TCGA-04-1350-01,TCGA-25-1326-01,TCGA-24-1549-01,TCGA-13-0891-01,TCGA-13-1411-01,TCGA-24-2260-01,TCGA-04-1342-01,TCGA-13-0723-01,TCGA-24-2289-01,TCGA-59-2354-01,TCGA-59-2350-01,TCGA-59-2363-01,TCGA-13-0762-01,TCGA-59-2351-01,TCGA-25-2398-01,TCGA-25-1315-01,TCGA-13-1497-01,TCGA-30-1853-01,TCGA-57-1582-01,TCGA-24-0966-01,TCGA-24-1557-01,TCGA-59-2355-01,TCGA-10-0927-01,TCGA-09-2044-01,TCGA-13-0906-01,TCGA-25-1627-01,TCGA-13-1482-01,TCGA-24-2281-01,TCGA-13-0889-01,TCGA-61-2016-01,TCGA-04-1362-01,TCGA-13-0717-01,TCGA-61-2104-01,TCGA-10-0938-01,TCGA-24-2035-01,TCGA-24-1105-01,TCGA-24-0979-01,TCGA-04-1361-01,TCGA-25-1628-01,TCGA-13-1491-01,TCGA-25-1635-01,TCGA-13-1506-01,TCGA-24-1560-01,TCGA-13-1410-01,TCGA-24-1464-01,TCGA-10-0935-01,TCGA-36-1568-01,TCGA-23-2072-01,TCGA-13-1487-01,TCGA-24-1426-01,TCGA-13-0920-01,TCGA-25-1320-01,TCGA-23-1021-01,TCGA-04-1348-01,TCGA-04-1338-01,TCGA-23-1117-01,TCGA-36-1578-01,TCGA-36-1575-01,TCGA-36-1574-01,TCGA-25-2399-01,TCGA-30-1891-01,TCGA-36-1577-01,TCGA-24-1466-01,TCGA-61-2092-01,TCGA-04-1347-01,TCGA-20-0990-01,TCGA-24-1104-01,TCGA-24-1418-01,TCGA-57-1583-01,TCGA-13-0795-01,TCGA-13-1496-01,TCGA-25-1623-01,TCGA-24-1551-01,TCGA-24-1431-01,TCGA-13-2060-01,TCGA-25-1631-01,TCGA-13-1495-01,TCGA-24-1603-01,TCGA-04-1530-01,TCGA-04-1542-01,TCGA-24-1471-01,TCGA-61-2102-01,TCGA-24-1469-01,TCGA-13-1407-01,TCGA-23-1028-01,TCGA-13-0894-01,TCGA-13-1409-01,TCGA-24-0982-01,TCGA-61-2000-01,TCGA-61-2110-01,TCGA-31-1950-01,TCGA-24-1424-01,TCGA-24-1427-01,TCGA-61-1998-01,TCGA-13-0904-01,TCGA-13-0923-01,TCGA-24-1563-01,TCGA-13-1504-01,TCGA-25-1324-01,TCGA-13-0897-01,TCGA-10-0937-01,TCGA-04-1364-01,TCGA-20-0991-01,TCGA-24-2267-01,TCGA-13-1404-01,TCGA-13-0911-01,TCGA-25-1313-01,TCGA-36-1571-01,TCGA-13-0884-01,TCGA-13-1412-01,TCGA-24-1545-01,TCGA-24-1436-01,TCGA-25-2400-01,TCGA-13-1403-01,TCGA-23-1116-01,TCGA-10-0925-01,TCGA-10-0933-01,TCGA-20-1684-01,TCGA-20-1685-01,TCGA-20-1686-01,TCGA-20-1687-01,TCGA-23-1029-01,TCGA-23-1031-01,TCGA-23-1109-01,TCGA-23-1111-01,TCGA-23-1113-01,TCGA-23-1119-01,TCGA-23-1809-01,TCGA-23-2641-01,TCGA-23-2643-01,TCGA-23-2645-01,TCGA-23-2647-01,TCGA-23-2649-01,TCGA-24-0980-01,TCGA-24-0981-01,TCGA-24-1430-01,TCGA-24-1435-01,TCGA-24-1467-01,TCGA-24-1544-01,TCGA-24-1546-01,TCGA-24-1550-01,TCGA-24-1552-01,TCGA-24-1553-01,TCGA-24-1565-01,TCGA-24-1842-01,TCGA-24-1843-01,TCGA-24-1844-01,TCGA-24-1845-01,TCGA-24-1846-01,TCGA-24-1847-01,TCGA-24-1849-01,TCGA-24-1850-01,TCGA-24-1852-01,TCGA-24-1920-01,TCGA-24-1923-01,TCGA-24-1924-01,TCGA-24-1927-01,TCGA-24-1928-01,TCGA-24-1930-01,TCGA-24-2020-01,TCGA-24-2023-01,TCGA-24-2026-01,TCGA-24-2027-01,TCGA-24-2029-01,TCGA-24-2033-01,TCGA-24-2038-01,TCGA-24-2295-01,TCGA-25-1312-01,TCGA-25-1314-01,TCGA-25-1316-01,TCGA-25-1317-01,TCGA-25-1323-01,TCGA-25-1325-01,TCGA-25-1328-01,TCGA-25-1633-01,TCGA-25-1870-01,TCGA-25-1871-01,TCGA-25-1877-01,TCGA-25-1878-01,TCGA-25-2042-01,TCGA-25-2390-01,TCGA-25-2396-01,TCGA-25-2397-01");
        browser.click(".oncoprinterSubmit");
        waitForOncoprint(3000);
        browser.setValue(".oncoprinterGenesInput", "BRCA2 TP53 PTEN");
        browser.click(".oncoprinterSubmit");
        waitForOncoprint(3000);

        var res = browser.checkElement('div#oncoprintDiv', { hide:['.qtip'] } );
        assertScreenShotMatch(res);
    });
    it("oncoprinter example data, dont color by mutation type", function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist(".oncoprinterExampleData");
        browser.click(".oncoprinterExampleData");
        browser.click(".oncoprinterSubmit");
        waitForOncoprint(3000);
        setOncoprintMutationsMenuOpen(true);
        browser.click('input[data-test="ColorByType"]');
        waitForOncoprint(3000);
        setOncoprintMutationsMenuOpen(false); // get it out of the way for screenshot

        var res = browser.checkElement('div#oncoprintDiv', { hide:['.qtip'] } );
        assertScreenShotMatch(res);
    });
    it("oncoprinter example data, dont color by driver vs VUS", function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist(".oncoprinterExampleData");
        browser.click(".oncoprinterExampleData");
        browser.click(".oncoprinterSubmit");
        waitForOncoprint(3000);
        setOncoprintMutationsMenuOpen(true);
        browser.click('input[data-test="ColorByDriver"]');
        waitForOncoprint(3000);
        setOncoprintMutationsMenuOpen(false); // get it out of the way for screenshot

        var res = browser.checkElement('div#oncoprintDiv', { hide:['.qtip'] } );
        assertScreenShotMatch(res);
    });
    it("oncoprinter example data, hide VUS", function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        browser.waitForExist(".oncoprinterExampleData");
        browser.click(".oncoprinterExampleData");
        browser.click(".oncoprinterSubmit");
        waitForOncoprint(3000);
        setOncoprintMutationsMenuOpen(true);
        browser.click('input[data-test="HideVUS"]');
        waitForOncoprint(3000);
        setOncoprintMutationsMenuOpen(false); // get it out of the way for screenshot

        var res = browser.checkElement('div#oncoprintDiv', { hide:['.qtip'] } );
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
    it("plots tab clinical vs clinical stacked bar plot", function() {
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({ value: "AJCC_TUMOR_PATHOLOGIC_PT" }); });
        waitForAndCheckPlotsTab();
    });
    it("plots tab clinical vs clinical table plot", function() {
        browser.click('input[data-test="DiscreteVsDiscreteTable"]');
        waitForAndCheckPlotsTab();
    });
    it("plots tab copy number vs clinical stacked bar plot", function() {
        browser.click('input[data-test="DiscreteVsDiscreteTable"]');
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({ value: "COPY_NUMBER_ALTERATION" }); });
        waitForAndCheckPlotsTab();
    });
    it("plots tab copy number vs clinical table plot", function() {
        browser.click('input[data-test="DiscreteVsDiscreteTable"]');
        waitForAndCheckPlotsTab();
    });
    it("plots tab mutations wildtype mode vs clinical stacked bar plot", function() {
        browser.click('input[data-test="DiscreteVsDiscreteTable"]');
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisMutationCountBySelect({ value: "MutatedVsWildType" }); });
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({ value: "MUTATION_EXTENDED" }); });
        waitForAndCheckPlotsTab();
    });
    it("plots tab mutations wildtype mode vs clinical table plot", function() {
        browser.click('input[data-test="DiscreteVsDiscreteTable"]');
        waitForAndCheckPlotsTab();
    });
    it("plots tab mutations vs clinical stacked bar plot", function() {
        browser.click('input[data-test="DiscreteVsDiscreteTable"]');
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisMutationCountBySelect({ value: "MutationType" }); });
        waitForAndCheckPlotsTab();
    });
    it("plots tab mutations vs clinical table plot", function() {
        browser.click('input[data-test="DiscreteVsDiscreteTable"]');
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
