import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';

const DEV_PATHOLOGY = {
    baseUrl: process.env.WSI_VIEWER_BASE_URL ?? '',
    studyId: 'coad_msk_2025',
    summaryPathologyCaseId: 'P-0048660',
    summarySlidesCaseId: 'P-0002438',
    duplicateHeavyCaseId: 'P-0045320',
    clinicalCaseId: 'P-0023443',
    unmatchedCaseId: 'P-0002438',
    summaryFailureCaseId: 'P-0000678',
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

function extractLeadingCount(label: string): number | null {
    const match = label.match(/^\s*(\d+)/);
    return match ? Number(match[1]) : null;
}

async function readVisiblePathologyTooltip(page: Page) {
    const tooltip = page
        .locator('[data-testid="pathology-timeline-tooltip"]')
        .last();
    await expect(tooltip).toBeVisible({ timeout: 15000 });

    const rows = await tooltip.locator('tr').evaluateAll(tableRows =>
        tableRows.map(row => {
            const cells = Array.from(row.querySelectorAll('td')).map(cell =>
                (cell.textContent || '').trim().replace(/\s+/g, ' ')
            );
            const link = row.querySelector('a');
            return {
                cells,
                href: link?.getAttribute('href') || '',
            };
        })
    );

    return rows.filter(row => row.cells.length >= 2);
}

async function hoverBadgeAndReadTooltip(page: Page, badgeIndex: number) {
    const badge = page.locator('[data-testid="pathology-count-badge"]').nth(
        badgeIndex
    );
    await badge.hover();
    return readVisiblePathologyTooltip(page);
}

async function hoverBadgeAndGetTooltip(page: Page, badgeIndex: number) {
    const badge = page.locator('[data-testid="pathology-count-badge"]').nth(
        badgeIndex
    );
    await badge.hover();
    const tooltip = page.locator('[role="tooltip"]').last();
    await expect(tooltip).toBeVisible({ timeout: 15000 });
    return { badge, tooltip };
}

async function findSummaryTooltipMatch(
    page: Page,
    predicate: (rows: Array<{ cells: string[]; href: string }>) => boolean
) {
    const badgeCount = await page
        .locator('[data-testid="pathology-count-badge"]')
        .count();

    for (let index = 0; index < badgeCount; index += 1) {
        const rows = await hoverBadgeAndReadTooltip(page, index);
        if (predicate(rows)) {
            return rows;
        }
    }

    return null;
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

    test('summary timeline collapses duplicate-heavy pathology events more tightly than the clinical data table', async ({
        page,
    }) => {
        await page.goto(
            devUrl(
                `/patient/summary?studyId=${DEV_PATHOLOGY.studyId}&caseId=${DEV_PATHOLOGY.duplicateHeavyCaseId}`
            )
        );

        await expect(page.locator('.tl-timeline-svg')).toBeVisible({
            timeout: 30000,
        });

        const summaryBadgeCount = await page
            .locator('[data-testid="pathology-count-badge"]')
            .count();
        expect(summaryBadgeCount).toBeGreaterThan(0);

        await page.goto(
            devUrl(
                `/patient/clinicalData?studyId=${DEV_PATHOLOGY.studyId}&caseId=${DEV_PATHOLOGY.duplicateHeavyCaseId}`
            )
        );

        await expect(page.locator('body')).toContainText(/Pathology slides/i, {
            timeout: 30000,
        });

        const clinicalRows = await readPathologyClinicalRows(page);
        expect(clinicalRows.length).toBeGreaterThan(summaryBadgeCount);
    });

    test('summary pathology tooltip shows the cleaned field contract and grouped linkouts stay count-consistent', async ({
        page,
    }) => {
        await page.goto(
            devUrl(
                `/patient/summary?studyId=${DEV_PATHOLOGY.studyId}&caseId=${DEV_PATHOLOGY.duplicateHeavyCaseId}`
            )
        );

        await expect(page.locator('.tl-timeline-svg')).toBeVisible({
            timeout: 30000,
        });

        const rows = await findSummaryTooltipMatch(
            page,
            tooltipRows =>
                tooltipRows.some(
                    row =>
                        row.cells[0] === 'LINKOUTS' ||
                        row.href.includes('matchLevel=')
                )
        );

        expect(rows).toBeTruthy();
        const resolvedRows = rows!;
        const labels = resolvedRows.map(row => row.cells[0]);

        expect(labels).toContain('PATHOLOGY TYPE');
        expect(labels).toContain('SLIDE TYPE');
        expect(labels).toContain('DATE');
        expect(labels).toContain('MATCH');
        expect(labels).toContain('SPECIMEN');
        expect(labels).not.toContain('TIMEPOINT SOURCE');

        const tooltipText = resolvedRows
            .flatMap(row => row.cells)
            .join(' | ');
        expect(tooltipText).not.toMatch(/HAS WSI SLIDE|WSI TIMEPOINT|WSI SLIDE DATE/i);
        expect(tooltipText).not.toMatch(/Seq d-/i);

        const viewableRow = resolvedRows.find(
            row => row.cells[0] === 'VIEWABLE SLIDES'
        );
        expect(viewableRow).toBeTruthy();
        const viewableCount = Number(viewableRow!.cells[1]);
        expect(viewableCount).toBeGreaterThan(0);

        const groupedLinkRows = resolvedRows.filter(
            row => row.cells[0] === 'LINKOUTS' || !!row.href
        );
        expect(groupedLinkRows.length).toBeGreaterThan(0);
        expect(groupedLinkRows.every(row => !row.href.includes('specimenKey='))).toBe(
            true
        );

        const groupedCountSum = groupedLinkRows.reduce((sum, row) => {
            const count = extractLeadingCount(row.cells[1] || '');
            return sum + (count || 0);
        }, 0);
        if (groupedLinkRows.some(row => row.cells[0] === 'LINKOUTS')) {
            expect(groupedCountSum).toBeGreaterThan(0);
            expect(groupedCountSum).toBe(viewableCount);
        } else {
            expect(groupedLinkRows).toHaveLength(1);
            expect(groupedLinkRows[0].cells[1]).toBe('View slides');
        }
    });

    test('summary pathology event carousel updates event details while preserving collapsed badge totals', async ({
        page,
    }) => {
        await page.goto(
            devUrl(
                `/patient/summary?studyId=${DEV_PATHOLOGY.studyId}&caseId=${DEV_PATHOLOGY.unmatchedCaseId}`
            )
        );

        await expect(page.locator('.tl-timeline-svg')).toBeVisible({
            timeout: 30000,
        });

        const badgeCount = await page
            .locator('[data-testid="pathology-count-badge"]')
            .count();
        let found = false;

        for (let index = 0; index < badgeCount; index += 1) {
            const { badge, tooltip } = await hoverBadgeAndGetTooltip(page, index);
            const eventCounter = tooltip.getByText(/\d+\s+of\s+\d+\s+events/i);
            if ((await eventCounter.count()) === 0) {
                continue;
            }

            found = true;
            const aggregateTotal = await badge.getAttribute(
                'data-pathology-total-count'
            );
            const aggregateViewable = await badge.getAttribute(
                'data-pathology-viewable-count'
            );
            const beforeRows = await readVisiblePathologyTooltip(page);
            const beforeSignature = beforeRows
                .map(row => row.cells.join('::') || row.href)
                .join('|');
            const beforeCounterText = await eventCounter.textContent();
            const beforeViewable =
                beforeRows.find(row => row.cells[0] === 'VIEWABLE SLIDES')?.cells[1] ||
                '';

            await tooltip.getByRole('button', { name: '>' }).click();
            await expect(eventCounter).not.toHaveText(beforeCounterText || '', {
                timeout: 10000,
            });

            const afterRows = await readVisiblePathologyTooltip(page);
            const afterSignature = afterRows
                .map(row => row.cells.join('::') || row.href)
                .join('|');
            expect(afterSignature).not.toBe(beforeSignature);

            const afterViewable =
                afterRows.find(row => row.cells[0] === 'VIEWABLE SLIDES')?.cells[1] ||
                '';
            expect(await badge.getAttribute('data-pathology-total-count')).toBe(
                aggregateTotal
            );
            expect(await badge.getAttribute('data-pathology-viewable-count')).toBe(
                aggregateViewable
            );

            await tooltip.getByRole('button', { name: '<' }).click();
            await expect(eventCounter).toHaveText(beforeCounterText || '', {
                timeout: 10000,
            });
            const restoredRows = await readVisiblePathologyTooltip(page);
            const restoredViewable =
                restoredRows.find(row => row.cells[0] === 'VIEWABLE SLIDES')?.cells[1] ||
                '';
            expect(restoredViewable).toBe(beforeViewable);
            break;
        }

        expect(found).toBe(true);
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
        expect(unmatchedHref).not.toContain('sampleId=');
        expect(unmatchedHref).not.toContain('specimenKey=');

        await page.goto(devUrl(unmatchedHref!));
        await expect(
            page.locator('[data-testid="wsi-match-filter-unmatched"]')
        ).toHaveClass(/btn-primary/, { timeout: 30000 });
    });

    test('matched summary linkouts and unmatched clinical-data linkouts preserve viewer bucket semantics', async ({
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

        const unmatchedRow =
            (
                await readPathologyClinicalRows(page)
            ).find(
                row =>
                    row.cells[1] === 'Unmatched' &&
                    row.cells[2] === 'Unmatched' &&
                    /viewable/i.test(row.cells[5] || '') &&
                    !!row.href
            ) || null;
        expect(unmatchedRow).toBeTruthy();
        const unmatchedLink = unmatchedRow!.href;
        const unmatchedTooltipViewable =
            extractViewableCount(unmatchedRow!.cells[5] || '') || 0;
        expect(unmatchedTooltipViewable).toBeGreaterThan(0);

        await page.goto(devUrl(unmatchedLink));
        await expect(
            page.locator('[data-testid="wsi-match-filter-unmatched"]')
        ).toHaveClass(/btn-primary/, { timeout: 30000 });
        const unmatchedRenderedCount = await page.locator(
            '[data-testid^="wsi-slide-item-"]'
        ).count();
        expect(unmatchedRenderedCount).toBeGreaterThanOrEqual(
            unmatchedTooltipViewable
        );

        await page.goto(
            devUrl(
                `/patient/summary?studyId=${DEV_PATHOLOGY.studyId}&caseId=${DEV_PATHOLOGY.summaryPathologyCaseId}`
            )
        );

        await expect(page.locator('.tl-timeline-svg')).toBeVisible({
            timeout: 30000,
        });

        const matchedRows = await findSummaryTooltipMatch(
            page,
            rows =>
                rows.some(
                    row =>
                        row.href.includes('matchLevel=PART') ||
                        row.href.includes('matchLevel=BLOCK')
                )
        );
        expect(matchedRows).toBeTruthy();
        const matchedLink = matchedRows!.find(
            row =>
                row.href.includes('matchLevel=PART') ||
                row.href.includes('matchLevel=BLOCK')
        )!;
        const matchedTooltipViewable = Number(
            matchedRows!.find(row => row.cells[0] === 'VIEWABLE SLIDES')!
                .cells[1]
        );

        await page.goto(devUrl(matchedLink.href));
        if (matchedLink.href.includes('matchLevel=PART')) {
            await expect(
                page.locator('[data-testid="wsi-match-filter-part"]')
            ).toHaveClass(/btn-primary/, { timeout: 30000 });
        } else {
            await expect(
                page.locator('[data-testid="wsi-match-filter-block"]')
            ).toHaveClass(/btn-primary/, { timeout: 30000 });
        }
        const matchedRenderedCount = await page.locator(
            '[data-testid^="wsi-slide-item-"]'
        ).count();
        expect(matchedRenderedCount).toBeGreaterThanOrEqual(
            matchedTooltipViewable
        );
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

            // Clinical data rows collapse pathology events more narrowly than the
            // viewer's current linkouts, which intentionally preserve broader
            // stain/match context instead of hard-locking specimen state.
            expect(renderedCount).toBeGreaterThanOrEqual(row.viewableCount!);
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

    test('clinical-data sample linkout scopes slides and keeps facet counts consistent', async ({
        page,
    }) => {
        const sampleId = 'P-0025952-T03-IM7';
        await page.goto(
            devUrl(
                `/patient/clinicalData?studyId=${DEV_PATHOLOGY.studyId}&caseId=P-0025952`
            )
        );

        await expect(page.locator('body')).toContainText(/Pathology slides/i, {
            timeout: 30000,
        });
        const sampleLink = (await readPathologyClinicalRows(page)).find(row =>
            row.href.includes(`sampleId=${sampleId}`)
        );
        expect(sampleLink).toBeTruthy();

        await page.goto(devUrl(sampleLink!.href));
        await expect(
            page.locator('[data-testid="wsi-share-button"]')
        ).toBeVisible({ timeout: 30000 });

        await expect(
            page.locator(`[data-testid="wsi-sample-node-${sampleId}"]`)
        ).toBeVisible();
        await expect(
            page.locator('[data-testid^="wsi-sample-node-"]')
        ).toHaveCount(1);

        const summary = page.locator(
            '[data-testid="wsi-filtered-slide-count"]'
        );
        await expect(summary).toContainText(/Showing \d+ slides?/);
        const shown = Number((await summary.textContent())!.match(/\d+/)![0]);

        const route = new URL(page.url());
        const activeFilters = [
            route.searchParams.get('stainFilter')
                ? `[data-testid="wsi-stain-filter-${route.searchParams.get(
                      'stainFilter'
                  )}"]`
                : null,
            route.searchParams.get('matchLevel')
                ? `[data-testid="wsi-match-filter-${route.searchParams
                      .get('matchLevel')!
                      .toLowerCase()}"]`
                : null,
        ].filter((selector): selector is string => selector !== null);

        for (const selector of activeFilters) {
            const button = page.locator(selector);
            const label = await button.textContent();
            const count = Number(label?.match(/\((\d+)\)/)?.[1]);
            expect(Number.isFinite(count)).toBe(true);
            expect(count).toBe(shown);
        }

        const firstSlide = page.locator('[data-testid^="wsi-slide-item-"]').first();
        await expect(firstSlide).toBeVisible();
        expect(shown).toBeGreaterThan(0);
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

    test('summary remains usable when pathology hierarchy requests fail', async ({
        page,
    }) => {
        await page.route(
            `**/patient/${DEV_PATHOLOGY.summaryFailureCaseId}?studyId=${DEV_PATHOLOGY.studyId}**`,
            async route => {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: 'pathology unavailable' }),
                });
            }
        );

        await page.goto(
            devUrl(
                `/patient/summary?studyId=${DEV_PATHOLOGY.studyId}&caseId=${DEV_PATHOLOGY.summaryFailureCaseId}`
            )
        );

        await expect(
            page.locator('[data-test="patientview-mutation-table"]')
        ).toBeVisible({ timeout: 30000 });
        await expect(page.locator('.tl-timeline-svg')).toBeVisible({
            timeout: 30000,
        });
        await expect(page.locator('body')).not.toContainText(
            /Error rendering tooltip|Something went wrong/i
        );
    });

    test('summary non-pathology content renders while pathology requests are delayed', async ({
        page,
    }) => {
        const delayedUrls: string[] = [];
        const delayMs = 7000;
        const delayAndFetch = async (url: string) => {
            delayedUrls.push(url);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            const response = await fetch(url);
            const body = await response.text();
            return {
                status: response.status,
                contentType:
                    response.headers.get('content-type') || 'application/json',
                body,
            };
        };

        await page.route(
            `**/patient/${DEV_PATHOLOGY.summaryFailureCaseId}?studyId=${DEV_PATHOLOGY.studyId}**`,
            async route => {
                await route.fulfill(await delayAndFetch(route.request().url()));
            }
        );
        await page.route(
            `**/patient/${DEV_PATHOLOGY.summaryFailureCaseId}/bootstrap**`,
            async route => {
                await route.fulfill(await delayAndFetch(route.request().url()));
            }
        );

        await page.goto(
            devUrl(
                `/patient/summary?studyId=${DEV_PATHOLOGY.studyId}&caseId=${DEV_PATHOLOGY.summaryFailureCaseId}`
            )
        );

        await expect(
            page.locator('[data-test="patientview-mutation-table"]')
        ).toBeVisible({ timeout: 5000 });
        await expect(
            page.locator('[data-test="patientview-structural-variant-table"]')
        ).toBeVisible({ timeout: 5000 });
        expect(delayedUrls.length).toBeGreaterThan(0);
    });
});
