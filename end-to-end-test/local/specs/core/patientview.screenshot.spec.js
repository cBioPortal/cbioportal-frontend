var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var waitForPatientView = require('../../../shared/specUtils')
    .waitForPatientView;
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const patientViewUrl =
    CBIOPORTAL_URL + '/patient?studyId=teststudy_genepanels&caseId=patientA';
const ascnPatientViewUrl =
    CBIOPORTAL_URL + '/patient?studyId=ascn_test_study&caseId=FAKE_P001';
const genericAssayPatientViewUrl =
    CBIOPORTAL_URL +
    '/patient?studyId=lgg_ucsf_2014_test_generic_assay&sampleId=P01_Pri';

describe('patient view page', function() {
    describe('patient view mutational signatures', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorage(genericAssayPatientViewUrl);
            waitForPatientView();
            browser.waitForVisible('a.tabAnchor_mutationalSignatures', 20000);
            browser.click('a.tabAnchor_mutationalSignatures');
            browser.waitForVisible(
                'div[data-test="MutationalSignaturesContainer"]',
                20000
            );
        });

        it('show stacked bar chart for patient who has significant v2 significant signatures', () => {
            browser.waitForVisible('div.patientSamples', 20000);
            var res = browser.checkElement('div.patientSamples');
            assertScreenShotMatch(res);
        });

        it('show tooltip for patient who has significant v3 significant signatures', () => {
            selectMutationalSignaturesVersion3();
            browser.waitForVisible('div.progress', 20000);
            browser.moveToObject('div.progress', 0, 0);

            assertScreenShotMatch(browser.checkElement('div.patientViewPage'));
        });

        it('show tooltip for patient who has significant v3 significant signatures move', () => {
            selectMutationalSignaturesVersion3();
            browser.waitForVisible('div.progress', 20000);
            browser.moveToObject('div.progress', 5, 5);

            assertScreenShotMatch(browser.checkElement('div.patientViewPage'));
        });

        it('show tooltip for patient who has significant v2 significant signatures', () => {
            browser.waitForVisible('div.progress', 20000);
            browser.moveToObject('div.progress', 0, 0);

            browser.waitForVisible(
                'div[data-test="SignificantMutationalSignaturesTooltip"]'
            );

            assertScreenShotMatch(browser.checkElement('div.patientViewPage'));
        });

        it('show mutational signatures table for patient who has significant v2 significant signatures', () => {
            var res = browser.checkElement(
                'div[data-test="MutationalSignaturesContainer"]'
            );
            assertScreenShotMatch(res);
        });

        it('show stacked bar chart for patient who has significant v3 significant signatures', () => {
            selectMutationalSignaturesVersion3();
            browser.waitForVisible('div.patientSamples', 20000);
            var res = browser.checkElement('div.patientSamples');
            assertScreenShotMatch(res);
        });

        it('show mutational signatures table for patient who has significant v3 significant signatures', () => {
            selectMutationalSignaturesVersion3();
            var res = browser.checkElement(
                'div[data-test="MutationalSignaturesContainer"]'
            );
            assertScreenShotMatch(res);
        });
    });
});

const selectMutationalSignaturesVersion3 = () => {
    browser.waitForVisible(
        'div.mutationalSignaturesVersionSelector__indicators',
        10000
    );
    browser.click('div.mutationalSignaturesVersionSelector__indicators');
    browser.waitForVisible('div=Mutational Signature V3', 10000);
    browser.click('div=Mutational Signature V3');
};
