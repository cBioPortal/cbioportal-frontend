var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../shared/specUtils')
    .goToUrlAndSetLocalStorage;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const studyEs0Summary = CBIOPORTAL_URL + '/study/summary?id=study_es_0';

describe('Virtual Study life cycle', function() {
    const vsTitle = 'Test VS ' + Date.now();
    it('Login and navigate to the study_es_0 study summary page', function() {
        goToUrlAndSetLocalStorage(studyEs0Summary, true);
    });
    it('Click Share Virtual Study button', function() {
        const studyView = $('.studyView');
        const shareVSBtn = studyView.$(
            'button[data-tour="action-button-bookmark"]'
        );
        shareVSBtn.waitForClickable();
        shareVSBtn.click();
    });
    it('Provid the title and save', function() {
        const modalDialog = $('.modal-dialog');
        modalDialog.waitForDisplayed();
        const titleInput = modalDialog.$('input#sniglet');
        titleInput.setValue(vsTitle);
        const saveBtn = modalDialog.$(
            '[data-tour="virtual-study-summary-save-btn"]'
        );
        saveBtn.click();
        modalDialog.$('.text-success').waitForDisplayed();
        const linkInput = modalDialog.$('input[type="text"]');
        const link = linkInput.getValue();
        assert.ok(
            link.startsWith('http'),
            'The value should be link, but was ' + link
        );
    });
    it('See the VS in My Virtual Studies section on the landing page', function() {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
        const myVirtualStudies = $(
            '//*[text()="My Virtual Studies"]/ancestor::ul[1]'
        );
        myVirtualStudies.waitForDisplayed();
        const vsRow = myVirtualStudies.$(
            `//*[text()="${vsTitle}"]/ancestor::li[1]`
        );
        vsRow.waitForDisplayed();

        const removeBtn = vsRow.$('.fa-trash');
        removeBtn.click();
    });
    it('The VS dissapred from the landing page', function() {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
        $('[data-test="cancerTypeListContainer"]').waitForDisplayed();
        const vsRow = $(`//*[text()="${vsTitle}"]`);
        browser.pause(100);
        assert.ok(!vsRow.isExisting());
    });
});
