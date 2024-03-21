var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var waitForPatientView = require('../../../shared/specUtils')
    .waitForPatientView;
var { setDropdownOpen } = require('../../../shared/specUtils');
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
const { getElementByTestHandle } = require('../../../shared/specUtils');
const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const patientViewUrl =
    CBIOPORTAL_URL + '/patient?studyId=teststudy_genepanels&caseId=patientA';
const ascnPatientViewUrl =
    CBIOPORTAL_URL + '/patient?studyId=ascn_test_study&caseId=FAKE_P001';
const genericAssayPatientViewUrl =
    CBIOPORTAL_URL +
    '/patient/mutationalSignatures?studyId=lgg_ucsf_2014_test_generic_assay&caseId=P01';

describe('patient view page', function() {
    describe('mutation table for study with ASCN data', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorage(ascnPatientViewUrl, true);
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
            goToUrlAndSetLocalStorage(patientViewUrl, true);
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
            goToUrlAndSetLocalStorage(patientViewUrl, true);
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

        it('filters VAF plot based on gene filter setting when switching to _all samples_', () => {
            switchGeneFilter('allSamples');
            doVafPlotScreenshotTest();
        });

        it('filters VAF plot based on gene filter setting when switching to _any sample_', () => {
            switchGeneFilter('anySample');
            doVafPlotScreenshotTest();
        });
    });

    describe('patient view mutational signatures', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorage(genericAssayPatientViewUrl, true);
            //waitForPatientView();
            $('a.tabAnchor_mutationalSignatures').waitForDisplayed({
                timeout: 20000,
            });
            $('a.tabAnchor_mutationalSignatures').click();
            $(
                'div[data-test="MutationalSignaturesContainer"]'
            ).waitForDisplayed({
                timeout: 20000,
            });
        });

        it('show stacked bar chart for patient who has significant SBS signatures', () => {
            $('div.patientSamples').waitForDisplayed({ timeout: 20000 });
            var res = browser.checkElement('div.patientSamples');
            assertScreenShotMatch(res);
        });

        it('show tooltip for patient who has significant SBS signatures', () => {
            $('div.progress').waitForDisplayed({ timeout: 20000 });
            $('div.progress').moveTo({ xOffset: 0, yOffset: 0 });
            assertScreenShotMatch(browser.checkElement('div.patientViewPage'));
        });

        it('show mutational signatures table for patient who has significant SBS signatures', () => {
            var res = browser.checkElement(
                'div[data-test="MutationalSignaturesContainer"]'
            );
            assertScreenShotMatch(res);
        });

        it('show stacked bar chart for patient who has significant ID signatures', () => {
            selectMutationalSignaturesVersionID();
            $('div.patientSamples').waitForDisplayed({ timeout: 20000 });
            // bar chart does an animation we have to wait for
            browser.pause(5000);
            var res = browser.checkElement('div.patientSamples');
            assertScreenShotMatch(res);
        });

        it('show tooltip for patient who has significant ID signatures', () => {
            selectMutationalSignaturesVersionID();
            $('div.progress').waitForDisplayed({ timeout: 20000 });
            $('div.progress').moveTo({ xOffset: 0, yOffset: 0 });

            $(
                'div[data-test="SignificantMutationalSignaturesTooltip"]'
            ).waitForDisplayed();

            assertScreenShotMatch(browser.checkElement('div.patientViewPage'));
        });

        it('show stacked bar chart for patient who has significant DBS signatures', () => {
            selectMutationalSignaturesVersionDBS();
            $('div.patientSamples').waitForDisplayed({ timeout: 20000 });
            // bar chart does an animation we have to wait for
            browser.pause(5000);
            var res = browser.checkElement('div.patientSamples');
            assertScreenShotMatch(res);
        });

        it('show tooltip for patient who has significant DBS signatures', () => {
            selectMutationalSignaturesVersionDBS();
            $('div.progress').waitForDisplayed({ timeout: 20000 });
            $('div.progress').moveTo({ xOffset: 0, yOffset: 0 });

            $(
                'div[data-test="SignificantMutationalSignaturesTooltip"]'
            ).waitForDisplayed();

            assertScreenShotMatch(browser.checkElement('div.patientViewPage'));
        });

        it('show mutational signatures table for patient who has significant ID signatures', () => {
            selectMutationalSignaturesVersionID();
            var res = browser.checkElement(
                'div[data-test="MutationalSignaturesContainer"]'
            );
            assertScreenShotMatch(res);
        });
    });
    describe('test the mutational bar chart', () => {
        it('show mutational bar chart sbs', () => {
            var res = browser.checkElement(
                'div[data-test=MutationalSignaturesContainer]'
            );
            assertScreenShotMatch(res);
        });
        it('show mutational bar chart id', () => {
            selectMutationalSignaturesVersionID();
            var res = browser.checkElement(
                'div[data-test=MutationalSignaturesContainer]'
            );
            assertScreenShotMatch(res);
        });
        it('show mutational bar chart dbs', () => {
            selectMutationalSignaturesVersionDBS();
            var res = browser.checkElement(
                'div[data-test=MutationalSignaturesContainer]'
            );
            assertScreenShotMatch(res);
        });
        it('show the bar chart with percentage on y axis', () => {
            selectPercentageYAxis();
            var res = browser.checkElement(
                'div[data-test=MutationalSignaturesContainer]'
            );
            assertScreenShotMatch(res);
        });
        it('switch between samples to update mutational bar chart', () => {
            selectSampleMutationalSignature();
            var res = browser.checkElement(
                'div[data-test=MutationalSignaturesContainer]'
            );
            assertScreenShotMatch(res);
        });
    });
});

const switchGeneFilter = selectedOption => {
    const selectMenu = '.rc-tooltip';
    const filterIcon =
        'div[data-test=patientview-mutation-table] i[data-test=gene-filter-icon]';
    setDropdownOpen(true, filterIcon, selectMenu);
    const allGenesRadio = $(selectMenu).$(
        'input[value=' + selectedOption + ']'
    );
    allGenesRadio.click();
    setDropdownOpen(false, filterIcon, selectMenu);
};

const doVafPlotScreenshotTest = () => {
    // we need to hide annotation column in mutations table first
    // because annotation column header icons will add extra height, the extra height will sometimes make scroll bar showing up on the right
    // browser.checkElement() doesn't work correctly on tooltip when there is a scroll bar
    // because scroll bar also takes some space and makes the total width shorter than tooltip, then tooltip will move to the right but browser.checkElement() still grabs the "old" position

    // open columns dropdown
    $('button*=Columns').click();
    // click "Annotation" to hide annotation column
    $('//*[text()="Annotation"]').click();
    // close on columns dropdown
    $('button*=Columns').click();
    $('.vafPlotThumbnail').moveTo(); // moves pointer to plot thumbnail
    $('div[role=tooltip] [data-test=vaf-plot]').waitForExist();
    const res = browser.checkElement('div[role=tooltip] [data-test=vaf-plot]'); // grabs the full plot
    assertScreenShotMatch(res);
};

const selectMutationalSignaturesVersionID = () => {
    $('div.mutationalSignaturesVersionSelector__indicators').waitForDisplayed({
        timeout: 10000,
    });
    $('div.mutationalSignaturesVersionSelector__indicators').click();
    $('div=Mutational Signature ID').waitForDisplayed({ timeout: 10000 });
    $('div=Mutational Signature ID').click();
};

const selectMutationalSignaturesVersionDBS = () => {
    $('div.mutationalSignaturesVersionSelector__indicators').waitForDisplayed({
        timeout: 10000,
    });
    $('div.mutationalSignaturesVersionSelector__indicators').click();
    $('div=Mutational Signature DBS').waitForDisplayed({ timeout: 10000 });
    $('div=Mutational Signature DBS').click();
};
const selectPercentageYAxis = () => {
    getElementByTestHandle('AxisScaleSwitch%').click();
};

const selectSampleMutationalSignature = () => {
    $('div.mutationalSignatureSampleSelector__indicators').waitForDisplayed({
        timeout: 10000,
    });
    $('div.mutationalSignatureSampleSelector__indicators').click();
    $('div=P01_Rec').waitForDisplayed({ timeout: 10000 });
    $('div=P01_Rec').click();
};
