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
    setDropdownOpen,
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
                    return window.getLoadConfig().frontendUrl;
                }),
                '//localhost:3000/'
            );
        });
    }

    // this just shows that we have some studies listed
    it('it should have some (>0) studies listed ', function() {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        var studies = $('[data-test="cancerTypeListContainer"] > ul > ul');

        studies.waitForExist({ timeout: 10000 }); // same as `$('.notification').waitForExist({timeout: 10000})`

        expect(0).to.be.below(
            $$('[data-test="cancerTypeListContainer"] > ul > ul').length
        );
    });

    it('should filter study list according to filter text input', function() {
        var input = $(searchInputSelector);

        input.waitForExist({ timeout: 10000 });

        setInputText(searchInputSelector, 'bladder');

        waitForNumberOfStudyCheckboxes(4);
    });

    it('when a single study is selected, a case set selector is provided', function() {
        var caseSetSelectorClass = '[data-test="CaseSetSelector"]';

        var checkBox = $('[data-test="StudySelect"]');

        checkBox.waitForExist({ timeout: 10000 });

        assert.equal($(caseSetSelectorClass).isExisting(), false);

        $('[data-test="StudySelect"] input').click();

        clickQueryByGeneButton();

        var caseSetSelector = $(caseSetSelectorClass);
        caseSetSelector.waitForExist({ timeout: 10000 });

        assert.equal($(caseSetSelectorClass).isExisting(), true);
    });

    it('should not allow submission if OQL contains EXP or PROT for multiple studies', () => {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        $('.autosuggest input[type=text]').waitForExist({ timeout: 10000 });
        setInputText('.autosuggest input[type=text]', 'breast -invasive');

        browser.pause(500);
        $('[data-test="StudySelect"]').waitForExist({ timeout: 10000 });
        $('[data-test="selectAllStudies"]').click();

        clickQueryByGeneButton();

        var oqlEntrySel = 'textarea[data-test="geneSet"]';
        setInputText(oqlEntrySel, 'PTEN: EXP>1');

        var errorMessageSel = 'span[data-test="oqlErrorMessage"]';
        $(errorMessageSel).waitForExist();
        browser.waitUntil(
            () =>
                $(errorMessageSel).getText() ===
                'Expression filtering in the gene list (the EXP command) is not supported when doing cross cancer queries.'
        );

        assert.equal(
            $(errorMessageSel).getText(),
            'Expression filtering in the gene list (the EXP command) is not supported when doing cross cancer queries.'
        );

        var submitButtonSel = 'button[data-test="queryButton"]';
        assert.ok(
            !$(submitButtonSel).isEnabled(),
            'submit should be disabled w/ EXP in oql'
        );

        setInputText(oqlEntrySel, 'PTEN: PROT>1');
        $(errorMessageSel).waitForExist();
        $(
            'span=Protein level filtering in the gene list (the PROT command) is not supported when doing cross cancer queries.'
        ).waitForExist();
        assert.equal(
            $(errorMessageSel).getText(),
            'Protein level filtering in the gene list (the PROT command) is not supported when doing cross cancer queries.'
        );
        assert.ok(
            !$(submitButtonSel).isEnabled(),
            'submit should be disabled w/ PROT in oql'
        );
    });

    describe.skip('select all/deselect all functionality in study selector', function() {
        beforeEach(function() {
            goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
            $('[data-test="StudySelect"] input[type=checkbox]').waitForExist();
        });

        function getVisibleCheckboxes() {
            return $$('[data-test="StudySelect"] input[type=checkbox]');
        }

        it('clicking select all studies checkbox selects all studies', function() {
            var studyCheckboxes = getVisibleCheckboxes();

            var selectedStudies = studyCheckboxes.filter(function(el) {
                return el.isSelected();
            });

            var allStudies = studyCheckboxes.length;

            assert.equal(selectedStudies.length, 0, 'no studies selected');

            $('[data-test=selectAllStudies]').click();

            selectedStudies = studyCheckboxes.filter(function(el) {
                return el.isSelected();
            });

            assert.equal(
                selectedStudies.length,
                allStudies,
                'all studies are selected'
            );

            $('[data-test=selectAllStudies]').click();

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
        $(input).waitForExist({ timeout: 10000 });
        setInputText(input, 'ovarian nature 2011');
        waitForNumberOfStudyCheckboxes(1);
        $('[data-test="StudySelect"]').waitForExist({ timeout: 10000 });
        $('[data-test="StudySelect"] input').click();

        clickQueryByGeneButton();

        $(selectedCaseSet_sel).waitForExist();
        browser.waitUntil(
            () =>
                $(selectedCaseSet_sel).getText() ===
                'Samples with mutation and CNA data (316)',
            5000
        );
    });
    it('selects the right default case sets in a single->multiple->single study selection flow', () => {
        // Select Ampullary Carcinoma
        var input = '.autosuggest input[type=text]';
        $(input).waitForExist({ timeout: 10000 });
        setInputText(input, 'ampullary baylor');
        waitForNumberOfStudyCheckboxes(1);
        $('[data-test="StudySelect"]').waitForExist({ timeout: 10000 });
        $('[data-test="StudySelect"] input').click();

        clickQueryByGeneButton();

        $(selectedCaseSet_sel).waitForExist();
        browser.waitUntil(
            () =>
                $(selectedCaseSet_sel).getText() ===
                'Samples with mutation data (160)',
            30000
        );

        clickModifyStudySelectionButton();

        // select Adrenocortical Carcinoma
        $(input).waitForExist({ timeout: 10000 });
        setInputText(input, 'adrenocortical carcinoma tcga firehose legacy');
        waitForNumberOfStudyCheckboxes(
            1,
            'Adrenocortical Carcinoma (TCGA, Firehose Legacy)'
        );
        $('[data-test="StudySelect"]').waitForExist({ timeout: 10000 });
        $('[data-test="StudySelect"] input').click();

        clickQueryByGeneButton();

        $('[data-test="dataTypePrioritySelector"]')
            .$('label*=Mutations')
            .$('input[type="checkbox"]')
            .waitForExist({ timeout: 10000 });

        $(selectedCaseSet_sel).waitForExist();
        browser.waitUntil(
            () => $(selectedCaseSet_sel).getText() === 'All (252)',
            10000
        );

        clickModifyStudySelectionButton();

        // Deselect Ampullary Carcinoma
        $(input).waitForExist({ timeout: 10000 });
        setInputText(input, 'ampullary baylor');
        waitForNumberOfStudyCheckboxes(
            1,
            'Ampullary Carcinoma (Baylor College of Medicine, Cell Reports 2016)'
        );
        $('[data-test="StudySelect"]').waitForExist({ timeout: 10000 });
        $('[data-test="StudySelect"] input').click();

        clickQueryByGeneButton();

        $(selectedCaseSet_sel).waitForExist();
        browser.waitUntil(
            () =>
                $(selectedCaseSet_sel).getText() ===
                'Samples with mutation and CNA data (88)',
            10000
        );
    });
    it('selects the right default case sets in a single->select all filtered->single study selection flow', () => {
        // Select Ampullary Carcinoma
        var input = '.autosuggest input[type=text]';
        $(input).waitForExist({ timeout: 10000 });
        setInputText(input, 'ampullary baylor');
        waitForNumberOfStudyCheckboxes(1);
        $('[data-test="StudySelect"]').waitForExist({ timeout: 10000 });
        $('[data-test="StudySelect"] input').click();

        clickQueryByGeneButton();

        $(selectedCaseSet_sel).waitForExist();
        browser.waitUntil(
            () =>
                $(selectedCaseSet_sel).getText() ===
                'Samples with mutation data (160)',
            10000
        );

        clickModifyStudySelectionButton();

        // select all TCGA non-provisional
        $(input).waitForExist({ timeout: 10000 });
        setInputText(input, 'tcga -provisional');
        browser.pause(500);
        $(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        ).waitForExist({ timeout: 10000 });
        $(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        ).click();

        clickQueryByGeneButton();

        $('[data-test="dataTypePrioritySelector"]')
            .$('label*=Mutations')
            .$('input[type="checkbox"]')
            .waitForExist({ timeout: 10000 });
        $('[data-test="dataTypePrioritySelector"]')
            .$('label*=Copy number alterations')
            .$('input[type="checkbox"]')
            .waitForExist({ timeout: 10000 });
        $(selectedCaseSet_sel).waitForExist({ timeout: 10000 });
        browser.waitUntil(
            () => /All \(\d+\)/.test($(selectedCaseSet_sel).getText()),
            10000
        ); // since sample #s change across studies, dont depend this test on specific number

        clickModifyStudySelectionButton();

        // Deselect all tcga -provisional studies
        $(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        ).waitForExist({ timeout: 10000 });
        $(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        ).click();
        browser.pause(100);

        // select Adrenocortical Carcinoma
        $(input).waitForExist({ timeout: 10000 });
        setInputText(input, 'adrenocortical carcinoma tcga firehose legacy');
        waitForNumberOfStudyCheckboxes(1);
        $('[data-test="StudySelect"]').waitForExist({ timeout: 10000 });
        $('[data-test="StudySelect"] input').click();

        clickQueryByGeneButton();

        $('[data-test="dataTypePrioritySelector"]')
            .$('label*=Mutations')
            .$('input[type="checkbox"]')
            .waitForExist({ timeout: 10000 });
        $('[data-test="dataTypePrioritySelector"]')
            .$('label*=Copy number alterations')
            .$('input[type="checkbox"]')
            .waitForExist({ timeout: 10000 });
        $(selectedCaseSet_sel).waitForExist({ timeout: 10000 });
        browser.waitUntil(
            () => $(selectedCaseSet_sel).getText() === 'All (252)',
            10000
        );

        clickModifyStudySelectionButton();

        // Deselect Ampullary Carcinoma
        $(input).waitForExist({ timeout: 10000 });
        setInputText(input, 'ampullary baylor');
        waitForNumberOfStudyCheckboxes(
            1,
            'Ampullary Carcinoma (Baylor College of Medicine, Cell Reports 2016)'
        );
        $('[data-test="StudySelect"]').waitForExist({ timeout: 10000 });
        $('[data-test="StudySelect"] input').click();

        clickQueryByGeneButton();

        $(selectedCaseSet_sel).waitForExist();
        browser.waitUntil(
            () =>
                $(selectedCaseSet_sel).getText() ===
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
        $(input).waitForExist({ timeout: 10000 });
        setInputText(input, 'ovarian nature 2011');
        waitForNumberOfStudyCheckboxes(1);
        $('[data-test="StudySelect"]').waitForExist({ timeout: 10000 });
        $('[data-test="StudySelect"] input').click();
        browser.pause(200);

        clickQueryByGeneButton();

        // wait for profiles selector to load
        $(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"]'
        ).waitForExist({ timeout: 6000 });
        // mutations, CNA should be selected
        assert(
            $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'
            ).isSelected(),
            'mutation profile should be selected'
        );
        assert(
            $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'
            ).isSelected(),
            'cna profile should be selected'
        );
        assert(
            !$(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'
            ).isSelected(),
            'mrna profile not selected'
        );

        clickModifyStudySelectionButton();

        // select another study
        $(input).waitForExist({ timeout: 10000 });
        setInputText(input, 'ampullary baylor');
        waitForNumberOfStudyCheckboxes(
            1,
            'Ampullary Carcinoma (Baylor College of Medicine, Cell Reports 2016)'
        );
        $('[data-test="StudySelect"]').waitForExist({ timeout: 10000 });
        $('[data-test="StudySelect"] input').click();

        clickQueryByGeneButton();

        // wait for data type priority selector to load
        $('[data-test="dataTypePrioritySelector"]')
            .$('label*=Mutations')
            .$('input[type="checkbox"]')
            .waitForExist({ timeout: 10000 });
        $('[data-test="dataTypePrioritySelector"]')
            .$('label*=Copy number alterations')
            .$('input[type="checkbox"]')
            .waitForExist({ timeout: 10000 });
        assert(
            $('[data-test="dataTypePrioritySelector"]')
                .$('label*=Mutations')
                .$('input[type="checkbox"]')
                .isSelected(),
            "'Mutation' should be selected"
        );
        assert(
            $('[data-test="dataTypePrioritySelector"]')
                .$('label*=Copy number alterations')
                .$('input[type="checkbox"]')
                .isSelected(),
            "'Copy number alterations' should be selected"
        );

        clickModifyStudySelectionButton();

        //deselect other study
        $('[data-test="StudySelect"] input').click();

        clickQueryByGeneButton();

        // wait for profiles selector to load
        $(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"]'
        ).waitForExist({ timeout: 10000 });
        // mutations, CNA should be selected
        assert(
            $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'
            ).isSelected(),
            'mutation profile should be selected'
        );
        assert(
            $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'
            ).isSelected(),
            'cna profile should be selected'
        );
        assert(
            !$(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'
            ).isSelected(),
            'mrna profile not selected'
        );

        clickModifyStudySelectionButton();

        // select all tcga firehose legacy studies
        $(input).waitForExist({ timeout: 10000 });
        setInputText(input, 'tcga firehose');
        browser.pause(500);
        $(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        ).click();

        clickQueryByGeneButton();

        // wait for data type priority selector to load
        $('[data-test="dataTypePrioritySelector"]')
            .$('label*=Mutations')
            .$('input[type="checkbox"]')
            .waitForExist({ timeout: 10000 });
        $('[data-test="dataTypePrioritySelector"]')
            .$('label*=Copy number alterations')
            .$('input[type="checkbox"]')
            .waitForExist({ timeout: 10000 });
        assert(
            $('[data-test="dataTypePrioritySelector"]')
                .$('label*=Mutations')
                .$('input[type="checkbox"]')
                .isSelected(),
            "'Mutation' should be selected"
        );
        assert(
            $('[data-test="dataTypePrioritySelector"]')
                .$('label*=Copy number alterations')
                .$('input[type="checkbox"]')
                .isSelected(),
            "'Copy number alterations' should be selected"
        );

        clickModifyStudySelectionButton();

        // Deselect all tcga firehose legacy studies
        $(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        ).click();
        browser.pause(100);

        clickQueryByGeneButton();

        // wait for profiles selector to load
        $(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"]'
        ).waitForExist({ timeout: 6000 });
        // mutations, CNA should be selected
        assert(
            $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'
            ).isSelected(),
            'mutation profile should be selected'
        );
        assert(
            $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'
            ).isSelected(),
            'cna profile should be selected'
        );
        assert(
            !$(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'
            ).isSelected(),
            'mrna profile not selected'
        );
    });
});

describe('auto-selecting needed profiles for oql in query form', () => {
    beforeEach(() => {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    it('gives a submit error if protein oql is inputted and no protein profile is available for the study', () => {
        $('.studyItem_nsclc_mskcc_2018').waitForExist({ timeout: 20000 });
        $('.studyItem_nsclc_mskcc_2018').click();
        clickQueryByGeneButton();

        // enter oql
        $('textarea[data-test="geneSet"]').waitForExist({ timeout: 2000 });
        setInputText('textarea[data-test="geneSet"]', 'BRCA1: PROT>1');

        // error appears
        browser.waitUntil(
            () => {
                return (
                    $('[data-test="oqlErrorMessage"]').isExisting() &&
                    $('[data-test="oqlErrorMessage"]').getText() ===
                        'Protein level data query specified in OQL, but no protein level profile is available in the selected study.'
                );
            },
            { timeout: 20000 }
        );

        // submit is disabled
        assert(!$('button[data-test="queryButton"]').isEnabled());
    });
    it('auto-selects an mrna profile when mrna oql is entered', () => {
        $('.studyItem_chol_tcga_pan_can_atlas_2018').waitForExist({
            timeout: 20000,
        });
        $('.studyItem_chol_tcga_pan_can_atlas_2018').click();
        clickQueryByGeneButton();

        // make sure profiles selector is loaded
        $(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"]'
        ).waitForExist({ timeout: 3000 });
        // mutations, CNA should be selected
        assert(
            $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'
            ).isSelected(),
            'mutation profile should be selected'
        );
        assert(
            $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'
            ).isSelected(),
            'cna profile should be selected'
        );
        assert(
            !$(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'
            ).isSelected(),
            'mrna profile not selected'
        );

        // enter oql
        $('textarea[data-test="geneSet"]').waitForExist({ timeout: 2000 });
        setInputText('textarea[data-test="geneSet"]', 'TP53 BRCA1: EXP>1');

        $('button[data-test="queryButton"]').waitForEnabled({ timeout: 5000 });
        $('button[data-test="queryButton"]').click();

        // wait for query to load
        waitForOncoprint(30000);

        const profileFilter = (
            browser.execute(function() {
                return { ...urlWrapper.query };
            }).profileFilter || ''
        ).split(',');
        // mutation, cna, mrna profiles are there
        assert.equal(profileFilter.includes('mutations'), true);
        assert.equal(profileFilter.includes('gistic'), true);
        assert.equal(
            profileFilter.includes('rna_seq_v2_mrna_median_Zscores'),
            true
        );
    });
});

describe('results page quick oql edit', () => {
    it.skip('gives a submit error if protein oql is inputted and no protein profile is available for the study', () => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/oncoprint?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=prad_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=prad_tcga_pub_gistic&cancer_study_list=prad_tcga_pub&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=prad_tcga_pub_cnaseq&gene_list=BRCA1&geneset_list=%20&tab_index=tab_visualize&Action=Submit`
        );

        $('[data-test="oqlQuickEditButton"]').waitForExist({ timeout: 20000 });
        $('[data-test="oqlQuickEditButton"]').click();

        $('.quick_oql_edit [data-test="geneSet"]').waitForExist({
            timeout: 5000,
        });
        setInputText('.quick_oql_edit [data-test="geneSet"]', 'PTEN: PROT>0');

        // error appears
        browser.waitUntil(
            () => {
                return (
                    $(
                        '.quick_oql_edit [data-test="oqlErrorMessage"]'
                    ).isExisting() &&
                    $(
                        '.quick_oql_edit [data-test="oqlErrorMessage"]'
                    ).getText() ===
                        'Protein level data query specified in OQL, but no protein level profile is available in the selected study.'
                );
            },
            { timeout: 20000 }
        );

        // submit is disabled
        assert(!$('button[data-test="oqlQuickEditSubmitButton"]').isEnabled());
    });
    it('auto-selects an mrna profile when mrna oql is entered', () => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/oncoprint?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=prad_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=prad_tcga_pub_gistic&cancer_study_list=prad_tcga_pub&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=prad_tcga_pub_cnaseq&gene_list=BRCA1&geneset_list=%20&tab_index=tab_visualize&Action=Submit`
        );

        $('[data-test="oqlQuickEditButton"]').waitForExist({ timeout: 20000 });

        $('[data-test="oqlQuickEditButton"]').click();

        $('.quick_oql_edit [data-test="geneSet"]').waitForExist({
            timeout: 5000,
        });
        setInputText(
            '.quick_oql_edit [data-test="geneSet"]',
            'TP53 PTEN: PROT>0'
        );

        let query = browser.execute(function() {
            return { ...urlWrapper.query };
        });
        // mutation and cna profile are there
        assert.equal(
            query.genetic_profile_ids_PROFILE_MUTATION_EXTENDED,
            'prad_tcga_pub_mutations'
        );
        assert.equal(
            query.genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION,
            'prad_tcga_pub_gistic'
        );
        assert.equal(
            query.genetic_profile_ids_PROFILE_MRNA_EXPRESSION,
            undefined
        );

        // enter oql
        setDropdownOpen(
            true,
            'a[data-test="oqlQuickEditButton"]',
            '.quick_oql_edit textarea[data-test="geneSet"]'
        );
        setInputText(
            '.quick_oql_edit textarea[data-test="geneSet"]',
            'PTEN: EXP>1'
        );

        browser.pause(1000); // give it a second
        $('button[data-test="oqlQuickEditSubmitButton"]').waitForEnabled({
            timeout: 5000,
        });
        $('button[data-test="oqlQuickEditSubmitButton"]').click();

        // wait for query to load
        waitForOncoprint(20000);

        // mutation, cna, mrna profiles are there
        let profileFilter = (
            browser.execute(function() {
                return { ...urlWrapper.query };
            }).profileFilter || ''
        ).split(',');
        // mutation, cna, mrna profiles are there
        assert.equal(profileFilter.includes('mutations'), true);
        assert.equal(profileFilter.includes('gistic'), true);
        assert.equal(
            profileFilter.includes('rna_seq_v2_mrna_median_Zscores'),
            true
        );
    });
});
