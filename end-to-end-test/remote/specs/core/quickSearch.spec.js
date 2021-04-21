var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;

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
        $('div=e.g. Lung, EGFR, TCGA-OR-A5J2').click();
        // "BRAF" is nice because it matches studies, genes, patients, and samples
        $('input').setValue('BRAF');
        browser.waitForText('div=Click on a study to open its summary');
        browser.waitForText('div=Click on a patient to see a summary');
        browser.waitForText('div=Click on a sample to open its summary');
    });

    it('should give results for studies', () => {
        $('strong=Skin Cutaneous Melanoma(Broad, Cancer Discov 2014)').click();
        browser.waitForText(
            'h3=Skin Cutaneous Melanoma(Broad, Cancer Discov 2014)'
        );

        assert.equal(
            browser.isDisplayed(
                'h3=Skin Cutaneous Melanoma(Broad, Cancer Discov 2014)'
            ),
            true,
            'modal is visible'
        );
    });

    it('should give results for genes', () => {
        $('strong=25 more genes (click to load 20 more)').click();
        browser.waitForText('strong=BRAF_PS314');
        $('strong=BRAF_PS314').click();
        browser.waitForText('a=BRAF_PS314');

        assert.equal($('a=BRAF_PS314').isDisplayed(), true, 'modal is visible');
    });

    it('should give results for patients', () => {
        $('strong=Mel-BRAFi-03').click();
        browser.waitForText('a=Mel-BRAFi-03');

        assert.equal(
            $('a=Mel-BRAFi-03').isDisplayed()[0],
            true,
            'modal is visible'
        );
    });

    it('should give results for samples', () => {
        $('strong=Mel_BRAFi_02_PRE').click();
        browser.waitForText('a=Mel_BRAFi_02_PRE');

        assert.equal(
            $('a=Mel_BRAFi_02_PRE').isDisplayed()[0],
            true,
            'modal is visible'
        );
    });
});
