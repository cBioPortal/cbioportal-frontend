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
        $('div=e.g. Lung, EGFR, TCGA-OR-A5J2').waitForExist();
        $('div=e.g. Lung, EGFR, TCGA-OR-A5J2').click();
        // "BRAF" is nice because it matches studies, genes, patients, and samples
        $('input').setValue('BRAF');
        $('div=Click on a study to open its summary').waitForExist();
        $('div=Click on a patient to see a summary').waitForExist();
        $('div=Click on a sample to open its summary').waitForExist();
    });

    it('should give results for studies', () => {
        $('strong=Skin Cutaneous Melanoma(Broad, Cancer Discov 2014)').click();
        $(
            'h3=Skin Cutaneous Melanoma(Broad, Cancer Discov 2014)'
        ).waitForExist();

        assert.equal(
            $(
                'h3=Skin Cutaneous Melanoma(Broad, Cancer Discov 2014)'
            ).isDisplayed(),
            true,
            'modal is visible'
        );
    });

    it('should give results for genes', () => {
        $('strong=25 more genes (click to load 20 more)').click();
        $('strong=BRAF_PS314').waitForExist();
        $('strong=BRAF_PS314').click();
        $('a=BRAF_PS314').waitForExist({ timeout: 60000 });

        assert.equal($('a=BRAF_PS314').isDisplayed(), true, 'modal is visible');
    });

    it('should give results for patients', () => {
        $('strong=Mel-BRAFi-03').click();
        $('a=Mel-BRAFi-03').waitForExist();

        assert.equal(
            $('a=Mel-BRAFi-03').isDisplayed(),
            true,
            'modal is visible'
        );
    });

    it('should give results for samples', () => {
        $('strong=Mel_BRAFi_02_PRE').click();
        $('a=Mel_BRAFi_02_PRE').waitForExist();

        assert.equal(
            $('a=Mel_BRAFi_02_PRE').isDisplayed(),
            true,
            'modal is visible'
        );
    });
});
