const assert = require('assert');
const {
    goToUrlAndSetLocalStorageWithProperty,
} = require('../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const resultsViewUrl = `${CBIOPORTAL_URL}/results/mutations?cancer_study_list=study_es_0&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cfusion%2Cgistic&case_set_id=study_es_0_all&gene_list=BRCA1&geneset_list=%20&tab_index=tab_visualize&Action=Submit`;
const patientViewUrl = `${CBIOPORTAL_URL}/patient?sampleId=TEST_SAMPLE_SOMATIC_HOMOZYGOUS&studyId=study_es_0`;

describe('namespace columns in mutation tables', function() {
    describe('results view', () => {
        it('hides namespace columns when no property set', () => {
            goToUrlAndSetLocalStorageWithProperty(resultsViewUrl, true, {});
            waitForMutationTable();
            assert(namespaceColumnsAreNotDisplayed());
        });
        it('shows columns when column menu is used', () => {
            // Click on column button.
            $('button*=Columns').click();
            // Filter menu options.
            $('[data-test=fixed-header-table-search-input]').setValue(
                'zygosity'
            );
            $('[data-test=add-by-type]')
                .$('div*=Zygosity')
                .waitForDisplayed();
            // Click namespace column checkboxes.
            $('[data-test=add-by-type]')
                .$$('div*=Zygosity')
                .forEach(checkbox => checkbox.click());
            $('button*=Columns').click();
            assert(namespaceColumnsAreDisplayed());
        });
        it('shows namespace columns when property set', () => {
            goToUrlAndSetLocalStorageWithProperty(resultsViewUrl, true, {
                skin_mutation_table_namespace_column_show_by_default: true,
            });
            waitForMutationTable();
            assert(namespaceColumnsAreDisplayed());
        });
        it('has filter icons', () => {
            $("//span[text() = 'Zygosity Code']").click();
            filterIconOfHeader(
                "//span[text() = 'Zygosity Code']"
            ).waitForDisplayed();
            $("//span[text() = 'Zygosity Name']").click();
            filterIconOfHeader(
                "//span[text() = 'Zygosity Name']"
            ).waitForDisplayed();
        });
        it('filters rows when using numerical filter menu', () => {
            filterIconOfHeader("//span[text() = 'Zygosity Code']").click();
            // Empty rows
            var numberOfRowsBefore = numberOfTableRows();
            $('#Zygosity_Code-lowerValue-box').setValue('2');
            $('[data-test=numerical-filter-menu-remove-empty-rows]').click();
            browser.waitUntil(() => numberOfTableRows() < numberOfRowsBefore);

            // reset state
            $('#Zygosity_Code-lowerValue-box').setValue('1');
            $('[data-test=numerical-filter-menu-remove-empty-rows]').click();
            browser.waitUntil(() => numberOfTableRows() === numberOfRowsBefore);
        });
        it('filters rows when using categorical filter menu', () => {
            filterIconOfHeader("//span[text() = 'Zygosity Name']").click();
            // Empty rows
            var numberOfRowsBefore = numberOfTableRows();
            $('[data-test=categorical-filter-menu-search-input]').setValue(
                'Homozygous'
            );
            browser.waitUntil(() => numberOfTableRows() < numberOfRowsBefore);
        });
    });
    describe('patient view', () => {
        it('hides namespace columns when no property set', () => {
            goToUrlAndSetLocalStorageWithProperty(patientViewUrl, true, {});
            waitForPatientViewMutationTable();
            assert(namespaceColumnsAreNotDisplayed());
        });
        it('shows columns when column menu is used', () => {
            // Click on column button.
            $('[data-test=patientview-mutation-table]')
                .$('button*=Columns')
                .click();
            // Click namespace column checkboxes.
            $('[data-id="Zygosity Code"]').click();
            $('[data-id="Zygosity Name"]').click();
            $('[data-test=patientview-mutation-table]')
                .$('button*=Columns')
                .click();
            assert(namespaceColumnsAreDisplayed());
        });
        it('shows namespace columns when property set', () => {
            goToUrlAndSetLocalStorageWithProperty(patientViewUrl, true, {
                skin_mutation_table_namespace_column_show_by_default: true,
            });
            waitForPatientViewMutationTable();
            assert(namespaceColumnsAreDisplayed());
        });
    });
});

waitForMutationTable = () => {
    $('[data-test=LazyMobXTable]').waitForDisplayed();
};

waitForPatientViewMutationTable = () => {
    $('[data-test=patientview-mutation-table]').waitForDisplayed();
};

namespaceColumnsAreDisplayed = () => {
    return (
        $("//span[text() = 'Zygosity Code']").isDisplayed() &&
        $("//span[text() = 'Zygosity Name']").isDisplayed()
    );
};

namespaceColumnsAreNotDisplayed = () => {
    return !(
        $("//span[text() = 'Zygosity Code']").isDisplayed() &&
        $("//span[text() = 'Zygosity Name']").isDisplayed()
    );
};

filterIconOfHeader = selector => {
    return $(selector)
        .parentElement()
        .parentElement()
        .$('.fa-filter');
};

numberOfTableRows = () => $$('.lazy-mobx-table tr').length;
