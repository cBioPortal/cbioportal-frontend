var assert = require('assert');

const {
    goToUrlAndSetLocalStorage,
    getElementByTestHandle,
    getElement,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('patient page', () => {
    before(async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    it('should show "all samples button" for single sample view of multi sample patient', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/patient?studyId=lgg_ucsf_2014&tab=summaryTab&sampleId=P04_Pri`
        );

        await (await getElement('button=Show all 4 samples')).waitForExist();
    });

    it('show appropriate messaging when a patient has only some profiled samples', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/patient?studyId=mpcproject_broad_2021&caseId=MPCPROJECT_0013`
        );

        // there is one partial profile message for CNA and sample 2
        await (
            await getElementByTestHandle('patientview-mutation-table')
        ).waitForDisplayed();
    });

    it.skip('should display TMB-H biomarker annotation inline in the sample header', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/patient?studyId=msk_impact_50k_2026&caseId=P-0002435`
        );

        // Wait for clinical spans to be visible
        const clinicalSpans = await getElementByTestHandle(
            'patientSamplesClinicalSpans'
        );
        await clinicalSpans.waitForDisplayed({ timeout: 20000 });

        // Find the TMB-H biomarker annotation span nested within clinical spans
        const tmbhAnnotation = await clinicalSpans.$('.clinical-spans');
        await tmbhAnnotation.waitForExist({ timeout: 10000 });

        // Verify TMB-H text is present in the annotation
        const text = await tmbhAnnotation.getText();
        assert(text.includes('TMB-H'), `Expected TMB-H in annotation text, got: ${text}`);

        // Verify the annotation is rendered as inline-flex (not block-level flex,
        // which would cause the biomarker to wrap onto a new line)
        const display = await tmbhAnnotation.getCSSProperty('display');
        assert.strictEqual(
            display.value,
            'inline-flex',
            `Expected TMB-H annotation display to be inline-flex, got: ${display.value}`
        );
    });
});
