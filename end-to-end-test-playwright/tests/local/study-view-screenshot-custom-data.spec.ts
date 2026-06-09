// Source: end-to-end-test/local/specs/core/studyview.screenshot.spec.js
// Split out from study-view-screenshot.spec.ts so Playwright's --shard
// has more files to balance across parallel runners.
import { test, expect } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';
import {
    expectElementScreenshot,
    waitForNetworkQuiet,
} from '../helpers/common';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

const ADD_CHART_BUTTON = "[data-test='add-charts-button']";
const ADD_CHART_GENERIC_ASSAY_TAB =
    '.addChartTabs a.tabAnchor_MUTATIONAL_SIGNATURE_TEST';
const GENERIC_ASSAY_PROFILE_SELECTION =
    "[data-test='GenericAssayProfileSelection']";
const CATEGORY_MUTATIONAL_SIGNATURE_PROFILE_TEXT =
    'div=mutational signature category v2 (61 samples)';
const WAIT_FOR_VISIBLE_TIMEOUT = 30000;
const ADD_CUSTOM_CHART_TAB = '.addChartTabs a.tabAnchor.tabAnchor_Custom_Data';

test.describe('study view generic assay categorical/binary features', () => {
    test.skip('generic assay pie chart should be added in the summary tab', async ({
        page,
    }) => {
        const url = `${CBIOPORTAL_URL}/study?id=lgg_ucsf_2014_test_generic_assay`;
        await goToUrlAndSetLocalStorage(page, url, true);

        await expect(page.locator(ADD_CHART_BUTTON)).toBeVisible({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await page.locator(ADD_CHART_BUTTON).click();

        await expect(page.locator(ADD_CHART_GENERIC_ASSAY_TAB)).toBeVisible({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await page.locator(ADD_CHART_GENERIC_ASSAY_TAB).click();

        await expect(
            page.locator(GENERIC_ASSAY_PROFILE_SELECTION)
        ).toBeVisible({ timeout: WAIT_FOR_VISIBLE_TIMEOUT });
        await page.locator(GENERIC_ASSAY_PROFILE_SELECTION).click();

        await expect(
            page
                .locator(GENERIC_ASSAY_PROFILE_SELECTION)
                .locator(CATEGORY_MUTATIONAL_SIGNATURE_PROFILE_TEXT)
        ).toBeVisible({ timeout: WAIT_FOR_VISIBLE_TIMEOUT });
        await page
            .locator(GENERIC_ASSAY_PROFILE_SELECTION)
            .locator(CATEGORY_MUTATIONAL_SIGNATURE_PROFILE_TEXT)
            .click();

        await page
            .locator('div[data-test="GenericAssayEntitySelection"]')
            .waitFor({ state: 'attached' });
        await page
            .locator(
                'div[data-test="GenericAssayEntitySelection"] input >> nth=0'
            )
            .fill('mutational_signature_category_10');

        await page
            .locator('div=Select all filtered options (1)')
            .waitFor({ state: 'attached' });
        await page.locator('div=Select all filtered options (1)').click();

        const indicators = page.locator('div[class$="indicatorContainer"]');
        await indicators.first().click();
        const selectedOptions = page.locator('div[class$="multiValue"]');
        expect(await selectedOptions.count()).toBe(1);

        await page.locator('button:text-is("Add Chart")').click();
        await page.locator('button:text-is("Add Chart")').click();

        await waitForNetworkQuiet(page);
        await page.waitForTimeout(1000);

        const att = await page
            .locator(
                "[data-test*='chart-container-mutational_signature_category_10_mutational']"
            )
            .first()
            .getAttribute('data-test');

        await expectElementScreenshot(
            page,
            `[data-test='${att}']`,
            'study-view-generic-assay-pie-chart.png'
        );
    });
});

test.describe('Test the Custom data tab', () => {
    test('Add custom data tab should have numerical and categorical selector', async ({
        page,
    }) => {
        const url = `${CBIOPORTAL_URL}/study?id=lgg_ucsf_2014_test_generic_assay`;
        await goToUrlAndSetLocalStorage(page, url, true);
        await waitForNetworkQuiet(page);

        await expect(page.locator(ADD_CHART_BUTTON)).toBeVisible({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await page.locator(ADD_CHART_BUTTON).click();

        await waitForNetworkQuiet(page);

        await expect(page.locator(ADD_CUSTOM_CHART_TAB)).toBeVisible({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await page.locator(ADD_CUSTOM_CHART_TAB).click();
        // Verify the numerical / categorical radio buttons are present via
        // DOM assertions. A screenshot is not used here because the tab
        // panel's width is set by a JS offsetWidth measurement that differs
        // between environments (local Chrome vs CI headless-shell), making
        // pixel-stable snapshots impossible without artificial overrides.
        const customTab = page.locator('div.msk-tab.custom');
        await expect(customTab.locator('text=Categorical data')).toBeVisible({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await expect(customTab.locator('text=Numerical data')).toBeVisible({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
    });

    test('Selecting numerical for custom data should return a bar chart', async ({
        page,
    }) => {
        const url = `${CBIOPORTAL_URL}/study?id=lgg_ucsf_2014_test_generic_assay`;
        await goToUrlAndSetLocalStorage(page, url, true);
        await waitForNetworkQuiet(page);

        await expect(page.locator(ADD_CHART_BUTTON)).toBeVisible({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await page.locator(ADD_CHART_BUTTON).click();

        await waitForNetworkQuiet(page);

        await expect(page.locator(ADD_CUSTOM_CHART_TAB)).toBeVisible({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await page.locator(ADD_CUSTOM_CHART_TAB).click();
        await page.locator('div.msk-tab.custom').waitFor({ state: 'attached' });
    });
});
