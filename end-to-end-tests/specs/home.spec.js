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
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

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
        var input = $(".autosuggest input[type=text]");
        input.setValue('breast');
        browser.pause(500);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"]');

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

describe('patient page', function(){

    this.retries(2);
    before(()=>{
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    it('oncokb indicators show up and hovering produces oncocard', function(){

        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/patient?studyId=ucec_tcga_pub&caseId=TCGA-BK-A0CC`);

        browser.waitForExist('span=PPP2R1A');

        // find oncokb image
        var oncokbIndicator = $('[data-test="oncogenic-icon-image"]');
        oncokbIndicator.waitForExist(30000);

        // move over oncokb image (this is deprecated, but there is no new
        // function yet)

        browser.pause(3000);
        browser.moveToObject('[data-test="oncogenic-icon-image"]',5,5);

        var oncokbCard = $('[data-test="oncokb-card"]');

        oncokbCard.waitForExist(30000);

        assert.equal(browser.getText('.tip-header').toLowerCase(), 'ppp2r1a s256f in uterine serous carcinoma/uterine papillary serous carcinoma'.toLowerCase());

    });

});

describe('cross cancer query', function() {

    this.retries(2);

    it('should show cross cancer bar chart with TP53 in title when selecting multiple studies and querying for TP53', function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}`);
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

        // wait for cancer types summary to appear
        $('[data-test="cancerTypeSummaryChart"]').waitForExist(60000);

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
           goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}`);
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
            goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/index.do?cancer_study_id=cellline_nci60&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=cellline_nci60_cnaseq&gene_list=MUC2&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=cellline_nci60_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=cellline_nci60_CNA`);
            browser.setViewportSize({ height:1400, width:1000 });

            //  wait for mutations tab
            $('#mutation-result-tab').waitForExist(30000);
            $('#mutation-result-tab').click();

            // check lollipop plot appears
            $('[data-test="LollipopPlot"]').waitForExist(60000);
        });
    });

    describe('enrichments', function() {
        //this.retries(3)

        it('should show mutations plot', function() {
            goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/index.do?cancer_study_id=ov_tcga_pub&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=ov_tcga_pub_cna_seq&gene_list=BRCA1+BRCA2&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ov_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=ov_tcga_pub_gistic`);
            waitForOncoprint(10000);

            assert(browser.isVisible('li a#enrichments-result-tab'));
        });
    });
});

describe("results page", function() {
    this.retries(2);

    before(()=>{
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
        browser.setViewportSize({ height:1400, width:1000 });
    });
    describe("mutual exclusivity tab", function() {
        it("should appear in a single study query with multiple genes", function(){
            goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%2520NRAS%2520BRAF%250APTEN%253A%2520MUT&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`);
            waitForOncoprint(10000);

            assert(browser.isVisible('li a#mutex-result-tab'));
        });
        it("should appear in a multiple study with multiple genes", function(){
            goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/index.do?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=all&gene_list=KRAS%2520NRAS%2520BRAF%250APTEN%253A%2520MUT&geneset_list=+&tab_index=tab_visualize&Action=Submit&cancer_study_list=coadread_tcga_pub%2Ccellline_nci60%2Cacc_tcga`);
            browser.waitForExist('li a#oncoprint-result-tab', 10000);

            assert(browser.isVisible('li a#mutex-result-tab'));
        });
        it("should not appear in a single study query with one gene", function(){
            goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%253A%2520MUT&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`);
            waitForOncoprint(10000);
            assert(!browser.isVisible('li a#mutex-result-tab'));

            goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`);
            waitForOncoprint(10000);
            assert(!browser.isVisible('li a#mutex-result-tab'));
        });
        it.skip("should not appear in a multiple study query with one gene", function() {
            goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/index.do?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=all&gene_list=KRAS&geneset_list=+&tab_index=tab_visualize&Action=Submit&cancer_study_list=coadread_tcga_pub%2Ccellline_nci60%2Cacc_tcga`);
            browser.waitForExist('li a#oncoprint-result-tab', 10000);
            browser.waitUntil(function(){
                return !browser.isVisible('li a#mutex-result-tab');
            });
            assert(!browser.isVisible('li a#mutex-result-tab'));
            goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/index.do?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=all&gene_list=KRAS%253A%2520MUT&geneset_list=+&tab_index=tab_visualize&Action=Submit&cancer_study_list=coadread_tcga_pub%2Ccellline_nci60%2Cacc_tcga`);
            browser.waitForExist('li a#oncoprint-result-tab', 10000);
            browser.waitUntil(function(){
                return !browser.isVisible('li a#mutex-result-tab');
            });
            assert(!browser.isVisible('li a#mutex-result-tab'));
        });
    });
});

describe('oncoprint', function() {

    this.retries(2);

    before(()=>{
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);


        browser.setViewportSize({ height:1400, width:1000 });
    });

    describe("initialization from URL parameters", ()=>{
        it("should start in patient mode if URL parameter show_samples=false or not specified", ()=>{
            // not specified
            goToUrlAndSetLocalStorage(CBIOPORTAL_URL+'/index.do?cancer_study_id=acc_tcga&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=acc_tcga_cnaseq&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_gistic');
            waitForOncoprint(10000);

            const patient_id_order = "VENHQS1PUi1BNUpZOmFjY190Y2dh,VENHQS1PUi1BNUo0OmFjY190Y2dh,VENHQS1PUi1BNUpCOmFjY190Y2dh,VENHQS1PUi1BNUoxOmFjY190Y2dh,VENHQS1PUi1BNUoyOmFjY190Y2dh,VENHQS1PUi1BNUozOmFjY190Y2dh,VENHQS1PUi1BNUo1OmFjY190Y2dh,VENHQS1PUi1BNUo2OmFjY190Y2dh,VENHQS1PUi1BNUo3OmFjY190Y2dh,VENHQS1PUi1BNUo4OmFjY190Y2dh,VENHQS1PUi1BNUo5OmFjY190Y2dh,VENHQS1PUi1BNUpBOmFjY190Y2dh,VENHQS1PUi1BNUpDOmFjY190Y2dh,VENHQS1PUi1BNUpEOmFjY190Y2dh,VENHQS1PUi1BNUpFOmFjY190Y2dh,VENHQS1PUi1BNUpGOmFjY190Y2dh,VENHQS1PUi1BNUpHOmFjY190Y2dh,VENHQS1PUi1BNUpIOmFjY190Y2dh,VENHQS1PUi1BNUpJOmFjY190Y2dh,VENHQS1PUi1BNUpKOmFjY190Y2dh,VENHQS1PUi1BNUpLOmFjY190Y2dh,VENHQS1PUi1BNUpMOmFjY190Y2dh,VENHQS1PUi1BNUpNOmFjY190Y2dh,VENHQS1PUi1BNUpPOmFjY190Y2dh,VENHQS1PUi1BNUpQOmFjY190Y2dh,VENHQS1PUi1BNUpROmFjY190Y2dh,VENHQS1PUi1BNUpSOmFjY190Y2dh,VENHQS1PUi1BNUpTOmFjY190Y2dh,VENHQS1PUi1BNUpUOmFjY190Y2dh,VENHQS1PUi1BNUpVOmFjY190Y2dh,VENHQS1PUi1BNUpWOmFjY190Y2dh,VENHQS1PUi1BNUpXOmFjY190Y2dh,VENHQS1PUi1BNUpYOmFjY190Y2dh,VENHQS1PUi1BNUpaOmFjY190Y2dh,VENHQS1PUi1BNUswOmFjY190Y2dh,VENHQS1PUi1BNUsxOmFjY190Y2dh,VENHQS1PUi1BNUsyOmFjY190Y2dh,VENHQS1PUi1BNUszOmFjY190Y2dh,VENHQS1PUi1BNUs0OmFjY190Y2dh,VENHQS1PUi1BNUs1OmFjY190Y2dh,VENHQS1PUi1BNUs2OmFjY190Y2dh,VENHQS1PUi1BNUs4OmFjY190Y2dh,VENHQS1PUi1BNUs5OmFjY190Y2dh,VENHQS1PUi1BNUtCOmFjY190Y2dh,VENHQS1PUi1BNUtPOmFjY190Y2dh,VENHQS1PUi1BNUtQOmFjY190Y2dh,VENHQS1PUi1BNUtROmFjY190Y2dh,VENHQS1PUi1BNUtTOmFjY190Y2dh,VENHQS1PUi1BNUtUOmFjY190Y2dh,VENHQS1PUi1BNUtVOmFjY190Y2dh,VENHQS1PUi1BNUtWOmFjY190Y2dh,VENHQS1PUi1BNUtXOmFjY190Y2dh,VENHQS1PUi1BNUtYOmFjY190Y2dh,VENHQS1PUi1BNUtZOmFjY190Y2dh,VENHQS1PUi1BNUtaOmFjY190Y2dh,VENHQS1PUi1BNUwxOmFjY190Y2dh,VENHQS1PUi1BNUwyOmFjY190Y2dh,VENHQS1PUi1BNUwzOmFjY190Y2dh,VENHQS1PUi1BNUw0OmFjY190Y2dh,VENHQS1PUi1BNUw1OmFjY190Y2dh,VENHQS1PUi1BNUw2OmFjY190Y2dh,VENHQS1PUi1BNUw4OmFjY190Y2dh,VENHQS1PUi1BNUw5OmFjY190Y2dh,VENHQS1PUi1BNUxBOmFjY190Y2dh,VENHQS1PUi1BNUxCOmFjY190Y2dh,VENHQS1PUi1BNUxDOmFjY190Y2dh,VENHQS1PUi1BNUxEOmFjY190Y2dh,VENHQS1PUi1BNUxFOmFjY190Y2dh,VENHQS1PUi1BNUxGOmFjY190Y2dh,VENHQS1PUi1BNUxHOmFjY190Y2dh,VENHQS1PUi1BNUxIOmFjY190Y2dh,VENHQS1PUi1BNUxJOmFjY190Y2dh,VENHQS1PUi1BNUxKOmFjY190Y2dh,VENHQS1PUi1BNUxLOmFjY190Y2dh,VENHQS1PUi1BNUxMOmFjY190Y2dh,VENHQS1PUi1BNUxOOmFjY190Y2dh,VENHQS1PUi1BNUxPOmFjY190Y2dh,VENHQS1PUi1BNUxQOmFjY190Y2dh,VENHQS1PUi1BNUxSOmFjY190Y2dh,VENHQS1PUi1BNUxTOmFjY190Y2dh,VENHQS1PUi1BNUxUOmFjY190Y2dh,VENHQS1PVS1BNVBJOmFjY190Y2dh,VENHQS1QNi1BNU9IOmFjY190Y2dh,VENHQS1QQS1BNVlHOmFjY190Y2dh,VENHQS1QSy1BNUg5OmFjY190Y2dh,VENHQS1QSy1BNUhBOmFjY190Y2dh,VENHQS1QSy1BNUhCOmFjY190Y2dh,VENHQS1QSy1BNUhDOmFjY190Y2dh";
            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                patient_id_order,
                "patient id order"
            );

            // = false
            goToUrlAndSetLocalStorage(CBIOPORTAL_URL+'/index.do?cancer_study_id=acc_tcga&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&show_samples=false&data_priority=0&case_set_id=acc_tcga_cnaseq&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_gistic');

            waitForOncoprint(10000);

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS1PUi1BNUpZOmFjY190Y2dh,VENHQS1PUi1BNUo0OmFjY190Y2dh,VENHQS1PUi1BNUpCOmFjY190Y2dh,VENHQS1PUi1BNUoxOmFjY190Y2dh,VENHQS1PUi1BNUoyOmFjY190Y2dh,VENHQS1PUi1BNUozOmFjY190Y2dh,VENHQS1PUi1BNUo1OmFjY190Y2dh,VENHQS1PUi1BNUo2OmFjY190Y2dh,VENHQS1PUi1BNUo3OmFjY190Y2dh,VENHQS1PUi1BNUo4OmFjY190Y2dh,VENHQS1PUi1BNUo5OmFjY190Y2dh,VENHQS1PUi1BNUpBOmFjY190Y2dh,VENHQS1PUi1BNUpDOmFjY190Y2dh,VENHQS1PUi1BNUpEOmFjY190Y2dh,VENHQS1PUi1BNUpFOmFjY190Y2dh,VENHQS1PUi1BNUpGOmFjY190Y2dh,VENHQS1PUi1BNUpHOmFjY190Y2dh,VENHQS1PUi1BNUpIOmFjY190Y2dh,VENHQS1PUi1BNUpJOmFjY190Y2dh,VENHQS1PUi1BNUpKOmFjY190Y2dh,VENHQS1PUi1BNUpLOmFjY190Y2dh,VENHQS1PUi1BNUpMOmFjY190Y2dh,VENHQS1PUi1BNUpNOmFjY190Y2dh,VENHQS1PUi1BNUpPOmFjY190Y2dh,VENHQS1PUi1BNUpQOmFjY190Y2dh,VENHQS1PUi1BNUpROmFjY190Y2dh,VENHQS1PUi1BNUpSOmFjY190Y2dh,VENHQS1PUi1BNUpTOmFjY190Y2dh,VENHQS1PUi1BNUpUOmFjY190Y2dh,VENHQS1PUi1BNUpVOmFjY190Y2dh,VENHQS1PUi1BNUpWOmFjY190Y2dh,VENHQS1PUi1BNUpXOmFjY190Y2dh,VENHQS1PUi1BNUpYOmFjY190Y2dh,VENHQS1PUi1BNUpaOmFjY190Y2dh,VENHQS1PUi1BNUswOmFjY190Y2dh,VENHQS1PUi1BNUsxOmFjY190Y2dh,VENHQS1PUi1BNUsyOmFjY190Y2dh,VENHQS1PUi1BNUszOmFjY190Y2dh,VENHQS1PUi1BNUs0OmFjY190Y2dh,VENHQS1PUi1BNUs1OmFjY190Y2dh,VENHQS1PUi1BNUs2OmFjY190Y2dh,VENHQS1PUi1BNUs4OmFjY190Y2dh,VENHQS1PUi1BNUs5OmFjY190Y2dh,VENHQS1PUi1BNUtCOmFjY190Y2dh,VENHQS1PUi1BNUtPOmFjY190Y2dh,VENHQS1PUi1BNUtQOmFjY190Y2dh,VENHQS1PUi1BNUtROmFjY190Y2dh,VENHQS1PUi1BNUtTOmFjY190Y2dh,VENHQS1PUi1BNUtUOmFjY190Y2dh,VENHQS1PUi1BNUtVOmFjY190Y2dh,VENHQS1PUi1BNUtWOmFjY190Y2dh,VENHQS1PUi1BNUtXOmFjY190Y2dh,VENHQS1PUi1BNUtYOmFjY190Y2dh,VENHQS1PUi1BNUtZOmFjY190Y2dh,VENHQS1PUi1BNUtaOmFjY190Y2dh,VENHQS1PUi1BNUwxOmFjY190Y2dh,VENHQS1PUi1BNUwyOmFjY190Y2dh,VENHQS1PUi1BNUwzOmFjY190Y2dh,VENHQS1PUi1BNUw0OmFjY190Y2dh,VENHQS1PUi1BNUw1OmFjY190Y2dh,VENHQS1PUi1BNUw2OmFjY190Y2dh,VENHQS1PUi1BNUw4OmFjY190Y2dh,VENHQS1PUi1BNUw5OmFjY190Y2dh,VENHQS1PUi1BNUxBOmFjY190Y2dh,VENHQS1PUi1BNUxCOmFjY190Y2dh,VENHQS1PUi1BNUxDOmFjY190Y2dh,VENHQS1PUi1BNUxEOmFjY190Y2dh,VENHQS1PUi1BNUxFOmFjY190Y2dh,VENHQS1PUi1BNUxGOmFjY190Y2dh,VENHQS1PUi1BNUxHOmFjY190Y2dh,VENHQS1PUi1BNUxIOmFjY190Y2dh,VENHQS1PUi1BNUxJOmFjY190Y2dh,VENHQS1PUi1BNUxKOmFjY190Y2dh,VENHQS1PUi1BNUxLOmFjY190Y2dh,VENHQS1PUi1BNUxMOmFjY190Y2dh,VENHQS1PUi1BNUxOOmFjY190Y2dh,VENHQS1PUi1BNUxPOmFjY190Y2dh,VENHQS1PUi1BNUxQOmFjY190Y2dh,VENHQS1PUi1BNUxSOmFjY190Y2dh,VENHQS1PUi1BNUxTOmFjY190Y2dh,VENHQS1PUi1BNUxUOmFjY190Y2dh,VENHQS1PVS1BNVBJOmFjY190Y2dh,VENHQS1QNi1BNU9IOmFjY190Y2dh,VENHQS1QQS1BNVlHOmFjY190Y2dh,VENHQS1QSy1BNUg5OmFjY190Y2dh,VENHQS1QSy1BNUhBOmFjY190Y2dh,VENHQS1QSy1BNUhCOmFjY190Y2dh,VENHQS1QSy1BNUhDOmFjY190Y2dh",
                "patient id order"
            );
        });

        it("should start in sample mode if URL paramter show_samples=true", ()=>{
            goToUrlAndSetLocalStorage(CBIOPORTAL_URL+'/index.do?cancer_study_id=acc_tcga&show_samples=true&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=acc_tcga_cnaseq&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_gistic');
            waitForOncoprint(10000);

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS1PUi1BNUpZLTAxOmFjY190Y2dh,VENHQS1PUi1BNUo0LTAxOmFjY190Y2dh,VENHQS1PUi1BNUpCLTAxOmFjY190Y2dh,VENHQS1PUi1BNUoxLTAxOmFjY190Y2dh,VENHQS1PUi1BNUoyLTAxOmFjY190Y2dh,VENHQS1PUi1BNUozLTAxOmFjY190Y2dh,VENHQS1PUi1BNUo1LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo2LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo3LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo4LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo5LTAxOmFjY190Y2dh,VENHQS1PUi1BNUpBLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpDLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpELTAxOmFjY190Y2dh,VENHQS1PUi1BNUpFLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpGLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpHLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpILTAxOmFjY190Y2dh,VENHQS1PUi1BNUpJLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpKLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpLLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpMLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpNLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpPLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpQLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpRLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpSLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpTLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpULTAxOmFjY190Y2dh,VENHQS1PUi1BNUpVLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpWLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpXLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpYLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpaLTAxOmFjY190Y2dh,VENHQS1PUi1BNUswLTAxOmFjY190Y2dh,VENHQS1PUi1BNUsxLTAxOmFjY190Y2dh,VENHQS1PUi1BNUsyLTAxOmFjY190Y2dh,VENHQS1PUi1BNUszLTAxOmFjY190Y2dh,VENHQS1PUi1BNUs0LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs1LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs2LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs4LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs5LTAxOmFjY190Y2dh,VENHQS1PUi1BNUtCLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtPLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtQLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtRLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtTLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtULTAxOmFjY190Y2dh,VENHQS1PUi1BNUtVLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtWLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtXLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtYLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtZLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtaLTAxOmFjY190Y2dh,VENHQS1PUi1BNUwxLTAxOmFjY190Y2dh,VENHQS1PUi1BNUwyLTAxOmFjY190Y2dh,VENHQS1PUi1BNUwzLTAxOmFjY190Y2dh,VENHQS1PUi1BNUw0LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw1LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw2LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw4LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw5LTAxOmFjY190Y2dh,VENHQS1PUi1BNUxBLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxCLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxDLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxELTAxOmFjY190Y2dh,VENHQS1PUi1BNUxFLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxGLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxHLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxILTAxOmFjY190Y2dh,VENHQS1PUi1BNUxJLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxKLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxLLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxMLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxOLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxPLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxQLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxSLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxTLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxULTAxOmFjY190Y2dh,VENHQS1PVS1BNVBJLTAxOmFjY190Y2dh,VENHQS1QNi1BNU9ILTAxOmFjY190Y2dh,VENHQS1QQS1BNVlHLTAxOmFjY190Y2dh,VENHQS1QSy1BNUg5LTAxOmFjY190Y2dh,VENHQS1QSy1BNUhBLTAxOmFjY190Y2dh,VENHQS1QSy1BNUhCLTAxOmFjY190Y2dh,VENHQS1QSy1BNUhDLTAxOmFjY190Y2dh",
                "sample id order"
            );
        });

        it("should start successfully if a specified clinical track doesnt exist", ()=>{
            goToUrlAndSetLocalStorage(CBIOPORTAL_URL+'/index.do?cancer_study_id=acc_tcga&show_samples=true&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=acc_tcga_cnaseq&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_gistic&clinicallist=asodifjpaosidjfa');
            waitForOncoprint(10000);

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS1PUi1BNUpZLTAxOmFjY190Y2dh,VENHQS1PUi1BNUo0LTAxOmFjY190Y2dh,VENHQS1PUi1BNUpCLTAxOmFjY190Y2dh,VENHQS1PUi1BNUoxLTAxOmFjY190Y2dh,VENHQS1PUi1BNUoyLTAxOmFjY190Y2dh,VENHQS1PUi1BNUozLTAxOmFjY190Y2dh,VENHQS1PUi1BNUo1LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo2LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo3LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo4LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo5LTAxOmFjY190Y2dh,VENHQS1PUi1BNUpBLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpDLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpELTAxOmFjY190Y2dh,VENHQS1PUi1BNUpFLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpGLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpHLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpILTAxOmFjY190Y2dh,VENHQS1PUi1BNUpJLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpKLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpLLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpMLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpNLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpPLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpQLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpRLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpSLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpTLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpULTAxOmFjY190Y2dh,VENHQS1PUi1BNUpVLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpWLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpXLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpYLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpaLTAxOmFjY190Y2dh,VENHQS1PUi1BNUswLTAxOmFjY190Y2dh,VENHQS1PUi1BNUsxLTAxOmFjY190Y2dh,VENHQS1PUi1BNUsyLTAxOmFjY190Y2dh,VENHQS1PUi1BNUszLTAxOmFjY190Y2dh,VENHQS1PUi1BNUs0LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs1LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs2LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs4LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs5LTAxOmFjY190Y2dh,VENHQS1PUi1BNUtCLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtPLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtQLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtRLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtTLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtULTAxOmFjY190Y2dh,VENHQS1PUi1BNUtVLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtWLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtXLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtYLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtZLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtaLTAxOmFjY190Y2dh,VENHQS1PUi1BNUwxLTAxOmFjY190Y2dh,VENHQS1PUi1BNUwyLTAxOmFjY190Y2dh,VENHQS1PUi1BNUwzLTAxOmFjY190Y2dh,VENHQS1PUi1BNUw0LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw1LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw2LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw4LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw5LTAxOmFjY190Y2dh,VENHQS1PUi1BNUxBLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxCLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxDLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxELTAxOmFjY190Y2dh,VENHQS1PUi1BNUxFLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxGLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxHLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxILTAxOmFjY190Y2dh,VENHQS1PUi1BNUxJLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxKLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxLLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxMLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxOLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxPLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxQLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxSLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxTLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxULTAxOmFjY190Y2dh,VENHQS1PVS1BNVBJLTAxOmFjY190Y2dh,VENHQS1QNi1BNU9ILTAxOmFjY190Y2dh,VENHQS1QQS1BNVlHLTAxOmFjY190Y2dh,VENHQS1QSy1BNUg5LTAxOmFjY190Y2dh,VENHQS1QSy1BNUhBLTAxOmFjY190Y2dh,VENHQS1QSy1BNUhCLTAxOmFjY190Y2dh,VENHQS1QSy1BNUhDLTAxOmFjY190Y2dh",
                "sample id order"
            );

            assert.equal(
                browser.execute(function() { return frontendOnc.model.getTracks().length; }).value,
                3,
                "gene tracks should exist"
            )
        });

        it("should start successfully if a specified clinical track doesnt exist, but others do", ()=>{
            goToUrlAndSetLocalStorage(CBIOPORTAL_URL+'/index.do?cancer_study_id=acc_tcga&show_samples=true&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=acc_tcga_cnaseq&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_gistic&clinicallist=CANCER_TYPE,asodifjpaosidjfa,CANCER_TYPE_DETAILED,FRACTION_GENOME_ALTERED,aposdijfpoai,MUTATION_COUNT');
            waitForOncoprint(10000);

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS1PUi1BNUpZLTAxOmFjY190Y2dh,VENHQS1PUi1BNUo0LTAxOmFjY190Y2dh,VENHQS1PUi1BNUpCLTAxOmFjY190Y2dh,VENHQS1PUi1BNUoxLTAxOmFjY190Y2dh,VENHQS1PUi1BNUoyLTAxOmFjY190Y2dh,VENHQS1PUi1BNUozLTAxOmFjY190Y2dh,VENHQS1PUi1BNUo1LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo2LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo3LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo4LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo5LTAxOmFjY190Y2dh,VENHQS1PUi1BNUpBLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpDLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpELTAxOmFjY190Y2dh,VENHQS1PUi1BNUpFLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpGLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpHLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpILTAxOmFjY190Y2dh,VENHQS1PUi1BNUpJLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpKLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpLLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpMLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpNLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpPLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpQLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpRLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpSLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpTLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpULTAxOmFjY190Y2dh,VENHQS1PUi1BNUpVLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpWLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpXLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpYLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpaLTAxOmFjY190Y2dh,VENHQS1PUi1BNUswLTAxOmFjY190Y2dh,VENHQS1PUi1BNUsxLTAxOmFjY190Y2dh,VENHQS1PUi1BNUsyLTAxOmFjY190Y2dh,VENHQS1PUi1BNUszLTAxOmFjY190Y2dh,VENHQS1PUi1BNUs0LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs1LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs2LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs4LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs5LTAxOmFjY190Y2dh,VENHQS1PUi1BNUtCLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtPLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtQLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtRLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtTLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtULTAxOmFjY190Y2dh,VENHQS1PUi1BNUtVLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtWLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtXLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtYLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtZLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtaLTAxOmFjY190Y2dh,VENHQS1PUi1BNUwxLTAxOmFjY190Y2dh,VENHQS1PUi1BNUwyLTAxOmFjY190Y2dh,VENHQS1PUi1BNUwzLTAxOmFjY190Y2dh,VENHQS1PUi1BNUw0LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw1LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw2LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw4LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw5LTAxOmFjY190Y2dh,VENHQS1PUi1BNUxBLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxCLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxDLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxELTAxOmFjY190Y2dh,VENHQS1PUi1BNUxFLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxGLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxHLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxILTAxOmFjY190Y2dh,VENHQS1PUi1BNUxJLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxKLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxLLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxMLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxOLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxPLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxQLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxSLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxTLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxULTAxOmFjY190Y2dh,VENHQS1PVS1BNVBJLTAxOmFjY190Y2dh,VENHQS1QNi1BNU9ILTAxOmFjY190Y2dh,VENHQS1QQS1BNVlHLTAxOmFjY190Y2dh,VENHQS1QSy1BNUg5LTAxOmFjY190Y2dh,VENHQS1QSy1BNUhBLTAxOmFjY190Y2dh,VENHQS1QSy1BNUhCLTAxOmFjY190Y2dh,VENHQS1QSy1BNUhDLTAxOmFjY190Y2dh",
                "sample id order"
            );

            assert.equal(
                browser.execute(function() { return frontendOnc.model.getTracks().length; }).value,
                7,
                "gene tracks and existing clinical tracks should exist"
            )
        });
    });
    describe("heatmap clustering", ()=>{
        describe("'Cluster Heatmap' button", ()=>{
            // THESE TESTs ARE RUN IN SERIAL, cannot be run alone
            var clusterButtonSelector;
            var heatmapButtonSelector;
            var heatmapMenuSelector;

            var sortButtonSelector;
            var sortMenuSelector;
            var sortMenuDataRadioSelector;
            var sortMenuHeatmapRadioSelector;

            before(()=>{
                heatmapButtonSelector = "#heatmapDropdown";
                heatmapMenuSelector = "div.oncoprint__controls__heatmap_menu";
                clusterButtonSelector = heatmapMenuSelector + ' button[data-test="clusterHeatmapBtn"]';

                sortButtonSelector="#sortDropdown";
                sortMenuSelector = "div.oncoprint__controls__sort_menu";
                sortMenuDataRadioSelector = sortMenuSelector + ' input[data-test="sortByData"]';
                sortMenuHeatmapRadioSelector = sortMenuSelector + ' input[data-test="sortByHeatmapClustering"]';
            });

            it("should be active (pressed) if, and only if, the oncoprint is clustered by the profile selected in the dropdown", ()=>{
                browser.url(CBIOPORTAL_URL+'/index.do?cancer_study_id=blca_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=blca_tcga_pub_cnaseq&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=blca_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=blca_tcga_pub_gistic&show_samples=false&heatmap_track_groups=blca_tcga_pub_rna_seq_mrna_median_Zscores%2CKRAS%2CNRAS%2CBRAF%3Bblca_tcga_pub_rppa_Zscores%2CKRAS%2CNRAS%2CBRAF');
                waitForOncoprint(10000);

                // open heatmap menu
                $(heatmapButtonSelector).click();
                browser.waitForVisible(heatmapMenuSelector, 2000);
                assert(browser.getAttribute(clusterButtonSelector, "class").split(/\s+/).indexOf("active") === -1, "button not active - 1");
                // click button
                browser.click(clusterButtonSelector);
                browser.pause(100);// wait for oncoprint to sort
                assert(browser.getAttribute(clusterButtonSelector, "class").split(/\s+/).indexOf("active") > -1, "button active - 1");
                // change heatmap profile
                browser.execute(function() { resultsViewOncoprint.selectHeatmapProfile(1); });
                assert(browser.getAttribute(clusterButtonSelector, "class").split(/\s+/).indexOf("active") === -1, "button not active - 2");
                browser.execute(function() { resultsViewOncoprint.selectHeatmapProfile(0); });
                assert(browser.getAttribute(clusterButtonSelector, "class").split(/\s+/).indexOf("active") > -1, "button active - 2");
            });
            it("should return to sort by data when the button is un-clicked", ()=>{
                // open sort menu, ensure sorted by heatmap clustering order
                $(sortButtonSelector).click();
                browser.waitForVisible(sortMenuSelector, 2000);
                assert(!browser.isSelected(sortMenuDataRadioSelector), "not sorted by data");
                assert(browser.isSelected(sortMenuHeatmapRadioSelector), "sorted by heatmap clustering");
                // open heatmap menu and unclick clustering button
                $(heatmapButtonSelector).click();
                browser.waitForVisible(heatmapMenuSelector, 2000);
                assert(browser.getAttribute(clusterButtonSelector, "class").split(/\s+/).indexOf("active") > -1, "button active");
                browser.click(clusterButtonSelector);
                assert(browser.getAttribute(clusterButtonSelector, "class").split(/\s+/).indexOf("active") === -1, "button not active");
                // open sort menu, ensure sorted by data
                $(sortButtonSelector).click();
                browser.waitForVisible(sortMenuSelector, 2000);
                assert(!browser.isSelected(sortMenuHeatmapRadioSelector), "not sorted by heatmap clustering");
                assert(browser.isSelected(sortMenuDataRadioSelector), "sorted by data");
            });
        });
    });
    describe("mutation annotation", ()=>{
        let mutationColorMenuButton;
        let mutationColorMenuDropdown;
        let oncoKbCheckbox;
        let hotspotsCheckbox;
        let cbioportalCheckbox;
        let cosmicCheckbox;

        before(()=>{
            browser.url(CBIOPORTAL_URL+'/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_cna_seq&gene_list=FBXW7&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations');
            waitForOncoprint(10000);

            mutationColorMenuButton = "#mutationColorDropdown";
            mutationColorMenuDropdown = "div.oncoprint__controls__mutation_color_menu";

            oncoKbCheckbox = mutationColorMenuDropdown + ' input[data-test="annotateOncoKb"]';
            hotspotsCheckbox = mutationColorMenuDropdown + ' input[data-test="annotateHotspots"]';
            cbioportalCheckbox = mutationColorMenuDropdown + ' input[data-test="annotateCBioPortalCount"]';
            cosmicCheckbox = mutationColorMenuDropdown + ' input[data-test="annotateCOSMICCount"]';
        });
        it("annotates all types of mutations with cbioportal count and cosmic", ()=>{
            browser.click(mutationColorMenuButton);
            browser.waitForVisible(mutationColorMenuDropdown, 2000);
            // select only mutation coloring by cbioportal count
            browser.click(cbioportalCheckbox);
            browser.click(oncoKbCheckbox);
            browser.click(hotspotsCheckbox);
            // set threshold 1
            browser.execute(function() { resultsViewOncoprint.setAnnotateCBioPortalInputValue("1"); });
            browser.pause(100); // give time to take effect
            waitForOncoprint(10000);
            let legendText = browser.getText("#oncoprint-inner svg");
            assert(legendText.indexOf("Inframe Mutation (putative driver)") > -1, "cbio count annotates inframe mutations");
            assert(legendText.indexOf("Missense Mutation (putative driver)") > -1, "cbio count annotates missense mutations");
            assert(legendText.indexOf("Truncating Mutation (putative driver)") > -1, "cbio count annotates truncating mutations");

            // select only mutation coloring by cosmic count
            browser.click(cosmicCheckbox);
            browser.click(cbioportalCheckbox);
            // set threshold 1
            browser.execute(function() { resultsViewOncoprint.setAnnotateCOSMICInputValue("1"); });
            browser.pause(100); // give time to take effect
            waitForOncoprint(10000);
            legendText = browser.getText("#oncoprint-inner svg");
            assert(legendText.indexOf("Inframe Mutation (putative driver)") > -1, "cosmic count annotates inframe mutations");
            assert(legendText.indexOf("Missense Mutation (putative driver)") > -1, "cosmic count annotates missense mutations");
            assert(legendText.indexOf("Truncating Mutation (putative driver)") > -1, "cosmic count annotates truncating mutations");
        });
    });

    describe("germline mutation", ()=>{

        it('should sort germline mutation in study ov_tcga_pub', () => {

            // search for study with germline mutation (ov_tcga_pub)
            browser.url(CBIOPORTAL_URL);
            var input = $(".autosuggest input[type=text]");
            input.waitForExist(10000);
            input.setValue('ovarian serous cystadenocarcinoma tcga nature 2011');
            browser.pause(500);
            // should only be one element
            assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);

            // select it
            var checkBox = $('[data-test="StudySelect"]');
            checkBox.waitForExist(10000);
            browser.click('[data-test="StudySelect"] input');

            // query with BRCA1
            $('[data-test="geneSet"]').setValue('BRCA1');

            browser.waitForEnabled('[data-test="queryButton"]', 30000);
            browser.click('[data-test="queryButton"]');

            waitForOncoprint(10000);

            // All patient/samples with germline mutation should be displayed first
            // ====================================================================
            // check if patient are sorted
            assert.equal(
                browser.execute(function () {
                    return frontendOnc.getIdOrder().join(",");
                }).value,
                "VENHQS0yMy0xMTIyOm92X3RjZ2FfcHVi,VENHQS0zMS0xOTU5Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzU2Om92X3RjZ2FfcHVi,VENHQS0wOS0xNjY5Om92X3RjZ2FfcHVi,VENHQS0wOS0yMDQ1Om92X3RjZ2FfcHVi,VENHQS0wOS0yMDUxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTMxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODgzOm92X3RjZ2FfcHVi,VENHQS0xMy0wODkzOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTAzOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDA4Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDk0Om92X3RjZ2FfcHVi,VENHQS0xMy0xNTEyOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDI3Om92X3RjZ2FfcHVi,VENHQS0yMy0xMTE4Om92X3RjZ2FfcHVi,VENHQS0yMy0yMDc3Om92X3RjZ2FfcHVi,VENHQS0yMy0yMDc4Om92X3RjZ2FfcHVi,VENHQS0yMy0yMDc5Om92X3RjZ2FfcHVi,VENHQS0yMy0yMDgxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDcwOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjk4Om92X3RjZ2FfcHVi,VENHQS0yNS0yMzkyOm92X3RjZ2FfcHVi,VENHQS0yNS0yNDAxOm92X3RjZ2FfcHVi,VENHQS01Ny0xNTgyOm92X3RjZ2FfcHVi,VENHQS01OS0yMzQ4Om92X3RjZ2FfcHVi,VENHQS02MS0yMDA4Om92X3RjZ2FfcHVi,VENHQS02MS0yMTA5Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzU3Om92X3RjZ2FfcHVi,VENHQS0xMy0wNzMwOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzYxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDg5Om92X3RjZ2FfcHVi,VENHQS0yMy0xMDI2Om92X3RjZ2FfcHVi,VENHQS0yNC0yMDM1Om92X3RjZ2FfcHVi,VENHQS0yNS0xNjI1Om92X3RjZ2FfcHVi,VENHQS0yNS0xNjMwOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjMyOm92X3RjZ2FfcHVi,VENHQS0yOS0yNDI3Om92X3RjZ2FfcHVi,VENHQS0xMy0wODA0Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzMxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzMyOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzM2Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzM3Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzM4Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzQyOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzQzOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzQ2Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzQ3Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzQ4Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzQ5Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzUwOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzYxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzYyOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzY0Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzY1Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzY3Om92X3RjZ2FfcHVi,VENHQS0wNC0xNTE0Om92X3RjZ2FfcHVi,VENHQS0wNC0xNTE3Om92X3RjZ2FfcHVi,VENHQS0wNC0xNTI1Om92X3RjZ2FfcHVi,VENHQS0wNC0xNTMwOm92X3RjZ2FfcHVi,VENHQS0wNC0xNTQyOm92X3RjZ2FfcHVi,VENHQS0wOS0wMzY2Om92X3RjZ2FfcHVi,VENHQS0wOS0wMzY5Om92X3RjZ2FfcHVi,VENHQS0wOS0xNjU5Om92X3RjZ2FfcHVi,VENHQS0wOS0xNjYxOm92X3RjZ2FfcHVi,VENHQS0wOS0xNjYyOm92X3RjZ2FfcHVi,VENHQS0wOS0xNjY1Om92X3RjZ2FfcHVi,VENHQS0wOS0xNjY2Om92X3RjZ2FfcHVi,VENHQS0wOS0yMDQ0Om92X3RjZ2FfcHVi,VENHQS0wOS0yMDQ5Om92X3RjZ2FfcHVi,VENHQS0wOS0yMDUwOm92X3RjZ2FfcHVi,VENHQS0wOS0yMDUzOm92X3RjZ2FfcHVi,VENHQS0wOS0yMDU2Om92X3RjZ2FfcHVi,VENHQS0xMC0wOTI2Om92X3RjZ2FfcHVi,VENHQS0xMC0wOTI3Om92X3RjZ2FfcHVi,VENHQS0xMC0wOTI4Om92X3RjZ2FfcHVi,VENHQS0xMC0wOTMwOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTMzOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTM0Om92X3RjZ2FfcHVi,VENHQS0xMC0wOTM1Om92X3RjZ2FfcHVi,VENHQS0xMC0wOTM3Om92X3RjZ2FfcHVi,VENHQS0xMC0wOTM4Om92X3RjZ2FfcHVi,VENHQS0xMy0wNzE0Om92X3RjZ2FfcHVi,VENHQS0xMy0wNzE3Om92X3RjZ2FfcHVi,VENHQS0xMy0wNzIwOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzIzOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzI0Om92X3RjZ2FfcHVi,VENHQS0xMy0wNzI2Om92X3RjZ2FfcHVi,VENHQS0xMy0wNzI3Om92X3RjZ2FfcHVi,VENHQS0xMy0wNzUxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzU1Om92X3RjZ2FfcHVi,VENHQS0xMy0wNzYwOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzYyOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzY1Om92X3RjZ2FfcHVi,VENHQS0xMy0wNzkxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzkyOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzkzOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzk1Om92X3RjZ2FfcHVi,VENHQS0xMy0wODAwOm92X3RjZ2FfcHVi,VENHQS0xMy0wODA3Om92X3RjZ2FfcHVi,VENHQS0xMy0wODg0Om92X3RjZ2FfcHVi,VENHQS0xMy0wODg1Om92X3RjZ2FfcHVi,VENHQS0xMy0wODg2Om92X3RjZ2FfcHVi,VENHQS0xMy0wODg3Om92X3RjZ2FfcHVi,VENHQS0xMy0wODg5Om92X3RjZ2FfcHVi,VENHQS0xMy0wODkwOm92X3RjZ2FfcHVi,VENHQS0xMy0wODkxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODk0Om92X3RjZ2FfcHVi,VENHQS0xMy0wODk3Om92X3RjZ2FfcHVi,VENHQS0xMy0wODk5Om92X3RjZ2FfcHVi,VENHQS0xMy0wOTAwOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTA0Om92X3RjZ2FfcHVi,VENHQS0xMy0wOTA1Om92X3RjZ2FfcHVi,VENHQS0xMy0wOTA2Om92X3RjZ2FfcHVi,VENHQS0xMy0wOTEwOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTExOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTEyOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTEzOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTE2Om92X3RjZ2FfcHVi,VENHQS0xMy0wOTE5Om92X3RjZ2FfcHVi,VENHQS0xMy0wOTIwOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTIzOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTI0Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDAzOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDA0Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDA1Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDA3Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDA5Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDEwOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDExOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDEyOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDc3Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDgxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDgyOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDgzOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDg0Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDg3Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDg4Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDkxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDkyOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDk1Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDk2Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDk3Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDk4Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDk5Om92X3RjZ2FfcHVi,VENHQS0xMy0xNTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNTA0Om92X3RjZ2FfcHVi,VENHQS0xMy0xNTA1Om92X3RjZ2FfcHVi,VENHQS0xMy0xNTA2Om92X3RjZ2FfcHVi,VENHQS0xMy0xNTA3Om92X3RjZ2FfcHVi,VENHQS0xMy0xNTA5Om92X3RjZ2FfcHVi,VENHQS0xMy0xNTEwOm92X3RjZ2FfcHVi,VENHQS0xMy0yMDYwOm92X3RjZ2FfcHVi,VENHQS0yMC0wOTg3Om92X3RjZ2FfcHVi,VENHQS0yMC0wOTkwOm92X3RjZ2FfcHVi,VENHQS0yMC0wOTkxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDIxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDIyOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDIzOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDI0Om92X3RjZ2FfcHVi,VENHQS0yMy0xMDI4Om92X3RjZ2FfcHVi,VENHQS0yMy0xMDMwOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDMxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDMyOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTEwOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTE2Om92X3RjZ2FfcHVi,VENHQS0yMy0xMTE3Om92X3RjZ2FfcHVi,VENHQS0yMy0xMTIwOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTIzOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTI0Om92X3RjZ2FfcHVi,VENHQS0yMy0yMDcyOm92X3RjZ2FfcHVi,VENHQS0yNC0wOTY2Om92X3RjZ2FfcHVi,VENHQS0yNC0wOTY4Om92X3RjZ2FfcHVi,VENHQS0yNC0wOTcwOm92X3RjZ2FfcHVi,VENHQS0yNC0wOTc1Om92X3RjZ2FfcHVi,VENHQS0yNC0wOTc5Om92X3RjZ2FfcHVi,VENHQS0yNC0wOTgwOm92X3RjZ2FfcHVi,VENHQS0yNC0wOTgyOm92X3RjZ2FfcHVi,VENHQS0yNC0xMTAzOm92X3RjZ2FfcHVi,VENHQS0yNC0xMTA0Om92X3RjZ2FfcHVi,VENHQS0yNC0xMTA1Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDEzOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDE2Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDE3Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDE4Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDE5Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDIyOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDIzOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDI0Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDI1Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDI2Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDI3Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDI4Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDMxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDM0Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDM1Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDM2Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDYzOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDY0Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDY2Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDY5Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDcxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDc0Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTQ0Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTQ1Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTQ4Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTQ5Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTUxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTUyOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTUzOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTU1Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTU2Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTU3Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTU4Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTYwOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTYyOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTYzOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTY0Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTY1Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTY3Om92X3RjZ2FfcHVi,VENHQS0yNC0xNjAzOm92X3RjZ2FfcHVi,VENHQS0yNC0xNjA0Om92X3RjZ2FfcHVi,VENHQS0yNC0xNjE0Om92X3RjZ2FfcHVi,VENHQS0yNC0xNjE2Om92X3RjZ2FfcHVi,VENHQS0yNC0yMDE5Om92X3RjZ2FfcHVi,VENHQS0yNC0yMDI0Om92X3RjZ2FfcHVi,VENHQS0yNC0yMDMwOm92X3RjZ2FfcHVi,VENHQS0yNC0yMDM4Om92X3RjZ2FfcHVi,VENHQS0yNC0yMjU0Om92X3RjZ2FfcHVi,VENHQS0yNC0yMjYwOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjYxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjYyOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjY3Om92X3RjZ2FfcHVi,VENHQS0yNC0yMjcxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjgwOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjgxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjg4Om92X3RjZ2FfcHVi,VENHQS0yNC0yMjg5Om92X3RjZ2FfcHVi,VENHQS0yNC0yMjkwOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjkzOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzEzOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzE1Om92X3RjZ2FfcHVi,VENHQS0yNS0xMzE2Om92X3RjZ2FfcHVi,VENHQS0yNS0xMzE3Om92X3RjZ2FfcHVi,VENHQS0yNS0xMzE4Om92X3RjZ2FfcHVi,VENHQS0yNS0xMzE5Om92X3RjZ2FfcHVi,VENHQS0yNS0xMzIwOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzIxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzIyOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzI0Om92X3RjZ2FfcHVi,VENHQS0yNS0xMzI2Om92X3RjZ2FfcHVi,VENHQS0yNS0xMzI4Om92X3RjZ2FfcHVi,VENHQS0yNS0xMzI5Om92X3RjZ2FfcHVi,VENHQS0yNS0xNjIzOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjI2Om92X3RjZ2FfcHVi,VENHQS0yNS0xNjI3Om92X3RjZ2FfcHVi,VENHQS0yNS0xNjI4Om92X3RjZ2FfcHVi,VENHQS0yNS0xNjMxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjMzOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjM0Om92X3RjZ2FfcHVi,VENHQS0yNS0xNjM1Om92X3RjZ2FfcHVi,VENHQS0yNS0yMDQyOm92X3RjZ2FfcHVi,VENHQS0yNS0yMzkxOm92X3RjZ2FfcHVi,VENHQS0yNS0yMzkzOm92X3RjZ2FfcHVi,VENHQS0yNS0yMzk2Om92X3RjZ2FfcHVi,VENHQS0yNS0yMzk4Om92X3RjZ2FfcHVi,VENHQS0yNS0yMzk5Om92X3RjZ2FfcHVi,VENHQS0yNS0yNDAwOm92X3RjZ2FfcHVi,VENHQS0yNS0yNDA0Om92X3RjZ2FfcHVi,VENHQS0yNS0yNDA4Om92X3RjZ2FfcHVi,VENHQS0yNS0yNDA5Om92X3RjZ2FfcHVi,VENHQS0zMC0xODUzOm92X3RjZ2FfcHVi,VENHQS0zMC0xODYyOm92X3RjZ2FfcHVi,VENHQS0zMC0xODkxOm92X3RjZ2FfcHVi,VENHQS0zMS0xOTUwOm92X3RjZ2FfcHVi,VENHQS0zMS0xOTUzOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTY4Om92X3RjZ2FfcHVi,VENHQS0zNi0xNTY5Om92X3RjZ2FfcHVi,VENHQS0zNi0xNTcwOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTcxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTc0Om92X3RjZ2FfcHVi,VENHQS0zNi0xNTc1Om92X3RjZ2FfcHVi,VENHQS0zNi0xNTc2Om92X3RjZ2FfcHVi,VENHQS0zNi0xNTc3Om92X3RjZ2FfcHVi,VENHQS0zNi0xNTc4Om92X3RjZ2FfcHVi,VENHQS0zNi0xNTgwOm92X3RjZ2FfcHVi,VENHQS01Ny0xNTgzOm92X3RjZ2FfcHVi,VENHQS01Ny0xNTg0Om92X3RjZ2FfcHVi,VENHQS01Ny0xOTkzOm92X3RjZ2FfcHVi,VENHQS01OS0yMzUwOm92X3RjZ2FfcHVi,VENHQS01OS0yMzUxOm92X3RjZ2FfcHVi,VENHQS01OS0yMzUyOm92X3RjZ2FfcHVi,VENHQS01OS0yMzU0Om92X3RjZ2FfcHVi,VENHQS01OS0yMzU1Om92X3RjZ2FfcHVi,VENHQS01OS0yMzYzOm92X3RjZ2FfcHVi,VENHQS02MS0xNzI4Om92X3RjZ2FfcHVi,VENHQS02MS0xNzM2Om92X3RjZ2FfcHVi,VENHQS02MS0xOTE5Om92X3RjZ2FfcHVi,VENHQS02MS0xOTk1Om92X3RjZ2FfcHVi,VENHQS02MS0xOTk4Om92X3RjZ2FfcHVi,VENHQS02MS0yMDAwOm92X3RjZ2FfcHVi,VENHQS02MS0yMDAyOm92X3RjZ2FfcHVi,VENHQS02MS0yMDAzOm92X3RjZ2FfcHVi,VENHQS02MS0yMDA5Om92X3RjZ2FfcHVi,VENHQS02MS0yMDEyOm92X3RjZ2FfcHVi,VENHQS02MS0yMDE2Om92X3RjZ2FfcHVi,VENHQS02MS0yMDg4Om92X3RjZ2FfcHVi,VENHQS02MS0yMDkyOm92X3RjZ2FfcHVi,VENHQS02MS0yMDk0Om92X3RjZ2FfcHVi,VENHQS02MS0yMDk1Om92X3RjZ2FfcHVi,VENHQS02MS0yMDk3Om92X3RjZ2FfcHVi,VENHQS02MS0yMTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMTAyOm92X3RjZ2FfcHVi,VENHQS02MS0yMTA0Om92X3RjZ2FfcHVi,VENHQS02MS0yMTEwOm92X3RjZ2FfcHVi,VENHQS02MS0yMTExOm92X3RjZ2FfcHVi,VENHQS02MS0yMTEzOm92X3RjZ2FfcHVi",
                "patient id order correct"
            );


            $('#oncoprint .oncoprint__controls #viewDropdownButton').click(); // open view menu
            $('#oncoprint .oncoprint__controls input[type="radio"][name="columnType"][value="0"]').waitForExist(10000);
            $('#oncoprint .oncoprint__controls input[type="radio"][name="columnType"][value="0"]').click(); // go to sample mode

            waitForOncoprint(10000);

            // check if samples are sorted
            assert.equal(
                browser.execute(function () {return frontendOnc.getIdOrder().join(",");}).value,
                "VENHQS0yMy0xMTIyLTAxOm92X3RjZ2FfcHVi,VENHQS0zMS0xOTU5LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzU2LTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0xNjY5LTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0yMDQ1LTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0yMDUxLTAxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTMxLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODgzLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODkzLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTAzLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDA4LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDk0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNTEyLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDI3LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTE4LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0yMDc3LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0yMDc4LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0yMDc5LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0yMDgxLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDcwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjk4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yMzkyLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yNDAxLTAxOm92X3RjZ2FfcHVi,VENHQS01Ny0xNTgyLTAxOm92X3RjZ2FfcHVi,VENHQS01OS0yMzQ4LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDA4LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMTA5LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzU3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzMwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzYxLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDg5LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDI2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMDM1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjI1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjMwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjMyLTAxOm92X3RjZ2FfcHVi,VENHQS0yOS0yNDI3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODA0LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzMxLTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzMyLTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzM2LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzM3LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzM4LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzQyLTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzQzLTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzQ2LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzQ3LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzQ4LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzQ5LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzUwLTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzYxLTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzYyLTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzY0LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzY1LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzY3LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xNTE0LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xNTE3LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xNTI1LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xNTMwLTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xNTQyLTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0wMzY2LTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0wMzY5LTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0xNjU5LTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0xNjYxLTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0xNjYyLTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0xNjY1LTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0xNjY2LTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0yMDQ0LTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0yMDQ5LTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0yMDUwLTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0yMDUzLTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0yMDU2LTAxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTI2LTAxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTI3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTI4LTAxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTMwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTMzLTAxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTM0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTM1LTAxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTM3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTM4LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzE0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzE3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzIwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzIzLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzI0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzI2LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzI3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzUxLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzU1LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzYwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzYyLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzY1LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzkxLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzkyLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzkzLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzk1LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODAwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODA3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODg0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODg1LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODg2LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODg3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODg5LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODkwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODkxLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODk0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODk3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODk5LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTAwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTA0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTA1LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTA2LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTEwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTExLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTEyLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTEzLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTE2LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTE5LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTIwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTIzLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTI0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDAzLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDA0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDA1LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDA3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDA5LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDEwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDExLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDEyLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDc3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDgxLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDgyLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDgzLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDg0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDg3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDg4LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDkxLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDkyLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDk1LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDk2LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDk3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDk4LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDk5LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNTAxLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNTA0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNTA1LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNTA2LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNTA3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNTA5LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNTEwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0yMDYwLTAxOm92X3RjZ2FfcHVi,VENHQS0yMC0wOTg3LTAxOm92X3RjZ2FfcHVi,VENHQS0yMC0wOTkwLTAxOm92X3RjZ2FfcHVi,VENHQS0yMC0wOTkxLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDIxLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDIyLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDIzLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDI0LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDI4LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDMwLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDMxLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDMyLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTEwLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTE2LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTE3LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTIwLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTIzLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTI0LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0yMDcyLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0wOTY2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0wOTY4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0wOTcwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0wOTc1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0wOTc5LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0wOTgwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0wOTgyLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xMTAzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xMTA0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xMTA1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDEzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDE2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDE3LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDE4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDE5LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDIyLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDIzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDI0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDI1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDI2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDI3LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDI4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDMxLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDM0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDM1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDM2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDYzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDY0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDY2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDY5LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDcxLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDc0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTQ0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTQ1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTQ4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTQ5LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTUxLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTUyLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTUzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTU1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTU2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTU3LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTU4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTYwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTYyLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTYzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTY0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTY1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTY3LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNjAzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNjA0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNjE0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNjE2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMDE5LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMDI0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMDMwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMDM4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjU0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjYwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjYxLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjYyLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjY3LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjcxLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjgwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjgxLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjg4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjg5LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjkwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjkzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzEzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzE1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzE2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzE3LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzE4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzE5LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzIwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzIxLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzIyLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzI0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzI2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzI4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzI5LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjIzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjI2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjI3LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjI4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjMxLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjMzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjM0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjM1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yMDQyLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yMzkxLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yMzkzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yMzk2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yMzk4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yMzk5LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yNDAwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yNDA0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yNDA4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yNDA5LTAxOm92X3RjZ2FfcHVi,VENHQS0zMC0xODUzLTAxOm92X3RjZ2FfcHVi,VENHQS0zMC0xODYyLTAxOm92X3RjZ2FfcHVi,VENHQS0zMC0xODkxLTAxOm92X3RjZ2FfcHVi,VENHQS0zMS0xOTUwLTAxOm92X3RjZ2FfcHVi,VENHQS0zMS0xOTUzLTAxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTY4LTAxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTY5LTAxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTcwLTAxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTcxLTAxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTc0LTAxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTc1LTAxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTc2LTAxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTc3LTAxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTc4LTAxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTgwLTAxOm92X3RjZ2FfcHVi,VENHQS01Ny0xNTgzLTAxOm92X3RjZ2FfcHVi,VENHQS01Ny0xNTg0LTAxOm92X3RjZ2FfcHVi,VENHQS01Ny0xOTkzLTAxOm92X3RjZ2FfcHVi,VENHQS01OS0yMzUwLTAxOm92X3RjZ2FfcHVi,VENHQS01OS0yMzUxLTAxOm92X3RjZ2FfcHVi,VENHQS01OS0yMzUyLTAxOm92X3RjZ2FfcHVi,VENHQS01OS0yMzU0LTAxOm92X3RjZ2FfcHVi,VENHQS01OS0yMzU1LTAxOm92X3RjZ2FfcHVi,VENHQS01OS0yMzYzLTAxOm92X3RjZ2FfcHVi,VENHQS02MS0xNzI4LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0xNzM2LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0xOTE5LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0xOTk1LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0xOTk4LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDAwLTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDAyLTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDAzLTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDA5LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDEyLTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDE2LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDg4LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDkyLTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDk0LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDk1LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDk3LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMTAxLTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMTAyLTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMTA0LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMTEwLTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMTExLTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMTEzLTAxOm92X3RjZ2FfcHVi",
                "sample id order correct");
        });

    });

    describe("sorting", ()=>{
        function topCmp(eltA, eltB) {
            return eltA.top - eltB.top;
        }
        function getNthTrackOptionsElements(n) {
            // n is one-indexed, to cohere with CSS nth-child

            var buttons = $$('#oncoprint-inner .oncoprintjs__track_options__toggle_btn_img');
            buttons = buttons.map(function(btn, i) {
                return {
                    btn: btn,
                    top: parseFloat(btn.$('..').getCssProperty('top').value),
                    selector:'#oncoprint-inner .oncoprintjs__track_options__toggle_btn_img:nth-child('+(i+1)+')'
                };
            });
            buttons.sort(topCmp);

            var dropdowns = $$('#oncoprint-inner .oncoprintjs__track_options__dropdown');
            dropdowns = dropdowns.map(function(dropdown, i) {
                return {
                    dropdown: dropdown,
                    top: parseFloat(dropdown.getCssProperty('top').value),
                    selector: '#oncoprint-inner .oncoprintjs__track_options__dropdown:nth-child('+(i+1)+')'
                };
            });
            dropdowns.sort(topCmp);

            return {
                button: buttons[n-1].btn,
                button_selector: buttons[n-1].selector,
                dropdown: dropdowns[n-1].dropdown,
                dropdown_selector: dropdowns[n-1].selector
            };
        }

        it("should sort patients and samples by custom case list order correctly", ()=>{
            goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

            // select Colorectal TCGA and Adrenocortical Carcinoma TCGA
            var input = $(".autosuggest input[type=text]");
            input.waitForExist(10000);
            input.setValue('colorectal tcga nature');
            browser.pause(500);
            // should only be one element
            assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
            var checkBox = $('[data-test="StudySelect"]');
            checkBox.waitForExist(10000);
            browser.click('[data-test="StudySelect"] input');

            input.setValue('');
            input.setValue('adrenocortical carcinoma tcga provisional');
            browser.pause(500);
            // should only be one element



            assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);

            var checkBox = $('[data-test="StudySelect"]');
            checkBox.waitForExist(10000);
            browser.click('[data-test="StudySelect"] input');

            browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="M"]', 10000);
            browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="C"]', 10000);    

            browser.execute(function() { globalStores.queryStore.selectedSampleListId = "-1"; }); // select custom case list

            var caseInput = $('[data-test="CustomCaseSetInput"]');
            caseInput.waitForExist(10000);
            caseInput.setValue('coadread_tcga_pub:TCGA-AA-3971-01\n'+
                                'acc_tcga:TCGA-OR-A5JC-01\n'+
                                'acc_tcga:TCGA-OR-A5J2-01\n'+
                                'coadread_tcga_pub:TCGA-AA-A00Q-01\n'+
                                'coadread_tcga_pub:TCGA-CM-4748-01\n'+
                                'acc_tcga:TCGA-OR-A5JD-01\n'+
                                'acc_tcga:TCGA-OR-A5J3-01');

            $('[data-test="geneSet"]').setValue('DKK2 KRAS BCL2L1 RASA1 HLA-B RRAGC');
            browser.waitForEnabled('[data-test="queryButton"]', 30000);
            browser.click('[data-test="queryButton"]');

            // now we're on results page
            waitForOncoprint(10000);
            // open sort menu
            browser.click('#sortDropdown');
            browser.waitForVisible('[data-test="oncoprintSortDropdownMenu"] input[data-test="caseList"]');
            browser.click('[data-test="oncoprintSortDropdownMenu"] input[data-test="caseList"]');
            browser.pause(100); // allow to sort

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS1BQS0zOTcxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1PUi1BNUpDOmFjY190Y2dh,VENHQS1PUi1BNUoyOmFjY190Y2dh,VENHQS1BQS1BMDBROmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1DTS00NzQ4OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1PUi1BNUpEOmFjY190Y2dh,VENHQS1PUi1BNUozOmFjY190Y2dh",
                "sorted patient order correct"
            );

            $('#oncoprint .oncoprint__controls #viewDropdownButton').click(); // open view menu
            $('#oncoprint .oncoprint__controls input[type="radio"][name="columnType"][value="0"]').waitForVisible(10000);
            $('#oncoprint .oncoprint__controls input[type="radio"][name="columnType"][value="0"]').click(); // go to sample mode
            waitForOncoprint(10000);

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS1BQS0zOTcxLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1PUi1BNUpDLTAxOmFjY190Y2dh,VENHQS1PUi1BNUoyLTAxOmFjY190Y2dh,VENHQS1BQS1BMDBRLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1DTS00NzQ4LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1PUi1BNUpELTAxOmFjY190Y2dh,VENHQS1PUi1BNUozLTAxOmFjY190Y2dh",
                "sorted sample order correct"
            );
        });

        it("should sort patients and samples correctly in coadread_tcga_pub", ()=>{
            goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

            var input = $(".autosuggest input[type=text]");

            input.waitForExist(10000);

            input.setValue('colorectal tcga nature');

            browser.pause(500);

            // should only be one element
            assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);

            var checkBox = $('[data-test="StudySelect"]');

            checkBox.waitForExist(10000);

            browser.click('[data-test="StudySelect"] input');

            // query KRAS NRAS BRAF
            $('[data-test="geneSet"]').setValue('KRAS NRAS BRAF');

            browser.waitForEnabled('[data-test="queryButton"]', 30000);
            browser.click('[data-test="queryButton"]');

            waitForOncoprint(10000);

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS1BRy0zOTk5OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBBOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTU4OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRi0yNjkxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBOOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODY0OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFaOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNzE1OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BNi0yNjgzOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBLOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBROmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFGOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFHOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFJOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFLOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFSOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFYOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDJPOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDJXOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDJZOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDNGOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDNKOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDI5OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTIwOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTIxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTIyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTMwOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTMyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTQ4OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTU1OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTU2OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTYwOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTYxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjcyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjczOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjgwOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjgxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjk1OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjk2OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODE0OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODE4OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODM3OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODQyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODQ1OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODQ4OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODUxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODUyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODU0OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODcwOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTMwOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTM5OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTc3OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTc5OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTg2OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTk0OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRi0yNjg5OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRi0yNjkyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDBDOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDBIOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDFXOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDJOOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDJYOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDA4OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDE0OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDE1OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDIwOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDI1OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDMyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTc1OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTgwOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTgxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTgzOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTg2OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTk0OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTk5OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNjAyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNjA1OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNjExOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNzI2OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNzI3OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODc4OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODg3OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODk2OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zOTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zOTAyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zOTA5OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy00MDA1OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy00MDA4OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODkyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTc1OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDJHOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFROmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BNi0yNjc4OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBGOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFWOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDJGOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDI0OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTQ5OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjY2OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODE5OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTcyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTczOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTc2OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRi0zOTEzOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDFMOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODk0OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BNi0yNjcyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BNi0yNjc2OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBEOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBKOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFEOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFQOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDIyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTE2OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTI1OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTQzOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjY0OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjg0OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODIxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODMzOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODc3OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTQ3OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTQ5OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTY2OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTc4OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDAyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BNi0yNjcwOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BNi0yNjc0OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BNi0yNjc3OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BNi0zODA3OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBFOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBMOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBPOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBSOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBVOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBXOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBaOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFTOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFUOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDJIOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDJKOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDA0OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDEwOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDE3OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTE0OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTE3OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTE4OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTE5OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTI0OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTI2OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTI3OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTI5OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTMxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTM0OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTM4OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTQyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTQ0OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTUyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTUzOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTU0OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTYyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjY3OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjc4OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjc5OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjg1OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjg4OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjkyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjkzOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNzEwOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODEyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODMxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODQ2OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODU1OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODU2OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODU4OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODYwOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODY2OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODY5OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODcyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODc1OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTUyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTU1OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTU2OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTcxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTg0OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTg5OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRi0zNDAwOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDFZOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDExOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDE2OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDI2OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTc0OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTgyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTg0OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTg3OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTkzOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTk4OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNjAwOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNjAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNjA4OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNjA5OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNjEyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODgxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODgyOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODgzOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODkwOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODkzOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODk4OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy00MDAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy00MDE1OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BWS00MDcwOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BWS00MDcxOmNvYWRyZWFkX3RjZ2FfcHVi",
                "patient id order correct"
            );

            $('#oncoprint .oncoprint__controls #viewDropdownButton').click(); // open view menu
            $('#oncoprint .oncoprint__controls input[type="radio"][name="columnType"][value="0"]').waitForExist(10000);
            $('#oncoprint .oncoprint__controls input[type="radio"][name="columnType"][value="0"]').click(); // go to sample mode

            waitForOncoprint(10000);

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS1BRy0zOTk5LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBBLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTU4LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRi0yNjkxLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBOLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODY0LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFaLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNzE1LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BNi0yNjgzLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBLLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBRLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFGLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFHLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFJLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFLLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFSLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFYLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDJPLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDJXLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDJZLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDNGLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDNKLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDI5LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTIwLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTIxLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTIyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTMwLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTMyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTQ4LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTU1LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTU2LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTYwLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTYxLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjcyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjczLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjgwLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjgxLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjk1LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjk2LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODE0LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODE4LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODM3LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODQyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODQ1LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODQ4LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODUxLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODUyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODU0LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODcwLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTMwLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTM5LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTc3LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTc5LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTg2LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTk0LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRi0yNjg5LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRi0yNjkyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDBDLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDBILTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDFXLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDJOLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDJYLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDA4LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDE0LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDE1LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDIwLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDI1LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDMyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTc1LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTgwLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTgxLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTgzLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTg2LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTk0LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTk5LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNjAyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNjA1LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNjExLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNzI2LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNzI3LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODc4LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODg3LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODk2LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zOTAxLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zOTAyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zOTA5LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy00MDA1LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy00MDA4LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODkyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTc1LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDJHLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFRLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BNi0yNjc4LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBGLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFWLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDJGLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDI0LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTQ5LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjY2LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODE5LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTcyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTczLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTc2LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRi0zOTEzLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDFMLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODk0LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BNi0yNjcyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BNi0yNjc2LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBELTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBKLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFELTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFQLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDIyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTE2LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTI1LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTQzLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjY0LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjg0LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODIxLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODMzLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODc3LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTQ3LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTQ5LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTY2LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTc4LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDAyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BNi0yNjcwLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BNi0yNjc0LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BNi0yNjc3LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BNi0zODA3LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBFLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBMLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBPLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBSLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBVLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBXLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDBaLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFTLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDFULTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDJILTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDJKLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDA0LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDEwLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS1BMDE3LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTE0LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTE3LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTE4LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTE5LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTI0LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTI2LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTI3LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTI5LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTMxLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTM0LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTM4LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTQyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTQ0LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTUyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTUzLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTU0LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNTYyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjY3LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjc4LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjc5LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjg1LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjg4LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjkyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNjkzLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zNzEwLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODEyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODMxLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODQ2LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODU1LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODU2LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODU4LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODYwLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODY2LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODY5LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODcyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zODc1LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTUyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTU1LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTU2LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTcxLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTg0LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BQS0zOTg5LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRi0zNDAwLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDFZLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDExLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDE2LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy1BMDI2LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTc0LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTgyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTg0LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTg3LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTkzLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNTk4LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNjAwLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNjAxLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNjA4LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNjA5LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zNjEyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODgxLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODgyLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODgzLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODkwLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODkzLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy0zODk4LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy00MDAxLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BRy00MDE1LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BWS00MDcwLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1BWS00MDcxLTAxOmNvYWRyZWFkX3RjZ2FfcHVi",
                "sample id order correct"
            );
        });

        it("should sort patients and samples correctly in gbm_tcga_pub", ()=>{
            goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

            var input = $(".autosuggest input[type=text]");

            input.waitForExist(10000);

            input.setValue('glio tcga nature 2008');

            browser.pause(500);

            // should only be one element
            assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);

            var checkBox = $('[data-test="StudySelect"]');

            checkBox.waitForExist(10000);

            browser.click('[data-test="StudySelect"] input');

            // query KRAS NRAS BRAF
            $('[data-test="geneSet"]').setValue('TP53 MDM2 MDM4');

            browser.waitForEnabled('[data-test="queryButton"]', 30000);
            browser.click('[data-test="queryButton"]');

            waitForOncoprint(10000);

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS0wNi0wMjEzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDE0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjIxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDEwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDExOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDMzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMwOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTkwOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjM3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjQxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDcxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDUyOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDYwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDk5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTAyOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTczOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQzOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEwOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDIxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTA3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTEzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTIyOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMyOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMzOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTcxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjExOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE5OmdibV90Y2dhX3B1Yg",
                "patient id order correct"
            );

            $('#oncoprint .oncoprint__controls #viewDropdownButton').click(); // open view menu
            $('#oncoprint .oncoprint__controls input[type="radio"][name="columnType"][value="0"]').waitForExist(10000);
            $('#oncoprint .oncoprint__controls input[type="radio"][name="columnType"][value="0"]').click(); // go to sample mode

            waitForOncoprint(10000);

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS0wNi0wMjEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTkwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDUyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDYwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDk5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTAyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTczLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTIyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE5LTAxOmdibV90Y2dhX3B1Yg",
                "sample id order correct"
            );
        });

        it("sorts correctly w/ clinical tracks and heatmap tracks, clinical tracks sorted", ()=>{
            goToUrlAndSetLocalStorage(CBIOPORTAL_URL+'/index.do?cancer_study_id=gbm_tcga_pub&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=gbm_tcga_pub_cnaseq&gene_list=TP53%2520MDM2%2520MDM4&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=gbm_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=gbm_tcga_pub_cna_rae&clinicallist=FRACTION_GENOME_ALTERED%2CDFS_MONTHS%2CKARNOFSKY_PERFORMANCE_SCORE%2COS_STATUS&heatmap_track_groups=gbm_tcga_pub_mrna_median_Zscores%2CTP53%2CMDM2%2CMDM4%3Bgbm_tcga_pub_mrna_merged_median_Zscores%2CTP53%2CMDM2%2CMDM4');
            $('.alert-warning').$('button.close').click(); // close dev mode notification so it doesnt intercept clicks

            waitForOncoprint(10000);

            // first get rid of the Profiled track
            var profiledElements = getNthTrackOptionsElements(5);
            profiledElements.button.click();
            browser.waitForVisible(profiledElements.dropdown_selector, 1000); // wait for menu to appear
            profiledElements.dropdown.$('li:nth-child(3)').click(); // Click Remove Track
            browser.pause(100); // give time to take effect

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS0wNi0wMjEzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDE0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjIxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDEwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDExOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDMzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMwOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTkwOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjM3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjQxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDcxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDUyOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDYwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDk5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTAyOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTczOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQzOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEwOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDIxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTA3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTEzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTIyOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMyOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMzOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTcxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjExOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE5OmdibV90Y2dhX3B1Yg",
                "initial patient id order correct"
            );

            $('#oncoprint .oncoprint__controls #viewDropdownButton').click(); // open view menu
            $('#oncoprint .oncoprint__controls input[type="radio"][name="columnType"][value="0"]').waitForVisible(10000);
            $('#oncoprint .oncoprint__controls input[type="radio"][name="columnType"][value="0"]').click(); // go to sample mode

            waitForOncoprint(10000);

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS0wNi0wMjEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTkwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDUyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDYwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDk5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTAyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTczLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTIyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE5LTAxOmdibV90Y2dhX3B1Yg",
                "initial sample id order correct"
            );

            $('#oncoprint .oncoprint__controls input[type="radio"][name="columnType"][value="1"]').waitForVisible(10000);
            $('#oncoprint .oncoprint__controls input[type="radio"][name="columnType"][value="1"]').click(); // go to patient mode

            waitForOncoprint(10000);


            var overallSurvivalElements = getNthTrackOptionsElements(4);
            overallSurvivalElements.button.click();
            browser.waitForVisible(overallSurvivalElements.dropdown_selector, 1000);// wait for menu to appear
            overallSurvivalElements.dropdown.$('li:nth-child(5)').click(); // Click sort a-Z
            browser.pause(100); // give time to sort

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS0wNi0wMjEzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDE0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjIxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDEwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDExOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDMzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMwOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTkwOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjM3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDcxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDUyOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDYwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDk5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTAyOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTczOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQzOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEwOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDIxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTA3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTIyOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMyOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMzOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTcxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjExOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjQxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTEzOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg1OmdibV90Y2dhX3B1Yg",
                "new sorted patient order correct - 1"
            );

            overallSurvivalElements.dropdown.$('li:nth-child(6)').click(); // Click sort Z-a
            browser.pause(100); // give time to sort

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS0wNi0wMTg4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjQxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTEzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEzOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjIxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDE0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjM3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTkwOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDMzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDExOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDEwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDcxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTczOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTAyOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDk5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDYwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDUyOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEwOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjExOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTcxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMzOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMyOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTIyOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTA3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDIxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA5OmdibV90Y2dhX3B1Yg",
                "new sorted patient order correct - 2"
            );

            var karnofskyPerformanceElements = getNthTrackOptionsElements(3);
            karnofskyPerformanceElements.button.click(); // open Karnofsky Performance clinical track menu
            browser.waitForVisible(karnofskyPerformanceElements.dropdown_selector, 1000);// wait for menu to appear
            karnofskyPerformanceElements.dropdown.$('li:nth-child(6)').click(); // Click sort Z-a
            browser.pause(100); // give time to sort

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS0wNi0wMTg4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjQxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTEzOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjIxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDE0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDMzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAzOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTAyOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjExOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTcxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTkwOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDExOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDEwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDcxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDk5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDYwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDUyOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTA3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDIxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQzOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEzOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjM3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTczOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEwOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMzOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMyOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTIyOmdibV90Y2dhX3B1Yg",
                "new sorted patient order correct - 3"
            );

            karnofskyPerformanceElements.dropdown.$('li:nth-child(5)').click(); // Click sort a-Z
            browser.pause(100); // give time to sort

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS0wNi0wMTU3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQzOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDEwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDExOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMwOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTkwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDcxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDUyOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDYwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDk5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDIxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTA3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjQxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTEzOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDE0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjIxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDMzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTAyOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTcxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjExOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEzOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjM3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTczOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEwOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTIyOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMyOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMzOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE5OmdibV90Y2dhX3B1Yg",
                "new sorted patient order correct - 4"
            );

            $('#oncoprint .oncoprint__controls input[type="radio"][name="columnType"][value="0"]').click(); // go to sample mode

            waitForOncoprint(10000);

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS0wNi0wMTU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTkwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDUyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDYwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDk5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTAyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTczLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTIyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE5LTAxOmdibV90Y2dhX3B1Yg",
                "new sorted sample order correct - 1"
            );

            var diseaseFreeElements = getNthTrackOptionsElements(2);
            diseaseFreeElements.button.click(); // open Disease Free (months) clinical track menu
            browser.waitForVisible(diseaseFreeElements.dropdown_selector, 1000);// wait for menu to appear
            diseaseFreeElements.dropdown.$('li:nth-child(5)').click(); // Click sort a-Z
            browser.pause(100); // give time to sort

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS0wMi0wMDU1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTkwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDYwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDUyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTAyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDk5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTczLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTIyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE5LTAxOmdibV90Y2dhX3B1Yg",
                "new sorted sample order correct - 2"
            );

            diseaseFreeElements.dropdown.$('li:nth-child(6)').click(); // Click sort Z-a
            browser.pause(100); // give time to sort

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS0wMi0wMDgwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTAyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDUyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDYwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTkwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDk5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTczLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTIyLTAxOmdibV90Y2dhX3B1Yg",
                "new sorted sample order correct - 3"
            );

            var fractionGenomeAlteredElements = getNthTrackOptionsElements(1);
            fractionGenomeAlteredElements.button.click(); // open Fraction Genome Altered clinical track menu
            browser.waitForVisible(fractionGenomeAlteredElements.dropdown_selector, 1000);// wait for menu to appear
            fractionGenomeAlteredElements.dropdown.$('li:nth-child(6)').click(); // Click sort Z-a
            browser.pause(100); // give time to sort

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS0wMi0wMTEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDk5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTIyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTkwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTczLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTAyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDUyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDYwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU2LTAxOmdibV90Y2dhX3B1Yg",
                "new sorted sample order correct - 4"
            );

            fractionGenomeAlteredElements.dropdown.$('li:nth-child(5)').click(); // Click sort a-Z
            browser.pause(100); // give time to sort

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS0wNi0wMTQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDYwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDUyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTAyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTczLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTkwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTIyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDk5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU2LTAxOmdibV90Y2dhX3B1Yg",
                "new sorted sample order correct - 5"
            );

            // Sort TP53 heatmap track
            var TP53HeatmapElements = getNthTrackOptionsElements(8);
            TP53HeatmapElements.button.click(); // open Fraction Genome Altered clinical track menu
            browser.waitForVisible(TP53HeatmapElements.dropdown_selector, 1000);// wait for menu to appear
            browser.scroll(0, 1000);// scroll down
            browser.click(TP53HeatmapElements.dropdown_selector + ' li:nth-child(6)'); // Click sort Z-a
            browser.pause(100); // give time to sort

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS0wNi0wMTQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDYwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDUyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTAyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTczLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTkwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTIyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDk5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU2LTAxOmdibV90Y2dhX3B1Yg",
                "new sorted sample order correct - 6"
            );
        });
        it("sorts correctly w/ clinical tracks and heatmap tracks, heatmap tracks sorted", ()=>{
            goToUrlAndSetLocalStorage(CBIOPORTAL_URL+'/index.do?cancer_study_id=gbm_tcga_pub&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=gbm_tcga_pub_cnaseq&gene_list=TP53%2520MDM2%2520MDM4&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=gbm_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=gbm_tcga_pub_cna_rae&clinicallist=FRACTION_GENOME_ALTERED%2CDFS_MONTHS%2CKARNOFSKY_PERFORMANCE_SCORE%2COS_STATUS&heatmap_track_groups=gbm_tcga_pub_mrna_median_Zscores%2CTP53%2CMDM2%2CMDM4%3Bgbm_tcga_pub_mrna_merged_median_Zscores%2CTP53%2CMDM2%2CMDM4&show_samples=true');
            $('.alert-warning').$('button.close').click(); // close dev mode notification so it doesnt intercept clicks

            waitForOncoprint(10000);

            // first get rid of the Profiled track
            var profiledElements = getNthTrackOptionsElements(5);
            profiledElements.button.click();
            browser.waitForVisible(profiledElements.dropdown_selector, 1000); // wait for menu to appear
            profiledElements.dropdown.$('li:nth-child(3)').click(); // Click Remove Track
            browser.pause(100); // give time to take effect

            browser.scroll(0,1000);//scroll down

            // Sort heatmap tracks
            var TP53HeatmapElements = getNthTrackOptionsElements(8);
            TP53HeatmapElements.button.click(); // open track menu
            browser.waitForVisible(TP53HeatmapElements.dropdown_selector, 1000);// wait for menu to appear
            browser.click(TP53HeatmapElements.dropdown_selector + ' li:nth-child(6)'); // Click sort Z-a
            browser.pause(100); // give time to sort

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS0wMi0wMTE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTAyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTczLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDk5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTIyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDUyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTkwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDYwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEzLTAxOmdibV90Y2dhX3B1Yg",
                "sorted sample order correct - 1"
            );

            TP53HeatmapElements.dropdown.$('li:nth-child(5)').click(); // Click sort a-Z
            browser.pause(100); // give time to sort

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS0wNi0wMjEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDYwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTkwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDUyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTIyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDk5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTczLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTAyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE0LTAxOmdibV90Y2dhX3B1Yg",
                "sorted sample order correct - 2"
            );

            TP53HeatmapElements.button.click(); // close track menu
            browser.waitForVisible(TP53HeatmapElements.dropdown_selector, 1000, true); // wait until menu disappears, exposing button

            var MDM4HeatmapElements = getNthTrackOptionsElements(13);
            MDM4HeatmapElements.button.click(); // open track menu
            browser.waitForVisible(MDM4HeatmapElements.dropdown_selector, 1000);// wait for menu to appear
            MDM4HeatmapElements.dropdown.$('li:nth-child(5)').click(); // Click sort a-Z
            browser.pause(100); // give time to sort

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS0wNi0wMjEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDYwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTkwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDUyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTIyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDk5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTczLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTAyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE0LTAxOmdibV90Y2dhX3B1Yg",
                "sorted sample order correct - 3"
            );

            MDM4HeatmapElements.dropdown.$('li:nth-child(6)').click(); // Click sort Z-a
            browser.pause(100); // give time to sort

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS0wNi0wMjEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDYwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTkwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDUyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTIyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDk5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTczLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTAyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE0LTAxOmdibV90Y2dhX3B1Yg",
                "sorted sample order correct - 4"
            );

            TP53HeatmapElements = getNthTrackOptionsElements(8);
            TP53HeatmapElements.button.click(); // open track menu
            browser.waitForVisible(TP53HeatmapElements.dropdown_selector, 1000);// wait for menu to appear
            TP53HeatmapElements.dropdown.$('li:nth-child(7)').click(); // Click Don't sort
            browser.pause(100); // give time to sort

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS0wNi0wMTU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDEwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTAyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTIyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDYwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjExLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjM3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTkwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDk5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTcxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTczLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY4LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjIxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg1LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMwLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDUyLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg0LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg5LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTA3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk3LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjAxLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEzLTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA2LTAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA5LTAxOmdibV90Y2dhX3B1Yg",
                "sorted sample order correct - 5"
            );

            $('#oncoprint .oncoprint__controls #viewDropdownButton').click(); // open view menu
            $('#oncoprint .oncoprint__controls input[type="radio"][name="columnType"][value="1"]').waitForExist(10000);
            $('#oncoprint .oncoprint__controls input[type="radio"][name="columnType"][value="1"]').click(); // go to patient mode
            waitForOncoprint(10000);

            assert.equal(
                browser.execute(function() { return frontendOnc.getIdOrder().join(","); }).value,
                "VENHQS0wNi0wMTU3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDcxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDEwOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDE0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDExOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQzOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDA5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTAyOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTIyOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgwOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDY0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDI3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDQ3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDMzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjQxOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDc1OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDM4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTU2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDgzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDYwOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjExOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTQ4OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDIxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjM3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTI0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTE1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTM5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMyOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTkwOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDk5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTcxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTczOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY4OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjIxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg1OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMwOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTMzOmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDUyOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTY2OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDU0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTEzOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjE0OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg5OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTc2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg0OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTg5OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMTA3OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMTk3OmdibV90Y2dhX3B1Yg,VENHQS0wMi0wMDg2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjAxOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjEzOmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA2OmdibV90Y2dhX3B1Yg,VENHQS0wNi0wMjA5OmdibV90Y2dhX3B1Yg",
                "sorted patient order correct - 1"
            );
        });
    });
});

describe('case set selection in front page query form', function(){
    var selectedCaseSet_sel = 'div[data-test="CaseSetSelector"] span.Select-value-label[aria-selected="true"]';

    this.retries(2);

    beforeEach(function() {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    it('selects the default case set for single study selections', ()=>{
        var input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('ovarian nature 2011');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        browser.waitForExist(selectedCaseSet_sel);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "Tumors with sequencing and CNA data (316)",
            "Default selected case set"
        );
    });
    it('selects the right default case sets in a single->multiple->single study selection flow', ()=>{
        // Select Ampullary Carcinoma
        var input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('ampullary baylor');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        browser.waitForExist(selectedCaseSet_sel);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "Sequenced Tumors (160)",
            "Default selected case set"
        );

        // select Adrenocortical Carcinoma
        input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('adrenocortical carcinoma tcga provisional');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');
        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="M"]', 10000);
        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="C"]', 10000);

        browser.waitForExist(selectedCaseSet_sel);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "All (252)",
            "All (252)",
        );

        // Deselect Ampullary Carcinoma
        input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('ampullary baylor');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        browser.waitForExist(selectedCaseSet_sel);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "Tumor Samples with sequencing and CNA data (88)",
            "Default selected case set for adrenocortical carcinoma"
        );
    });
    it('selects the right default case sets in a single->select all filtered->single study selection flow', ()=>{
        // Select Ampullary Carcinoma
        var input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('ampullary baylor');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        browser.waitForExist(selectedCaseSet_sel);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "Sequenced Tumors (160)",
            "Default selected case set"
        );

        // select all TCGA non-provisional
        input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('tcga -provisional');
        browser.pause(500);
        browser.click('div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]');

        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="M"]', 10000);
        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="C"]', 10000);
        browser.waitForExist(selectedCaseSet_sel, 10000);

        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "All (21333)",
            "All (21333)",
        );

        // Deselect all tcga -provisional studies
        browser.click('div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]');
        browser.pause(100);

        // select Adrenocortical Carcinoma
        input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('adrenocortical carcinoma tcga provisional');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="M"]', 10000);
        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="C"]', 10000);
        browser.waitForExist(selectedCaseSet_sel);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "All (252)",
            "All (252)",
        );

        // Deselect Ampullary Carcinoma
        input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('ampullary baylor');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        browser.waitForExist(selectedCaseSet_sel);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "Tumor Samples with sequencing and CNA data (88)",
            "Default selected case set for adrenocortical carcinoma"
        );
    });
});

describe('case set selection in modify query form', function(){
    var selectedCaseSet_sel = 'div[data-test="CaseSetSelector"] span.Select-value-label[aria-selected="true"]';

    this.retries(2);

    beforeEach(function(){
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_rppa&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`;
        goToUrlAndSetLocalStorage(url);
        browser.waitForExist("#modifyQueryBtn", 60000)
    });

    it('contains correct selected case set through a certain use flow involving two selected studies', ()=>{
        //populates case set selector with selected case set in current query, then selects "All" when more studies are selected, then selects default when only one is selected again
        // open query form
        $('#modifyQueryBtn').click();
        browser.waitForExist(selectedCaseSet_sel, 10000);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "Tumors with RPPA data (196)",
            "Initially selected case set should be as specified from URL"
        );

        // Select a different study
        var input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('adrenocortical carcinoma tcga provisional');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');
        browser.pause(100);

        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="M"]', 10000);
        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="C"]', 10000);
        browser.waitForExist(selectedCaseSet_sel, 10000);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "All (368)",
            "All (368)",
        );

        // Uncheck study
        browser.click('[data-test="StudySelect"] input');
        browser.pause(100);

        browser.waitForExist(selectedCaseSet_sel, 10000);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "Tumors with sequencing and CNA data (212)",
            "Now we should be back to default selected case set for this study"
        );
    });

    it('contains correct selected case set through a certain use flow involving the "select all filtered studies" checkbox', ()=>{
        //populates case set selector with selected case set in current query, then selects "All" when more studies are selected, then selects default when only one is selected again
        // open query form
        $('#modifyQueryBtn').click();
        browser.waitForExist(selectedCaseSet_sel, 10000);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "Tumors with RPPA data (196)",
            "Initially selected case set should be as specified from URL"
        );

        // Select all tcga -provisional studies
        var input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('impact');
        browser.pause(500);

        browser.click('div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]');

        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="M"]', 10000);
        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="C"]', 10000);
        browser.waitForExist(selectedCaseSet_sel, 10000);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "All (12997)",
            "All (12997)",
        );

        // Deselect all tcga -provisional studies
        browser.click('div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]');
        browser.pause(100);

        browser.waitForExist(selectedCaseSet_sel, 10000);
        assert.equal(
            browser.getText(selectedCaseSet_sel),
            "Tumors with sequencing and CNA data (212)",
            "Now we should be back to default selected case set for this study"
        );
    });
});

describe('genetic profile selection in modify query form', function(){

    this.retries(2);

    beforeEach(function(){
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=chol_tcga&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=chol_tcga_all&gene_list=EGFR&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=chol_tcga_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=chol_tcga_gistic&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=chol_tcga_rppa_Zscores`;
        goToUrlAndSetLocalStorage(url);
        browser.waitForExist("#modifyQueryBtn", 20000)
    });

    it('contains correct selected genetic profiles through a certain use flow involving two studies', ()=>{
        //populates selected genetic profiles from current query, then goes back to defaults if another study is selected then deselected
        // open modify query form
        $('#modifyQueryBtn').click();
        // wait for profiles selector to load
        browser.waitForExist('div[data-test="molecularProfileSelector"] input[type="checkbox"]', 3000);
        // mutations, CNA, and protein should be selected
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'), "mutation profile should be selected");
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'), "cna profile should be selected");
        assert(!browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'), "mrna profile not selected");
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="PROTEIN_LEVEL"]'), "protein level should be selected");

        // select another study
        var input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('ampullary baylor');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        // wait for data type priority selector to load
        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="M"]', 10000);
        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="C"]', 10000);
        assert(browser.isSelected('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="M"]'), "'Mutation' should be selected");
        assert(browser.isSelected('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="C"]'), "'Copy number alterations' should be selected");

        //deselect other study
        browser.click('[data-test="StudySelect"] input');

        // wait for profiles selector to load
        browser.waitForExist('div[data-test="molecularProfileSelector"] input[type="checkbox"]', 3000);
        // mutations, CNA should be selected
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'), "mutation profile should be selected");
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'), "cna profile should be selected");
        assert(!browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'), "mrna profile not selected");
        assert(!browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="PROTEIN_LEVEL"]'), "protein level not selected");
    });

    it('contains correct selected genetic profiles through a certain use flow involving the "select all filtered studies" checkbox', ()=>{
        //populates selected genetic profiles from current query, then goes back to defaults if a lot of studies are selected then deselected
        // open modify query form
        $('#modifyQueryBtn').click();
        // wait for profiles selector to load
        browser.waitForExist('div[data-test="molecularProfileSelector"] input[type="checkbox"]', 3000);
        // mutations, CNA, and protein should be selected
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'), "mutation profile should be selected");
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'), "cna profile should be selected");
        assert(!browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'), "mrna profile not selected");
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="PROTEIN_LEVEL"]'), "protein level should be selected");

        // select all TCGA non-provisional
        var input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('tcga -provisional');
        browser.pause(500);
        browser.click('div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]');

        // wait for data type priority selector to load
        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="M"]', 10000);
        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="C"]', 10000);
        assert(browser.isSelected('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="M"]'), "'Mutation' should be selected");
        assert(browser.isSelected('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="C"]'), "'Copy number alterations' should be selected");


        // Deselect all tcga -provisional studies
        browser.click('div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]');
        browser.pause(100);

        // wait for profiles selector to load
        browser.waitForExist('div[data-test="molecularProfileSelector"] input[type="checkbox"]', 3000);
        // mutations, CNA should be selected
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'), "mutation profile should be selected");
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'), "cna profile should be selected");
        assert(!browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'), "mrna profile not selected");
        assert(!browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="PROTEIN_LEVEL"]'), "protein level not selected");
    });
});

describe('genetic profile selection in front page query form', ()=>{
    beforeEach(function(){
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });
    it('selects the right default genetic profiles in a single->multiple->single study selection flow', ()=>{
        // select a study
        var input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('ovarian nature 2011');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');
        browser.pause(200);

        // wait for profiles selector to load
        browser.waitForExist('div[data-test="molecularProfileSelector"] input[type="checkbox"]', 3000);
        // mutations, CNA should be selected
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'), "mutation profile should be selected");
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'), "cna profile should be selected");
        assert(!browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'), "mrna profile not selected");

        // select another study
        var input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('ampullary baylor');
        browser.pause(500);
        // should only be one element
        assert.equal(browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length, 1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        // wait for data type priority selector to load
        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="M"]', 10000);
        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="C"]', 10000);
        assert(browser.isSelected('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="M"]'), "'Mutation' should be selected");
        assert(browser.isSelected('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="C"]'), "'Copy number alterations' should be selected");

        //deselect other study
        browser.click('[data-test="StudySelect"] input');

        // wait for profiles selector to load
        browser.waitForExist('div[data-test="molecularProfileSelector"] input[type="checkbox"]', 3000);
        // mutations, CNA should be selected
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'), "mutation profile should be selected");
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'), "cna profile should be selected");
        assert(!browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'), "mrna profile not selected");

        // select all tcga provisional
        input = $(".autosuggest input[type=text]");
        input.waitForExist(10000);
        input.setValue('tcga provisional');
        browser.pause(500);
        browser.click('div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]');

        // wait for data type priority selector to load
        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="M"]', 10000);
        browser.waitForExist('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="C"]', 10000);
        assert(browser.isSelected('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="M"]'), "'Mutation' should be selected");
        assert(browser.isSelected('[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="C"]'), "'Copy number alterations' should be selected");

        // Deselect all tcga provisional studies
        browser.click('div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]');
        browser.pause(100);

        // wait for profiles selector to load
        browser.waitForExist('div[data-test="molecularProfileSelector"] input[type="checkbox"]', 3000);
        // mutations, CNA should be selected
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'), "mutation profile should be selected");
        assert(browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'), "cna profile should be selected");
        assert(!browser.isSelected('div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'), "mrna profile not selected");
    });
});
