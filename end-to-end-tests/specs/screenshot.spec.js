var assert = require('assert');
var expect = require('chai').expect;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

function ssAssert(result, message){
    assert(result[0].isWithinMisMatchTolerance);
};

describe('fdas', function(){
    before(function(){
        var url = `${CBIOPORTAL_URL}/index.do?tab_index=tab_visualize&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&case_ids=&gene_list=KRAS+NRAS+BRAF&gene_set_choice=user-defined-list&Action=Submit&show_samples=false&`;
        browser.url(url);
        browser.localStorage('POST', {key: 'localdev', value: 'true'});
        browser.refresh();
    });

    it('render the oncoprint', function(){
        browser.waitForVisible('#oncoprint canvas');
        browser.pause(1000);
        var res = browser.checkDocument();
        ssAssert(res);
    });

    it('cancer type summary', function(){
        browser.click("[href='#pancancer_study_summary']");
        browser.waitForVisible('.cancer-summary-chart-container',10000);
        var res = browser.checkDocument({ hide:['.qtip'] });
        ssAssert(res);
    });

    it('mutex tab', function(){
        browser.click("[href='#mutex']");
        //browser.waitForVisible('.table-striped',10000);
        var res = browser.checkDocument({ hide:['.qtip'] });
        ssAssert(res);
    });

    it('plots tab', function(){
        browser.click("[href='#plots']");
        //browser.waitForVisible('.table-striped',10000);
        //var res = browser.checkDocument({ misMatchTolerance:10, hide:['.qtip'] });
        var res = browser.checkElement('#plots-sidebar-x-div');
        ssAssert(res);
    });

    it('mutation tab', function(){
        browser.click("[href='#mutation_details']");
        browser.waitForVisible('.table-striped',10000);
        browser.waitForVisible('.borderedChart svg',10000);
        var res = browser.checkDocument({hide:['.qtip'] });
        ssAssert(res);
    });

    it('coexpression tab', function(){
        browser.click("[href='#coexp']");
        browser.waitForVisible('#coexp_table_div_KRAS',10000);
        var res = browser.checkDocument({hide:['.qtip'] });
        ssAssert(res);
    });

    it('survival tab', function(){
        browser.click("[href='#survival']");
        browser.waitForVisible('[data-test=SurvivalChart] svg',10000);
        var res = browser.checkDocument({hide:['.qtip'] });
        ssAssert(res);
    });

    it('network tab', function(){
        browser.click("[href='#network']");
        browser.waitForVisible('#cytoscapeweb',20000);
        var res = browser.checkDocument({hide:['.qtip'] });
        ssAssert(res);
    });

    it('igv_tab tab', function(){
        browser.click("[href='#igv_tab']");
        browser.pause(4000); // wait for iframe to load
        var res = browser.checkDocument({hide:['.qtip'] });
        ssAssert(res);
    });

    it('data_download tab', function(){
        browser.click("[href='#data_download']");
        var res = browser.checkDocument({hide:['.qtip'] });
        ssAssert(res);
    });

    it('bookmark tab', function(){
        browser.click("[href='#bookmark_email']");
        var res = browser.checkDocument({hide:['.qtip'] });
        ssAssert(res);
    });




});




