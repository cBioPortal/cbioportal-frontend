function clickColumnSelectionButton(patientCnaTable) {
    $(`[data-test=${patientCnaTable}]`)
        .$('button*=Columns')
        .click();
}

function selectColumn(namespaceColumn1) {
    $(`[data-id="${namespaceColumn1}"]`).click();
}

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

module.exports = {
    getRowByGene,
    namespaceColumnsAreNotDisplayed,
    namespaceColumnsAreDisplayed,
    waitForTable,
    selectColumn,
    clickColumnSelectionButton,
};
