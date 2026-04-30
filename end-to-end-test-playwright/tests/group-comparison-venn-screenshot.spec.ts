import { test, expect, Page } from '../fixtures';
import {
    COMPLEX_VENN_URL,
    DISJOINT_VENN_URL,
    dispatchSvgClick,
    OVERLAP_DIV,
    OVERLAP_VENN_URL,
    snapWithFrozenHover,
    THREE_DISJOINT_VENN_URL,
    UPSET_URL,
} from './helpers/group-comparison';

/**
 * Venn diagram + upset-plot portion of the group-comparison screenshot
 * suite. Independent disjoint tests and two serial describe blocks that
 * each walk through complex overlap states on a shared page.
 */

test.describe('group comparison venn diagrams', () => {
    test.describe('disjoint diagram', () => {
        test('disjoint venn diagram view', async ({ page }) => {
            await page.goto(DISJOINT_VENN_URL);
            await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                timeout: 20000,
            });
            await snapWithFrozenHover(
                page,
                OVERLAP_DIV,
                'group-comparison-venn-disjoint.png'
            );
        });

        test('disjoint venn diagram with a group selected', async ({
            page,
        }) => {
            await page.goto(DISJOINT_VENN_URL);
            await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                timeout: 20000,
            });
            await expect(
                page.locator('svg#comparison-tab-overlap-svg')
            ).toBeVisible({ timeout: 6000 });
            await dispatchSvgClick(page, 'rect[data-test="sample0VennRegion"]');
            await snapWithFrozenHover(
                page,
                OVERLAP_DIV,
                'group-comparison-venn-disjoint-selected.png'
            );
        });

        test('3 disjoint venn diagram', async ({ page }) => {
            await page.goto(THREE_DISJOINT_VENN_URL);
            await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                timeout: 20000,
            });
            await snapWithFrozenHover(
                page,
                OVERLAP_DIV,
                'group-comparison-venn-three-disjoint.png'
            );
        });
    });

    test.describe.serial('venn diagram with overlap', () => {
        test.describe.configure({ retries: 0 });
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await page.goto(OVERLAP_VENN_URL);
            await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                timeout: 20000,
            });
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('venn diagram with overlap view', async () => {
            await snapWithFrozenHover(
                page,
                OVERLAP_DIV,
                'group-comparison-venn-overlap.png'
            );
        });

        test('venn diagram with overlap and session selected view', async () => {
            await dispatchSvgClick(
                page,
                'rect[data-test="sample0,1,2VennRegion"]'
            );
            await snapWithFrozenHover(
                page,
                OVERLAP_DIV,
                'group-comparison-venn-overlap-selected.png'
            );
        });

        test('venn diagram with overlap deselect active group', async () => {
            await page
                .locator('button[data-test="groupSelectorButtonZFPM1 mutant"]')
                .click();
            await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                timeout: 20000,
            });
            await snapWithFrozenHover(
                page,
                OVERLAP_DIV,
                'group-comparison-venn-overlap-deselect.png'
            );
        });
    });

    test.describe.serial('venn diagram with complex overlaps', () => {
        test.describe.configure({ retries: 0 });
        let page: Page;
        const buttonA = 'button[data-test="groupSelectorButtonAll Cases"]';
        const buttonB = 'button[data-test="groupSelectorButtonMetastasis"]';
        const buttonC =
            'button[data-test="groupSelectorButtonoverlapping patients"]';
        const buttonD = 'button[data-test="groupSelectorButtonPrimary"]';

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage();
            await page.goto(COMPLEX_VENN_URL);
            await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                timeout: 20000,
            });
        });

        test.afterAll(async () => {
            await page.close();
        });

        test('complex venn BCD', async () => {
            await page.locator(buttonA).click();
            await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                timeout: 20000,
            });
            await snapWithFrozenHover(
                page,
                OVERLAP_DIV,
                'group-comparison-venn-complex-bcd.png'
            );
        });

        test('complex venn CD', async () => {
            await page.locator(buttonB).click();
            await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                timeout: 20000,
            });
            await snapWithFrozenHover(
                page,
                OVERLAP_DIV,
                'group-comparison-venn-complex-cd.png'
            );
        });

        test('complex venn BC', async () => {
            await page.locator(buttonB).click();
            await expect(page.locator(buttonD)).toBeVisible();
            await page.locator(buttonD).click();
            await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                timeout: 20000,
            });
            await snapWithFrozenHover(
                page,
                OVERLAP_DIV,
                'group-comparison-venn-complex-bc.png'
            );
        });

        test('complex venn ABC', async () => {
            await page.locator(buttonA).click();
            await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                timeout: 20000,
            });
            await snapWithFrozenHover(
                page,
                OVERLAP_DIV,
                'group-comparison-venn-complex-abc.png'
            );
        });

        test('complex venn AB', async () => {
            await page.locator(buttonC).click();
            await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                timeout: 20000,
            });
            await snapWithFrozenHover(
                page,
                OVERLAP_DIV,
                'group-comparison-venn-complex-ab.png'
            );
        });

        test('complex venn ABD', async () => {
            await page.locator(buttonD).click();
            await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                timeout: 20000,
            });
            await snapWithFrozenHover(
                page,
                OVERLAP_DIV,
                'group-comparison-venn-complex-abd.png'
            );
        });

        test('complex venn AD', async () => {
            await page.locator(buttonB).click();
            await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                timeout: 20000,
            });
            await snapWithFrozenHover(
                page,
                OVERLAP_DIV,
                'group-comparison-venn-complex-ad.png'
            );
        });

        test('complex venn ACD', async () => {
            await page.locator(buttonC).click();
            await expect(page.locator(OVERLAP_DIV)).toBeVisible({
                timeout: 20000,
            });
            await snapWithFrozenHover(
                page,
                OVERLAP_DIV,
                'group-comparison-venn-complex-acd.png'
            );
        });
    });
});

test.describe.serial('group comparison overlap upset diagram', () => {
    test.describe.configure({ retries: 0 });
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await page.goto(UPSET_URL);
        await expect(page.locator(OVERLAP_DIV)).toBeVisible({
            timeout: 20000,
        });
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('overlap upset groups selected', async () => {
        await dispatchSvgClick(page, '.sample_testGroup5_bar');
        await dispatchSvgClick(page, '.sample_testGroup1_testGroup2_bar');
        await dispatchSvgClick(page, '.patient_testGroup1_bar');
        await snapWithFrozenHover(
            page,
            OVERLAP_DIV,
            'group-comparison-upset-groups-selected.png'
        );
    });

    test('overlap upset deselect active group', async () => {
        await page
            .locator('button[data-test="groupSelectorButtontestGroup4"]')
            .click();
        await expect(page.locator(OVERLAP_DIV)).toBeVisible({
            timeout: 20000,
        });
        await snapWithFrozenHover(
            page,
            OVERLAP_DIV,
            'group-comparison-upset-deselect.png'
        );
    });
});
