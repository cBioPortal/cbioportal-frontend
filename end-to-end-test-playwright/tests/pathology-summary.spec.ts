import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';

const DEV_PATHOLOGY = {
    baseUrl: process.env.WSI_VIEWER_BASE_URL ?? '',
    studyId: 'coad_msk_2025',
    summaryPathologyCaseId: 'P-0048660',
    summarySlidesCaseId: 'P-0002438',
    clinicalCaseId: 'P-0023443',
    unmatchedCaseId: 'P-0002438',
} as const;

function requireDevPathology() {
    test.skip(
        !DEV_PATHOLOGY.baseUrl,
        'WSI_VIEWER_BASE_URL not set — skipping pathology dev-server e2e tests'
    );
}

function devUrl(path: string) {
    return `${DEV_PATHOLOGY.baseUrl}${path}`;
}

async function readPathologyClinicalRows(page: Page) {
    return await page.evaluate(() => {
        const table = Array.from(document.querySelectorAll('table')).find(
            candidate => {
                const headerCells = Array.from(
                    candidate.querySelectorAll(
                        'tr:first-child th, tr:first-child td'
                    )
                ).map(cell =>
                    (cell.textContent || '').trim().replace(/\s+/g, ' ')
                );

                return (
                    headerCells[0] === 'DATE (DAYS)' &&
                    headerCells[1] === 'SAMPLE' &&
                    headerCells[2] === 'MATCH' &&
                    headerCells[3] === 'SPECIMEN' &&
                    headerCells[4] === 'SLIDE TYPE' &&
                    headerCells[5] === 'SLIDES' &&
                    headerCells[6] === 'LINKOUT'
                );
            }
        );

        if (!table) {
            return [];
        }

        return Array.from(table.querySelectorAll('tr'))
            .map(row => {
                const cells = Array.from(row.querySelectorAll('th,td')).map(
                    cell =>
                        (cell.textContent || '').trim().replace(/\s+/g, ' ')
                );
                const link = row.querySelector('a');
                return {
                    cells,
                    href: link?.getAttribute('href') || '',
                };
            })
            .filter(row => row.cells[0] !== 'DATE (DAYS)');
    });
}

function extractViewableCount(slidesCell: string): number | null {
    const match = slidesCell.match(/\((\d+)\s+viewable\)/i);
    return match ? Number(match[1]) : null;
}

test.describe('pathology summary and clinical-data surfaces', () => {
    test.beforeEach(async () => {
        requireDevPathology();
    });

    test('summary timeline renders pathology slide tracks under the pathology group when no backend clinical events are present', async ({
        page,
    }) => {
        await page.goto(
            devUrl(
                `/patient/summary?studyId=${DEV_PATHOLOGY.studyId}&caseId=${DEV_PATHOLOGY.summaryPathologyCaseId}`
            )
        );

        await expect(page.locator('.tl-timeline-svg')).toBeVisible({
            timeout: 30000,
        });

        const labels = page.locator('.tl-timeline-tracklabels');
        await expect(labels.getByText(/^PATHOLOGY$/i)).toBeVisible();
        await expect(labels.getByText(/^Slides$/i)).toBeVisible();
    });

    test('summary timeline renders a pathology slides subgroup when slide events are present', async ({
        page,
    }) => {
        await page.goto(
            devUrl(
                `/patient/summary?studyId=${DEV_PATHOLOGY.studyId}&caseId=${DEV_PATHOLOGY.summarySlidesCaseId}`
            )
        );

        await expect(page.locator('.tl-timeline-svg')).toBeVisible({
            timeout: 30000,
        });

        const labels = page.locator('.tl-timeline-tracklabels');
        await expect(labels.getByText(/^PATHOLOGY$/i)).toBeVisible();
        await expect(labels.getByText(/^Slides$/i)).toBeVisible({
            timeout: 15000,
        });
    });

    test('patient summary omits raw WSI implementation attributes from the top sample summary when no sample chips are rendered', async ({
        page,
    }) => {
        await page.goto(
            devUrl(
                `/patient/summary?studyId=${DEV_PATHOLOGY.studyId}&caseId=${DEV_PATHOLOGY.clinicalCaseId}`
            )
        );

        await expect(
            page.locator('[data-test="patientSamplesClinicalSpans"]')
        ).toHaveCount(0);
        await expect(page.locator('body')).not.toContainText(/HAS WSI SLIDE/i);
        await expect(page.locator('body')).not.toContainText(/WSI TIMEPOINT/i);
        await expect(page.locator('body')).not.toContainText(
            /WSI SLIDE DATE/i
        );
    });

    test('clinical data page hides raw sample-level WSI attributes', async ({
        page,
    }) => {
        await page.goto(
            devUrl(
                `/patient/clinicalData?studyId=${DEV_PATHOLOGY.studyId}&caseId=${DEV_PATHOLOGY.clinicalCaseId}`
            )
        );

        await expect(page.locator('body')).toContainText(/Pathology slides/i, {
            timeout: 30000,
        });
        await expect(page.locator('body')).not.toContainText(/Has WSI Slide/i);
        await expect(page.locator('body')).not.toContainText(/WSI Timepoint/i);
        await expect(page.locator('body')).not.toContainText(
            /WSI Slide Date/i
        );
    });

    test('clinical data pathology rows omit linkouts for non-viewable unmatched slides', async ({
        page,
    }) => {
        await page.goto(
            devUrl(
                `/patient/clinicalData?studyId=${DEV_PATHOLOGY.studyId}&caseId=${DEV_PATHOLOGY.unmatchedCaseId}`
            )
        );

        await expect(page.locator('body')).toContainText(/Pathology slides/i, {
            timeout: 30000,
        });

        const pathologyRows = await readPathologyClinicalRows(page);

        const unmatchedRows = pathologyRows.filter(
            row => row.cells[1] === 'Unmatched' && row.cells[2] === 'Unmatched'
        );

        expect(unmatchedRows.length).toBeGreaterThan(0);

        const unmatchedViewableRows = unmatchedRows.filter(row =>
            /viewable/i.test(row.cells[5] || '')
        );
        const unmatchedNonViewableRows = unmatchedRows.filter(
            row => !/viewable/i.test(row.cells[5] || '')
        );

        expect(unmatchedViewableRows.length).toBeGreaterThan(0);
        expect(unmatchedNonViewableRows.length).toBeGreaterThan(0);
        expect(unmatchedViewableRows.some(row => !!row.href)).toBe(true);
        expect(unmatchedNonViewableRows.every(row => !row.href)).toBe(true);
    });

    test('clinical data unmatched viewable pathology rows link to unmatched viewer state without sampleId', async ({
        page,
    }) => {
        await page.goto(
            devUrl(
                `/patient/clinicalData?studyId=${DEV_PATHOLOGY.studyId}&caseId=${DEV_PATHOLOGY.unmatchedCaseId}`
            )
        );

        await expect(page.locator('body')).toContainText(/Pathology slides/i, {
            timeout: 30000,
        });

        const unmatchedHref =
            (
                await readPathologyClinicalRows(page)
            ).find(
                row =>
                    row.cells[1] === 'Unmatched' &&
                    row.cells[2] === 'Unmatched' &&
                    /viewable/i.test(row.cells[5] || '') &&
                    !!row.href
            )?.href || null;

        expect(unmatchedHref).toBeTruthy();
        expect(unmatchedHref).toContain('matchLevel=Unmatched');
        expect(unmatchedHref).toContain('specimenKey=');
        expect(unmatchedHref).not.toContain('sampleId=');

        await page.goto(devUrl(unmatchedHref!));
        await expect(
            page.locator('[data-testid="wsi-match-filter-unmatched"]')
        ).toHaveClass(/btn-primary/, { timeout: 30000 });
    });

    test('clinical data pathology viewable counts match the rendered pathology slides tab results', async ({
        page,
    }) => {
        await page.goto(
            devUrl(
                `/patient/clinicalData?studyId=${DEV_PATHOLOGY.studyId}&caseId=${DEV_PATHOLOGY.unmatchedCaseId}`
            )
        );

        await expect(page.locator('body')).toContainText(/Pathology slides/i, {
            timeout: 30000,
        });

        const rows = (await readPathologyClinicalRows(page))
            .map(row => ({
                href: row.href,
                sample: row.cells[1] || '',
                match: row.cells[2] || '',
                specimen: row.cells[3] || '',
                subtype: row.cells[4] || '',
                slides: row.cells[5] || '',
                viewableCount: extractViewableCount(row.cells[5] || ''),
            }))
            .filter(
                row =>
                    row.href &&
                    row.viewableCount !== null &&
                    row.viewableCount > 0
            );

        expect(rows.length).toBeGreaterThan(0);

        for (const row of rows) {
            await page.goto(devUrl(row.href));
            await expect(
                page.locator('[data-testid="wsi-share-button"]')
            ).toBeVisible({ timeout: 30000 });
            await expect(
                page.locator('[data-testid^="wsi-slide-item-"]').first()
            ).toBeVisible({ timeout: 30000 });

            const renderedCount = await page.locator(
                '[data-testid^="wsi-slide-item-"]'
            ).count();

            expect(renderedCount).toBe(row.viewableCount);
        }
    });

    test('pathology slides tab exposes block, part, and unmatched match filters', async ({
        page,
    }) => {
        await page.goto(
            devUrl(
                `/patient/wsiHESlides?studyId=${DEV_PATHOLOGY.studyId}&caseId=${DEV_PATHOLOGY.unmatchedCaseId}`
            )
        );

        await expect(
            page.locator('[data-testid="wsi-share-button"]')
        ).toBeVisible({ timeout: 30000 });

        await expect(
            page.locator('[data-testid="wsi-match-filter-all"]')
        ).toBeVisible();
        await expect(
            page.locator('[data-testid="wsi-match-filter-part"]')
        ).toBeVisible();
        await expect(
            page.locator('[data-testid="wsi-match-filter-block"]')
        ).toBeVisible();
        await expect(
            page.locator('[data-testid="wsi-match-filter-unmatched"]')
        ).toBeVisible();

        await expect(
            page.locator('[data-testid="wsi-match-filter-unmatched"]')
        ).toBeEnabled();
    });

    test('pathology viewer metadata sidebar shows specimen and match details for matched slides', async ({
        page,
    }) => {
        await page.goto(
            devUrl(
                `/patient/wsiHESlides?studyId=${DEV_PATHOLOGY.studyId}&caseId=${DEV_PATHOLOGY.summaryPathologyCaseId}`
            )
        );
 
        const sidebar = page.locator('[data-testid="wsi-metadata-sidebar"]');
        await expect(
            page.locator('[data-testid="wsi-share-button"]')
        ).toBeVisible({ timeout: 30000 });
        await expect(sidebar).toBeVisible();
 
        await expect(sidebar).toContainText(/Pathology/i);
        await expect(sidebar).toContainText(/Specimen/i);
        await expect(sidebar).toContainText(/Match/i);
        await expect(sidebar).toContainText(/Part-matched|Block-matched/i);
    });

    test('pathology viewer slide nav shows procedure-relative dates and match badges without legacy seq dates', async ({
        page,
    }) => {
        await page.goto(
            devUrl(
                `/patient/wsiHESlides?studyId=${DEV_PATHOLOGY.studyId}&caseId=${DEV_PATHOLOGY.unmatchedCaseId}`
            )
        );

        await expect(
            page.locator('[data-testid="wsi-share-button"]')
        ).toBeVisible({ timeout: 30000 });

        const slideItems = page.locator('[data-testid^="wsi-slide-item-"]');
        await expect(slideItems.first()).toBeVisible();

        await expect(page.locator('body')).toContainText(/Proc d/i);
        await expect(page.locator('body')).not.toContainText(/Seq d-/i);
        await expect(
            page.locator('[data-testid^="wsi-slide-match-badge-"]').first()
        ).toBeVisible();
    });
});
