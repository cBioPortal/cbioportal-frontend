const assert = require('assert');
const {
    goToUrlAndSetLocalStorageWithProperty,
} = require('../../shared/specUtils');
const { waitForTable } = require('./namespace-columns-utils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

const DEFAULT_COLS = {
    GENE: 'Gene',
    CNA: 'CNA',
    ANNOTATION: 'Annotation',
    CYTOBAND: 'Cytoband',
    COHORT: 'Cohort',
};

describe('namespace columns in cna tables', function() {
    describe('patient view', () => {
        const patientViewUrl = `${CBIOPORTAL_URL}/patient?studyId=study_es_0&caseId=TCGA-A2-A04U`;
        const patientCnaTable = 'patientview-copynumber-table';

        it('shows default columns when property is not set', () => {
            goToUrlAndSetLocalStorageWithProperty(patientViewUrl, true, {});
            waitForTable(patientCnaTable);
            assert(defaultColumnsAreDisplayed());
        });

        it('shows selected columns when property is set', () => {
            goToUrlAndSetLocalStorageWithProperty(patientViewUrl, true, {
                skin_patient_view_copy_number_table_columns_show_on_init:
                    'Gene,Annotation,Gene panel',
            });
            waitForTable(patientCnaTable);
            assert(columnIsDisplayed(DEFAULT_COLS.GENE));
            assert(columnIsNotDisplayed(DEFAULT_COLS.CNA));
            assert(columnIsDisplayed(DEFAULT_COLS.ANNOTATION));
            assert(columnIsNotDisplayed(DEFAULT_COLS.CYTOBAND));
            assert(columnIsNotDisplayed(DEFAULT_COLS.COHORT));
            assert(columnIsDisplayed('Gene panel')); //Failing
        });
    });
});

defaultColumnsAreDisplayed = () => {
    return (
        $("//span[text() = '" + DEFAULT_COLS.GENE + "']").isDisplayed() &&
        $("//span[text() = '" + DEFAULT_COLS.CNA + "']").isDisplayed() &&
        $("//span[text() = '" + DEFAULT_COLS.ANNOTATION + "']").isDisplayed() &&
        $("//span[text() = '" + DEFAULT_COLS.CYTOBAND + "']").isDisplayed() &&
        $("//span[text() = '" + DEFAULT_COLS.COHORT + "']").isDisplayed() &&
        !$("//span[text() = 'Gene panel']").isDisplayed()
    );
};

function columnIsDisplayed(column) {
    return $("//span[text() = '" + column + "']").isDisplayed();
}

function columnIsNotDisplayed(column) {
    return !$("//span[text() = '" + column + "']").isDisplayed();
}
