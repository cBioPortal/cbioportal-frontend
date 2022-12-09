const clickColumnSelectionButton = patientCnaTable => {
    $(`[data-test=${patientCnaTable}]`)
        .$('button*=Columns')
        .click();
};

const selectColumn = namespaceColumn1 => {
    $(`[data-id="${namespaceColumn1}"]`).click();
};

const waitForTable = table => {
    $(`[data-test=${table}]`).waitForDisplayed();
};

const namespaceColumnsAreDisplayed = columns => {
    for (const column of columns) {
        if (!$(`//span[text()='${column}']`).isDisplayed()) {
            return false;
        }
    }
    return true;
};

const namespaceColumnsAreNotDisplayed = columns => {
    return !namespaceColumnsAreDisplayed(columns);
};

const getRowByGene = (tableName, gene) => {
    const tableRows = $$(`[data-test="${tableName}"] tr`);
    return tableRows.find(r => r.$('td=' + gene).isExisting());
};

module.exports = {
    getRowByGene,
    namespaceColumnsAreNotDisplayed,
    namespaceColumnsAreDisplayed,
    waitForTable,
    selectColumn,
    clickColumnSelectionButton,
};
