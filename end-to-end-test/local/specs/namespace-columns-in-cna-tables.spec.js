const assert = require('assert');
const {
    goToUrlAndSetLocalStorageWithProperty,
} = require('../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('namespace columns in cna tables', function() {
    describe('patient view', () => {
        const patientViewUrl = `${CBIOPORTAL_URL}/patient?studyId=study_es_0&caseId=TCGA-A2-A04U`;
        const namespaceColumn1 = 'MyNamespace Column1';
        const namespaceValue1 = 'value1b';
        const namespaceColumn2 = 'MyNamespace Column2';
        const namespaceValue2 = 'value2b';
        const namespaceColumns = [namespaceColumn1, namespaceColumn2];
        const patientCnaTable = 'patientview-copynumber-table';
        const geneWithCustomNamespaceData = 'ACAP3';

        it('hides namespace columns when no property set', () => {
            goToUrlAndSetLocalStorageWithProperty(patientViewUrl, true, {});
            waitForTable(patientCnaTable);
            assert(namespaceColumnsAreNotDisplayed(namespaceColumns));
        });

        it('shows columns when column menu is used', () => {
            clickColumnSelectionButton(patientCnaTable);
            selectColumn(namespaceColumn1);
            selectColumn(namespaceColumn2);
            clickColumnSelectionButton(patientCnaTable);
            assert(namespaceColumnsAreDisplayed(namespaceColumns));
        });

        /**
         * Expected custom namespace columns to be shown
         */
        it('displays custom namespace data', () => {
            const rowWithNamespaceData = getRowByGene(
                patientCnaTable,
                geneWithCustomNamespaceData
            );
            assert(!!rowWithNamespaceData);
            const text = rowWithNamespaceData.getText();
            assert(text.includes(namespaceValue1));
            assert(text.includes(namespaceValue2));
        });
    });
});

function clickColumnSelectionButton(patientCnaTable) {
    $(`[data-test=${patientCnaTable}]`)
        .$('button*=Columns')
        .click();
}

function selectColumn(namespaceColumn1) {
    $(`[data-id="${namespaceColumn1}"]`).click();
}

waitForMutationTable = () => {
    $('[data-test=LazyMobXTable]').waitForDisplayed();
};

waitForTable = table => {
    $(`[data-test=${table}]`).waitForDisplayed();
};

namespaceColumnsAreDisplayed = columns => {
    for (const column of columns) {
        if (!$(`//span[text()='${column}']`).isDisplayed()) {
            return false;
        }
    }
    return true;
};

namespaceColumnsAreNotDisplayed = columns => {
    return !namespaceColumnsAreDisplayed(columns);
};

getRowByGene = (tableName, gene) => {
    const tableRows = $$(`[data-test="${tableName}"] tr`);
    return tableRows.find(r => r.$('td=' + gene).isExisting());
};
