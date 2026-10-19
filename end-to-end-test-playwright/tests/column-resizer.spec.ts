import { test, expect } from '../fixtures';

// The patient view mutation table's Samples column is resizable when the
// patient has more than one sample (lgg_ucsf_2014 P04 has four).
test.describe('column resizer', () => {
    test('dragging the Samples column divider widens the column', async ({
        page,
    }) => {
        await page.setViewportSize({ width: 1600, height: 1000 });
        await page.goto('/patient?studyId=lgg_ucsf_2014&caseId=P04');

        const table = page.locator('[data-test="patientview-mutation-table"]');
        const resizer = table.locator('thead td.columnResizer').first();
        await expect(resizer).toBeVisible({ timeout: 30000 });

        const header = resizer.locator('xpath=preceding-sibling::th[1]');
        await expect(header).toContainText('Samples');

        const before = (await header.boundingBox())!.width;
        const box = (await resizer.boundingBox())!;
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;

        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + 40, y, { steps: 5 });
        await page.mouse.move(x + 80, y, { steps: 5 });
        await page.mouse.up();

        await expect
            .poll(async () => (await header.boundingBox())!.width)
            .toBeGreaterThan(before + 40);
        expect(await header.evaluate(th => th.style.width)).toMatch(/px$/);

        // Moving the mouse after release must not keep resizing.
        const released = (await header.boundingBox())!.width;
        await page.mouse.move(x + 200, y, { steps: 5 });
        expect((await header.boundingBox())!.width).toBeCloseTo(released, 0);
    });
});
