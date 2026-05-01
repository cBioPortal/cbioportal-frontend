// Source: end-to-end-test/local/specs/virtual-study.spec.js
import { test, expect, Page } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');
const studyEs0Summary = CBIOPORTAL_URL + '/study/summary?id=study_es_0';

test.describe.serial('Virtual Study life cycle', () => {
    const vsTitle = 'Test VS ' + Date.now();
    let vsId: string | undefined;
    const X_PUBLISHER_API_KEY = 'SECRETKEY';
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('Login and navigate to the study_es_0 study summary page', async () => {
        await goToUrlAndSetLocalStorage(page, studyEs0Summary, true);
    });

    test('Click Share Virtual Study button', async () => {
        const shareVSBtn = page.locator(
            '.studyView button[data-tour="action-button-bookmark"]'
        );
        await expect(shareVSBtn).toBeVisible();
        await shareVSBtn.click();
    });

    test('Provide the title and save', async () => {
        const modalDialog = page.locator('.modal-dialog');
        await expect(modalDialog).toBeVisible();
        await modalDialog.locator('input#sniglet').fill(vsTitle);
        await modalDialog
            .locator('[data-tour="virtual-study-summary-save-btn"]')
            .click();
        await expect(modalDialog.locator('.text-success')).toBeVisible();
        const link = await modalDialog
            .locator('input[type="text"]')
            .inputValue();
        expect(link.startsWith('http')).toBe(true);
        const params = link.split('?')[1].split('&');
        const idEntry = params
            .map((paramEqValue: string) => paramEqValue.split('='))
            .find(([key]: string[]) => key === 'id');
        vsId = idEntry ? idEntry[1] : undefined;
        expect(vsId).toBeTruthy();
    });

    test('See the VS in My Virtual Studies section on the landing page', async () => {
        await goToUrlAndSetLocalStorage(page, CBIOPORTAL_URL, true);
        const vsSection = page
            .locator(`xpath=//*[text()="${vsTitle}"]/ancestor::ul[1]`)
            .first();
        await expect(vsSection).toBeVisible();
        const sectionTitle = vsSection.locator('li label span');
        expect(await sectionTitle.innerText()).toBe('My Virtual Studies');
    });

    test('Publish the VS', async () => {
        const result = await page.evaluate(
            async ({
                cbioUrl,
                vsIdInner,
                key,
            }: {
                cbioUrl: string;
                vsIdInner: string;
                key: string;
            }) => {
                const url =
                    cbioUrl + '/api/public_virtual_studies/' + vsIdInner;
                const headers = new Headers();
                headers.append('X-PUBLISHER-API-KEY', key);
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers,
                    });
                    return {
                        success: response.ok,
                        message: 'HTTP Status: ' + response.status,
                    };
                } catch (error) {
                    return {
                        success: false,
                        message: (error as Error).message,
                    };
                }
            },
            {
                cbioUrl: CBIOPORTAL_URL,
                vsIdInner: vsId!,
                key: X_PUBLISHER_API_KEY,
            }
        );
        expect(result.success, result.message).toBe(true);
    });

    test('See the VS in Public Virtual Studies section on the landing page', async () => {
        await goToUrlAndSetLocalStorage(page, CBIOPORTAL_URL, true);
        const vsSection = page
            .locator(`xpath=//*[text()="${vsTitle}"]/ancestor::ul[1]`)
            .first();
        await expect(vsSection).toBeVisible();
        const sectionTitle = vsSection.locator('li label span');
        expect(await sectionTitle.innerText()).toBe('Public Virtual Studies');
    });

    test('Re-publish the VS specifying PubMed ID and type of cancer', async () => {
        const result = await page.evaluate(
            async ({
                cbioUrl,
                vsIdInner,
                key,
            }: {
                cbioUrl: string;
                vsIdInner: string;
                key: string;
            }) => {
                const headers = new Headers();
                headers.append('X-PUBLISHER-API-KEY', key);
                try {
                    const response = await fetch(
                        cbioUrl +
                            '/api/public_virtual_studies/' +
                            vsIdInner +
                            '?pmid=28783718&typeOfCancerId=aca',
                        { method: 'POST', headers }
                    );
                    return {
                        success: response.ok,
                        message: 'HTTP Status: ' + response.status,
                    };
                } catch (error) {
                    return {
                        success: false,
                        message: (error as Error).message,
                    };
                }
            },
            {
                cbioUrl: CBIOPORTAL_URL,
                vsIdInner: vsId!,
                key: X_PUBLISHER_API_KEY,
            }
        );
        expect(result.success, result.message).toBe(true);
    });

    test('See the VS in the Adrenocortical Adenoma section with PubMed link', async () => {
        await goToUrlAndSetLocalStorage(page, CBIOPORTAL_URL, true);
        const vsRow = page.locator(
            `xpath=//*[text()="${vsTitle}"]/ancestor::li[1]`
        );
        const vsSection = vsRow.locator('xpath=..');
        await expect(vsSection).toBeVisible();
        const sectionTitle = vsSection.locator('li label span');
        expect(await sectionTitle.innerText()).toBe('Adrenocortical Adenoma');
        await expect(vsRow.locator('.fa-book')).toBeAttached();
    });

    test('Un-publish the VS', async () => {
        const result = await page.evaluate(
            async ({
                cbioUrl,
                vsIdInner,
                key,
            }: {
                cbioUrl: string;
                vsIdInner: string;
                key: string;
            }) => {
                const headers = new Headers();
                headers.append('X-PUBLISHER-API-KEY', key);
                try {
                    const response = await fetch(
                        cbioUrl + '/api/public_virtual_studies/' + vsIdInner,
                        { method: 'DELETE', headers }
                    );
                    return {
                        success: response.ok,
                        message: 'HTTP Status: ' + response.status,
                    };
                } catch (error) {
                    return {
                        success: false,
                        message: (error as Error).message,
                    };
                }
            },
            {
                cbioUrl: CBIOPORTAL_URL,
                vsIdInner: vsId!,
                key: X_PUBLISHER_API_KEY,
            }
        );
        expect(result.success, result.message).toBe(true);
    });

    test('Removing the VS', async () => {
        await goToUrlAndSetLocalStorage(page, CBIOPORTAL_URL, true);
        const vsRow = page.locator(
            `xpath=//*[text()="${vsTitle}"]/ancestor::li[1]`
        );
        await expect(vsRow).toBeVisible();
        await vsRow.locator('.fa-trash').click();
    });

    test('The VS disappears from the landing page', async () => {
        await goToUrlAndSetLocalStorage(page, CBIOPORTAL_URL, true);
        await expect(
            page.locator('[data-test="cancerTypeListContainer"]')
        ).toBeVisible();
        const vsRowTitle = page.locator(`xpath=//*[text()="${vsTitle}"]`);
        await page.waitForTimeout(100);
        await expect(vsRowTitle).toHaveCount(0);
    });
});
