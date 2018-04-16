var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('./specUtils').waitForOncoprint;
var goToUrlAndSetLocalStorage = require('./specUtils').goToUrlAndSetLocalStorage;
var useExternalFrontend = require('./specUtils').useExternalFrontend;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

describe('homepage', function() {

    this.retries(2);

    before(()=>{
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    if (useExternalFrontend) {
        it('it should show dev mode when testing', function() {
            var devMode = $('.alert-warning');

            devMode.waitForExist(60000);
            assert(browser.getText('.alert-warning').indexOf('dev mode') > 0);
        });
    }

    it('it should have 27 (small test db), 29 (public test db) or 31 studies (production) in list', function () {
        browser.url(CBIOPORTAL_URL);

        var studies = $('[data-test="cancerTypeListContainer"] > ul > ul');

        studies.waitForExist(10000); // same as `browser.waitForExist('.notification', 10000)`

        expect([27, 29, 31]).to.include(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length);

    });


    it('should filter study list according to filter text input', function () {

        var input = $(".autosuggest input[type=text]");

        input.waitForExist(10000);

        input.setValue('tract');

        browser.pause(500);

        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 2);

    });

    it('when a single study is selected, a case set selector is provided', function(){

        var caseSetSelectorClass = '[data-test="CaseSetSelector"]';

        var checkBox = $('[data-test="StudySelect"]');

        checkBox.waitForExist(10000);

        assert.equal(browser.isExisting(caseSetSelectorClass), false);

        browser.click('[data-test="StudySelect"]');

        var caseSetSelector = $(caseSetSelectorClass);
        caseSetSelector.waitForExist(10000);

        assert.equal(browser.isExisting(caseSetSelectorClass), true);

    });

    it('should not allow submission if OQL contains EXP or PROT for multiple studies', ()=>{
        var nextCheckboxSel = '[data-test="StudySelect"]:nth-child(5)';
        browser.click(nextCheckboxSel);

        var oqlEntrySel = 'textarea[data-test="geneSet"]';
        browser.setValue(oqlEntrySel, 'PTEN: EXP>1');

        var errorMessageSel = 'span[data-test="oqlErrorMessage"]';
        browser.waitForExist(errorMessageSel);
        assert.equal(
            browser.getText(errorMessageSel),
            "Expression filtering in the gene list (the EXP command) is not supported when doing cross cancer queries."
        );

        var submitButtonSel = 'button[data-test="queryButton"]';
        assert.equal(
            browser.getAttribute(submitButtonSel, 'disabled'),
            'true',
            "submit should be disabled w/ EXP in oql"
        );

        browser.setValue(oqlEntrySel, 'PTEN: PROT>1');
        browser.waitForExist(errorMessageSel);
        assert.equal(
            browser.getText(errorMessageSel),
            "Protein level filtering in the gene list (the PROT command) is not supported when doing cross cancer queries."
        );
        assert.equal(
            browser.getAttribute(submitButtonSel, 'disabled'),
            'true',
            "submit should be disabled w/ PROT in oql"
        );
    });

    describe('select all/deselect all functionality in study selector',function(){

        beforeEach(function(){
            goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
            browser.setViewportSize({ height:1400, width:1000 });
            browser.waitForExist('[data-test="StudySelect"] input[type=checkbox]');
        });


        function getVisibleCheckboxes(){
            return browser.elements('[data-test="StudySelect"] input[type=checkbox]').value;
        }

        it('clicking select all studies checkbox selects all studies',function(){

            var studyCheckboxes = getVisibleCheckboxes();

            var selectedStudies = studyCheckboxes.filter(function(el){
                return el.isSelected();
            });

            var allStudies = studyCheckboxes.length;

            assert.equal(selectedStudies.length, 0, 'no studies selected');

            browser.element('[data-test=selectAllStudies]').click();

            selectedStudies = studyCheckboxes.filter(function(el){
                return el.isSelected();
            });

            assert.equal(selectedStudies.length, allStudies, 'all studies are selected');

            browser.element('[data-test=selectAllStudies]').click();

            selectedStudies = studyCheckboxes.filter(function(el){
                return el.isSelected();
            });

            assert.equal(selectedStudies.length, 0, 'no studies are selected');


        });


        it('global deselect button clears all selected studies, even during filter',function(){


            var visibleCheckboxes = getVisibleCheckboxes();

            assert.equal($('[data-test=globalDeselectAllStudiesButton]').isExisting(), false, 'global deselect button does not exist');

            visibleCheckboxes[10].click();

            assert.equal($('[data-test=globalDeselectAllStudiesButton]').isExisting(), true, 'global deselect button DOES exist');

            var input = $(".autosuggest input[type=text]");

            var selectedStudies = visibleCheckboxes.filter(function(el){
                return el.isSelected();
            });

            assert.equal(selectedStudies.length,1, 'we selected one study');



            // add a filter
            input.setValue('breast');

            browser.pause(500);

            //click global deselect all while filtered
            $('[data-test=globalDeselectAllStudiesButton]').click();

            // click unfilter button
            $('[data-test=clearStudyFilter]').click();

            browser.pause(500);

            // we have to reselect elements b/c react has re-rendered them
            selectedStudies = checkboxes = getVisibleCheckboxes().filter(function(el){
                return el.isSelected();
            });

            assert.equal(selectedStudies.length,0, 'no selected studies are selected after deselect all clicked');


        });


    });

});

describe('cross cancer query', function() {

    this.retries(2);

    it('should show cross cancer bar chart with TP53 in title when selecting multiple studies and querying for TP53', function() {
        browser.url(`${CBIOPORTAL_URL}`);
        browser.setViewportSize({ height:1400, width:1000 });

        $('[data-test="StudySelect"]').waitForExist(20000);
        var checkBoxes = $$('[data-test="StudySelect"]');

        checkBoxes.forEach(function (checkBox, i) {
            // select a proportion of existing studies
            if (i % 20 === 0) {
                checkBox.click();
            }
        });

        // query tp53
        $('[data-test="geneSet"]').setValue('TP53');
        browser.waitForEnabled('[data-test="queryButton"]', 30000);
        browser.click('[data-test="queryButton"]');

        // go to cancer types summary
        $('#ui-id-1').waitForExist(60000);
        $('#ui-id-1').click();

        // check if TP53 is in the navigation above the plots
        $('.nav-pills').waitForExist(30000);
        var text = browser.getText('.nav-pills')
        assert(text.search('TP53') > -1);
    });
});

describe('single study query', function() {
    this.retries(2);

    before(()=>{
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });
    describe('mutation mapper ', function() {
        it('should show somatic and germline mutation rate', function() {
            browser.url(`${CBIOPORTAL_URL}`);
            browser.setViewportSize({ height:1400, width:1000 });

            var input = $(".autosuggest input[type=text]");

            input.waitForExist(10000);

            input.setValue('ovarian nature 2011');

            browser.pause(500);

            // should only be one element
            assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);

            var checkBox = $('[data-test="StudySelect"]');

            checkBox.waitForExist(10000);

            browser.click('[data-test="StudySelect"]');

            // query BRCA1 and BRCA2
            $('[data-test="geneSet"]').setValue('BRCA1 BRCA2');

            browser.waitForEnabled('[data-test="queryButton"]', 30000);
            browser.click('[data-test="queryButton"]');

            // click mutations tab
            $('#mutation-result-tab').waitForExist(30000);
            $('#mutation-result-tab').click();

            $('[data-test="germlineMutationRate"]').waitForExist(60000);
            var text = browser.getText('[data-test="germlineMutationRate"]')
            // check germline mutation rate
            assert(text.search('8.2%') > -1);
            // check somatic mutation
            var text = browser.getText('[data-test="somaticMutationRate"]')
            assert(text.search('3.5%') > -1);

        });

        it('should show lollipop for MUC2', function() {
            browser.url(`${CBIOPORTAL_URL}/index.do?cancer_study_id=cellline_nci60&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=cellline_nci60_cnaseq&gene_list=MUC2&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=cellline_nci60_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=cellline_nci60_CNA`);
            browser.setViewportSize({ height:1400, width:1000 });

            //  wait for mutations tab
            $('#mutation-result-tab').waitForExist(30000);
            $('#mutation-result-tab').click();

            // check lollipop plot appears
            $('[data-test="LollipopPlot"]').waitForExist(60000);
        });
    });

    describe('enrichments', function() {
        this.retries(3)

        it('should show mutations plot', function() {
            browser.url(`${CBIOPORTAL_URL}/index.do?cancer_study_id=ov_tcga_pub&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=ov_tcga_pub_cna_seq&gene_list=BRCA1+BRCA2&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ov_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=ov_tcga_pub_gistic`);

            // click enrichments tab
            $('#enrichments-result-tab').waitForExist(30000);
            $('#enrichments-result-tab').click();

            // wait for plot to show
            $('#ov_tcga_pub_mutations_plot_div').waitForExist(60000);
        });

        it('should be possible to add genes to query', function() {

            var checkBoxes = $('.ov_tcga_pub_mutations_datatable_table_gene_checkbox_class');

            checkBoxes.waitForExist(10000);

            // select one gene and click add checked genes to query
            browser.click('.ov_tcga_pub_mutations_datatable_table_gene_checkbox_class');
            browser.click('#ov_tcga_pub_mutations_datatable_table_update_query_btn');

            // wait for page to load
            $('[data-test="QuerySummaryGeneCount"]').waitForExist(60000);
            var text = browser.getText('[data-test="QuerySummaryGeneCount"]')

            // there should be one more gene queried now
            assert(text.search('3') > -1);
        });

        it('should be possible to add genes to query, with custom case list query in single study query', function() {
            browser.url(`${CBIOPORTAL_URL}/index.do?cancer_study_id=ov_tcga_pub&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=-1&case_ids=ov_tcga_pub%3ATCGA-24-1428-01%0D%0Aov_tcga_pub%3ATCGA-24-1928-01%0D%0Aov_tcga_pub%3ATCGA-29-1698-01%0D%0Aov_tcga_pub%3ATCGA-24-0980-01%0D%0Aov_tcga_pub%3ATCGA-24-0970-01%0D%0Aov_tcga_pub%3ATCGA-13-0725-01%0D%0Aov_tcga_pub%3ATCGA-23-1027-01%0D%0Aov_tcga_pub%3ATCGA-13-0755-01%0D%0Aov_tcga_pub%3ATCGA-25-1315-01&gene_list=BRCA1%2520BRCA2&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ov_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=ov_tcga_pub_gistic`);
            waitForOncoprint(60000);
            browser.pause(2000)

            // click enrichments tab
            $('#enrichments-result-tab').waitForExist(30000);
            $('#enrichments-result-tab').click();

            var checkBoxes = $('.ov_tcga_pub_mutations_datatable_table_gene_checkbox_class');

            checkBoxes.waitForExist(10000);

            // select one gene and click add checked genes to query
            browser.click('.ov_tcga_pub_mutations_datatable_table_gene_checkbox_class');
            browser.click('#ov_tcga_pub_mutations_datatable_table_update_query_btn');

            // wait for page to load
            $('[data-test="QuerySummaryGeneCount"]').waitForExist(60000);
            browser.pause(2000)
            var text = browser.getText('[data-test="QuerySummaryGeneCount"]')

            // there should be one more gene queried now
            assert(text.search('3') > -1, "one more gene queried");
        });
    });
});
