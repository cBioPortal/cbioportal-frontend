const assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    waitForStudyView,
    clickElement,
    getElement,
    setInputText,
    selectElementByText,
} = require('../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const studyViewUrl = `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`;
const ADD_CHART_BUTTON = "[data-test='add-charts-button']";
const ADD_CHART_GENERIC_ASSAY_TAB =
    '.addChartTabs a.tabAnchor_MUTATIONAL_SIGNATURE_TEST';
const GENERIC_ASSAY_PROFILE_SELECTOR =
    '[data-test="GenericAssayProfileSelection"]';
const GENERIC_ASSAY_ENTITY_SELECTOR =
    '[data-test="GenericAssayEntitySelection"]';
const CATEGORY_MUTATIONAL_SIGNATURE_PROFILE_TEXT =
    'div=mutational signature category v2 (61 samples)';
const WARNING_SELECTOR = '//*[contains(text(),"Showing first")]';

describe('study view generic assay selector', function() {
    beforeEach(async () => {
        await goToUrlAndSetLocalStorage(studyViewUrl, true);
        await waitForStudyView();
        await clickElement(ADD_CHART_BUTTON);
        await clickElement(ADD_CHART_GENERIC_ASSAY_TAB);
        await clickElement(GENERIC_ASSAY_PROFILE_SELECTOR);
        await (await selectElementByText(CATEGORY_MUTATIONAL_SIGNATURE_PROFILE_TEXT)).waitForExist();
        await (await selectElementByText(CATEGORY_MUTATIONAL_SIGNATURE_PROFILE_TEXT)).click();
    });

    it('restores the unfiltered warning after clearing a search', async () => {
        await clickElement(GENERIC_ASSAY_ENTITY_SELECTOR);
        const warning = await getElement(WARNING_SELECTOR);
        await warning.waitForExist();
        const initialWarningText = await warning.getText();

        await setInputText(
            '[data-test="GenericAssayEntitySelection"] input',
            'mutational_signature_category_10'
        );
        await browser.waitUntil(async () => !(await warning.isExisting()), {
            timeout: 10000,
            timeoutMsg: 'Expected generic assay warning to disappear for filtered results',
        });

        await (await selectElementByText('mutational_signature_category_10')).waitForExist();
        await (await selectElementByText('mutational_signature_category_10')).click();

        await setInputText(
            '[data-test="GenericAssayEntitySelection"] input',
            ''
        );

        const restoredWarning = await getElement(WARNING_SELECTOR);
        await restoredWarning.waitForExist();
        assert.equal(await restoredWarning.getText(), initialWarningText);
    });
});
