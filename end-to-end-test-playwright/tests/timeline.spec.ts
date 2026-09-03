import { test, expect, Page } from '../fixtures';

/**
 * Clinical timeline — port of end-to-end-test/remote/specs/core/timeline.spec.js
 *
 * The clinical timeline is the horizontal widget on the patient summary page
 * that plots clinical events (treatments, lab results, status changes) against
 * time. Row groups can be collapsed via the caret affordance, and the
 * viewport can be zoomed/panned by dragging on the timeline axis.
 *
 * These tests use the public cBioPortal study `mpcproject_broad_2021`
 * (Metastatic Prostate Cancer Project) case `MPCPROJECT_0013`, chosen because
 * it has enough events across enough tracks to exercise the layout.
 */

const PATIENT_URL =
    '/patient/summary?studyId=mpcproject_broad_2021&caseId=MPCPROJECT_0013';

test.describe('clinical timeline', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(PATIENT_URL);
        // The page renders many remote-data panels; wait for network to settle
        // before interacting so the timeline has finished its first layout.
        await page.waitForLoadState('networkidle');
    });

    /**
     * Smoke test: the timeline SVG renders on initial page load, and its
     * visual layout matches the reference snapshot. Guards against both
     * "timeline failed to mount" regressions and subtler layout drift
     * (axis labels, row heights, track colors) that pure DOM assertions miss.
     */
    test('timeline displays on load', async ({ page }) => {
        const timeline = page.locator('.tl-timeline-wrapper');
        await expect(page.locator('.tl-timeline-svg')).toBeVisible();

        await stabilizeForScreenshot(page);
        await expect(timeline).toHaveScreenshot('timeline-on-load.png');
    });

    /**
     * Collapsing a row group via its caret should reduce the visible row
     * count, and re-expanding should restore it.
     *
     * Marked `fixme` to mirror the `.skip` on the source wdio test. The
     * original hardcoded 15 → 6 → 15 counts went stale as data upstream
     * changed; porting preserves the intent so we can re-enable it with
     * robust selectors (e.g. asserting a *decrease*, not a magic number)
     * in a follow-up.
     */
    test.fixme(
        'timeline rows collapse when caret clicked',
        async ({ page }) => {
            await expect(page.locator('.tl-timeline-svg')).toBeVisible();

            const rows = page.locator('.tl-timeline-tracklabels > div');
            const initialCount = await rows.count();
            expect(initialCount).toBeGreaterThan(0);

            // Collapse the first expandable row group.
            await page
                .locator('.tl-timeline-wrapper .fa-caret-down')
                .first()
                .click();

            // After collapse, strictly fewer rows should be visible.
            await expect.poll(() => rows.count()).toBeLessThan(initialCount);

            await stabilizeForScreenshot(page);
            await expect(page.locator('.tl-timeline-wrapper')).toHaveScreenshot(
                'timeline-collapsed.png'
            );

            // Re-expand; row count returns to the original value.
            await page
                .locator('.tl-timeline-wrapper .fa-caret-right')
                .first()
                .click();
            await expect(rows).toHaveCount(initialCount);
        }
    );

    /**
     * Dragging horizontally on the timeline axis zooms the viewport onto
     * the dragged range. We drag from the "year 0" label rightward and
     * confirm the view updates.
     *
     * The source wdio version of this test had no assertion at all (the
     * screenshot result was never awaited or compared), so this is a
     * correctness upgrade during the port, not a faithful copy. Kept here
     * because the *intent* — verify drag-to-zoom works — is worth having.
     */
    test('timeline zooms in on drag and drop', async ({ page }) => {
        await expect(page.locator('.tl-timeline-svg')).toBeVisible();

        // The axis renders tick labels as <text>; the "0" tick is the
        // anchor we drag from.
        const zeroTick = page
            .locator('.tl-timelineviewport text')
            .filter({ hasText: /^0$/ })
            .first();
        await zeroTick.waitFor();

        const box = await zeroTick.boundingBox();
        if (!box) throw new Error('zero tick has no bounding box');

        const startX = box.x + box.width / 2;
        const startY = box.y + box.height / 2;

        // Drag 300px to the right, steps > 1 so the component sees
        // intermediate mousemove events (required by drag handlers).
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX + 300, startY, { steps: 20 });
        await page.mouse.up();

        await stabilizeForScreenshot(page);
        await expect(page.locator('.tl-timeline-wrapper')).toHaveScreenshot(
            'timeline-zoomed.png'
        );
    });
});

/**
 * Move the mouse to the top-left corner so no hover state leaks into the
 * screenshot (equivalent of the wdio `checkElementWithMouseDisabled`
 * overlay trick). Playwright's `toHaveScreenshot` already disables
 * animations and hides the caret; combined, this gives us stable pixels.
 */
async function stabilizeForScreenshot(page: Page) {
    await page.mouse.move(0, 0);
    // One tick for any pending hover-out transitions to flush.
    await page.waitForTimeout(200);
}
