var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var waitForPatientView = require('../../../shared/specUtils')
    .waitForPatientView;
var { setDropdownOpen } = require('../../../shared/specUtils');
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
            waitForPatientView();
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

        it('show stacked bar chart for patient who has significant v2 significant signatures', () => {
            $('div.patientSamples').waitForDisplayed({ timeout: 20000 });
            var res = browser.checkElement('div.patientSamples');
            assertScreenShotMatch(res);
        });

        it('show tooltip for patient who has significant v2 significant signatures', () => {
            $('div.progress').waitForDisplayed({ timeout: 20000 });
            $('div.progress').moveTo({ xOffset: 0, yOffset: 0 });
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
            $('div.patientSamples').waitForDisplayed({ timeout: 20000 });
            var res = browser.checkElement('div.patientSamples');
            assertScreenShotMatch(res);
        });

        it('show tooltip for patient who has significant v3 significant signatures', () => {
            selectMutationalSignaturesVersion3();
            $('div.progress').waitForDisplayed({ timeout: 20000 });
            $('div.progress').moveTo({ xOffset: 0, yOffset: 0 });

            $(
                'div[data-test="SignificantMutationalSignaturesTooltip"]'
            ).waitForDisplayed();

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
    var res = browser.checkElement('[data-test=vaf-plot]'); // grabs the full plot
    $('svg[data-test=vaf-plot]').moveTo(); // moves pointer to plot thumbnail
    var res = browser.checkElement('div[role=tooltip] [data-test=vaf-plot]'); // grabs the full plot
    $('div[role=tooltip] [data-test=vaf-plot]').waitForExist();
    res = browser.checkElement('div[role=tooltip] [data-test=vaf-plot]'); // grabs the full plot
    assertScreenShotMatch(res);
};

const selectMutationalSignaturesVersion3 = () => {
    $('div.mutationalSignaturesVersionSelector__indicators').waitForDisplayed({
        timeout: 10000,
    });
    $('div.mutationalSignaturesVersionSelector__indicators').click();
    $('div=Mutational Signature V3').waitForDisplayed({ timeout: 10000 });
    $('div=Mutational Signature V3').click();
};
