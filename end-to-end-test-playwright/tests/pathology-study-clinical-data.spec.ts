import { test, expect, Page } from '../fixtures';
import { ensureLocalLogin } from './local/helpers';

const DEV_STUDY = {
    baseUrl: process.env.WSI_VIEWER_BASE_URL ?? '',
    studyId: process.env.WSI_LIVE_STUDY_ID ?? 'msk_spectrum_tme_2022',
} as const;
const MSKIMPACT_BASE_URL = process.env.MSKIMPACT_BASE_URL ?? '';

function requireDevStudy() {
    test.skip(
        !DEV_STUDY.baseUrl,
        'WSI_VIEWER_BASE_URL not set — skipping dev-study pathology e2e tests'
    );
}

function studyClinicalDataUrl() {
    return `${DEV_STUDY.baseUrl}/study/clinicalData?id=${DEV_STUDY.studyId}`;
}

async function waitForClinicalDataTable(page: Page) {
    await expect(
        page.locator('[data-test="clinical-data-tab-content"] table')
    ).toBeVisible({ timeout: 30000 });
}

async function clickColumnsButton(page: Page) {
    await page
        .locator('[data-test="clinical-data-tab-content"] button', {
            hasText: 'Columns',
        })
        .click();
}

async function toggleColumn(page: Page, columnId: string) {
    await page.locator(`[data-id="${columnId}"]`).click();
}

async function getVisibleHeaderNames(page: Page): Promise<string[]> {
    return page
        .locator('[data-test="clinical-data-tab-content"] thead th')
        .evaluateAll(headers =>
            headers
                .map(header => (header.textContent || '').trim())
                .filter(Boolean)
        );
}

async function getColumnValuesByHeader(
    page: Page,
    headerName: string
): Promise<string[]> {
    return page.evaluate(targetHeader => {
        const table = document.querySelector(
            '[data-test="clinical-data-tab-content"] table'
        );
        if (!table) {
            return [];
        }

        const headers = Array.from(table.querySelectorAll('thead th')).map(th =>
            (th.textContent || '').trim()
        );
        const index = headers.findIndex(header => header === targetHeader);
        if (index < 0) {
            return [];
        }

        return Array.from(table.querySelectorAll('tbody tr'))
            .map(row => {
                const cell = row.querySelectorAll('td')[index];
                return (cell?.textContent || '').trim();
            })
            .filter(Boolean);
    }, headerName);
}

function parseLeadingIntegers(values: string[]): number[] {
    return values
        .map(value => {
            const match = value.match(/^-?\d+/);
            return match ? Number(match[0]) : NaN;
        })
        .filter(value => Number.isFinite(value));
}

function isNonIncreasing(values: number[]): boolean {
    for (let index = 1; index < values.length; index += 1) {
        if (values[index] > values[index - 1]) {
            return false;
        }
    }
    return true;
}

function isNonDecreasing(values: number[]): boolean {
    for (let index = 1; index < values.length; index += 1) {
        if (values[index] < values[index - 1]) {
            return false;
        }
    }
    return true;
}

async function showAllLimitedClinicalRows(page: Page) {
    const showMore = page.locator(
        '[data-test="clinical-data-tab-content"] #showMoreButton'
    );
    for (let attempt = 0; attempt < 10; attempt += 1) {
        if (await showMore.isDisabled()) {
            return;
        }
        await showMore.click();
    }
    throw new Error('Clinical data Show more button did not become disabled');
}

async function sortColumnDescending(page: Page, headerName: string) {
    const header = page.locator(`[data-test="${headerName}"]`);

    for (let attempt = 0; attempt < 3; attempt += 1) {
        await header.click();
        try {
            await expect
                .poll(
                    async () => {
                        const values = parseLeadingIntegers(
                            await getColumnValuesByHeader(page, headerName)
                        );
                        return values.length > 0 && isNonIncreasing(values);
                    },
                    { timeout: 3000 }
                )
                .toBe(true);
            return;
        } catch (error) {
            if (attempt === 2) {
                throw error;
            }
        }
    }
}

test.describe('study clinical data pathology columns', () => {
    test.beforeEach(async ({ page }) => {
        requireDevStudy();
        await ensureLocalLogin(page, DEV_STUDY.baseUrl);
    });

    test('exposes WSI slide columns through column visibility and sorts by WSI Slides per Patient', async ({
        page,
    }) => {
        await page.goto(studyClinicalDataUrl());
        await waitForClinicalDataTable(page);

        const initialHeaders = await getVisibleHeaderNames(page);
        expect(initialHeaders).toContain('WSI Slides per Patient');
        expect(initialHeaders).not.toContain(
            'WSI Slides per Patient, Part-matched'
        );
        expect(initialHeaders).not.toContain(
            'WSI Slides per Patient, Block-matched'
        );

        await clickColumnsButton(page);
        await toggleColumn(page, 'WSI Slides per Patient, Part-matched');
        await toggleColumn(page, 'WSI Slides per Patient, Block-matched');
        await clickColumnsButton(page);

        await expect(
            page.locator('[data-test="WSI Slides per Patient"]')
        ).toBeVisible();
        await expect(
            page.locator('[data-test="WSI Slides per Patient, Part-matched"]')
        ).toBeVisible();
        await expect(
            page.locator('[data-test="WSI Slides per Patient, Block-matched"]')
        ).toBeVisible();

        const beforeSort = parseLeadingIntegers(
            await getColumnValuesByHeader(page, 'WSI Slides per Patient')
        );
        expect(beforeSort.length).toBeGreaterThan(0);

        await sortColumnDescending(page, 'WSI Slides per Patient');
        await sortColumnDescending(
            page,
            'WSI Slides per Patient, Part-matched'
        );
        await sortColumnDescending(
            page,
            'WSI Slides per Patient, Block-matched'
        );
    });
});

test.describe('private MSK-IMPACT clinical data sorting', () => {
    test.beforeEach(async ({ page }) => {
        test.skip(
            !MSKIMPACT_BASE_URL,
            'MSKIMPACT_BASE_URL not set — skipping private cohort sorting test'
        );
        await ensureLocalLogin(page, MSKIMPACT_BASE_URL);
    });

    test('keeps the filtered cohort total when sorting WSI slides in either direction', async ({
        page,
    }) => {
        const filterJson = encodeURIComponent(
            JSON.stringify({
                clinicalDataFilters: [
                    {
                        attributeId: 'CANCER_TYPE',
                        values: [{ value: 'Colorectal Cancer' }],
                    },
                ],
            })
        );
        await page.goto(
            `${MSKIMPACT_BASE_URL}/study/clinicalData?id=mskimpact#filterJson=${filterJson}`
        );
        await waitForClinicalDataTable(page);

        const resultCount = page
            .locator('[data-test="clinical-data-tab-content"] strong')
            .filter({ hasText: /^\d+ results$/ });
        await expect(resultCount).toBeVisible();
        const filteredResultText = (await resultCount.innerText()).trim();
        expect(Number.parseInt(filteredResultText, 10)).toBeGreaterThan(500);

        const headerCell = page
            .locator('[data-test="clinical-data-tab-content"] th')
            .filter({
                has: page.locator('[data-test="WSI Slides per Patient"]'),
            });
        const sortButton = headerCell.locator('span[role="button"]');
        const waitForSortedTable = () =>
            page.waitForResponse(
                response =>
                    response.ok() &&
                    response.request().method() === 'POST' &&
                    response.url().includes('/api/clinical-data-table/fetch')
            );

        const descendingResponse = waitForSortedTable();
        await sortButton.click();
        await descendingResponse;
        await expect(sortButton).toHaveClass(/sort-des/);
        await expect
            .poll(async () => {
                const values = parseLeadingIntegers(
                    await getColumnValuesByHeader(
                        page,
                        'WSI Slides per Patient'
                    )
                );
                return values.length > 0 && isNonIncreasing(values);
            })
            .toBe(true);
        await expect(resultCount).toHaveText(filteredResultText);
        await showAllLimitedClinicalRows(page);
        await expect(
            page.getByText("You've reached the maximum viewable records.")
        ).toBeVisible();

        const ascendingResponse = waitForSortedTable();
        await sortButton.click();
        await ascendingResponse;
        await expect(sortButton).toHaveClass(/sort-asc/);
        await expect
            .poll(async () => {
                const values = parseLeadingIntegers(
                    await getColumnValuesByHeader(
                        page,
                        'WSI Slides per Patient'
                    )
                );
                return values.length > 0 && isNonDecreasing(values);
            })
            .toBe(true);
        await expect(resultCount).toHaveText(filteredResultText);
        await showAllLimitedClinicalRows(page);
        await expect(
            page.getByText("You've reached the maximum viewable records.")
        ).toBeVisible();
    });
});
