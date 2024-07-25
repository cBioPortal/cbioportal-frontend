var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../shared/specUtils')
    .goToUrlAndSetLocalStorage;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const studyEs0Summary = CBIOPORTAL_URL + '/study/summary?id=study_es_0';

describe('Virtual Study life cycle', function() {
    const vsTitle = 'Test VS ' + Date.now();
    let link;
    let vsId;
    const X_PUBLISHER_API_KEY = 'SECRETKEY';

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
    it('Provide the title and save', function() {
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
        link = linkInput.getValue();
        assert.ok(
            link.startsWith('http'),
            'The value should be link, but was ' + link
        );
        vsId = link
            .split('?')[1]
            .split('&')
            .map(paramEqValue => paramEqValue.split('='))
            .find(([key, value]) => key === 'id')[1];
        assert.ok(vsId, 'Virtual Study ID has not to be empty');
    });
    it('See the VS in My Virtual Studies section on the landing page', function() {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
        const vsSection = $(`//*[text()="${vsTitle}"]/ancestor::ul[1]`);
        vsSection.waitForDisplayed();
        const sectionTitle = vsSection.$('li label span');
        assert.equal(sectionTitle.getText(), 'My Virtual Studies');
    });
    it('Publish the VS', function() {
        const result = browser.executeAsync(
            function(cbioUrl, vsId, key, done) {
                const url = cbioUrl + '/api/public_virtual_studies/' + vsId;
                const headers = new Headers();
                headers.append('X-PUBLISHER-API-KEY', key);
                fetch(url, {
                    method: 'POST',
                    headers: headers,
                })
                    .then(response => {
                        done({
                            success: response.ok,
                            message: 'HTTP Status: ' + response.status,
                        });
                    })
                    .catch(error => {
                        done({ success: false, message: error.message });
                    });
            },
            CBIOPORTAL_URL,
            vsId,
            X_PUBLISHER_API_KEY
        );
        assert.ok(result.success, result.message);
    });
    it('See the VS in Public Virtual Studies section on the landing page', function() {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
        const vsSection = $(`//*[text()="${vsTitle}"]/ancestor::ul[1]`);
        vsSection.waitForDisplayed();
        const sectionTitle = vsSection.$('li label span');
        assert.equal(sectionTitle.getText(), 'Public Virtual Studies');
    });
    it('Re-publish the VS specifying PubMed ID and type of cancer', function() {
        const result = browser.executeAsync(
            function(cbioUrl, vsId, key, done) {
                const headers = new Headers();
                headers.append('X-PUBLISHER-API-KEY', key);
                fetch(
                    cbioUrl +
                        '/api/public_virtual_studies/' +
                        vsId +
                        '?pmid=28783718&typeOfCancerId=aca',
                    {
                        method: 'POST',
                        headers: headers,
                    }
                )
                    .then(response => {
                        done({
                            success: response.ok,
                            message: 'HTTP Status: ' + response.status,
                        });
                    })
                    .catch(error => {
                        done({ success: false, message: error.message });
                    });
            },
            CBIOPORTAL_URL,
            vsId,
            X_PUBLISHER_API_KEY
        );
        assert.ok(result.success, result.message);
    });
    it('See the VS in the Adrenocortical Adenoma section with PubMed link', function() {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
        const vsRow = $(`//*[text()="${vsTitle}"]/ancestor::li[1]`);
        const vsSection = vsRow.parentElement();
        vsSection.waitForDisplayed();
        const sectionTitle = vsSection.$('li label span');
        assert.equal(sectionTitle.getText(), 'Adrenocortical Adenoma');
        //has PubMed link
        assert.ok(vsRow.$('.fa-book').isExisting());
    });
    it('Un-publish the VS', function() {
        const result = browser.executeAsync(
            function(cbioUrl, vsId, key, done) {
                const headers = new Headers();
                headers.append('X-PUBLISHER-API-KEY', key);
                fetch(cbioUrl + '/api/public_virtual_studies/' + vsId, {
                    method: 'DELETE',
                    headers: headers,
                })
                    .then(response => {
                        done({
                            success: response.ok,
                            message: 'HTTP Status: ' + response.status,
                        });
                    })
                    .catch(error => {
                        done({ success: false, message: error.message });
                    });
            },
            CBIOPORTAL_URL,
            vsId,
            X_PUBLISHER_API_KEY
        );
        assert.ok(result.success, result.message);
    });

    it('Removing the VS', function() {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
        const vsRow = $(`//*[text()="${vsTitle}"]/ancestor::li[1]`);
        vsRow.waitForDisplayed();

        const removeBtn = vsRow.$('.fa-trash');
        removeBtn.click();
    });

    it('The VS disappears from the landing page', function() {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
        $('[data-test="cancerTypeListContainer"]').waitForDisplayed();
        const vsRowTitle = $(`//*[text()="${vsTitle}"]`);
        browser.pause(100);
        assert.ok(!vsRowTitle.isExisting());
    });
});
