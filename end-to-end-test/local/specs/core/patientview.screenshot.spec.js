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
    describe('mutation table for study with ASCN data', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorage(ascnPatientViewUrl);
            waitForPatientView();
        });

        it('displays ASCN columns', () => {
            var res = browser.checkElement(
                'div[data-test=patientview-mutation-table] table'
            );
            assertScreenShotMatch(res);
        });
    });

    describe('mutation table for study with no ASCN data', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorage(patientViewUrl);
            waitForPatientView();
        });

        it('does not display ASCN columns for studies with no ASCN data', () => {
            var res = browser.checkElement(
                'div[data-test=patientview-mutation-table] table'
            );
            assertScreenShotMatch(res);
        });
    });

    describe('gene panel icons', () => {
        const iconIndexGenePanelSample = 2;
        const iconIndexWholeGenomeSample = 3;

        beforeEach(() => {
            goToUrlAndSetLocalStorage(patientViewUrl);
            waitForPatientView();
        });

        it('shows gene panel icons behind mutation and CNA genomic tracks', () => {
            var res = browser.checkElement(
                'div.genomicOverviewTracksContainer'
            );
            assertScreenShotMatch(res);
        });

        it('filters mutation tracks based on gene filter setting', () => {
            switchGeneFilter('allSamples');
            var res = browser.checkElement(
                'div.genomicOverviewTracksContainer'
            );
            assertScreenShotMatch(res);
        });

        it('filters VAF plot based on gene filter setting when switching to "all samples"', () => {
            switchGeneFilter('allSamples');
            doVafPlotScreenshotTest();
        });

        it('filters VAF plot based on gene filter setting when switching to "any sample"', () => {
            switchGeneFilter('anySample');
            doVafPlotScreenshotTest();
        });
    });

    describe.only('patient view mutational signatures', () => {
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

        it('show tooltip for patient who has significant v2 significant signatures', () => {
            browser.waitForVisible('div.progress', 20000);
            browser.moveToObject('div.progress', 0, 0);
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

        it('show tooltip for patient who has significant v3 significant signatures', () => {
            selectMutationalSignaturesVersion3();
            browser.waitForVisible('div.progress', 20000);
            browser.moveToObject('div.progress', 0, 0);

            browser.waitForVisible(
                'div[data-test="SignificantMutationalSignaturesTooltip"]'
            );

            assertScreenShotMatch(browser.checkElement('div.patientViewPage'));
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

const switchGeneFilter = selectedOption => {
    var filterIcon = $('div[data-test=patientview-mutation-table]').$(
        'i[data-test=gene-filter-icon]'
    );
    filterIcon.click();
    var selectMenu = $('.rc-tooltip');
    const allGenesRadio = selectMenu.$('input[value=' + selectedOption + ']');
    allGenesRadio.click();
    filterIcon.click();
};

const doVafPlotScreenshotTest = () => {
    var res = browser.checkElement('[data-test=vaf-plot]'); // grabs the full plot
    browser.moveToObject('svg[data-test=vaf-plot]'); // moves pointer to plot thumbnail
    var res = browser.checkElement('div[role=tooltip] [data-test=vaf-plot]'); // grabs the full plot
    $('div[role=tooltip] [data-test=vaf-plot]').waitForExist();
    res = browser.checkElement('div[role=tooltip] [data-test=vaf-plot]'); // grabs the full plot
    assertScreenShotMatch(res);
};

const selectMutationalSignaturesVersion3 = () => {
    browser.waitForVisible(
        'div.mutationalSignaturesVersionSelector__indicators',
        10000
    );
    browser.click('div.mutationalSignaturesVersionSelector__indicators');
    browser.waitForVisible('div=Mutational Signature V3', 10000);
    browser.click('div=Mutational Signature V3');
};
