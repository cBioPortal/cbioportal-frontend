var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('./../specUtils').waitForOncoprint;
var setOncoprintMutationsMenuOpen = require('./../specUtils').setOncoprintMutationsMenuOpen;
var goToUrlAndSetLocalStorage = require('./../specUtils').goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('./../specUtils').waitForNetworkQuiet;
var sessionServiceIsEnabled = require('./../specUtils').sessionServiceIsEnabled;
var assertScreenShotMatch = require('../../lib/testUtils').assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");


describe("coexpression tab screenshot tests", function() {

    this.retries(2);

    before(function() {
        var url = `${CBIOPORTAL_URL}/results/coexpression?tab_index=tab_visualize&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&case_ids=&gene_list=KRAS+NRAS+BRAF&gene_set_choice=user-defined-list&Action=Submit`;
        goToUrlAndSetLocalStorage(url);
    });
    it('coexpression tab coadread_tcga_pub initial load', function() {
        browser.waitForExist('div[data-test="CoExpressionPlot"]', 60000); // wait for plot to show up
        var res = browser.checkElement('div[data-test="coExpressionTabDiv"]');
        assertScreenShotMatch(res);
    });
    it('coexpression tab coadread_tcga_pub log scale x and y mutations on', function() {
        browser.click('div[data-test="coExpressionTabDiv"] input[data-test="logScale"]');
        browser.moveToObject("body",0,0);
        var res = browser.checkElement('div[data-test="coExpressionTabDiv"]');
        assertScreenShotMatch(res);
    });
    it('coexpression tab coadread_tcga_pub log scale x and y with regression line', function() {
        browser.click('input[data-test="ShowRegressionLine"]');
        var res = browser.checkElement('div[data-test="coExpressionTabDiv"]');
        assertScreenShotMatch(res);
    });
    it('coexpression tab coadread_tcga_pub loc scale x and y mutations off', function() {
        browser.click('input[data-test="ShowRegressionLine"]');
        browser.click('div[data-test="coExpressionTabDiv"] input[data-test="ShowMutations"]');
        browser.moveToObject("body",0,0);
        var res = browser.checkElement('div[data-test="coExpressionTabDiv"]');
        assertScreenShotMatch(res);
    });
    it('coexpression tab coadread_tcga_pub switch tabs', function() {
        browser.click('#coexpressionTabGeneTabs>ul>li:nth-child(2)>a');// click on NRAS
        browser.moveToObject("body",0,0);
        browser.pause(100); // give time to start loading
        browser.waitForExist('div[data-test="CoExpressionPlot"]', 60000); // wait for plot to show up
        var res = browser.checkElement('div[data-test="coExpressionTabDiv"]');
        assertScreenShotMatch(res);
    });
    it('coexpression tab coadread_tcga_pub switch profiles', function() {
        browser.execute(function() { resultsViewCoExpressionTab.onSelectProfileX({ value: "coadread_tcga_pub_mrna"}); });
        browser.execute(function() { resultsViewCoExpressionTab.onSelectProfileY({ value: "coadread_tcga_pub_mrna"}); });
        browser.pause(100); // give time to start loading
        browser.waitForExist('div[data-test="CoExpressionPlot"]', 60000); // wait for plot to show up
        var res = browser.checkElement('div[data-test="coExpressionTabDiv"]');
        assertScreenShotMatch(res);
    });
    it('coexpression tab coadread_tcga_pub switch profiles + regression line', function() {
        browser.click('input[data-test="ShowRegressionLine"]');
        var res = browser.checkElement('div[data-test="coExpressionTabDiv"]');
        assertScreenShotMatch(res);
    });
    it('coexpression tab coadread_tcga_pub with a lot of genes', function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/results/coexpression?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=AKR1C3%2520AR%2520CYB5A%2520CYP11A1%2520CYP11B1%2520CYP11B2%2520CYP17A1%2520CYP19A1%2520CYP21A2%2520HSD17B1%2520HSD17B10%2520HSD17B11%2520HSD17B12%2520HSD17B13%2520HSD17B14%2520HSD17B2%2520HSD17B3%2520HSD17B4%2520HSD17B6%2520HSD17B7%2520HSD17B8%2520HSD3B1%2520HSD3B2%2520HSD3B7%2520RDH5%2520SHBG%2520SRD5A1%2520SRD5A2%2520SRD5A3%2520STAR&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`);
        browser.waitForExist('div[data-test="CoExpressionPlot"]', 60000); // wait for plot to show up
        var res = browser.checkElement('div[data-test="coExpressionTabDiv"]');
        assertScreenShotMatch(res);
    });
});
