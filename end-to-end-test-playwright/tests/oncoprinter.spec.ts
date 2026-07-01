import { test, expect, Page } from '../fixtures';
import {
    setOncoprintMutationsMenuOpen,
    waitForOncoprint,
} from './helpers/oncoprint';

/**
 * Port of end-to-end-test/remote/specs/core/oncoprinter.spec.js.
 *
 * Oncoprinter is the standalone oncoprint tool that accepts pasted
 * genomic data. These tests verify that the mutation annotation
 * controls correctly adapt to whether the input data includes custom
 * driver annotations.
 */

const DATA_WITHOUT_CUSTOM_DRIVER =
    'TCGA-25-2392-01 TP53 FUSION FUSION\nTCGA-04-1357-01 BRCA1 Q1538A MISSENSE';

async function submitExampleDataWithCustomDriver(page: Page) {
    await page.locator('.oncoprinterGeneticExampleData').waitFor({
        state: 'visible',
        timeout: 10000,
    });
    await page.locator('.oncoprinterGeneticExampleData').click();
    await expect(page.locator('.oncoprinterSubmit')).toBeEnabled({
        timeout: 10000,
    });
    await page.locator('.oncoprinterSubmit').click();
    await waitForOncoprint(page);

    await setOncoprintMutationsMenuOpen(page, true);
    await expect(
        page.locator('input[data-test="annotateOncoKb"]')
    ).not.toBeChecked();
    await expect(
        page.locator('input[data-test="annotateCustomBinary"]')
    ).toBeChecked();
}

async function submitDataWithoutCustomDriver(page: Page) {
    // Poke oncoprinter's input field directly via the global tool handle —
    // mirrors the wdio spec which bypassed the textarea for deterministic
    // input handling.
    await page.locator('.oncoprinterGeneticExampleData').waitFor({
        state: 'visible',
        timeout: 10000,
    });
    await page.evaluate(text => {
        (window as any).oncoprinterTool.onGeneticDataInputChange({
            currentTarget: { value: text },
        });
    }, DATA_WITHOUT_CUSTOM_DRIVER);
    await expect(page.locator('.oncoprinterSubmit')).toBeEnabled({
        timeout: 10000,
    });
    await page.locator('.oncoprinterSubmit').click();
    await waitForOncoprint(page);

    await setOncoprintMutationsMenuOpen(page, true);
    await expect(
        page.locator('input[data-test="annotateOncoKb"]')
    ).toBeChecked();
    await expect(
        page.locator('input[data-test="annotateCustomBinary"]')
    ).toHaveCount(0);
}

test.describe('oncoprinter', () => {
    test.describe('custom driver annotation', () => {
        test('only custom driver annotation is selected when input data includes one', async ({
            page,
        }) => {
            await page.goto('/oncoprinter');
            await submitExampleDataWithCustomDriver(page);
        });

        test('oncokb is selected and custom-driver button hidden when data has no custom driver', async ({
            page,
        }) => {
            await page.goto('/oncoprinter');
            await submitDataWithoutCustomDriver(page);
        });

        test('mutation annotation settings reset whenever oncoprint is submitted', async ({
            page,
        }) => {
            await page.goto('/oncoprinter');
            await submitExampleDataWithCustomDriver(page);
            await page.locator('.oncoprinterModifyInput').click();
            await submitDataWithoutCustomDriver(page);
        });
    });
});
