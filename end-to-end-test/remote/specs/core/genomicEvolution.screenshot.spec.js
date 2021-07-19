var assert = require('assert');
var selectReactSelectOption = require('../../../shared/specUtils');
var expect = require('chai').expect;
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var checkElementWithMouseDisabled = require('../../../shared/specUtils')
    .checkElementWithMouseDisabled;
var waitForNetworkQuiet = require('../../../shared/specUtils')
    .waitForNetworkQuiet;
var { setCheckboxChecked } = require('../../../shared/specUtils');
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
var { jsApiHover } = require('../../../shared/specUtils');
const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

const patientViewUrl = `${CBIOPORTAL_URL}/patient/genomicEvolution?caseId=P04&studyId=lgg_ucsf_2014`;

describe('Patient View Genomic Evolution tab screenshot tests', function() {
    before(() => {
        goToUrlAndSetLocalStorage(patientViewUrl);
        $('a.tabAnchor_lineChart').waitForDisplayed({ timeout: 10000 });
        $('a.tabAnchor_lineChart').click();
        $('body').moveTo({ xOffset: 0, yOffset: 0 });
        $('[data-test=VAFChartWrapper]').waitForDisplayed({ timeout: 5000 });
        waitForNetworkQuiet(10000);
    });
    it('pvge initial view with line chart', function() {
        const res = browser.checkElement(
            'div[data-test="GenomicEvolutionTab"]',
            '',
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });
    it('pvge show timeline', function() {
        $('button[data-test="ToggleTimeline"]').click();
        $('div.tl-timeline-wrapper').waitForDisplayed();
        const res = browser.checkElement(
            'div[data-test="GenomicEvolutionTab"]',
            '',
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });
    it('pvge one mutation selected with line chart', function() {
        $('button[data-test="ToggleTimeline"]').click(); // toggle timeline off
        $(
            'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(1)'
        ).click();
        const res = checkElementWithMouseDisabled(
            'div[data-test="GenomicEvolutionTab"]',
            0,
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });
    it.skip('pvge hover a mutation with line chart', function() {
        jsApiHover(
            'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(2)'
        );
        const res = browser.checkElement(
            'div[data-test="GenomicEvolutionTab"]',
            '',
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });

    it('pvge switch to sequential mode', function() {
        setCheckboxChecked(true, 'input[data-test="VAFSequentialMode"]');
        const res = browser.checkElement('[data-test=VAFChartWrapper]');
        assertScreenShotMatch(res);
    });

    it('pvge only show highlighted in line chart', function() {
        setCheckboxChecked(false, 'input[data-test="VAFSequentialMode"]');
        $('input[data-test="VAFOnlyHighlighted"]').click();
        const res = browser.checkElement('[data-test=VAFChartWrapper]');
        assertScreenShotMatch(res);
    });
    it('pvge line chart log scale', function() {
        $('input[data-test="VAFLogScale"]').click();
        const res = browser.checkElement('[data-test=VAFChartWrapper]');
        assertScreenShotMatch(res);
    });
    it('pvge line chart with data range y axis', function() {
        $('input[data-test="VAFDataRange"]').click();
        const res = browser.checkElement('[data-test=VAFChartWrapper]');
        assertScreenShotMatch(res);
    });
    it('pvge add a mutation to line chart', function() {
        $(
            'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(2)'
        ).click();
        const res = browser.checkElement('[data-test=VAFChartWrapper]');
        assertScreenShotMatch(res);
    });
    it('pvge heatmap with two mutations selected from before', function() {
        $('a.tabAnchor_heatmap').click();
        $('div#MutationHeatmap').waitForDisplayed({ timeout: 3000 });
        const res = browser.checkElement(
            'div[data-test="GenomicEvolutionTab"]',
            '',
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });
    it('pvge one mutation selected with heatmap', function() {
        $(
            'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(1)'
        ).click();
        $('#cbioportal-logo').moveTo();
        const res = checkElementWithMouseDisabled(
            'div[data-test="GenomicEvolutionTab"]',
            0,
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });
    it('pvge hover a mutation with heatmap', function() {
        $(
            'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(9)'
        ).moveTo();
        const res = browser.checkElement(
            'div[data-test="GenomicEvolutionTab"]',
            '',
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });
    it('pvge uncluster heatmap', function() {
        $('input[data-test="HeatmapCluster"]').click();
        browser.pause(2000); // give time to uncluster
        const res = checkElementWithMouseDisabled('div#MutationHeatmap', 0, {
            hide: ['.qtip', '.dropdown-menu'],
        });
        assertScreenShotMatch(res);
    });
    it('pvge transpose heatmap', function() {
        $('input[data-test="HeatmapTranspose"]').click();
        browser.pause(2000); // give time to transpose
        const res = checkElementWithMouseDisabled('div#MutationHeatmap', 0, {
            hide: ['.qtip', '.dropdown-menu'],
        });
        assertScreenShotMatch(res);
    });
    it('pvge transposed heatmap hide labels', function() {
        $('input[data-test="HeatmapMutationLabels"]').click();
        browser.pause(400); // give time to rerender
        const res = checkElementWithMouseDisabled('div#MutationHeatmap', 0, {
            hide: ['.qtip', '.dropdown-menu'],
        });
        assertScreenShotMatch(res);
    });
    it('pvge heatmap hide labels', function() {
        $('input[data-test="HeatmapTranspose"]').click();
        browser.pause(2000); // give time to untranspose

        const res = checkElementWithMouseDisabled('div#MutationHeatmap', 0, {
            hide: ['.qtip', '.dropdown-menu'],
        });

        assertScreenShotMatch(res);
    });
});
