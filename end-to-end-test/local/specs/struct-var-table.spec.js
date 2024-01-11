var assert = require('assert');
var goToUrlAndSetLocalStorageWithProperty = require('../../shared/specUtils')
    .goToUrlAndSetLocalStorageWithProperty;
var waitForStudyView = require('../../shared/specUtils').waitForStudyView;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const studyViewUrl = `${CBIOPORTAL_URL}/study/summary?id=study_es_0`;
const structVarTable = '//*[@data-test="structural variant pairs-table"]';
const filterCheckBox = '[data-test=labeledCheckbox]';
const structVarFilterPillTag = '[data-test=pill-tag]';
const uncheckedSvIcon = '[data-test=structVarQueryCheckboxUnchecked]';
const checkedSvIcon = '[data-test=structVarQueryCheckboxChecked]';
const structVarNameCell = '[data-test=structVarNameCell]';
const toast = '.Toastify div[role=alert]';

describe('study view structural variant table', function() {
    beforeEach(() => {
        goToUrlAndSetLocalStorageWithProperty(studyViewUrl, true, {
            skin_study_view_show_sv_table: true,
        });
        waitForStudyView();
        showSvPane();
    });

    it('adds structural variant to study view filter', () => {
        $(structVarTable)
            .$(filterCheckBox)
            .click();
        $('[data-test=selectSamplesButton]').waitForExist();
        $('[data-test=selectSamplesButton]').click();
        assert($(structVarFilterPillTag).isExisting());
    });

    it.skip('shows all checkboxes when row is hovered', () => {
        $(structVarNameCell).waitForExist();
        const firstSvRowCell = $$(structVarNameCell)[0];
        assert.equal($$(structVarNameCell)[1].getText(), 'SND1');
        assert.equal($$(structVarNameCell)[2].getText(), 'BRAF');

        movePointerWithRetry(firstSvRowCell, () =>
            $(uncheckedSvIcon).waitForDisplayed()
        );
        assert.equal($$(uncheckedSvIcon).length, 3);
    });

    it.skip('shows only checked checkboxes when row is not hovered', () => {
        $(structVarNameCell).waitForExist();
        const gene1Cell = $$(structVarNameCell)[1];
        movePointerWithRetry(gene1Cell, () =>
            $(uncheckedSvIcon).waitForDisplayed()
        );
        assert.equal($$(uncheckedSvIcon).length, 3);

        gene1Cell.waitForClickable();
        gene1Cell.click();

        // hover somewhere else:
        movePointerWithRetry($('span=Gene 2'), $(checkedSvIcon).waitForExist());

        assert.equal($$(uncheckedSvIcon).length, 0);
        assert.equal($$(checkedSvIcon).length, 1);
    });

    it.skip('adds gene1::gene2 to Results View query', () => {
        $(structVarNameCell).waitForExist();
        const firstSvRowCell = $$(structVarNameCell)[0];

        movePointerWithRetry(firstSvRowCell, () => {
            $$(uncheckedSvIcon)[0].waitForClickable();
        });
        const gene1And2Checkbox = $$(uncheckedSvIcon)[0];
        gene1And2Checkbox.click();
        $(toast).waitForDisplayed();
        clearToast();

        const resultsViewQueryBox = openResultViewQueryBox();
        assert.equal('SND1: FUSION::BRAF;', resultsViewQueryBox.getValue());
    });

    it.skip('adds gene1::* to Results View query', () => {
        $(structVarNameCell).waitForExist();
        const gene1Cell = $$(structVarNameCell)[1];
        movePointerWithRetry(gene1Cell, () =>
            $(uncheckedSvIcon).waitForDisplayed()
        );
        gene1Cell.waitForClickable();
        gene1Cell.click();
        $(toast).waitForDisplayed();
        clearToast();

        const resultsViewQueryBox = openResultViewQueryBox();
        assert.equal('SND1: FUSION::;', resultsViewQueryBox.getValue());
    });

    it.skip('adds *::gene2 to Results View query', () => {
        $(structVarNameCell).waitForExist();
        const gene2Cell = $$(structVarNameCell)[2];
        movePointerWithRetry(gene2Cell, () =>
            $(uncheckedSvIcon).waitForDisplayed()
        );
        gene2Cell.waitForClickable();
        gene2Cell.click();
        $(toast).waitForDisplayed();
        clearToast();

        const resultsViewQueryBox = openResultViewQueryBox();
        assert.equal('BRAF: ::FUSION;', resultsViewQueryBox.getValue());
    });
});

function showSvPane() {
    const $chartsBtn = $('[data-test=add-charts-button]');
    $chartsBtn.waitForExist();
    $chartsBtn.waitForClickable();
    $chartsBtn.click();
    const $chartsGenomicTab = $('.tabAnchor_Genomic');
    $chartsGenomicTab.waitForExist();
    $chartsGenomicTab.waitForClickable();
    $chartsGenomicTab.click();
    const $svChartCheckbox = $(
        '[data-test="add-chart-option-structural-variants"]'
    ).$('[data-test="labeledCheckbox"]');
    $svChartCheckbox.waitForExist();
    $svChartCheckbox.waitForClickable();
    if (!$svChartCheckbox.isSelected()) {
        $svChartCheckbox.click();
    }
    $chartsBtn.click();
    waitForStudyView();
}

function openResultViewQueryBox() {
    const resultsViewQueryBox = $('[data-test=geneSet]');
    resultsViewQueryBox.waitForClickable();
    resultsViewQueryBox.click();
    return resultsViewQueryBox;
}

function clearToast() {
    const toastify = $('.Toastify button');
    toastify.waitForClickable();
    toastify.click();
    browser.pause(100);
}

function movePointerTo(element) {
    element.waitForDisplayed();
    element.scrollIntoView();
    const x = element.getLocation('x');
    const y = element.getLocation('y');
    browser.performActions([
        {
            type: 'pointer',
            parameters: { pointerType: 'mouse' },
            actions: [
                { type: 'pointerMove', duration: 0, x, y },
                { type: 'pointerMove', duration: 0, x, y },
            ],
        },
    ]);
}

/**
 * When scrolling to the new location, some tooltips might pop up and interfere.
 * A retry solves this problem: the second time the pointer is already near/at the desired location
 */
function movePointerWithRetry(element, isOk) {
    movePointerTo(element);
    try {
        if (isOk()) {
            return;
        }
    } catch (e) {
        // retry
        movePointerTo(element);
    }
}
