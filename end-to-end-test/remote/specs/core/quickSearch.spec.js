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
        $('input').setValue('Ad');
        $('div=Click on a study to open its summary').waitForExist();
        $('div=Click on a patient to see a summary').waitForExist();
        $('div=Click on a sample to open its summary').waitForExist();
    });

    it('should give results for studies', () => {
        $('strong=Adrenocortical Carcinoma (TCGA, Firehose Legacy)').click();
        $('h3=Adrenocortical Carcinoma (TCGA, Firehose Legacy)').waitForExist();

        assert.equal(
            $(
                'h3=Adrenocortical Carcinoma (TCGA, Firehose Legacy)'
            ).isDisplayed(),
            true,
            'modal is visible'
        );
    });

    it('should give results for genes', () => {
        $('strong=444 more genes (click to load 20 more)').click();
        $('strong=ADAM12').waitForExist();
        $('strong=ADAM15').click();
        $('a=ADAM15').waitForExist({ timeout: 60000 });

        assert.equal(
            $('a=ADAM15').isDisplayed(),
            true,
            'we navigated successfully to gene query'
        );
    });

    it('should give results for patients', () => {
        $('strong=AdCC11T').click();
        $('a=AdCC11T').waitForExist();

        assert.equal(
            $('a=AdCC11T').isDisplayed(),
            true,
            'navigated to patient'
        );
    });

    it('should give results for samples', () => {
        $('strong=AdCC11T').click();
        $('a=AdCC11T').waitForExist();

        assert.equal(
            $('a=AdCC11T').isDisplayed(),
            true,
            'navigated to patient'
        );
    });
});
