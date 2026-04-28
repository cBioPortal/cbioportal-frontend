import { test, expect, Page } from '../fixtures';
import {
    expectElementScreenshot,
    setCheckboxChecked,
    waitForNetworkQuiet,
} from './helpers/common';

/**
 * Port of end-to-end-test/remote/specs/core/genomicEvolution.screenshot.spec.js.
 *
 * Screenshot coverage of the Patient View → Genomic Evolution tab:
 *  - VAF line-chart view (default, with timeline, with selections, in
 *    sequential/log/data-range modes).
 *  - Mutation heatmap view (cluster toggle, transpose, label hide).
 *
 * Tests share one Page — most of them build on state established by
 * the previous test (a mutation selected, a checkbox flipped, etc.),
 * so splitting them would require expensive re-setup.
 */

const TAB = 'div[data-test="GenomicEvolutionTab"]';
const CHART = '[data-test=VAFChartWrapper]';
const TABLE_ROW = (n: number) =>
    `div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(${n})`;

test.describe.serial('Patient View Genomic Evolution screenshot tests', () => {
    test.describe.configure({ retries: 0 });
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage({
            viewport: { width: 1600, height: 1000 },
        });
        await page.goto(
            '/patient/genomicEvolution?caseId=P04&studyId=lgg_ucsf_2014'
        );
        await page.waitForTimeout(2000);

        // Switch from the default VAF view to the line chart view, which
        // is the starting point for most tests.
        await expect(page.locator('a.tabAnchor_lineChart')).toBeVisible({
            timeout: 20000,
        });
        await page.locator('a.tabAnchor_lineChart').click();
        await expect(page.locator(CHART)).toBeVisible({ timeout: 5000 });
        await waitForNetworkQuiet(page, 10000);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('initial line chart view', async () => {
        await expectElementScreenshot(page, TAB, 'pvge-line-initial.png', {
            hide: ['.qtip'],
        });
    });

    test('line chart with timeline toggled on', async () => {
        await page.locator('button[data-test="ToggleTimeline"]').click();
        await expect(
            page.locator('div.tl-timeline-wrapper').first()
        ).toBeVisible();
        await expectElementScreenshot(page, TAB, 'pvge-line-timeline.png', {
            hide: ['.qtip'],
        });
    });

    test('one mutation selected with line chart', async () => {
        // toggle timeline back off
        await page.locator('button[data-test="ToggleTimeline"]').click();
        await page.locator(TABLE_ROW(1)).click();
        await expectElementScreenshot(page, TAB, 'pvge-line-one-selected.png', {
            hide: ['.qtip'],
        });
    });

    test('sequential mode', async () => {
        await setCheckboxChecked(
            page,
            true,
            'input[data-test="VAFSequentialMode"]'
        );
        await expectElementScreenshot(page, CHART, 'pvge-line-sequential.png');
    });

    test('only-show-highlighted', async () => {
        await setCheckboxChecked(
            page,
            false,
            'input[data-test="VAFSequentialMode"]'
        );
        await setCheckboxChecked(
            page,
            true,
            'input[data-test="VAFOnlyHighlighted"]'
        );
        await expectElementScreenshot(
            page,
            CHART,
            'pvge-line-only-highlighted.png'
        );
    });

    test('line chart in log scale', async () => {
        await setCheckboxChecked(page, true, 'input[data-test="VAFLogScale"]');
        await expectElementScreenshot(page, CHART, 'pvge-line-logscale.png');
    });

    test('line chart with data-range y axis', async () => {
        // The wdio spec used jsApiClick here — element was obscured by a
        // sibling. Playwright's `force: true` has the same effect.
        await page
            .locator('input[data-test="VAFDataRange"]')
            .click({ force: true });
        await expectElementScreenshot(page, CHART, 'pvge-line-data-range.png');
    });

    test('second mutation added to line chart', async () => {
        await page.locator(TABLE_ROW(2)).click();
        await expectElementScreenshot(
            page,
            CHART,
            'pvge-line-two-selected.png'
        );
    });

    test('heatmap view with two selected mutations', async () => {
        await page.locator('a.tabAnchor_heatmap').click();
        await expect(page.locator('div#MutationHeatmap')).toBeVisible({
            timeout: 3000,
        });
        await expectElementScreenshot(
            page,
            TAB,
            'pvge-heatmap-two-selected.png',
            {
                hide: ['.qtip'],
            }
        );
    });

    test('heatmap with only the first mutation selected', async () => {
        await page.locator(TABLE_ROW(1)).click();
        await expectElementScreenshot(
            page,
            TAB,
            'pvge-heatmap-one-selected.png',
            {
                hide: ['.qtip'],
            }
        );
    });

    test('heatmap hover shows hover effect', async () => {
        const row = page.locator(TABLE_ROW(9));
        await row.scrollIntoViewIfNeeded();
        await row.hover();
        await page.waitForTimeout(2000);
        await expectElementScreenshot(page, TAB, 'pvge-heatmap-hover.png', {
            hide: ['.qtip'],
        });
    });

    test('heatmap unclustered', async () => {
        await setCheckboxChecked(
            page,
            false,
            'input[data-test="HeatmapCluster"]'
        );
        await page.waitForTimeout(2000);
        await expectElementScreenshot(
            page,
            'div#MutationHeatmap',
            'pvge-heatmap-unclustered.png',
            { hide: ['.qtip', '.dropdown-menu'] }
        );
    });

    test('heatmap transposed', async () => {
        await setCheckboxChecked(
            page,
            true,
            'input[data-test="HeatmapTranspose"]'
        );
        await page.waitForTimeout(2000);
        await expectElementScreenshot(
            page,
            'div#MutationHeatmap',
            'pvge-heatmap-transposed.png',
            { hide: ['.qtip', '.dropdown-menu'] }
        );
    });

    test('transposed heatmap without mutation labels', async () => {
        await setCheckboxChecked(
            page,
            false,
            'input[data-test="HeatmapMutationLabels"]'
        );
        await page.waitForTimeout(400);
        await expectElementScreenshot(
            page,
            'div#MutationHeatmap',
            'pvge-heatmap-transposed-nolabels.png',
            { hide: ['.qtip', '.dropdown-menu'] }
        );
    });

    test('heatmap without labels (back to unrotated)', async () => {
        await setCheckboxChecked(
            page,
            false,
            'input[data-test="HeatmapTranspose"]'
        );
        await page.waitForTimeout(2000);
        await expectElementScreenshot(
            page,
            'div#MutationHeatmap',
            'pvge-heatmap-nolabels.png',
            { hide: ['.qtip', '.dropdown-menu'] }
        );
    });
});
