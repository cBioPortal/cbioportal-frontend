var assert = require('assert');
var expect = require('chai').expect;

var {
    goToUrlAndSetLocalStorage,
    clickQueryByGeneButton,
    useExternalFrontend,
    useNetlifyDeployPreview,
    setInputText,
    waitForNumberOfStudyCheckboxes,
    clickModifyStudySelectionButton,
    waitForOncoprint,
    setDropdownOpen,
    jq,
} = require('../../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

var searchInputSelector = 'div[data-test=study-search] input[type=text]';

describe('homepage', function() {
    before(async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    if (!useNetlifyDeployPreview) {
        it('window.frontendConfig.frontendUrl should point to localhost 3000 when testing', async function() {
            // We no longer check whether the dev mode banner exits.
            // The banner is hidden in e2etests.scss

            assert.equal(
                await browser.execute(function() {
                    return window.getLoadConfig().frontendUrl;
                })
                ,
                '//localhost:3000/'
            );
        });
    }

    // this just shows that we have some studies listed
    it('it should have some (>0) studies listed ', async function() {

        var container = await $(
            '[data-test="cancerTypeListContainer"] > ul > ul'
        );

        await container.waitForExist({ timeout: 10000 }); // same as `$('.notification').waitForExist({timeout: 10000})`

        const studies = await $$(
            '[data-test="cancerTypeListContainer"] > ul > ul'
        );

        expect(0).to.be.below(studies.length);
    });

    it('should filter study list according to filter text input', async function() {
        var input = await $(searchInputSelector);

        await input.waitForExist({ timeout: 10000 });

        setInputText(searchInputSelector, 'bladder');

        waitForNumberOfStudyCheckboxes(4);
    });

    it('when a single study is selected, a case set selector is provided', async function() {
        var caseSetSelectorClass = '[data-test="CaseSetSelector"]';

        var checkBox = await $('[data-test="StudySelect"]');

        await checkBox.waitForExist({ timeout: 10000 });

        assert.equal(await $(caseSetSelectorClass).isExisting(), false);

        await $('[data-test="StudySelect"] input').click();

        await clickQueryByGeneButton();

        var caseSetSelector = await $(caseSetSelectorClass);

        await caseSetSelector.waitForExist({ timeout: 10000 });

        assert.equal(await $(caseSetSelectorClass).isExisting(), true);
    });

    it('should not allow submission if OQL contains EXP or PROT for multiple studies', async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        await $('div[data-test=study-search] input[type=text]').waitForExist({
            timeout: 10000,
        });

        await setInputText(
            'div[data-test=study-search] input[type=text]',
            'breast -invasive'
        );

        await browser.pause(500);
        await $('[data-test="StudySelect"]').waitForExist({ timeout: 10000 });

        await $('[data-test="selectAllStudies"]').click();

        await clickQueryByGeneButton();

        const oqlEntrySel = 'textarea[data-test="geneSet"]';

        await setInputText(oqlEntrySel, 'PTEN: EXP>1');

        var errorMessageSel = 'span[data-test="oqlErrorMessage"]';
        await $(errorMessageSel).waitForExist();
        await browser.waitUntil(
            async () =>
                (await $(errorMessageSel).getText()) ===
                'Expression filtering in the gene list (the EXP command) is not supported when doing cross cancer queries.'
        );

        assert.equal(
            await $(errorMessageSel).getText(),
            'Expression filtering in the gene list (the EXP command) is not supported when doing cross cancer queries.'
        );

        const submitButtonSel = 'button[data-test="queryButton"]';
        assert.equal(
            await $(submitButtonSel).isEnabled(),
            false,
            'submit should be disabled w/ EXP in oql'
        );

        await setInputText(oqlEntrySel, 'PTEN: PROT>1');
        await $(errorMessageSel).waitForExist();
        await $(
            'span=Protein level filtering in the gene list (the PROT command) is not supported when doing cross cancer queries.'
        ).waitForExist();
        assert.equal(
            await $(errorMessageSel).getText(),
            'Protein level filtering in the gene list (the PROT command) is not supported when doing cross cancer queries.'
        );
        assert.ok(
            !(await $(submitButtonSel).isEnabled()),
            'submit should be disabled w/ PROT in oql'
        );
    });
});

describe('select all/deselect all functionality in study selector', function() {
    const getCheckedCheckboxes = async () => {
        await $('[data-test="StudySelect"] input[type=checkbox]').waitForDisplayed();
        // return $$('[data-test="StudySelect"] input[type=checkbox]');

        return await jq(`[data-test=\"StudySelect\"] input[type=checkbox]:checked`);
    };

    it('clicking select all studies checkbox selects all studies', async function() {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        assert.equal((await getCheckedCheckboxes()).length, 0, 'no studies selected');

        await $('button=TCGA PanCancer Atlas Studies').click();

        assert.equal(
            (await getCheckedCheckboxes()).length,
            32,
            'all pan can studies are selected'
        );

        await $('[data-test=globalDeselectAllStudiesButton]').click();

        assert.equal(
            (await getCheckedCheckboxes()).length,
            0,
            'no studies are selected'
        );
    });

    it('global deselect button clears all selected studies, even during filter', async function() {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        assert.equal(
            await $('[data-test=globalDeselectAllStudiesButton]').isExisting(),
            false,
            'global deselect button does not exist'
        );

        await browser.pause(500);

        await $$('[data-test="StudySelect"] input[type=checkbox]')[50].click();

        assert.equal(
            await $('[data-test=globalDeselectAllStudiesButton]').isExisting(),
            true,
            'global deselect button DOES exist'
        );

        var input = await $('div[data-test=study-search] input[type=text]');

        assert.equal((await getCheckedCheckboxes()).length, 1, 'we selected one study');

        // add a filter
        await input.setValue('breast');

        //click global deselect all while filtered
        await $('[data-test=globalDeselectAllStudiesButton]').click();

        // click unfilter button
        await $('[data-test=clearStudyFilter]').click();

        assert.equal(
            (await getCheckedCheckboxes()).length,
            0,
            'no selected studies are selected after deselect all clicked'
        );
    });
});

describe('case set selection in front page query form', function() {
    var selectedCaseSet_sel =
        'div[data-test="CaseSetSelector"] span.Select-value-label[aria-selected="true"]';

    beforeEach(async function() {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    it('selects the default case set for single study selections', async () => {
        const input = 'div[data-test=study-search] input[type=text]';
        await $(input).waitForExist({ timeout: 10000 });
        await setInputText(input, 'ovarian nature 2011');
        await waitForNumberOfStudyCheckboxes(1);
        await $('[data-test="StudySelect"]').waitForExist({ timeout: 10000 });
        await $('[data-test="StudySelect"] input').click();

        await clickQueryByGeneButton();

        await $(selectedCaseSet_sel).waitForExist();
        await browser.waitUntil(
            async () =>
                await $(selectedCaseSet_sel).getText() ===
                'Samples with mutation and CNA data (316)',
            {timeout:5000}
        );
    });
    it('selects the right default case sets in a single->multiple->single study selection flow', async () => {
        // Select Ampullary Carcinoma
        const input = 'div[data-test=study-search] input[type=text]';
        await $(input).waitForExist({ timeout: 10000 });
        await setInputText(input, 'ampullary baylor');
        await waitForNumberOfStudyCheckboxes(1);
        await $('[data-test="StudySelect"]').waitForExist({ timeout: 10000 });
        await $('[data-test="StudySelect"] input').click();

        await clickQueryByGeneButton();

        await $(selectedCaseSet_sel).waitForExist();
        await browser.waitUntil(
            async () =>
                (await $(selectedCaseSet_sel).getText()) ===
                'Samples with mutation data (160)',
            {timeout:30000}
        );

        await clickModifyStudySelectionButton();

        // select Adrenocortical Carcinoma
        await $(input).waitForExist({ timeout: 10000 });
        await setInputText(input, 'adrenocortical carcinoma tcga firehose legacy');

        await waitForNumberOfStudyCheckboxes(
            1,
            'Adrenocortical Carcinoma (TCGA, Firehose Legacy)'
        );

        await $('[data-test="StudySelect"]').waitForExist({ timeout: 10000 });
        await $('[data-test="StudySelect"] input').click();

        await clickQueryByGeneButton();

        await $('[data-test="dataTypePrioritySelector"]')
            .$('label*=Mutations')
            .$('input[type="checkbox"]')
            .waitForExist({ timeout: 10000 });

        await $(selectedCaseSet_sel).waitForExist();

        await browser.waitUntil(
            async () => (await $(selectedCaseSet_sel).getText()) === 'All (252)',
            { timeout:10000 }
        );

        await clickModifyStudySelectionButton();

        // Deselect Ampullary Carcinoma
        await $(input).waitForExist({ timeout: 10000 });
        await setInputText(input, 'ampullary baylor');
        await waitForNumberOfStudyCheckboxes(
            1,
            'Ampullary Carcinoma (Baylor College of Medicine, Cell Reports 2016)'
        );
        await $('[data-test="StudySelect"]').waitForExist({ timeout: 10000 });
        await $('[data-test="StudySelect"] input').click();

        await clickQueryByGeneButton();

        await $(selectedCaseSet_sel).waitForExist();

        await browser.waitUntil(
            async () =>
                await $(selectedCaseSet_sel).getText() ===
                'Samples with mutation and CNA data (88)',
                    { timeout:10000 }
        );
    });
    it('selects the right default case sets in a single->select all filtered->single study selection flow', async () => {
        // Select Ampullary Carcinoma
        const input = 'div[data-test=study-search] input[type=text]';
        await $(input).waitForExist({ timeout: 10000 });
        await setInputText(input, 'ampullary baylor');
        await waitForNumberOfStudyCheckboxes(1);
        await $('[data-test="StudySelect"]').waitForExist({ timeout: 10000 });
        await $('[data-test="StudySelect"] input').click();

        await clickQueryByGeneButton();

        await $(selectedCaseSet_sel).waitForExist();
        await browser.waitUntil(
            async () =>
                (await $(selectedCaseSet_sel).getText()) ===
                'Samples with mutation data (160)',
            10000
        );

        await clickModifyStudySelectionButton();

        // select all TCGA non-provisional
        await $(input).waitForExist({ timeout: 10000 });
        await setInputText(input, 'tcga -provisional');
        await browser.pause(500);
        await $(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        ).waitForExist({ timeout: 10000 });
        await $(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        ).click();

        await clickQueryByGeneButton();

        await $('[data-test="dataTypePrioritySelector"]')
            .$('label*=Mutations')
            .$('input[type="checkbox"]')
            .waitForExist({ timeout: 10000 });
        await $('[data-test="dataTypePrioritySelector"]')
            .$('label*=Copy number alterations')
            .$('input[type="checkbox"]')
            .waitForExist({ timeout: 10000 });
        await $(selectedCaseSet_sel).waitForExist({ timeout: 10000 });

        await browser.waitUntil(
            async () => {
                const vv = await $(selectedCaseSet_sel).getText();
                return /All \(\d+\)/.test(vv)
            },
            {timeout:10000}
        ); // since sample #s change across studies, dont depend this test on specific number

        await clickModifyStudySelectionButton();

        // Deselect all tcga -provisional studies
        await $(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        ).waitForExist({ timeout: 10000 });
        await $(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        ).click();
        await browser.pause(100);

        // select Adrenocortical Carcinoma
        await $(input).waitForExist({ timeout: 10000 });
        await setInputText(input, 'adrenocortical carcinoma tcga firehose legacy');
        await waitForNumberOfStudyCheckboxes(1);
        await $('[data-test="StudySelect"]').waitForExist({ timeout: 10000 });
        await $('[data-test="StudySelect"] input').click();

        await clickQueryByGeneButton();

        await $('[data-test="dataTypePrioritySelector"]')
            .$('label*=Mutations')
            .$('input[type="checkbox"]')
            .waitForExist({ timeout: 10000 });
        await $('[data-test="dataTypePrioritySelector"]')
            .$('label*=Copy number alterations')
            .$('input[type="checkbox"]')
            .waitForExist({ timeout: 10000 });
        await $(selectedCaseSet_sel).waitForExist({ timeout: 10000 });
        await browser.waitUntil(
            async () => await $(selectedCaseSet_sel).getText() === 'All (252)',
            { timeout:10000}
        );

        await clickModifyStudySelectionButton();

        // Deselect Ampullary Carcinoma
        await $(input).waitForExist({ timeout: 10000 });
        await setInputText(input, 'ampullary baylor');

        await waitForNumberOfStudyCheckboxes(
            1,
            'Ampullary Carcinoma (Baylor College of Medicine, Cell Reports 2016)'
        );
        await $('[data-test="StudySelect"]').waitForExist({ timeout: 10000 });
        await $('[data-test="StudySelect"] input').click();

        await clickQueryByGeneButton();

        await $(selectedCaseSet_sel).waitForExist();

        await browser.waitUntil(
            async () =>
                await $(selectedCaseSet_sel).getText() ===
                'Samples with mutation and CNA data (88)',
            { timeout: 10000 }
        );
    });
});

describe('genetic profile selection in front page query form', () => {
    beforeEach(async function() {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });
    it('selects the right default genetic profiles in a single->multiple->single study selection flow',
        async () => {
        // select a study
        const input = 'div[data-test=study-search] input[type=text]';
        await $(input).waitForExist({ timeout: 10000 });
        await setInputText(input, 'ovarian nature 2011');
        await  waitForNumberOfStudyCheckboxes(1);
        await $('[data-test="StudySelect"]').waitForExist({ timeout: 10000 });
        await $('[data-test="StudySelect"] input').click();
        await browser.pause(200);

        await clickQueryByGeneButton();

        // wait for profiles selector to load
        await $(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"]'
        ).waitForExist({ timeout: 6000 });
        // mutations, CNA should be selected
        assert(
            await $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'
            ).isSelected(),
            'mutation profile should be selected'
        );
        assert(
            await $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'
            ).isSelected(),
            'cna profile should be selected'
        );
        assert(
            ! await $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'
            ).isSelected(),
            'mrna profile not selected'
        );

        await clickModifyStudySelectionButton();

        // select another study
        await $(input).waitForExist({ timeout: 10000 });
        await setInputText(input, 'ampullary baylor');
        await waitForNumberOfStudyCheckboxes(
            1,
            'Ampullary Carcinoma (Baylor College of Medicine, Cell Reports 2016)'
        );
        await $('[data-test="StudySelect"]').waitForExist({ timeout: 10000 });
        await $('[data-test="StudySelect"] input').click();

        await clickQueryByGeneButton();

        // wait for data type priority selector to load
        await $('[data-test="dataTypePrioritySelector"]')
            .$('label*=Mutations')
            .$('input[type="checkbox"]')
            .waitForExist({ timeout: 10000 });
        await $('[data-test="dataTypePrioritySelector"]')
            .$('label*=Copy number alterations')
            .$('input[type="checkbox"]')
            .waitForExist({ timeout: 10000 });
        assert(
            await $('[data-test="dataTypePrioritySelector"]')
                .$('label*=Mutations')
                .$('input[type="checkbox"]')
                .isSelected(),
            "'Mutation' should be selected"
        );
        assert(
            await $('[data-test="dataTypePrioritySelector"]')
                .$('label*=Copy number alterations')
                .$('input[type="checkbox"]')
                .isSelected(),
            "'Copy number alterations' should be selected"
        );

        await clickModifyStudySelectionButton();

        //deselect other study
        await $('[data-test="StudySelect"] input').click();

        await clickQueryByGeneButton();

        // wait for profiles selector to load
        await $(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"]'
        ).waitForExist({ timeout: 10000 });
        // mutations, CNA should be selected
        assert(
            await $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'
            ).isSelected(),
            'mutation profile should be selected'
        );
        assert(
            await $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'
            ).isSelected(),
            'cna profile should be selected'
        );
        assert(
            ! await $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'
            ).isSelected(),
            'mrna profile not selected'
        );

        await clickModifyStudySelectionButton();

        // select all tcga firehose legacy studies
        await $(input).waitForExist({ timeout: 10000 });
        await setInputText(input, 'tcga firehose');
        await browser.pause(500);
        await $(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        ).click();

        await clickQueryByGeneButton();

        // wait for data type priority selector to load
        await $('[data-test="dataTypePrioritySelector"]')
            .$('label*=Mutations')
            .$('input[type="checkbox"]')
            .waitForExist({ timeout: 10000 });
        await $('[data-test="dataTypePrioritySelector"]')
            .$('label*=Copy number alterations')
            .$('input[type="checkbox"]')
            .waitForExist({ timeout: 10000 });
        assert(
            await $('[data-test="dataTypePrioritySelector"]')
                .$('label*=Mutations')
                .$('input[type="checkbox"]')
                .isSelected(),
            "'Mutation' should be selected"
        );
        assert(
            await $('[data-test="dataTypePrioritySelector"]')
                .$('label*=Copy number alterations')
                .$('input[type="checkbox"]')
                .isSelected(),
            "'Copy number alterations' should be selected"
        );

        await clickModifyStudySelectionButton();

        // Deselect all tcga firehose legacy studies
        await $(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        ).click();
        browser.pause(100);

        await clickQueryByGeneButton();

        // wait for profiles selector to load
        await $(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"]'
        ).waitForExist({ timeout: 6000 });
        // mutations, CNA should be selected
        assert(
            await $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'
            ).isSelected(),
            'mutation profile should be selected'
        );
        assert(
            await $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'
            ).isSelected(),
            'cna profile should be selected'
        );
        assert(
            ! await $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'
            ).isSelected(),
            'mrna profile not selected'
        );
    });
});

describe('auto-selecting needed profiles for oql in query form', () => {
    beforeEach(async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    it('gives a submit error if protein oql is inputted and no protein profile is available for the study', async () => {
        await $('.studyItem_nsclc_mskcc_2018').waitForExist({ timeout: 20000 });
        await $('.studyItem_nsclc_mskcc_2018').click();
        await clickQueryByGeneButton();

        // enter oql
        await $('textarea[data-test="geneSet"]').waitForExist({ timeout: 2000 });
        await setInputText('textarea[data-test="geneSet"]', 'BRCA1: PROT>1');

        // error appears
        await browser.waitUntil(
            async () => {
                return (
                    await $('[data-test="oqlErrorMessage"]').isExisting() &&
                    await $('[data-test="oqlErrorMessage"]').getText() ===
                        'Protein level data query specified in OQL, but no protein level profile is available in the selected study.'
                );
            },
            { timeout: 20000 }
        );

        // submit is disabled
        assert(! await $('button[data-test="queryButton"]').isEnabled());
    });
    it('auto-selects an mrna profile when mrna oql is entered', async () => {
        await $('.studyItem_chol_tcga_pan_can_atlas_2018').waitForExist({
            timeout: 20000,
        });
        await $('.studyItem_chol_tcga_pan_can_atlas_2018').click();
        clickQueryByGeneButton();

        // make sure profiles selector is loaded
        await $(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"]'
        ).waitForExist({ timeout: 3000 });
        // mutations, CNA should be selected
        assert(
            await $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'
            ).isSelected(),
            'mutation profile should be selected'
        );
        assert(
            await $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'
            ).isSelected(),
            'cna profile should be selected'
        );
        assert(
            ! await $(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'
            ).isSelected(),
            'mrna profile not selected'
        );

        // enter oql
        await $('textarea[data-test="geneSet"]').waitForExist({ timeout: 2000 });
        await setInputText('textarea[data-test="geneSet"]', 'TP53 BRCA1: EXP>1');

        await $('button[data-test="queryButton"]').waitForEnabled({ timeout: 5000 });
        await $('button[data-test="queryButton"]').click();

        // wait for query to load
        await waitForOncoprint(30000);
        //await browser.pause(10000);

        let profileFilter = await browser.execute(function() {
                return urlWrapper.query.profileFilter
            }
        )

        profileFilter = profileFilter.split(",")

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
    it('gives a submit error if protein oql is inputted and no protein profile is available for the study', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/oncoprint?cancer_study_list=ccrcc_dfci_2019&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations&case_set_id=ccrcc_dfci_2019_sequenced&gene_list=TP53&geneset_list=%20&tab_index=tab_visualize&Action=Submit`
        );

        await $('[data-test="oqlQuickEditButton"]').waitForExist({ timeout: 20000 });
        await $('[data-test="oqlQuickEditButton"]').click();

        await $('.quick_oql_edit [data-test="geneSet"]').waitForExist({
            timeout: 5000,
        });
        await setInputText('.quick_oql_edit [data-test="geneSet"]', 'PTEN: PROT>0');

        // error appears
        browser.waitUntil(
            async () => {
                return (
                    await $(
                        '.quick_oql_edit [data-test="oqlErrorMessage"]'
                    ).isExisting() &&
                    await $(
                        '.quick_oql_edit [data-test="oqlErrorMessage"]'
                    ).getText() ===
                        'Protein level data query specified in OQL, but no protein level profile is available in the selected study.'
                );
            },
            { timeout: 20000 }
        );

        // submit is disabled
        assert(await $('button[data-test="oqlQuickEditSubmitButton"]').isEnabled() === false);
    });
    it('auto-selects an mrna profile when mrna oql is entered', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/oncoprint?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=prad_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=prad_tcga_pub_gistic&cancer_study_list=prad_tcga_pub&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=prad_tcga_pub_cnaseq&gene_list=BRCA1&geneset_list=%20&tab_index=tab_visualize&Action=Submit`
        );

        await $('[data-test="oqlQuickEditButton"]').waitForExist({ timeout: 20000 });

        await $('[data-test="oqlQuickEditButton"]').click();

        await $('.quick_oql_edit [data-test="geneSet"]').waitForExist({
            timeout: 5000,
        });
        await setInputText(
            '.quick_oql_edit [data-test="geneSet"]',
            'TP53 PTEN: PROT>0'
        );

        let query = await browser.execute(function() {
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
        await setDropdownOpen(
            true,
            'a[data-test="oqlQuickEditButton"]',
            '.quick_oql_edit textarea[data-test="geneSet"]'
        );
        await setInputText(
            '.quick_oql_edit textarea[data-test="geneSet"]',
            'PTEN: EXP>1'
        );

        await browser.pause(1000); // give it a second

        await $('button[data-test="oqlQuickEditSubmitButton"]').waitForEnabled({
            timeout: 5000,
        });
        await $('button[data-test="oqlQuickEditSubmitButton"]').click();

        // wait for query to load
        await waitForOncoprint(20000);

        // mutation, cna, mrna profiles are there
        let profileFilter =
            await browser.execute(function() {
                return urlWrapper.query.profileFilter || ""
            });

        profileFilter = profileFilter.split(",");

        // mutation, cna, mrna profiles are there
        assert.equal(profileFilter.includes('mutations'), true);
        assert.equal(profileFilter.includes('gistic'), true);
        assert.equal(
            profileFilter.includes('rna_seq_v2_mrna_median_Zscores'),
            true
        );
    });
});
