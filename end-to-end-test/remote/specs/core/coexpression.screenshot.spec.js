var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('../../../shared/specUtils').waitForOncoprint;
var setOncoprintMutationsMenuOpen = require('../../../shared/specUtils')
    .setOncoprintMutationsMenuOpen;
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('../../../shared/specUtils')
    .waitForNetworkQuiet;
var sessionServiceIsEnabled = require('../../../shared/specUtils')
    .sessionServiceIsEnabled;
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

var { COEXPRESSION_TIMEOUT } = require('../../../shared/specUtils');

describe('coexpression tab screenshot tests', function() {
    this.retries(2);

    before(function() {
        var url = `${CBIOPORTAL_URL}/results/coexpression?tab_index=tab_visualize&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS+NRAS+BRAF&gene_set_choice=user-defined-list&Action=Submit`;
        goToUrlAndSetLocalStorage(url);
    });
    it('coexpression tab coadread_tcga_pub initial load', function() {
        browser.waitForExist(
            'div[data-test="CoExpressionPlot"]',
            COEXPRESSION_TIMEOUT
        ); // wait for plot to show up
        var res = browser.checkElement('div[data-test="coExpressionTabDiv"]');
        assertScreenShotMatch(res);
    });
    it('coexpression tab coadread_tcga_pub log scale x and y mutations on', function() {
        browser.click(
            'div[data-test="coExpressionTabDiv"] input[data-test="logScale"]'
        );
        browser.moveToObject('body', 0, 0);
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
        browser.click(
            'div[data-test="coExpressionTabDiv"] input[data-test="ShowMutations"]'
        );
        browser.moveToObject('body', 0, 0);
        var res = browser.checkElement('div[data-test="coExpressionTabDiv"]');
        assertScreenShotMatch(res);
    });
    it('coexpression tab coadread_tcga_pub switch tabs', function() {
        browser.click('#coexpressionTabGeneTabs>ul>li:nth-child(2)>a'); // click on NRAS
        browser.moveToObject('body', 0, 0);
        browser.pause(100); // give time to start loading
        browser.waitForExist(
            'div[data-test="CoExpressionPlot"]',
            COEXPRESSION_TIMEOUT
        ); // wait for plot to show up
        var res = browser.checkElement('div[data-test="coExpressionTabDiv"]');
        assertScreenShotMatch(res);
    });
    it('coexpression tab coadread_tcga_pub switch profiles', function() {
        browser.execute(function() {
            resultsViewCoExpressionTab.onSelectProfileX({
                value: 'coadread_tcga_pub_mrna',
            });
        });
        browser.execute(function() {
            resultsViewCoExpressionTab.onSelectProfileY({
                value: 'coadread_tcga_pub_mrna',
            });
        });
        browser.pause(100); // give time to start loading
        browser.waitForExist(
            'div[data-test="CoExpressionPlot"]',
            COEXPRESSION_TIMEOUT
        ); // wait for plot to show up
        var res = browser.checkElement('div[data-test="coExpressionTabDiv"]');
        assertScreenShotMatch(res);
    });
    it('coexpression tab coadread_tcga_pub switch profiles + regression line', function() {
        browser.click('input[data-test="ShowRegressionLine"]');
        var res = browser.checkElement('div[data-test="coExpressionTabDiv"]');
        assertScreenShotMatch(res);
    });
    it.skip('coexpression tab coadread_tcga_pub with a lot of genes', function() {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/coexpression?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=AKR1C3%2520AR%2520CYB5A%2520CYP11A1%2520CYP11B1%2520CYP11B2%2520CYP17A1%2520CYP19A1%2520CYP21A2%2520HSD17B1%2520HSD17B10%2520HSD17B11%2520HSD17B12%2520HSD17B13%2520HSD17B14%2520HSD17B2%2520HSD17B3%2520HSD17B4%2520HSD17B6%2520HSD17B7%2520HSD17B8%2520HSD3B1%2520HSD3B2%2520HSD3B7%2520RDH5%2520SHBG%2520SRD5A1%2520SRD5A2%2520SRD5A3%2520STAR&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`
        );
        browser.waitForExist(
            'div[data-test="CoExpressionPlot"]',
            COEXPRESSION_TIMEOUT
        ); // wait for plot to show up
        var res = browser.checkElement('div[data-test="coExpressionTabDiv"]');
        assertScreenShotMatch(res);
    });

    it.skip('coexpression tab coadread_tcga_pub with user defined case list', function() {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/coexpression?Action=Submit&cancer_study_list=coadread_tcga_pub&case_ids=coadread_tcga_pub%3ATCGA-A6-2672-01%2Bcoadread_tcga_pub%3ATCGA-A6-2678-01%2Bcoadread_tcga_pub%3ATCGA-A6-3809-01%2Bcoadread_tcga_pub%3ATCGA-AA-3502-01%2Bcoadread_tcga_pub%3ATCGA-AA-3510-01%2Bcoadread_tcga_pub%3ATCGA-AA-3672-01%2Bcoadread_tcga_pub%3ATCGA-AA-3673-01%2Bcoadread_tcga_pub%3ATCGA-AA-3850-01%2Bcoadread_tcga_pub%3ATCGA-AA-3852-01%2Bcoadread_tcga_pub%3ATCGA-AA-3862-01%2Bcoadread_tcga_pub%3ATCGA-AA-3877-01%2Bcoadread_tcga_pub%3ATCGA-AA-3986-01%2Bcoadread_tcga_pub%3ATCGA-AA-3989-01%2Bcoadread_tcga_pub%3ATCGA-AA-3994-01%2Bcoadread_tcga_pub%3ATCGA-AA-A00L-01%2Bcoadread_tcga_pub%3ATCGA-AA-A010-01%2Bcoadread_tcga_pub%3ATCGA-AA-A02O-01%2Bcoadread_tcga_pub%3ATCGA-CM-4748-01&case_set_id=-1&clinicallist=PROFILED_IN_coadread_tcga_pub_mutations%2CPROFILED_IN_coadread_tcga_pub_gistic&gene_list=KRAS%0AAPC&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&show_samples=false&tab_index=tab_visualize`
        );
        browser.waitForExist(
            'div[data-test="CoExpressionPlot"]',
            COEXPRESSION_TIMEOUT
        ); // wait for plot to show up
        var res = browser.checkElement('div[data-test="coExpressionTabDiv"]');
        assertScreenShotMatch(res);
    });
});
