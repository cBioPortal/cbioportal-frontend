const assert = require('assert');
const {
    clickElement,
    getElement,
    goToUrlAndSetLocalStorage,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('Quick Search', () => {
    before(async () => {
        await goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}`);
    });

    beforeEach(async () => {
        const url = `${CBIOPORTAL_URL}`;
        await goToUrlAndSetLocalStorage(url);
        await clickElement('strong=Beta!');
        await (
            await getElement('div=e.g. Lung, EGFR, TCGA-OR-A5J2')
        ).waitForExist();
        await clickElement('div=e.g. Lung, EGFR, TCGA-OR-A5J2');
        // "BRAF" is nice because it matches studies, genes, patients, and samples
        await (await getElement('input')).setValue('Ad');
        await (
            await getElement('div=Click on a study to open its summary')
        ).waitForExist();
        await (
            await getElement('div=Click on a patient to see a summary')
        ).waitForExist();
        await (
            await getElement('div=Click on a sample to open its summary')
        ).waitForExist();
    });

    it('should give results for studies', async () => {
        await clickElement(
            'strong=Adrenocortical Carcinoma (TCGA, Firehose Legacy)'
        );
        await (
            await getElement(
                'h3=Adrenocortical Carcinoma (TCGA, Firehose Legacy)'
            )
        ).waitForExist();

        assert.equal(
            await (
                await getElement(
                    'h3=Adrenocortical Carcinoma (TCGA, Firehose Legacy)'
                )
            ).isDisplayed(),
            true,
            'modal is visible'
        );
    });

    it('should give results for genes', async () => {
        await clickElement('strong=454 more genes (click to load 20 more)');
        await (await getElement('strong=ADAM12')).waitForExist();
        await clickElement('strong=ADAM15');
        await (await getElement('a=ADAM15')).waitForExist({ timeout: 60000 });

        assert.equal(
            await (await getElement('a=ADAM15')).isDisplayed(),
            true,
            'we navigated successfully to gene query'
        );
    });

    it('should give results for patients', async () => {
        await clickElement('strong=AdCC11T');
        await (await getElement('a=AdCC11T')).waitForExist();

        assert.equal(
            await (await getElement('a=AdCC11T')).isDisplayed(),
            true,
            'navigated to patient'
        );
    });

    it('should give results for samples', async () => {
        await clickElement('strong=AdCC11T');
        await (await getElement('a=AdCC11T')).waitForExist();

        assert.equal(
            await (await getElement('a=AdCC11T')).isDisplayed(),
            true,
            'navigated to patient'
        );
    });
});
