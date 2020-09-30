var assert = require('assert');
var selectReactSelectOption = require('../../../shared/specUtils');
var expect = require('chai').expect;
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var checkElementWithMouseDisabled = require('../../../shared/specUtils')
    .checkElementWithMouseDisabled;
var waitForNetworkQuiet = require('../../../shared/specUtils')
    .waitForNetworkQuiet;
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

const patientViewUrl = `${CBIOPORTAL_URL}/patient/genomicEvolution?caseId=P04&studyId=lgg_ucsf_2014`;

describe('Patient View Genomic Evolution tab screenshot tests', function() {
    before(() => {
        goToUrlAndSetLocalStorage(patientViewUrl);
        browser.waitForVisible('a.tabAnchor_lineChart', 10000);
        browser.click('a.tabAnchor_lineChart');
        browser.moveToObject('body', 0, 0);
        browser.waitForVisible('svg[data-test="VAFLineChart"]', 5000);
        waitForNetworkQuiet(10000);
    });
    it('pvge initial view with line chart', function() {
        const res = browser.checkElement(
            'div[data-test="GenomicEvolutionTab"]',
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });
    it('pvge show timeline', function() {
        browser.click('button[data-test="ToggleTimeline"]');
        browser.waitForVisible('div#timeline');
        const res = browser.checkElement(
            'div[data-test="GenomicEvolutionTab"]',
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });
    it('pvge one mutation selected with line chart', function() {
        browser.click('button[data-test="ToggleTimeline"]'); // toggle timeline off
        browser.click(
            'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(1)'
        );
        const res = checkElementWithMouseDisabled(
            'div[data-test="GenomicEvolutionTab"]',
            0,
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });
    it('pvge hover a mutation with line chart', function() {
        browser.moveToObject(
            'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(2)'
        );
        const res = browser.checkElement(
            'div[data-test="GenomicEvolutionTab"]',
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });
    it('pvge only show highlighted in line chart', function() {
        browser.click('input[data-test="VAFOnlyHighlighted"]');
        const res = browser.checkElement('svg[data-test="VAFLineChart"]', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });
    it('pvge line chart log scale', function() {
        browser.click('input[data-test="VAFLogScale"]');
        const res = browser.checkElement('svg[data-test="VAFLineChart"]', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });
    it('pvge line chart with data range y axis', function() {
        browser.click('input[data-test="VAFDataRange"]');
        const res = browser.checkElement('svg[data-test="VAFLineChart"]', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });
    it('pvge add a mutation to line chart', function() {
        browser.click(
            'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(7)'
        );
        const res = browser.checkElement('svg[data-test="VAFLineChart"]', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });
    it('pvge heatmap with two mutations selected from before', function() {
        browser.click('a.tabAnchor_heatmap');
        browser.waitForVisible('div#MutationHeatmap', 3000);
        const res = browser.checkElement(
            'div[data-test="GenomicEvolutionTab"]',
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });
    it('pvge one mutation selected with heatmap', function() {
        browser.click(
            'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(1)'
        );
        browser.moveToObject('#cbioportal-logo');
        const res = checkElementWithMouseDisabled(
            'div[data-test="GenomicEvolutionTab"]',
            0,
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });
    it('pvge hover a mutation with heatmap', function() {
        browser.moveToObject(
            'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(9)'
        );
        const res = browser.checkElement(
            'div[data-test="GenomicEvolutionTab"]',
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });
    it('pvge uncluster heatmap', function() {
        browser.click('input[data-test="HeatmapCluster"]');
        browser.pause(2000); // give time to uncluster
        const res = checkElementWithMouseDisabled('div#MutationHeatmap', 0, {
            hide: ['.qtip', '.dropdown-menu'],
        });
        assertScreenShotMatch(res);
    });
    it('pvge transpose heatmap', function() {
        browser.click('input[data-test="HeatmapTranspose"]');
        browser.pause(2000); // give time to transpose
        const res = checkElementWithMouseDisabled('div#MutationHeatmap', 0, {
            hide: ['.qtip', '.dropdown-menu'],
        });
        assertScreenShotMatch(res);
    });
    it('pvge transposed heatmap hide labels', function() {
        browser.click('input[data-test="HeatmapMutationLabels"]');
        browser.pause(400); // give time to rerender
        const res = checkElementWithMouseDisabled('div#MutationHeatmap', 0, {
            hide: ['.qtip', '.dropdown-menu'],
        });
        assertScreenShotMatch(res);
    });
    it('pvge heatmap hide labels', function() {
        browser.click('input[data-test="HeatmapTranspose"]');
        browser.pause(2000); // give time to untranspose
        const res = checkElementWithMouseDisabled('div#MutationHeatmap', 0, {
            hide: ['.qtip', '.dropdown-menu'],
        });
        assertScreenShotMatch(res);
    });

    describe('variant allele frequency plot controls', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorage(patientViewUrl);
            $('.tl-timeline-svg').waitForVisible();
        });

        it('initalized with all options deselected', () => {
            const res = checkElementWithMouseDisabled(
                '[data-test=VAFChartWrapper]',
                0
            );
            assertScreenShotMatch(res);
        });

        it('shows sequential mode', () => {
            $('[data-test=TableShowSequentialMode]').click();
            $('.tl-timeline-svg').waitForVisible();
            const res = checkElementWithMouseDisabled(
                '[data-test=VAFChartWrapper]',
                0
            );
            assertScreenShotMatch(res);
        });

        it('shows selected mutations', () => {
            // TODO
            assert(false);
        });

        it('shows log scale', () => {
            $('[data-test=VAFLogScale]').click();
            $('.tl-timeline-svg').waitForVisible();
            const res = checkElementWithMouseDisabled(
                '[data-test=VAFChartWrapper]',
                0
            );
            assertScreenShotMatch(res);
        });

        it('truncates y-axis to data range', () => {
            $('[data-test=VAFLogScale]').click();
            $('[data-test=VAFDataRange]').click();
            $('.tl-timeline-svg').waitForVisible();
            const res = checkElementWithMouseDisabled(
                '[data-test=VAFChartWrapper]',
                0
            );
            assertScreenShotMatch(res);
        });

        it('shows single groupBy clinical variable track', () => {
            selectReactSelectOption(
                $('div[data-test=VAFChartControls]'),
                'Cancer Type'
            );
            $('text=GLIOMA').waitForVisible();
            const res = checkElementWithMouseDisabled(
                '[data-test=VAFChartWrapper]',
                0
            );
            assertScreenShotMatch(res);
        });

        it('shows multiple groupBy clinical variable tracks', () => {
            selectReactSelectOption(
                $('div[data-test=VAFChartControls]'),
                'Cancer Type Detailed'
            );
            $('text=ASTROCYTOMA').waitForVisible();
            const res = checkElementWithMouseDisabled(
                '[data-test=VAFChartWrapper]',
                0
            );
            assertScreenShotMatch(res);
        });
    });
});
