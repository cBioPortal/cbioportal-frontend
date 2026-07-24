import { test, expect, Page } from '../fixtures';

const DEV_STUDY = {
    baseUrl: process.env.WSI_VIEWER_BASE_URL ?? '',
    studyId: 'coad_msk_2025',
} as const;

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

test.describe('study clinical data pathology columns', () => {
    test.beforeEach(async () => {
        requireDevStudy();
    });

    test('exposes WSI slide columns through column visibility and sorts by WSI Slides', async ({
        page,
    }) => {
        await page.goto(studyClinicalDataUrl());
        await waitForClinicalDataTable(page);

        const initialHeaders = await getVisibleHeaderNames(page);
        expect(initialHeaders).toContain('WSI Slides');
        expect(initialHeaders).not.toContain('WSI Slides, Part-matched');
        expect(initialHeaders).not.toContain('WSI Slides, Block-matched');

        await clickColumnsButton(page);
        await toggleColumn(page, 'WSI Slides, Part-matched');
        await toggleColumn(page, 'WSI Slides, Block-matched');
        await clickColumnsButton(page);

        await expect(page.locator('[data-test="WSI Slides"]')).toBeVisible();
        await expect(
            page.locator('[data-test="WSI Slides, Part-matched"]')
        ).toBeVisible();
        await expect(
            page.locator('[data-test="WSI Slides, Block-matched"]')
        ).toBeVisible();

        const beforeSort = parseLeadingIntegers(
            await getColumnValuesByHeader(page, 'WSI Slides')
        );
        expect(beforeSort.length).toBeGreaterThan(0);

        const wsiSlidesHeader = page.locator('[data-test="WSI Slides"]');
        await wsiSlidesHeader.click();
        await wsiSlidesHeader.click();

        await expect
            .poll(async () => {
                const values = parseLeadingIntegers(
                    await getColumnValuesByHeader(page, 'WSI Slides')
                );
                return values.length > 0 && isNonIncreasing(values);
            })
            .toBe(true);

        const partMatchedHeader = page.locator(
            '[data-test="WSI Slides, Part-matched"]'
        );
        await partMatchedHeader.click();
        await partMatchedHeader.click();
        await expect
            .poll(async () => {
                const values = parseLeadingIntegers(
                    await getColumnValuesByHeader(
                        page,
                        'WSI Slides, Part-matched'
                    )
                );
                return values.length > 0 && isNonIncreasing(values);
            })
            .toBe(true);

        const blockMatchedHeader = page.locator(
            '[data-test="WSI Slides, Block-matched"]'
        );
        await blockMatchedHeader.click();
        await blockMatchedHeader.click();
        await expect
            .poll(async () => {
                const values = parseLeadingIntegers(
                    await getColumnValuesByHeader(
                        page,
                        'WSI Slides, Block-matched'
                    )
                );
                return values.length > 0 && isNonIncreasing(values);
            })
            .toBe(true);
    });
});
