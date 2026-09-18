// Source: end-to-end-test/local/specs/core/studyview.screenshot.spec.js
// Split out from study-view-screenshot.spec.ts so Playwright's --shard
// has more files to balance across parallel runners.
import { test, expect, Page } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';
import {
    expectElementScreenshot,
    waitForNetworkQuiet,
} from '../helpers/common';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

const ADD_CHART_BUTTON = "[data-test='add-charts-button']";
const ADD_CHART_X_VS_Y_TAB = '.addChartTabs a.tabAnchor_X_Vs_Y';
const WAIT_FOR_VISIBLE_TIMEOUT = 30000;

test.describe.serial('study view x vs y charts', () => {
    test.describe.configure({ retries: 0 });
    let page: Page;

    const X_VS_Y_CHART = `div[data-test="chart-container-X-VS-Y-AGE-MUTATION_COUNT"]`;
    const X_VS_Y_HAMBURGER_ICON = `${X_VS_Y_CHART} [data-test="chart-header-hamburger-icon"]`;
    const X_VS_Y_MENU = `${X_VS_Y_CHART} [data-test="chart-header-hamburger-icon-menu"]`;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        const url = `${CBIOPORTAL_URL}/study?id=lgg_ucsf_2014_test_generic_assay`;
        await goToUrlAndSetLocalStorage(page, url, true);
        await waitForNetworkQuiet(page);

        if ((await page.locator(X_VS_Y_CHART).count()) > 0) {
            await page.locator(X_VS_Y_CHART).dispatchEvent('mouseover');
            await expect(
                page.locator(`${X_VS_Y_CHART} [data-test="deleteChart"]`)
            ).toBeVisible();
            await page
                .locator(`${X_VS_Y_CHART} [data-test="deleteChart"]`)
                .click();
            await expect(page.locator(X_VS_Y_CHART)).toHaveCount(0);
        }
    });

    test.afterAll(async () => {
        // remove mutation count vs diagnosis age chart
        await page.locator(X_VS_Y_CHART).dispatchEvent('mouseover');
        await expect(
            page.locator(`${X_VS_Y_CHART} [data-test="deleteChart"]`)
        ).toBeVisible();
        await page.locator(`${X_VS_Y_CHART} [data-test="deleteChart"]`).click();
        await expect(page.locator(X_VS_Y_CHART)).toHaveCount(0);

        await page.locator(ADD_CHART_BUTTON).click();
        await waitForNetworkQuiet(page);
        const resetExists =
            (await page.locator('button:text-is("Reset charts")').count()) > 0;
        if (resetExists) {
            await page.locator('button:text-is("Reset charts")').click();
            await expect(
                page.locator('.modal-content button:text-is("Confirm")')
            ).toBeVisible();
            await page
                .locator('.modal-content button:text-is("Confirm")')
                .click();
            await page.waitForTimeout(4000);
            await waitForNetworkQuiet(page);
        }
        await page.close();
    });

    test('adds mutation count vs diagnosis age chart', async () => {
        await expect(page.locator(ADD_CHART_BUTTON)).toBeVisible({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        // The button has a `disabled` CSS class while generic-assay profiles are
        // still loading (tabsLoading guard). Clicks during that window are silently
        // ignored, so wait for the class to clear before clicking.
        await expect(page.locator(ADD_CHART_BUTTON)).not.toHaveClass(
            /disabled/,
            { timeout: WAIT_FOR_VISIBLE_TIMEOUT }
        );
        // Retry-click until the dropdown actually opens — a re-render can race
        // the toggle and close it immediately after the first click.
        for (let attempt = 0; attempt < 5; attempt++) {
            const isOpen =
                (await page.locator(ADD_CHART_X_VS_Y_TAB).count()) > 0 &&
                (await page.locator(ADD_CHART_X_VS_Y_TAB).isVisible());
            if (isOpen) break;
            await page.locator(ADD_CHART_BUTTON).click();
            await page.waitForTimeout(1000);
        }

        await expect(page.locator(ADD_CHART_X_VS_Y_TAB)).toBeVisible({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await page.locator(ADD_CHART_X_VS_Y_TAB).click();

        await expect(page.locator('.xvsy-x-axis-selector')).toBeVisible();
        await page.locator('.xvsy-x-axis-selector').click();
        await expect(
            page.locator('.xvsy-x-axis-selector :text-is("Diagnosis Age")')
        ).toBeVisible();
        await page
            .locator('.xvsy-x-axis-selector :text-is("Diagnosis Age")')
            .click();

        await expect(page.locator('.xvsy-y-axis-selector')).toBeVisible();
        await page.locator('.xvsy-y-axis-selector').click();
        await expect(
            page.locator('.xvsy-y-axis-selector :text-is("Mutation Count")')
        ).toBeVisible();
        await page
            .locator('.xvsy-y-axis-selector :text-is("Mutation Count")')
            .click();

        try {
            await expect(
                page.locator('button[data-test="x-vs-y-submit-btn"]')
            ).toBeEnabled();
            await page.locator('button[data-test="x-vs-y-submit-btn"]').click();
        } catch (e) {
            // submit button may already be disabled if chart exists
        }

        await page.locator(X_VS_Y_CHART).waitFor({ state: 'attached' });

        await expectElementScreenshot(
            page,
            X_VS_Y_CHART,
            'study-view-x-vs-y-chart.png'
        );
    });

    test('turns on log scale from dropdown menu', async () => {
        await page.locator(X_VS_Y_CHART).dispatchEvent('mouseover');
        await expect(page.locator(X_VS_Y_HAMBURGER_ICON)).toBeVisible();
        await page.locator(X_VS_Y_HAMBURGER_ICON).dispatchEvent('mouseover');
        await expect(page.locator(X_VS_Y_MENU)).toBeVisible();
        await page.locator(`${X_VS_Y_MENU} a.logScaleCheckbox`).click();
        await page.mouse.move(0, 0);
        await expectElementScreenshot(
            page,
            X_VS_Y_CHART,
            'study-view-x-vs-y-chart-log-scale.png'
        );
    });

    test('swaps axis from dropdown menu', async () => {
        await page.locator(X_VS_Y_CHART).dispatchEvent('mouseover');
        await expect(page.locator(X_VS_Y_HAMBURGER_ICON)).toBeVisible();
        await page.locator(X_VS_Y_HAMBURGER_ICON).dispatchEvent('mouseover');
        await expect(page.locator(X_VS_Y_MENU)).toBeVisible();
        await page.locator(`${X_VS_Y_MENU} [data-test="swapAxes"]`).click();
        await page.mouse.move(0, 0);
        await expectElementScreenshot(
            page,
            X_VS_Y_CHART,
            'study-view-x-vs-y-chart-swap-axes.png'
        );
    });
});

test.describe.serial('study view editable breadcrumbs', () => {
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        // Ensure a clean default chart state
        const studyUrl = `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`;
        await goToUrlAndSetLocalStorage(page, studyUrl, true);
        await waitForNetworkQuiet(page);
        await page.locator(ADD_CHART_BUTTON).click();
        const resetVisible =
            (await page.locator('button:text-is("Reset charts")').count()) >
                0 &&
            (await page.locator('button:text-is("Reset charts")').isVisible());
        if (resetVisible) {
            await page.locator('button:text-is("Reset charts")').click();
            await expect(
                page.locator('.modal-content button:text-is("Confirm")')
            ).toBeVisible();
            await page
                .locator('.modal-content button:text-is("Confirm")')
                .click();
            await waitForNetworkQuiet(page);
        } else {
            // Close the dropdown without resetting
            await page.locator(ADD_CHART_BUTTON).click();
        }
    });

    test.afterAll(async () => {
        // The setDropdownOpen helper polls dropdown visibility while
        // toggling ADD_CHART_BUTTON, but the toggle can race a flicker
        // and trip "Couldn't open dropdown" — retry the toggle manually
        // until the Reset Charts button actually paints.
        await expect(page.locator(ADD_CHART_BUTTON)).toBeVisible({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        for (let attempt = 0; attempt < 5; attempt++) {
            const isOpen =
                (await page.locator('button:text-is("Reset charts")').count()) >
                    0 &&
                (await page
                    .locator('button:text-is("Reset charts")')
                    .isVisible());
            if (isOpen) break;
            await page.locator(ADD_CHART_BUTTON).click();
            await page.waitForTimeout(1000);
        }
        await page.locator('button:text-is("Reset charts")').click();
        await expect(
            page.locator('.modal-content button:text-is("Confirm")')
        ).toBeVisible();
        await page.locator('.modal-content button:text-is("Confirm")').click();
        await page.waitForTimeout(4000);
        await waitForNetworkQuiet(page);
        await page.close();
    });

    test('breadcrumbs are editable for mutation count chart', async () => {
        const url = `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay#filterJson={"clinicalDataFilters":[{"attributeId":"MUTATION_COUNT","values":[{"start":15,"end":20},{"start":20,"end":25},{"start":25,"end":30},{"start":30,"end":35},{"start":35,"end":40},{"start":40,"end":45}]}],"studyIds":["lgg_ucsf_2014_test_generic_assay"],"alterationFilter":{"copyNumberAlterationEventTypes":{"AMP":true,"HOMDEL":true},"mutationEventTypes":{"any":true},"structuralVariants":null,"includeDriver":true,"includeVUS":true,"includeUnknownOncogenicity":true,"includeUnknownTier":true,"includeGermline":true,"includeSomatic":true,"includeUnknownStatus":true,"tiersBooleanMap":{}}}`;
        await goToUrlAndSetLocalStorage(page, url, true);
        await waitForNetworkQuiet(page);
        await expect(page.locator('.userSelections')).toBeVisible();

        const element = page.locator('.userSelections span:text-is("15")');
        // ArrowRight, ArrowRight, Backspace, Backspace, "13"
        await element.click();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.type('13');
        await page.keyboard.press('Enter');

        await waitForNetworkQuiet(page);
        await page.waitForTimeout(1000);

        await expectElementScreenshot(
            page,
            '#mainColumn',
            'study-view-editable-breadcrumbs.png'
        );
    });
});
