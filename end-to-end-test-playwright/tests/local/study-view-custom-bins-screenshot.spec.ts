// Source: end-to-end-test/local/specs/study-view-custom-bins.screenshot.spec.js
import { Page, expect } from '@playwright/test';
import { test } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';
import { expectElementScreenshot, setInputText } from '../helpers/common';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');
const studyViewUrl = `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`;
const MUTATION_COUNT_CHART = `div[data-test="chart-container-MUTATION_COUNT"]`;
const MUTATION_COUNT_HAMBURGER_ICON = `${MUTATION_COUNT_CHART} [data-test="chart-header-hamburger-icon"]`;
const MUTATION_COUNT_MENU = `${MUTATION_COUNT_CHART} [data-test="chart-header-hamburger-icon-menu"]`;
const CUSTOM_BINS_MENU = `.modal-dialog`;
const UPDATE_BUTTON = '.btn-sm';
const BIN_SIZE_INPUT = '[data-test=bin-size-input]';
const MIN_VALUE_INPUT = '[data-test=anchorvalue-input]';
const CUSTOM_BINS_TEXTAREA = '[data-test=custom-bins-textarea]';

async function jsApiHover(page: Page, selector: string) {
    await page.evaluate(sel => {
        const el = document.querySelector(sel);
        if (el)
            el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    }, selector);
}

async function openCustomBinsMenu(page: Page) {
    await expect(page.locator(MUTATION_COUNT_CHART)).toBeVisible();
    await jsApiHover(page, MUTATION_COUNT_CHART);

    await expect(page.locator(MUTATION_COUNT_HAMBURGER_ICON)).toBeVisible();
    await jsApiHover(page, MUTATION_COUNT_HAMBURGER_ICON);

    await expect(page.locator(MUTATION_COUNT_MENU)).toBeVisible();
    await page.locator(`${MUTATION_COUNT_MENU} a.dropdown-item`).click();

    await expect(page.locator(CUSTOM_BINS_MENU)).toBeVisible();
}

async function selectMenuOption(page: Page, label: string) {
    await page
        .locator(`${CUSTOM_BINS_MENU} label`, {
            hasText: new RegExp(`^${label}$`),
        })
        .click();
}

async function clickUpdate(page: Page) {
    await page.locator(`${CUSTOM_BINS_MENU} ${UPDATE_BUTTON}`).click();
}

test.describe('Custom Bins menu in study view chart header', () => {
    test.beforeEach(async ({ page }) => {
        await goToUrlAndSetLocalStorage(page, studyViewUrl, true);
        await openCustomBinsMenu(page);
    });

    test('creates quartiles bins', async ({ page }) => {
        await selectMenuOption(page, 'Quartiles');
        await clickUpdate(page);
        await page.mouse.move(0, 0);
        await expectElementScreenshot(
            page,
            MUTATION_COUNT_CHART,
            'creates-quartiles-bins.png'
        );
    });

    test('creates median split bins', async ({ page }) => {
        await selectMenuOption(page, 'Median split');
        await clickUpdate(page);
        await page.mouse.move(0, 0);
        await page.waitForTimeout(2000);
        await expectElementScreenshot(
            page,
            MUTATION_COUNT_CHART,
            'creates-median-split-bins.png'
        );
    });

    test('generates bins using min and bin size input fields', async ({
        page,
    }) => {
        await selectMenuOption(page, 'Generate bins');
        await page.locator(BIN_SIZE_INPUT).waitFor({ state: 'attached' });
        await setInputText(page, BIN_SIZE_INPUT, '2');
        await setInputText(page, MIN_VALUE_INPUT, '2');
        await clickUpdate(page);
        await page.mouse.move(0, 0);
        await expectElementScreenshot(
            page,
            MUTATION_COUNT_CHART,
            'generates-bins-using-min-and-bin-size-input-fields.png'
        );
    });

    test('creates custom bins using custom bins input field', async ({
        page,
    }) => {
        await selectMenuOption(page, 'Custom bins');
        await page.locator(CUSTOM_BINS_TEXTAREA).waitFor({ state: 'attached' });
        await setInputText(page, CUSTOM_BINS_TEXTAREA, '0,10,20,30,40');
        await clickUpdate(page);
        await page.mouse.move(0, 0);
        await expectElementScreenshot(
            page,
            MUTATION_COUNT_CHART,
            'creates-custom-bins-using-custom-bins-input-field.png'
        );
    });
});
