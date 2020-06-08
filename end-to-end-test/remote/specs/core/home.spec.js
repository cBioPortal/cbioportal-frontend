var assert = require('assert');
var expect = require('chai').expect;

var {
    goToUrlAndSetLocalStorage,
    clickQueryByGeneButton,
    useExternalFrontend,
    setInputText,
    clickQueryByGeneButton,
    waitForNumberOfStudyCheckboxes,
    clickModifyStudySelectionButton,
    waitForOncoprint,
} = require('../../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

var searchInputSelector = '.autosuggest input[type=text]';

describe('homepage', function() {
    before(() => {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    if (useExternalFrontend) {
        it('window.frontendConfig.frontendUrl should point to localhost 3000 when testing', function() {
            // We no longer check whether the dev mode banner exits.
            // The banner is hidden in e2etests.scss
            assert.equal(
                browser.execute(function() {
                    return window.frontendConfig.frontendUrl;
                }).value,
                '//localhost:3000/'
            );
        });
    }

    it('it should have 27 (small test db), 29 (public test db) or 32 studies (production) in list', function() {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        var studies = $('[data-test="cancerTypeListContainer"] > ul > ul');

        studies.waitForExist(10000); // same as `browser.waitForExist('.notification', 10000)`

        expect([27, 29, 33]).to.include(
            browser.elements('[data-test="cancerTypeListContainer"] > ul > ul')
                .value.length
        );
    });

    it('should filter study list according to filter text input', function() {
        var input = $(searchInputSelector);

        input.waitForExist(10000);

        setInputText(searchInputSelector, 'bladder');

        waitForNumberOfStudyCheckboxes(4);
    });

    it('when a single study is selected, a case set selector is provided', function() {
        var caseSetSelectorClass = '[data-test="CaseSetSelector"]';

        var checkBox = $('[data-test="StudySelect"]');

        checkBox.waitForExist(10000);

        assert.equal(browser.isExisting(caseSetSelectorClass), false);

        browser.click('[data-test="StudySelect"]');

        clickQueryByGeneButton();

        var caseSetSelector = $(caseSetSelectorClass);
        caseSetSelector.waitForExist(10000);

        assert.equal(browser.isExisting(caseSetSelectorClass), true);
    });

    it('should not allow submission if OQL contains EXP or PROT for multiple studies', () => {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        browser.waitForExist('.autosuggest input[type=text]', 10000);
        setInputText('.autosuggest input[type=text]', 'breast -invasive');

        browser.pause(500);
        browser.waitForExist('[data-test="StudySelect"]', 10000);
        browser.click('[data-test="selectAllStudies"]');

        clickQueryByGeneButton();

        var oqlEntrySel = 'textarea[data-test="geneSet"]';
        setInputText(oqlEntrySel, 'PTEN: EXP>1');

        var errorMessageSel = 'span[data-test="oqlErrorMessage"]';
        browser.waitForExist(errorMessageSel);
        browser.waitForText(
            'span=Expression filtering in the gene list (the EXP command) is not supported when doing cross cancer queries.'
        );

        assert.equal(
            browser.getText(errorMessageSel),
            'Expression filtering in the gene list (the EXP command) is not supported when doing cross cancer queries.'
        );

        var submitButtonSel = 'button[data-test="queryButton"]';
        assert.equal(
            browser.getAttribute(submitButtonSel, 'disabled'),
            'true',
            'submit should be disabled w/ EXP in oql'
        );

        setInputText(oqlEntrySel, 'PTEN: PROT>1');
        browser.waitForExist(errorMessageSel);
        browser.waitForText(
            'span=Protein level filtering in the gene list (the PROT command) is not supported when doing cross cancer queries.'
        );
        assert.equal(
            browser.getText(errorMessageSel),
            'Protein level filtering in the gene list (the PROT command) is not supported when doing cross cancer queries.'
        );
        assert.equal(
            browser.getAttribute(submitButtonSel, 'disabled'),
            'true',
            'submit should be disabled w/ PROT in oql'
        );
    });

    describe.skip('select all/deselect all functionality in study selector', function() {
        beforeEach(function() {
            goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
            browser.waitForExist(
                '[data-test="StudySelect"] input[type=checkbox]'
            );
        });

        function getVisibleCheckboxes() {
            return browser.elements(
                '[data-test="StudySelect"] input[type=checkbox]'
            ).value;
        }

        it('clicking select all studies checkbox selects all studies', function() {
            var studyCheckboxes = getVisibleCheckboxes();

            var selectedStudies = studyCheckboxes.filter(function(el) {
                return el.isSelected();
            });

            var allStudies = studyCheckboxes.length;

            assert.equal(selectedStudies.length, 0, 'no studies selected');

            browser.element('[data-test=selectAllStudies]').click();

            selectedStudies = studyCheckboxes.filter(function(el) {
                return el.isSelected();
            });

            assert.equal(
                selectedStudies.length,
                allStudies,
                'all studies are selected'
            );

            browser.element('[data-test=selectAllStudies]').click();

            selectedStudies = studyCheckboxes.filter(function(el) {
                return el.isSelected();
            });

            assert.equal(selectedStudies.length, 0, 'no studies are selected');
        });

        it('global deselect button clears all selected studies, even during filter', function() {
            var visibleCheckboxes = getVisibleCheckboxes();

            assert.equal(
                $('[data-test=globalDeselectAllStudiesButton]').isExisting(),
                false,
                'global deselect button does not exist'
            );

            visibleCheckboxes[10].click();

            assert.equal(
                $('[data-test=globalDeselectAllStudiesButton]').isExisting(),
                true,
                'global deselect button DOES exist'
            );

            var input = $('.autosuggest input[type=text]');

            var selectedStudies = visibleCheckboxes.filter(function(el) {
                return el.isSelected();
            });

            assert.equal(selectedStudies.length, 1, 'we selected one study');

            // add a filter
            input.setValue('breast');

            browser.pause(500);

            //click global deselect all while filtered
            $('[data-test=globalDeselectAllStudiesButton]').click();

            // click unfilter button
            $('[data-test=clearStudyFilter]').click();

            browser.pause(500);

            // we have to reselect elements b/c react has re-rendered them
            selectedStudies = checkboxes = getVisibleCheckboxes().filter(
                function(el) {
                    return el.isSelected();
                }
            );

            assert.equal(
                selectedStudies.length,
                0,
                'no selected studies are selected after deselect all clicked'
            );
        });
    });
});

describe('case set selection in front page query form', function() {
    var selectedCaseSet_sel =
        'div[data-test="CaseSetSelector"] span.Select-value-label[aria-selected="true"]';

    beforeEach(function() {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    it('selects the default case set for single study selections', () => {
        var input = '.autosuggest input[type=text]';
        browser.waitForExist(input, 10000);
        setInputText(input, 'ovarian nature 2011');
        waitForNumberOfStudyCheckboxes(1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        clickQueryByGeneButton();

        browser.waitForExist(selectedCaseSet_sel);
        browser.waitUntil(
            () =>
                browser.getText(selectedCaseSet_sel) ===
                'Samples with mutation and CNA data (316)',
            5000
        );
    });
    it('selects the right default case sets in a single->multiple->single study selection flow', () => {
        // Select Ampullary Carcinoma
        var input = '.autosuggest input[type=text]';
        browser.waitForExist(input, 10000);
        setInputText(input, 'ampullary baylor');
        waitForNumberOfStudyCheckboxes(1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        clickQueryByGeneButton();

        browser.waitForExist(selectedCaseSet_sel);
        browser.waitUntil(
            () =>
                browser.getText(selectedCaseSet_sel) ===
                'Samples with mutation data (160)',
            10000
        );

        clickModifyStudySelectionButton();

        // select Adrenocortical Carcinoma
        browser.waitForExist(input, 10000);
        setInputText(input, 'adrenocortical carcinoma tcga firehose legacy');
        waitForNumberOfStudyCheckboxes(
            1,
            'Adrenocortical Carcinoma (TCGA, Firehose Legacy)'
        );
        checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        clickQueryByGeneButton();

        browser.waitForExist(
            '[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="M"]',
            10000
        );

        browser.waitForExist(selectedCaseSet_sel);
        browser.waitUntil(
            () => browser.getText(selectedCaseSet_sel) === 'All (252)',
            10000
        );

        clickModifyStudySelectionButton();

        // Deselect Ampullary Carcinoma
        browser.waitForExist(input, 10000);
        setInputText(input, 'ampullary baylor');
        waitForNumberOfStudyCheckboxes(
            1,
            'Ampullary Carcinoma (Baylor College of Medicine, Cell Reports 2016)'
        );
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        clickQueryByGeneButton();

        browser.waitForExist(selectedCaseSet_sel);
        browser.waitUntil(
            () =>
                browser.getText(selectedCaseSet_sel) ===
                'Samples with mutation and CNA data (88)',
            10000
        );
    });
    it('selects the right default case sets in a single->select all filtered->single study selection flow', () => {
        // Select Ampullary Carcinoma
        var input = '.autosuggest input[type=text]';
        browser.waitForExist(input, 10000);
        setInputText(input, 'ampullary baylor');
        waitForNumberOfStudyCheckboxes(1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        clickQueryByGeneButton();

        browser.waitForExist(selectedCaseSet_sel);
        browser.waitUntil(
            () =>
                browser.getText(selectedCaseSet_sel) ===
                'Samples with mutation data (160)',
            10000
        );

        clickModifyStudySelectionButton();

        // select all TCGA non-provisional
        browser.waitForExist(input, 10000);
        setInputText(input, 'tcga -provisional');
        browser.pause(500);
        browser.click(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        );

        clickQueryByGeneButton();

        browser.waitForExist(
            '[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="M"]',
            10000
        );
        browser.waitForExist(
            '[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="C"]',
            10000
        );
        browser.waitForExist(selectedCaseSet_sel, 10000);
        browser.waitUntil(
            () => /All \(\d+\)/.test(browser.getText(selectedCaseSet_sel)),
            10000
        ); // since sample #s change across studies, dont depend this test on specific number

        clickModifyStudySelectionButton();

        // Deselect all tcga -provisional studies
        browser.click(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        );
        browser.pause(100);

        // select Adrenocortical Carcinoma
        browser.waitForExist(input, 10000);
        setInputText(input, 'adrenocortical carcinoma tcga firehose legacy');
        waitForNumberOfStudyCheckboxes(1);
        checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        clickQueryByGeneButton();

        browser.waitForExist(
            '[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="M"]',
            10000
        );
        browser.waitForExist(
            '[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="C"]',
            10000
        );
        browser.waitForExist(selectedCaseSet_sel, 10000);
        browser.waitUntil(
            () => browser.getText(selectedCaseSet_sel) === 'All (252)',
            10000
        );

        clickModifyStudySelectionButton();

        // Deselect Ampullary Carcinoma
        browser.waitForExist(input, 10000);
        setInputText(input, 'ampullary baylor');
        waitForNumberOfStudyCheckboxes(
            1,
            'Ampullary Carcinoma (Baylor College of Medicine, Cell Reports 2016)'
        );
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        clickQueryByGeneButton();

        browser.waitForExist(selectedCaseSet_sel);
        browser.waitUntil(
            () =>
                browser.getText(selectedCaseSet_sel) ===
                'Samples with mutation and CNA data (88)',
            10000
        );
    });
});

describe('genetic profile selection in front page query form', () => {
    beforeEach(function() {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });
    it('selects the right default genetic profiles in a single->multiple->single study selection flow', () => {
        // select a study
        var input = '.autosuggest input[type=text]';
        browser.waitForExist(input, 10000);
        setInputText(input, 'ovarian nature 2011');
        waitForNumberOfStudyCheckboxes(1);
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');
        browser.pause(200);

        clickQueryByGeneButton();

        // wait for profiles selector to load
        browser.waitForExist(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"]',
            6000
        );
        // mutations, CNA should be selected
        assert(
            browser.isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'
            ),
            'mutation profile should be selected'
        );
        assert(
            browser.isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'
            ),
            'cna profile should be selected'
        );
        assert(
            !browser.isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'
            ),
            'mrna profile not selected'
        );

        clickModifyStudySelectionButton();

        // select another study
        browser.waitForExist(input, 10000);
        setInputText(input, 'ampullary baylor');
        waitForNumberOfStudyCheckboxes(
            1,
            'Ampullary Carcinoma (Baylor College of Medicine, Cell Reports 2016)'
        );
        var checkBox = $('[data-test="StudySelect"]');
        checkBox.waitForExist(10000);
        browser.click('[data-test="StudySelect"] input');

        clickQueryByGeneButton();

        // wait for data type priority selector to load
        browser.waitForExist(
            '[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="M"]',
            10000
        );
        browser.waitForExist(
            '[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="C"]',
            10000
        );
        assert(
            browser.isSelected(
                '[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="M"]'
            ),
            "'Mutation' should be selected"
        );
        assert(
            browser.isSelected(
                '[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="C"]'
            ),
            "'Copy number alterations' should be selected"
        );

        clickModifyStudySelectionButton();

        //deselect other study
        browser.click('[data-test="StudySelect"] input');

        clickQueryByGeneButton();

        // wait for profiles selector to load
        browser.waitForExist(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"]',
            10000
        );
        // mutations, CNA should be selected
        assert(
            browser.isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'
            ),
            'mutation profile should be selected'
        );
        assert(
            browser.isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'
            ),
            'cna profile should be selected'
        );
        assert(
            !browser.isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'
            ),
            'mrna profile not selected'
        );

        clickModifyStudySelectionButton();

        // select all tcga firehose legacy studies
        browser.waitForExist(input, 10000);
        setInputText(input, 'tcga firehose');
        browser.pause(500);
        browser.click(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        );

        clickQueryByGeneButton();

        // wait for data type priority selector to load
        browser.waitForExist(
            '[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="M"]',
            10000
        );
        browser.waitForExist(
            '[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="C"]',
            10000
        );
        assert(
            browser.isSelected(
                '[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="M"]'
            ),
            "'Mutation' should be selected"
        );
        assert(
            browser.isSelected(
                '[data-test="dataTypePrioritySelector"] input[type="checkbox"][data-test="C"]'
            ),
            "'Copy number alterations' should be selected"
        );

        clickModifyStudySelectionButton();

        // Deselect all tcga firehose legacy studies
        browser.click(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        );
        browser.pause(100);

        clickQueryByGeneButton();

        // wait for profiles selector to load
        browser.waitForExist(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"]',
            3000
        );
        // mutations, CNA should be selected
        assert(
            browser.isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'
            ),
            'mutation profile should be selected'
        );
        assert(
            browser.isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'
            ),
            'cna profile should be selected'
        );
        assert(
            !browser.isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'
            ),
            'mrna profile not selected'
        );
    });
});

describe('auto-selecting needed profiles for oql in query form', () => {
    before(() => {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });
    it('gives a submit error if protein oql is inputted and no protein profile is available for the study', () => {
        browser.waitForExist('.studyItem_acc_tcga_pan_can_atlas_2018', 20000);
        browser.click('.studyItem_acc_tcga_pan_can_atlas_2018');
        clickQueryByGeneButton();

        // enter oql
        browser.waitForExist('textarea[data-test="geneSet"]', 2000);
        setInputText('textarea[data-test="geneSet"]', 'BRCA1: PROT>1');

        // error appears
        browser.waitUntil(() => {
            return (
                browser.isExisting('[data-test="oqlErrorMessage"]') &&
                browser.getText('[data-test="oqlErrorMessage"]') ===
                    'Protein level data query specified in OQL, but no protein level profile is available in the selected study.'
            );
        }, 20000);

        // submit is disabled
        assert(!browser.isEnabled('button[data-test="queryButton"]'));
    });
    it('auto-selects an mrna profile when mrna oql is entered', () => {
        // make sure profiles selector is loaded
        browser.waitForExist(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"]',
            3000
        );
        // mutations, CNA should be selected
        assert(
            browser.isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'
            ),
            'mutation profile should be selected'
        );
        assert(
            browser.isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'
            ),
            'cna profile should be selected'
        );
        assert(
            !browser.isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'
            ),
            'mrna profile not selected'
        );

        // enter oql
        browser.waitForExist('textarea[data-test="geneSet"]', 2000);
        setInputText('textarea[data-test="geneSet"]', 'BRCA1: EXP>1');

        browser.waitForEnabled('button[data-test="queryButton"]', 5000);
        browser.click('button[data-test="queryButton"]');

        // wait for query to load
        waitForOncoprint(20000);

        const query = browser.execute(function() {
            return urlWrapper.query;
        }).value;
        // mutation, cna, mrna profiles are there
        assert.equal(
            query.genetic_profile_ids_PROFILE_MUTATION_EXTENDED,
            'acc_tcga_pan_can_atlas_2018_mutations'
        );
        assert.equal(
            query.genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION,
            'acc_tcga_pan_can_atlas_2018_gistic'
        );
        assert.equal(
            query.genetic_profile_ids_PROFILE_MRNA_EXPRESSION,
            'acc_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median_Zscores'
        );
    });
});

describe('results page quick oql edit', () => {
    before(() => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/oncoprint?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_pan_can_atlas_2018_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_pan_can_atlas_2018_gistic&cancer_study_list=acc_tcga_pan_can_atlas_2018&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=acc_tcga_pan_can_atlas_2018_cnaseq&gene_list=BRCA1&geneset_list=%20&tab_index=tab_visualize&Action=Submit`
        );
    });

    it('gives a submit error if protein oql is inputted and no protein profile is available for the study', () => {
        browser.waitForExist('[data-test="oqlQuickEditButton"]', 20000);
        browser.click('[data-test="oqlQuickEditButton"]');

        browser.waitForExist('.quick_oql_edit [data-test="geneSet"]', 5000);
        setInputText('.quick_oql_edit [data-test="geneSet"]', 'PTEN: PROT>0');

        // error appears
        browser.waitUntil(() => {
            return (
                browser.isExisting(
                    '.quick_oql_edit [data-test="oqlErrorMessage"]'
                ) &&
                browser.getText(
                    '.quick_oql_edit [data-test="oqlErrorMessage"]'
                ) ===
                    'Protein level data query specified in OQL, but no protein level profile is available in the selected study.'
            );
        }, 20000);

        // submit is disabled
        assert(
            !browser.isEnabled('button[data-test="oqlQuickEditSubmitButton"]')
        );
    });
    it('auto-selects an mrna profile when mrna oql is entered', () => {
        let query = browser.execute(function() {
            return urlWrapper.query;
        }).value;
        // mutation and cna profile are there
        assert.equal(
            query.genetic_profile_ids_PROFILE_MUTATION_EXTENDED,
            'acc_tcga_pan_can_atlas_2018_mutations'
        );
        assert.equal(
            query.genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION,
            'acc_tcga_pan_can_atlas_2018_gistic'
        );
        assert.equal(
            query.genetic_profile_ids_PROFILE_MRNA_EXPRESSION,
            undefined
        );

        // enter oql
        browser.waitForExist(
            '.quick_oql_edit textarea[data-test="geneSet"]',
            2000
        );
        setInputText(
            '.quick_oql_edit textarea[data-test="geneSet"]',
            'PTEN: EXP>1'
        );

        browser.waitForEnabled(
            'button[data-test="oqlQuickEditSubmitButton"]',
            5000
        );
        browser.click('button[data-test="oqlQuickEditSubmitButton"]');

        // wait for query to load
        waitForOncoprint(20000);

        // mutation, cna, mrna profiles are there
        query = browser.execute(function() {
            return urlWrapper.query;
        }).value;
        assert.equal(
            query.genetic_profile_ids_PROFILE_MUTATION_EXTENDED,
            'acc_tcga_pan_can_atlas_2018_mutations'
        );
        assert.equal(
            query.genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION,
            'acc_tcga_pan_can_atlas_2018_gistic'
        );
        assert.equal(
            query.genetic_profile_ids_PROFILE_MRNA_EXPRESSION,
            'acc_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median_Zscores'
        );
    });
});
