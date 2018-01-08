var assert = require('assert');
var expect = require('chai').expect;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

describe('homepage', function() {

    it('it should show dev mode when testing', function() {
        browser.url(CBIOPORTAL_URL);

        browser.localStorage('POST', {key: 'localdev', value: 'true'});
        browser.refresh();

        var devMode = $('.alert-warning');

        devMode.waitForExist(60000);
        assert(browser.getText('.alert-warning').indexOf('dev mode') > 0);
    });

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


    describe('select all/deselect all functionality in study selector',function(){

        beforeEach(function(){
            browser.url(CBIOPORTAL_URL);
            browser.localStorage('POST', {key: 'localdev', value: 'true'});
            browser.refresh();
        });


        function getVisibleCheckboxes(){
            var checkboxes = browser.elements('[data-test="studyList"] input[type=checkbox]');

            checkboxes.waitForExist(10000);

            return checkboxes.value.filter(function(el){
                return el.isVisible();
            });
        }

        it('clicking select all studies checkbox selects all studies',function(){

            var visibleCheckboxes = getVisibleCheckboxes();

            var selectedStudies = visibleCheckboxes.filter(function(el){
                return el.isSelected();
            });

            var allStudies = visibleCheckboxes.length;

            assert.equal(allStudies, 174, 'we have 174 visible checkboxes');
            assert.equal(selectedStudies.length, 0, 'no studies selected');

            browser.element('[data-test=selectAllStudies]').click();

            selectedStudies = visibleCheckboxes.filter(function(el){
                return el.isSelected();
            });

            assert.equal(selectedStudies.length, allStudies, 'all studies are selected');

            browser.element('[data-test=selectAllStudies]').click();

            selectedStudies = visibleCheckboxes.filter(function(el){
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

            // click global deselect all while filtered
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

    it('oncokb indicators show up and hovering produces oncocard', function(){

        browser.url(`${CBIOPORTAL_URL}/case.do#/patient?studyId=ucec_tcga_pub&caseId=TCGA-BK-A0CC`);

        // wait for mutation to exist
        $('span*=PPP2R1A').waitForExist(60000);

        browser.pause(500);

        // find oncokb image
        var oncokbIndicator = $('[data-test="oncogenic-icon-image"]');
        oncokbIndicator.waitForExist(30000);

        // move over oncokb image (this is deprecated, but there is no new
        // function yet)
        browser.moveToObject('[data-test="oncogenic-icon-image"]',5,5);

        var oncokbCard = $('[data-test="oncokb-card"]');

        oncokbCard.waitForExist(30000);
        
        assert.equal(browser.getText('.tip-header').toLowerCase(), 'PPP2R1A S256F in Uterine Serous Carcinoma/Uterine Papillary Serous Carcinoma'.toLowerCase());

    });

});

describe('cross cancer query', function() {
    it('should show cross cancer bar chart with TP53 in title when selecting multiple studies and querying for TP53', function() {
        browser.url(`${CBIOPORTAL_URL}`);

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
    describe('mutation mapper ', function() {
        it('should show somatic and germline mutation rate', function() {
            browser.url(`${CBIOPORTAL_URL}`);

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
            assert(text.search('8.2%' > -1));
            // check somatic mutation 
            var text = browser.getText('[data-test="somaticMutationRate"]')
            assert(text.search('3.5%' > -1));

        });
    });
});
