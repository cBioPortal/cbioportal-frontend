// Source: end-to-end-test/local/specs/SurvivalChart.screenshot.spec.js
import { test, expect } from '../../fixtures';
import { Page } from '@playwright/test';
import { goToUrlAndSetLocalStorage } from './helpers';
import {
    expectElementScreenshot,
    setCheckboxChecked,
    setInputText,
    waitForGroupComparisonTabOpen,
    waitForNetworkQuiet,
} from '../helpers/common';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

async function jsApiHover(page: Page, selector: string) {
    await page.evaluate((sel: string) => {
        const el = document.querySelector(sel);
        if (el)
            el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    }, selector);
}

async function openGroupComparison(
    page: Page,
    studyViewUrl: string,
    chartDataTest: string,
    timeoutMs = 10000
) {
    await goToUrlAndSetLocalStorage(page, studyViewUrl, true);
    await expect(page.locator('[data-test=summary-tab-content]')).toBeVisible();
    await waitForNetworkQuiet(page, 20000);

    const chart = '[data-test=' + chartDataTest + ']';
    await expect(page.locator(chart)).toBeVisible({ timeout: timeoutMs });
    await page.mouse.move(0, 0);
    await page.locator(chart).scrollIntoViewIfNeeded();

    await jsApiHover(page, chart);
    await page
        .locator(chart + ' .controls')
        .waitFor({ state: 'attached', timeout: timeoutMs });

    const hamburgerIcon = '[data-test=chart-header-hamburger-icon]';
    await jsApiHover(page, hamburgerIcon);
    await expect(page.locator(chart + ' ' + hamburgerIcon)).toBeVisible({
        timeout: timeoutMs,
    });

    // Listen for the new tab/page that opens when clicking the second menu item.
    const context = page.context();
    const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        page
            .locator(chart + ' ' + hamburgerIcon + '-menu li')
            .nth(1)
            .click(),
    ]);

    await newPage.waitForLoadState('load');
    await waitForGroupComparisonTabOpen(newPage, timeoutMs);
    return newPage;
}

test.describe(
    'Screenshot test for extend survival chart (feature flag)',
    () => {
        test.describe.configure({ retries: 0, mode: 'serial' });

        let comparisonPage: Page;

        test.beforeAll(async ({ browser }) => {
            const context = await browser.newContext();
            const page = await context.newPage();
            comparisonPage = await openGroupComparison(
                page,
                `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay&featureFlags=SURVIVAL_PLOT_EXTENDED`,
                'chart-container-OS_STATUS',
                100000
            );
            await comparisonPage.locator('.tabAnchor_survival').click();
            await comparisonPage
                .locator('[data-test="ComparisonPageSurvivalTabDiv"]')
                .waitFor({ state: 'attached', timeout: 20000 });
        });

        test('Survival chart with landmark event and hazard ratio disabled', async () => {
            await expectElementScreenshot(
                comparisonPage,
                'div[data-test=SurvivalChart]',
                'survival-chart-with-landmark-event-and-hazard-ratio-disabled.png'
            );
        });

        test('Survival chart with landmark event at time point 20', async () => {
            await setCheckboxChecked(
                comparisonPage,
                true,
                'input[data-test=landmarkLines]'
            );
            await setInputText(
                comparisonPage,
                'input[data-test=landmarkValues]',
                '20'
            );
            await comparisonPage.mouse.move(0, 0);
            await expectElementScreenshot(
                comparisonPage,
                'div[data-test=SurvivalChart]',
                'survival-chart-with-landmark-event-at-time-point-20.png'
            );
        });

        test('Survival chart with hazard ratio table', async () => {
            await setCheckboxChecked(
                comparisonPage,
                false,
                'input[data-test=landmarkLines]'
            );
            await setCheckboxChecked(
                comparisonPage,
                true,
                'input[data-test=hazardRatioCheckbox]'
            );
            await expectElementScreenshot(
                comparisonPage,
                'div[data-test=survivalTabView]',
                'survival-chart-with-hazard-ratio-table.png'
            );
        });

        test('Survival chart with hazard ratio table and landmark line', async () => {
            await setCheckboxChecked(
                comparisonPage,
                true,
                'input[data-test=landmarkLines]'
            );
            await setInputText(
                comparisonPage,
                'input[data-test=landmarkValues]',
                '20'
            );
            await setCheckboxChecked(
                comparisonPage,
                true,
                'input[data-test=hazardRatioCheckbox]'
            );
            await expectElementScreenshot(
                comparisonPage,
                'div[data-test=survivalTabView]',
                'survival-chart-with-hazard-ratio-table-and-landmark-line.png'
            );
        });
    }
);
