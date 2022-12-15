const assert = require('assert');
const {
    goToUrlAndSetLocalStorageWithProperty,
} = require('../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const resultsViewUrl = `${CBIOPORTAL_URL}/results/mutations?cancer_study_list=study_es_0&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cfusion%2Cgistic&case_set_id=study_es_0_all&gene_list=BRCA1&geneset_list=%20&tab_index=tab_visualize&Action=Submit`;
const patientViewUrl = `${CBIOPORTAL_URL}/patient?sampleId=TEST_SAMPLE_SOMATIC_HOMOZYGOUS&studyId=study_es_0`;

const DEFAULT_RESULT_COLS = {
    SAMPLE_ID: 'Sample ID',
    PROTEIN_CHANGE: 'Protein Change',
    ANNOTATION: 'Annotation',
    MUTATION_TYPE: 'Mutation Type',
    COPY_NUM: 'Copy #',
    COSMIC: 'COSMIC',
    NUM_MUT_IN_SAMPLE: '# Mut in Sample',
};

const DEFAULT_PATIENT_COLS = {
    GENE: 'Gene',
    PROTEIN_CHANGE: 'Protein Change',
    ANNOTATION: 'Annotation',
    MUTATION_TYPE: 'Mutation Type',
    COPY_NUM: 'Copy #',
    COHORT: 'Cohort',
    COSMIC: 'COSMIC',
};

describe('default init columns in mutation tables', function() {
    describe('results view', () => {
        it('shows default columns when properties not set', () => {
            goToUrlAndSetLocalStorageWithProperty(resultsViewUrl, true, {});
            waitForMutationTable();
            assert(defaultResultColumnsAreDisplayed());
            assert(namespaceColumnsAreNotDisplayed());
        });
        it('shows default and namespace columns when only namespace property set', () => {
            goToUrlAndSetLocalStorageWithProperty(resultsViewUrl, true, {
                skin_mutation_table_namespace_column_show_by_default: true,
            });
            waitForMutationTable();
            assert(defaultResultColumnsAreDisplayed());
            assert(namespaceColumnsAreDisplayed());
        });

        it('shows selected columns when only selected property set', () => {
            goToUrlAndSetLocalStorageWithProperty(resultsViewUrl, true, {
                skin_results_view_mutation_table_columns_show_on_init:
                    'Sample ID,Protein Change',
            });
            waitForMutationTable();
            assert(columnIsDisplayed(DEFAULT_RESULT_COLS.SAMPLE_ID));
            assert(columnIsDisplayed(DEFAULT_RESULT_COLS.PROTEIN_CHANGE));
            assert(columnIsNotDisplayed(DEFAULT_RESULT_COLS.ANNOTATION));
            assert(columnIsNotDisplayed(DEFAULT_RESULT_COLS.MUTATION_TYPE));
            assert(columnIsNotDisplayed(DEFAULT_RESULT_COLS.COPY_NUM));
            assert(columnIsNotDisplayed(DEFAULT_RESULT_COLS.COSMIC));
            assert(columnIsNotDisplayed(DEFAULT_RESULT_COLS.NUM_MUT_IN_SAMPLE));
            assert(columnIsNotDisplayed('Functional Impact'));
            assert(columnIsNotDisplayed('Variant Type'));
            assert(namespaceColumnsAreNotDisplayed());
        });

        it('shows selected and namespace columns when both properties are set', () => {
            goToUrlAndSetLocalStorageWithProperty(resultsViewUrl, true, {
                skin_results_view_mutation_table_columns_show_on_init:
                    'Sample ID,Protein Change',
                skin_mutation_table_namespace_column_show_by_default: true,
            });
            waitForMutationTable();
            assert(columnIsDisplayed(DEFAULT_RESULT_COLS.SAMPLE_ID));
            assert(columnIsDisplayed(DEFAULT_RESULT_COLS.PROTEIN_CHANGE));
            assert(columnIsNotDisplayed(DEFAULT_RESULT_COLS.MUTATION_TYPE));
            assert(columnIsNotDisplayed(DEFAULT_RESULT_COLS.COPY_NUM));
            assert(columnIsNotDisplayed(DEFAULT_RESULT_COLS.COSMIC));
            assert(columnIsNotDisplayed(DEFAULT_RESULT_COLS.NUM_MUT_IN_SAMPLE));
            assert(columnIsNotDisplayed('Functional Impact'));
            assert(columnIsNotDisplayed('Variant Type'));
            assert(namespaceColumnsAreDisplayed());
        });
    });
    describe('patient view', () => {
        it('shows default columns when properties not set', () => {
            goToUrlAndSetLocalStorageWithProperty(patientViewUrl, true, {});
            waitForPatientViewMutationTable();
            assert(defaultPatientColumnsAreDisplayed());
            assert(namespaceColumnsAreNotDisplayed());
        });
        it('shows default and namespace columns when only namespace property set', () => {
            goToUrlAndSetLocalStorageWithProperty(patientViewUrl, true, {
                skin_mutation_table_namespace_column_show_by_default: true,
            });
            waitForPatientViewMutationTable();
            assert(defaultPatientColumnsAreDisplayed());
            assert(namespaceColumnsAreDisplayed());
        });

        it('shows selected columns when only selected property set', () => {
            goToUrlAndSetLocalStorageWithProperty(patientViewUrl, true, {
                skin_patient_view_mutation_table_columns_show_on_init:
                    'Gene,Protein Change',
            });
            waitForPatientViewMutationTable();
            assert(columnIsDisplayed(DEFAULT_PATIENT_COLS.GENE));
            assert(columnIsDisplayed(DEFAULT_PATIENT_COLS.PROTEIN_CHANGE));
            assert(columnIsNotDisplayed(DEFAULT_PATIENT_COLS.ANNOTATION));
            assert(columnIsNotDisplayed(DEFAULT_PATIENT_COLS.MUTATION_TYPE));
            assert(columnIsNotDisplayed(DEFAULT_PATIENT_COLS.COPY_NUM));
            assert(columnIsNotDisplayed(DEFAULT_PATIENT_COLS.COHORT));
            assert(columnIsNotDisplayed(DEFAULT_PATIENT_COLS.COSMIC));
            assert(columnIsNotDisplayed('Functional Impact'));
            assert(columnIsNotDisplayed('Variant Type'));
            assert(namespaceColumnsAreNotDisplayed());
        });

        it('shows selected and namespace columns when both properties are set', () => {
            goToUrlAndSetLocalStorageWithProperty(patientViewUrl, true, {
                skin_patient_view_mutation_table_columns_show_on_init:
                    'Gene,Protein Change',
                skin_mutation_table_namespace_column_show_by_default: true,
            });
            waitForPatientViewMutationTable();
            assert(columnIsDisplayed(DEFAULT_PATIENT_COLS.GENE));
            assert(columnIsDisplayed(DEFAULT_PATIENT_COLS.PROTEIN_CHANGE));
            assert(columnIsNotDisplayed(DEFAULT_PATIENT_COLS.ANNOTATION));
            assert(columnIsNotDisplayed(DEFAULT_PATIENT_COLS.MUTATION_TYPE));
            assert(columnIsNotDisplayed(DEFAULT_PATIENT_COLS.COPY_NUM));
            assert(columnIsNotDisplayed(DEFAULT_PATIENT_COLS.COHORT));
            assert(columnIsNotDisplayed(DEFAULT_PATIENT_COLS.COSMIC));
            assert(columnIsNotDisplayed('Functional Impact'));
            assert(columnIsNotDisplayed('Variant Type'));
            assert(namespaceColumnsAreDisplayed());
        });
    });
});

defaultResultColumnsAreDisplayed = () => {
    return (
        $(
            "//span[text() = '" + DEFAULT_RESULT_COLS.SAMPLE_ID + "']"
        ).isDisplayed() &&
        $(
            "//span[text() = '" + DEFAULT_RESULT_COLS.PROTEIN_CHANGE + "']"
        ).isDisplayed() &&
        $(
            "//span[text() = '" + DEFAULT_RESULT_COLS.ANNOTATION + "']"
        ).isDisplayed() &&
        $(
            "//span[text() = '" + DEFAULT_RESULT_COLS.MUTATION_TYPE + "']"
        ).isDisplayed() &&
        $(
            "//span[text() = '" + DEFAULT_RESULT_COLS.COPY_NUM + "']"
        ).isDisplayed() &&
        $(
            "//span[text() = '" + DEFAULT_RESULT_COLS.COSMIC + "']"
        ).isDisplayed() &&
        $(
            "//span[text() = '" + DEFAULT_RESULT_COLS.NUM_MUT_IN_SAMPLE + "']"
        ).isDisplayed() &&
        !$("//span[text() = 'Functional Impact']").isDisplayed() &&
        !$("//span[text() = 'Variant Type']").isDisplayed()
    );
};

defaultPatientColumnsAreDisplayed = () => {
    return (
        $(
            "//span[text() = '" + DEFAULT_PATIENT_COLS.GENE + "']"
        ).isDisplayed() &&
        $(
            "//span[text() = '" + DEFAULT_PATIENT_COLS.PROTEIN_CHANGE + "']"
        ).isDisplayed() &&
        $(
            "//span[text() = '" + DEFAULT_PATIENT_COLS.ANNOTATION + "']"
        ).isDisplayed() &&
        $(
            "//span[text() = '" + DEFAULT_PATIENT_COLS.MUTATION_TYPE + "']"
        ).isDisplayed() &&
        $(
            "//span[text() = '" + DEFAULT_PATIENT_COLS.COPY_NUM + "']"
        ).isDisplayed() &&
        $(
            "//span[text() = '" + DEFAULT_PATIENT_COLS.COHORT + "']"
        ).isDisplayed() &&
        $(
            "//span[text() = '" + DEFAULT_PATIENT_COLS.COSMIC + "']"
        ).isDisplayed() &&
        !$("//span[text() = 'Functional Impact']").isDisplayed() &&
        !$("//span[text() = 'Variant Type']").isDisplayed()
    );
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

function columnIsDisplayed(column) {
    return $("//span[text() = '" + column + "']").isDisplayed();
}

function columnIsNotDisplayed(column) {
    return !$("//span[text() = '" + column + "']").isDisplayed();
}

waitForMutationTable = () => {
    $('[data-test=LazyMobXTable]').waitForDisplayed();
};

waitForPatientViewMutationTable = () => {
    $('[data-test=patientview-mutation-table]').waitForDisplayed();
    $('[data-test=LazyMobXTable]').waitForDisplayed();
};
