// Source: end-to-end-test/local/specs/core/querypage.spec.js
import { expect } from '@playwright/test';
import { test } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';
import { setInputText } from '../helpers/common';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

test.describe('study select page', () => {
    test.describe('study search box', () => {
        const searchTextInput = '[data-test=study-search-input]';
        const searchControlsMenu =
            '[data-test=study-search-controls-container]';
        const referenceGenomeFormSection = '//h5[text()="Reference genome"]';
        const hg38StudyEntry = '//span[text()="Study HG38"]';
        const hg38Checkbox = '#input-hg38';

        // Mirrors the wdio describe.serial: tests in this block share the
        // study-list state (the hg38 filter from the previous test
        // persists into the next). Use a single page across all tests in
        // this describe and serialize.
        test.describe.configure({ mode: 'serial' });

        let sharedPage: import('@playwright/test').Page;

        test.beforeAll(async ({ browser }) => {
            sharedPage = await browser.newPage();
            await goToUrlAndSetLocalStorage(sharedPage, CBIOPORTAL_URL, true);
            await sharedPage
                .locator('[data-test=cancerTypeListContainer]')
                .waitFor({ state: 'attached' });
            // NOTE Somehow, we need to reload to load the external frontend.
            await goToUrlAndSetLocalStorage(sharedPage, CBIOPORTAL_URL, true);
            await sharedPage
                .locator('[data-test=cancerTypeListContainer]')
                .waitFor({ state: 'attached' });
        });

        test.afterAll(async () => {
            await sharedPage.close();
        });

        test('shows menu when focussing the text input', async () => {
            await expect(
                sharedPage.locator(searchControlsMenu)
            ).not.toBeVisible();
            await sharedPage.locator(searchTextInput).click();
            await expect(sharedPage.locator(searchControlsMenu)).toBeVisible();
        });

        test.describe('reference genome', () => {
            test('shows reference genome form elements when studies on different reference genomes are present', async () => {
                await expect(
                    sharedPage.locator(searchControlsMenu)
                ).toBeVisible();
                await expect(
                    sharedPage.locator(referenceGenomeFormSection)
                ).toBeVisible();
            });

            test('fills text input with search shorthand and filters studies when filtering studies via reference genome form element', async () => {
                await expect(
                    sharedPage.locator(referenceGenomeFormSection)
                ).toBeVisible();
                await expect(sharedPage.locator(hg38StudyEntry)).toBeVisible();
                await sharedPage.locator(hg38Checkbox).click();
                const textInSearchTextInput = await sharedPage
                    .locator(searchTextInput)
                    .inputValue();
                expect(textInSearchTextInput).toBe('reference-genome:hg19');
                await expect(
                    sharedPage.locator(hg38StudyEntry)
                ).not.toBeVisible();
            });

            test('updates reference genome form elements and study filter when entering search shorthand in text input', async () => {
                await sharedPage.locator('.input-group-btn').click();
                await sharedPage
                    .locator(referenceGenomeFormSection)
                    .waitFor({ state: 'attached' });
                await expect(
                    sharedPage.locator(referenceGenomeFormSection)
                ).toBeVisible();
                await expect(
                    sharedPage.locator(hg38StudyEntry)
                ).not.toBeVisible();
                await expect(
                    sharedPage.locator(hg38Checkbox)
                ).not.toBeChecked();
                await setInputText(sharedPage, searchTextInput, 'Study');
                await sharedPage
                    .locator(hg38StudyEntry)
                    .waitFor({ state: 'attached' });
                await expect(sharedPage.locator(hg38Checkbox)).toBeChecked();
            });
        });
    });
});
