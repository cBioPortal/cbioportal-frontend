const assert = require('assert');
const {
    goToUrlAndSetLocalStorageWithProperty,
} = require('../../shared/specUtils');
const { waitForTable } = require('./namespace-columns-utils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

const DEFAULT_COLS = {
    GENE_1: 'Gene 1',
    GENE_2: 'Gene 2',
    STATUS: 'Status',
    ANNOTATION: 'Annotation',
    VARIANT_CLASS: 'Variant Class',
    EVENT_INFO: 'Event Info',
    CONNECTION_TYPE: 'Connection Type',
};

describe('namespace columns in structural variant tables', function() {
    describe('patient view', () => {
        const patientViewUrl = `${CBIOPORTAL_URL}/patient?studyId=study_es_0&caseId=TCGA-A2-A04P`;
        const patientStructVarTable = 'patientview-structural-variant-table';

        it('shows default columns when property is not set', () => {
            goToUrlAndSetLocalStorageWithProperty(patientViewUrl, true, {});
            waitForTable(patientStructVarTable);

            assert(defaultColumnsAreDisplayed());
        });

        it('shows selected columns when property is set', () => {
            goToUrlAndSetLocalStorageWithProperty(patientViewUrl, true, {
                skin_patient_view_structural_variant_table_columns_show_on_init:
                    'Gene 1,Annotation,Breakpoint Type',
            });
            waitForTable(patientStructVarTable);
            assert(columnIsDisplayed(DEFAULT_COLS.GENE_1));
            assert(columnIsNotDisplayed(DEFAULT_COLS.GENE_2));
            assert(columnIsNotDisplayed(DEFAULT_COLS.STATUS));
            assert(columnIsDisplayed(DEFAULT_COLS.ANNOTATION));
            assert(columnIsNotDisplayed(DEFAULT_COLS.VARIANT_CLASS));
            assert(columnIsNotDisplayed(DEFAULT_COLS.EVENT_INFO));
            assert(columnIsNotDisplayed(DEFAULT_COLS.CONNECTION_TYPE));
            assert(columnIsDisplayed('Breakpoint Type'));
        });
    });
});

defaultColumnsAreDisplayed = () => {
    return (
        $("//span[text() = '" + DEFAULT_COLS.GENE_1 + "']").waitForDisplayed({
            timeout: 10000,
        }) &&
        $("//span[text() = '" + DEFAULT_COLS.GENE_2 + "']").isDisplayed() &&
        $("//span[text() = '" + DEFAULT_COLS.STATUS + "']").isDisplayed() &&
        $("//span[text() = '" + DEFAULT_COLS.ANNOTATION + "']").isDisplayed() &&
        $(
            "//span[text() = '" + DEFAULT_COLS.VARIANT_CLASS + "']"
        ).isDisplayed() &&
        $("//span[text() = '" + DEFAULT_COLS.EVENT_INFO + "']").isDisplayed() &&
        $(
            "//span[text() = '" + DEFAULT_COLS.CONNECTION_TYPE + "']"
        ).isDisplayed() &&
        !$("//span[text() = 'Breakpoint Type']").isDisplayed()
    );
};

function columnIsDisplayed(column) {
    return $("//span[text() = '" + column + "']").isDisplayed();
}

function columnIsNotDisplayed(column) {
    return !$("//span[text() = '" + column + "']").isDisplayed();
}
