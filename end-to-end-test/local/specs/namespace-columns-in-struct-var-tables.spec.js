const assert = require('assert');
const {
    goToUrlAndSetLocalStorageWithProperty,
} = require('../../shared/specUtils');
const {
    namespaceColumnsAreNotDisplayed,
    waitForTable,
    clickColumnSelectionButton,
    selectColumn,
    namespaceColumnsAreDisplayed,
    getRowByGene,
} = require('./namespace-columns-utils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('namespace columns in struct var tables', function() {
    describe('patient view', () => {
        const patientViewUrl = `${CBIOPORTAL_URL}/patient?studyId=study_es_0&caseId=TCGA-A2-A04P`;
        const namespaceColumn1 = 'StructVarNs Column1';
        const namespaceValue1 = 'value1';
        const namespaceColumn2 = 'StructVarNs Column2';
        const namespaceValue2 = 'value2';
        const namespaceColumns = [namespaceColumn1, namespaceColumn2];
        const patientStructVarTable = 'patientview-structural-variant-table';
        const geneWithCustomNamespaceData = 'KIAA1549';

        it('hides namespace columns when no property set', () => {
            goToUrlAndSetLocalStorageWithProperty(patientViewUrl, true, {});
            waitForTable(patientStructVarTable);
            assert(namespaceColumnsAreNotDisplayed(namespaceColumns));
        });

        it('shows columns when column menu is used', () => {
            clickColumnSelectionButton(patientStructVarTable);
            selectColumn(namespaceColumn1);
            selectColumn(namespaceColumn2);
            clickColumnSelectionButton(patientStructVarTable);
            assert(namespaceColumnsAreDisplayed(namespaceColumns));
        });

        /**
         * Expected custom namespace columns to be shown
         */
        it('displays custom namespace data', () => {
            const rowWithNamespaceData = getRowByGene(
                patientStructVarTable,
                geneWithCustomNamespaceData
            );
            assert(!!rowWithNamespaceData);
            const text = rowWithNamespaceData.getText();
            assert(text.includes(namespaceValue1));
            assert(text.includes(namespaceValue2));
        });
    });
});
