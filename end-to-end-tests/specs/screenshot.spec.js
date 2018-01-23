var assert = require('assert');
var expect = require('chai').expect;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

function waitForOncoprint(timeout) {
    browser.pause(100); // give oncoprint time to disappear
    $('#oncoprint-inner svg rect').waitForExist(10000); // as a proxy for oncoprint being rendered, wait for an svg rectangle to appear in the legend
}

function ssAssert(result, message){
    assert(result[0].isWithinMisMatchTolerance);
};

describe('result page tabs', function(){
    before(function(){
        var url = `${CBIOPORTAL_URL}/index.do?tab_index=tab_visualize&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&case_ids=&gene_list=KRAS+NRAS+BRAF&gene_set_choice=user-defined-list&Action=Submit&show_samples=false&`;
        browser.url(url);
        ///browser.localStorage('POST', {key: 'localdev', value: 'true'});
        //browser.refresh();
    });

    it('render the oncoprint', function(){
        waitForOncoprint();
        browser.pause(2000);
        var res = browser.checkElement('#oncoprint');
        ssAssert(res);
    });

    it('cancer type summary', function(){
        browser.click("[href='#pancancer_study_summary']");
        browser.waitForVisible('.cancer-summary-chart-container',10000);
        var res = browser.checkElement('#pancancer_study_summary', { hide:['.qtip'] });
        ssAssert(res);
    });

    it('mutex tab', function(){
        browser.click("[href='#mutex']");
        var res = browser.checkElement('#mutex',{ hide:['.qtip'] });
        ssAssert(res);
    });

    it('plots tab', function(){
        browser.click("[href='#plots']");
        var res = browser.checkElement('#plots', { hide:['.qtip'] });
        ssAssert(res);
    });

    it('mutation tab', function(){
        browser.click("[href='#mutation_details']");
        browser.waitForVisible('.table-striped',10000);
        browser.waitForVisible('.borderedChart svg',10000);
        var res = browser.checkElement('#mutation_details',{hide:['.qtip'] });
        ssAssert(res);
    });

    it('coexpression tab', function(){
        browser.click("[href='#coexp']");
        browser.waitForVisible('#coexp_table_div_KRAS',10000);
        var res = browser.checkElement('#coexp',{hide:['.qtip'] });
        ssAssert(res);
    });

    it('survival tab', function(){
        browser.click("[href='#survival']");
        browser.waitForVisible('[data-test=SurvivalChart] svg',10000);
        var res = browser.checkElement('#survival',{hide:['.qtip'] });
        ssAssert(res);
    });

    it('network tab', function(){
        browser.click("[href='#network']");
        browser.waitForVisible('#cytoscapeweb canvas',20000);
        var res = browser.checkElement("#network",{hide:['.qtip','canvas'] });
        ssAssert(res);
    });

    it('igv_tab tab', function(){
        browser.click("[href='#igv_tab']");
        browser.pause(6000); // wait for iframe to load
        var res = browser.checkElement('#igv_tab',{hide:['.qtip'] });
        ssAssert(res);
    });

    it('data_download tab', function(){
        browser.click("[href='#data_download']");
        var res = browser.checkElement('#data_download',{hide:['.qtip'] });
        ssAssert(res);
    });

    it('bookmark tab', function(){
        browser.click("[href='#bookmark_email']");
        var res = browser.checkElement('#bookmark_email', {hide:['.qtip'] });
        ssAssert(res);
    });




});




