var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils').goToUrlAndSetLocalStorage;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('Quick Search', () => {
    before(function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}`);
    });

    beforeEach(() => {
        var url = `${CBIOPORTAL_URL}`;
        goToUrlAndSetLocalStorage(url);
        $('strong=Beta!').click();
        browser.waitForText('div=e.g. Lung, EGFR, TCGA-OR-A5J2');
        browser.click('div=e.g. Lung, EGFR, TCGA-OR-A5J2');
        // "BRAF" is nice because it matches studies, genes, patients, and samples
        $('input').setValue('BRAF');
        browser.waitForText('div=Click on a study to open its summary');
        browser.waitForText('div=Click on a patient to see a summary');
        browser.waitForText('div=Click on a sample to open its summary');
    });

    it('should give results for studies', () => {
        browser.click('strong=Skin Cutaneous Melanoma(Broad, Cancer Discov 2014)');
        browser.waitForText('h3=Skin Cutaneous Melanoma(Broad, Cancer Discov 2014)');

        assert.equal(
            browser.isVisible('h3=Skin Cutaneous Melanoma(Broad, Cancer Discov 2014)'),
            true,
            'modal is visible'
        );
    });

    it('should give results for genes', () => {
        browser.click('strong=25 more genes (click to load 20 more)');
        browser.waitForText('strong=BRAF_PS314');
        browser.click('strong=BRAF_PS314');
        browser.waitForText('a=BRAF_PS314');

        assert.equal(browser.isVisible('a=BRAF_PS314'), true, 'modal is visible');
    });

    it('should give results for patients', () => {
        browser.click('strong=Mel-BRAFi-03');
        browser.waitForText('a=Mel-BRAFi-03');

        assert.equal(browser.isVisible('a=Mel-BRAFi-03')[0], true, 'modal is visible');
    });

    it('should give results for samples', () => {
        browser.click('strong=Mel_BRAFi_02_PRE');
        browser.waitForText('a=Mel_BRAFi_02_PRE');

        assert.equal(browser.isVisible('a=Mel_BRAFi_02_PRE')[0], true, 'modal is visible');
    });
});
