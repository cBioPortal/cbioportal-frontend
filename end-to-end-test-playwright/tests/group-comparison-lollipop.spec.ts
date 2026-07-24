import { test, expect, Page } from '../fixtures';
import { byTestHandle, setInputText, setDropdownOpen } from './helpers/common';

/**
 * Port of end-to-end-test/remote/specs/core/groupComparisonLollipop.spec.js.
 *
 * Exercises the group comparison mutations tab:
 *  - too-many-groups / not-enough-groups alerts
 *  - lollipop tooltip display + axis-scale toggle
 *  - gene selection via tab + dropdown
 *  - annotation-track visibility stickiness across gene change
 *  - protein badge (driver/vus) filter behavior
 *  - "only" button behavior (single-class selection)
 *  - fisher exact test label + pagination / count text
 *  - mutation-table filter options (search, dropdown, checkbox, badge, lollipop)
 */

const MUTATIONS_3GROUPS_URL =
    '/comparison/mutations?comparisonId=634006c24dd45f2bc4c3d4aa';
const MUTATIONS_AR_URL =
    '/comparison/mutations?sessionId=5cf89323e4b0ab413787436c&selectedGene=AR';

const MUTATIONS_PLOT = '[data-test="ComparisonPageMutationsTabPlot"]';

/**
 * Click a lollipop to select it. The lollipop's click target is a shared
 * hit-zone overlay that the plot repositions over the hovered lollipop via a
 * MobX observable; under React 18 that re-render commits asynchronously, so we
 * hover and let the overlay settle before clicking — otherwise the click lands
 * before the overlay (and its onClick) is in place and the selection no-ops.
 */
async function selectLollipop(page: Page, selector: string) {
    const lollipop = page.locator(selector).first();
    await lollipop.hover({ force: true });
    await page.waitForTimeout(500);
    await lollipop.click({ force: true });
}

/** Convert any CSS color string to a lowercase `#rrggbb` hex. */
function rgbToHex(color: string): string {
    if (!color) return '';
    if (color.startsWith('#')) return color.toLowerCase();
    const m = color.match(/\d+/g);
    if (!m || m.length < 3) return color;
    return (
        '#' +
        m
            .slice(0, 3)
            .map(n =>
                parseInt(n, 10)
                    .toString(16)
                    .padStart(2, '0')
            )
            .join('')
    );
}

async function getColorBySelector(
    page: Page,
    selector: string,
    property: 'color' | 'background-color' = 'color'
): Promise<string> {
    const raw = await page.evaluate(
        ({ sel, prop }) => {
            const el = document.querySelector(sel) as HTMLElement | null;
            if (!el) return '';
            return getComputedStyle(el).getPropertyValue(prop);
        },
        { sel: selector, prop: property }
    );
    return rgbToHex(raw);
}

async function getColorByTestHandle(
    page: Page,
    handle: string,
    property: 'color' | 'background-color' = 'color'
): Promise<string> {
    return getColorBySelector(page, `[data-test="${handle}"]`, property);
}

async function getColorOfNthElement(
    page: Page,
    selector: string,
    index: number,
    property: 'color' | 'background-color' = 'color'
): Promise<string> {
    const raw = await page.evaluate(
        ({ sel, idx, prop }) => {
            const els = document.querySelectorAll(sel);
            const el = els[idx] as HTMLElement | undefined;
            if (!el) return '';
            return getComputedStyle(el).getPropertyValue(prop);
        },
        { sel: selector, idx: index, prop: property }
    );
    return rgbToHex(raw);
}

async function jsApiHover(page: Page, selector: string) {
    await page.evaluate(sel => {
        const el = document.querySelector(sel);
        if (el) {
            el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        }
    }, selector);
}

async function setGlobalSettingsMenuOpen(page: Page, open: boolean) {
    await setDropdownOpen(
        page,
        open,
        'button[data-test="GlobalSettingsButton"]',
        'div[data-test="GlobalSettingsDropdown"]'
    );
}

test.describe('group comparison mutations tab tests', () => {
    test.describe.serial(
        'alerts, tooltips, gene selection, tracks, badges',
        () => {
            test.describe.configure({ retries: 0 });
            let page: Page;

            test.beforeAll(async ({ browser }) => {
                page = await browser.newPage({
                    viewport: { width: 1600, height: 1000 },
                });
                await page.goto(MUTATIONS_3GROUPS_URL);
                await expect(
                    page.locator('a.tabAnchor_mutations')
                ).toBeVisible({ timeout: 30000 });
            });

            test.afterAll(async () => {
                await page.close();
            });

            test.describe.serial('lollipop alerts and plot display', () => {
                test.describe.configure({ retries: 0 });
                test('too many groups alert displayed when more than 2 groups selected', async () => {
                    await expect(
                        byTestHandle(page, 'TooManyGroupsAlert')
                    ).toBeVisible({ timeout: 40000 });
                });

                test('not enough groups alert displayed when less than 2 groups selected', async () => {
                    await page
                        .getByText('Deselect all', { exact: true })
                        .first()
                        .click();
                    await expect(
                        byTestHandle(page, 'NotEnoughGroupsAlert')
                    ).toBeVisible({ timeout: 20000 });
                    await byTestHandle(
                        page,
                        'groupSelectorButtonColon Adenocarcinoma'
                    ).click();
                    await expect(
                        byTestHandle(page, 'NotEnoughGroupsAlert')
                    ).toBeVisible();
                });

                test('lollipop plot displayed when 2 groups selected', async () => {
                    await byTestHandle(
                        page,
                        'groupSelectorButtonColorectal Adenocarcinoma'
                    ).click();
                    await expect(page.locator(MUTATIONS_PLOT)).toBeVisible({
                        timeout: 30000,
                    });
                });
            });

            test.describe.serial('lollipop tooltip display', () => {
                test.describe.configure({ retries: 0 });
                test('displays double tooltip when lollipop is present in both plots at the same position', async () => {
                    await expect(
                        page.locator('.lollipop-0').first()
                    ).toBeAttached({ timeout: 30000 });
                    await page
                        .locator('.lollipop-0')
                        .first()
                        .hover({ force: true });
                    await expect(
                        byTestHandle(page, 'tooltip-1450-Colon Adenocarcinoma')
                    ).toBeVisible({ timeout: 15000 });
                    await expect(
                        byTestHandle(
                            page,
                            'tooltip-1450-Colorectal Adenocarcinoma'
                        )
                    ).toBeVisible({ timeout: 15000 });
                });

                test("doesn't display % when axis scale # is toggled", async () => {
                    await byTestHandle(page, 'AxisScaleSwitch#').click();
                    await expect(
                        page.locator('.lollipop-6').first()
                    ).toBeAttached();
                    await page
                        .locator('.lollipop-6')
                        .first()
                        .hover({ force: true });
                    const tooltip = byTestHandle(
                        page,
                        'tooltip-1378-Colon Adenocarcinoma'
                    );
                    await expect(tooltip).toBeVisible({ timeout: 15000 });
                    const text = await tooltip.textContent();
                    expect(text?.includes('%')).toBe(false);
                });

                test('displays % when axis scale % is toggled', async () => {
                    await byTestHandle(page, 'AxisScaleSwitch%').click();
                    await expect(
                        page.locator('.lollipop-6').first()
                    ).toBeAttached();
                    await page
                        .locator('.lollipop-6')
                        .first()
                        .hover({ force: true });
                    const tooltip = page.locator(
                        '[data-test="tooltip-1378-Colon Adenocarcinoma"]'
                    );
                    await expect(tooltip).toBeVisible({ timeout: 15000 });
                    const html = await tooltip.innerHTML();
                    expect(html.includes('%')).toBe(true);
                });
            });

            test.describe.serial(
                'selecting gene with dropdown and tabs',
                () => {
                    test.describe.configure({ retries: 0 });
                    test('clicking on gene tab sets the selected gene', async () => {
                        await page.locator('a.tabAnchor_TP53').click();
                        const plotH3 = page
                            .locator(MUTATIONS_PLOT)
                            .locator('h3')
                            .first();
                        await expect(plotH3).toBeVisible({ timeout: 20000 });
                        expect(await plotH3.textContent()).toContain('TP53');
                        expect(
                            await byTestHandle(
                                page,
                                'GeneSelector'
                            ).textContent()
                        ).toContain('TP53');
                    });

                    test('selecting gene in gene selector sets the selected gene', async () => {
                        await setInputText(
                            page,
                            'div[data-test=GeneSelector] input[type=text]',
                            'KRAS'
                        );
                        await page.keyboard.press('Enter');
                        const plotH3 = page
                            .locator(MUTATIONS_PLOT)
                            .locator('h3')
                            .first();
                        await expect(plotH3).toBeVisible({ timeout: 20000 });
                        expect(await plotH3.textContent()).toContain('KRAS');
                        const krasTab = page.locator('a.tabAnchor_KRAS');
                        const parentClass = await krasTab
                            .locator('..')
                            .getAttribute('class');
                        expect(parentClass || '').toContain('active');
                    });
                }
            );

            test.describe.serial('adding annotation tracks', () => {
                test.describe.configure({ retries: 0 });
                test('track visibility stays on gene change', async () => {
                    await page.locator('div.annotation-track-selector').hover();
                    await page.locator('div.annotation-track-selector').click();
                    await byTestHandle(page, 'CancerHotspots').hover();
                    await byTestHandle(page, 'CancerHotspots').click();

                    await expect(page.locator('a.tabAnchor_APC')).toBeVisible({
                        timeout: 20000,
                    });
                    await page.locator('a.tabAnchor_APC').click();
                    await expect(
                        byTestHandle(page, 'AnnotationTracks')
                    ).toBeVisible({ timeout: 15000 });
                });
            });

            test.describe.serial('protein badge selecting', () => {
                test.describe.configure({ retries: 0 });
                test('clicking badge filters both top and bottom plots', async () => {
                    // deselect protein driver badge
                    await byTestHandle(page, 'badge-truncating_putative_driver')
                        .first()
                        .click();
                    // counts are unchanged
                    expect(
                        await byTestHandle(
                            page,
                            'badge-truncating_putative_driver'
                        )
                            .first()
                            .textContent()
                    ).toBe('115');
                    expect(
                        await page
                            .locator(
                                '[data-test="badge-truncating_putative_driver"]'
                            )
                            .nth(1)
                            .textContent()
                    ).toBe('38');

                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-truncating_putative_driver'
                        )
                    ).toBe(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-truncating_putative_driver"]',
                            1
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-truncating_putative_driver'
                        )
                    ).toBe('#000000');
                    await expect(
                        byTestHandle(page, 'filter-reset-panel')
                    ).toBeVisible({ timeout: 15000 });

                    // undo filter
                    await byTestHandle(page, 'badge-truncating_putative_driver')
                        .first()
                        .click();
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-truncating_putative_driver'
                        )
                    ).toBe(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-truncating_putative_driver"]',
                            1
                        )
                    );
                    await expect(
                        byTestHandle(page, 'filter-reset-panel')
                    ).toBeHidden();
                });

                test('deselecting protein badge deselects both protein driver and vus badges', async () => {
                    await page
                        .locator('strong', { hasText: /^Inframe$/ })
                        .first()
                        .click();

                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-inframe_putative_driver'
                        )
                    ).toBe(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-inframe_putative_driver"]',
                            1
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-inframe_unknown_significance'
                        )
                    ).toBe(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-inframe_unknown_significance"]',
                            1
                        )
                    );

                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-inframe_putative_driver'
                        )
                    ).toBe('#993404');
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-inframe_unknown_significance'
                        )
                    ).toBe('#a68028');
                });

                test('selecting protein badge selects both protein driver and vus badges', async () => {
                    await page
                        .locator('strong', { hasText: /^Inframe$/ })
                        .first()
                        .click();

                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-inframe_putative_driver'
                        )
                    ).toBe(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-inframe_putative_driver"]',
                            1
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-inframe_unknown_significance'
                        )
                    ).toBe(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-inframe_unknown_significance"]',
                            1
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-inframe_putative_driver'
                        )
                    ).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-inframe_unknown_significance'
                        )
                    );

                    // deselect driver badge, then reselect protein badge
                    await byTestHandle(page, 'badge-inframe_putative_driver')
                        .first()
                        .click();
                    await page
                        .locator('strong', { hasText: /^Inframe$/ })
                        .first()
                        .click();

                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-inframe_putative_driver'
                        )
                    ).toBe(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-inframe_putative_driver"]',
                            1
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-inframe_unknown_significance'
                        )
                    ).toBe(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-inframe_unknown_significance"]',
                            1
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-inframe_putative_driver'
                        )
                    ).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-inframe_unknown_significance'
                        )
                    );
                });

                test('deselecting driver/vus badge deselects all protein driver/vus badges', async () => {
                    // deselect driver badge
                    await page
                        .locator('[data-test="badge-driver"]')
                        .nth(1)
                        .click();

                    expect(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-driver"]',
                            1
                        )
                    ).toBe(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-driver"]',
                            3
                        )
                    );
                    expect(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-driver"]',
                            1,
                            'background-color'
                        )
                    ).toBe('#ffffff');

                    await expect(
                        byTestHandle(page, 'filter-reset-panel')
                    ).toBeVisible();

                    // all protein driver badges deselected (background-color equal)
                    expect(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-driver"]',
                            1,
                            'background-color'
                        )
                    ).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-missense_putative_driver',
                            'background-color'
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-missense_putative_driver',
                            'background-color'
                        )
                    ).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-truncating_putative_driver',
                            'background-color'
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-truncating_putative_driver',
                            'background-color'
                        )
                    ).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-inframe_putative_driver',
                            'background-color'
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-inframe_putative_driver',
                            'background-color'
                        )
                    ).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-splice_putative_driver',
                            'background-color'
                        )
                    );

                    // select driver badge again
                    await page
                        .locator('[data-test="badge-driver"]')
                        .nth(1)
                        .click();

                    expect(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-driver"]',
                            1,
                            'background-color'
                        )
                    ).toBe(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-driver"]',
                            3,
                            'background-color'
                        )
                    );
                    expect(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-driver"]',
                            1
                        )
                    ).toBe('#ffffff');
                    await expect(
                        byTestHandle(page, 'filter-reset-panel')
                    ).toBeHidden();

                    // deselect vus badge
                    await byTestHandle(page, 'badge-VUS')
                        .first()
                        .click();
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-VUS',
                            'background-color'
                        )
                    ).toBe(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-VUS"]',
                            1,
                            'background-color'
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-VUS',
                            'background-color'
                        )
                    ).toBe('#ffffff');
                    await expect(
                        byTestHandle(page, 'filter-reset-panel')
                    ).toBeVisible();

                    // select vus badge again
                    await byTestHandle(page, 'badge-VUS')
                        .first()
                        .click();
                    expect(await getColorByTestHandle(page, 'badge-VUS')).toBe(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-VUS"]',
                            1
                        )
                    );
                    expect(await getColorByTestHandle(page, 'badge-VUS')).toBe(
                        '#ffffff'
                    );
                    await expect(
                        byTestHandle(page, 'filter-reset-panel')
                    ).toBeHidden();
                });

                test('adjusts mutation counts based on driver annotation settings', async () => {
                    const driverBadgeCount = page
                        .locator('span.badge[data-test="badge-driver"]')
                        .first();
                    await expect(driverBadgeCount).toHaveText('116', {
                        timeout: 15000,
                    });
                    await setGlobalSettingsMenuOpen(page, true);
                    await byTestHandle(page, 'annotateOncoKb').click();
                    await setGlobalSettingsMenuOpen(page, false);
                    await expect(
                        page.locator('.lollipop-svgnode').first()
                    ).toBeVisible({ timeout: 30000 });
                    await expect(driverBadgeCount).toHaveText('0', {
                        timeout: 15000,
                    });
                    await setGlobalSettingsMenuOpen(page, true);
                    await byTestHandle(page, 'annotateOncoKb').click();
                    await setGlobalSettingsMenuOpen(page, false);
                    await expect(
                        page.locator('.lollipop-svgnode').first()
                    ).toBeVisible();
                    await expect(driverBadgeCount).toHaveText('116', {
                        timeout: 15000,
                    });
                });
            });

            test.describe.serial('protein only selecting', () => {
                test.describe.configure({ retries: 0 });
                test('clicking protein driver/vus badge only button selects protein driver/vus, deselects others', async () => {
                    await byTestHandle(page, 'badge-splice_putative_driver')
                        .first()
                        .hover();
                    await byTestHandle(page, 'badge-splice_putative_driver')
                        .first()
                        .click();

                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-splice_putative_driver'
                        )
                    ).toBe(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-splice_putative_driver"]',
                            1
                        )
                    );

                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-splice_putative_driver',
                            'background-color'
                        )
                    ).toBe('#ffffff');
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-splice_unknown_significance',
                            'background-color'
                        )
                    ).toBe('#f0b87b');
                    expect(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-driver"]',
                            1
                        )
                    ).toBe('#000000');
                });

                test('clicking protein type badge only button selects both protein driver and vus, deselects others', async () => {
                    await byTestHandle(page, 'missense_only')
                        .first()
                        .click({ force: true });

                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-missense_putative_driver'
                        )
                    ).toBe(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-missense_putative_driver"]',
                            1
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-missense_unknown_significance'
                        )
                    ).toBe(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-missense_unknown_significance"]',
                            1
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-missense_putative_driver'
                        )
                    ).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-missense_unknown_significance'
                        )
                    );
                    expect(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-driver"]',
                            1
                        )
                    ).toBe('#000000');
                    expect(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-VUS"]',
                            1
                        )
                    ).toBe('#696969');
                });

                test('clicking driver/vus badge only button selects all protein driver/vus badges, deselects protein vus/driver badges', async () => {
                    await byTestHandle(page, 'badge-VUS')
                        .first()
                        .hover();
                    await byTestHandle(page, 'badge-VUS')
                        .first()
                        .click();

                    await byTestHandle(page, 'driver_only')
                        .first()
                        .click({ force: true });

                    expect(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-driver"]',
                            1
                        )
                    ).toBe(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-driver"]',
                            3
                        )
                    );
                    expect(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-driver"]',
                            1
                        )
                    ).toBe('#ffffff');

                    await expect(
                        byTestHandle(page, 'filter-reset-panel')
                    ).toBeVisible();

                    expect(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-driver"]',
                            1
                        )
                    ).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-missense_putative_driver'
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-missense_putative_driver'
                        )
                    ).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-truncating_putative_driver'
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-truncating_putative_driver'
                        )
                    ).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-inframe_putative_driver'
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-inframe_putative_driver'
                        )
                    ).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-splice_putative_driver'
                        )
                    );

                    // vus badge deselected
                    expect(await getColorByTestHandle(page, 'badge-VUS')).toBe(
                        '#696969'
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-VUS',
                            'background-color'
                        )
                    ).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-missense_unknown_significance',
                            'background-color'
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-missense_unknown_significance',
                            'background-color'
                        )
                    ).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-truncating_unknown_significance',
                            'background-color'
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-inframe_unknown_significance',
                            'background-color'
                        )
                    ).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-splice_unknown_significance',
                            'background-color'
                        )
                    );

                    // select vus only
                    await byTestHandle(page, 'VUS_only')
                        .first()
                        .click({ force: true });

                    expect(await getColorByTestHandle(page, 'badge-VUS')).toBe(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-VUS"]',
                            1
                        )
                    );
                    expect(await getColorByTestHandle(page, 'badge-VUS')).toBe(
                        '#ffffff'
                    );
                    await expect(
                        byTestHandle(page, 'filter-reset-panel')
                    ).toBeVisible();

                    expect(await getColorByTestHandle(page, 'badge-VUS')).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-missense_unknown_significance'
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-missense_unknown_significance'
                        )
                    ).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-truncating_unknown_significance'
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-truncating_unknown_significance'
                        )
                    ).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-inframe_unknown_significance'
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-inframe_unknown_significance'
                        )
                    ).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-splice_unknown_significance'
                        )
                    );

                    // driver deselected
                    expect(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-driver"]',
                            1
                        )
                    ).toBe('#000000');

                    expect(
                        await getColorOfNthElement(
                            page,
                            '[data-test="badge-driver"]',
                            1,
                            'background-color'
                        )
                    ).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-missense_putative_driver',
                            'background-color'
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-missense_putative_driver',
                            'background-color'
                        )
                    ).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-truncating_putative_driver',
                            'background-color'
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-truncating_putative_driver',
                            'background-color'
                        )
                    ).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-inframe_putative_driver',
                            'background-color'
                        )
                    );
                    expect(
                        await getColorByTestHandle(
                            page,
                            'badge-inframe_putative_driver',
                            'background-color'
                        )
                    ).toBe(
                        await getColorByTestHandle(
                            page,
                            'badge-splice_putative_driver',
                            'background-color'
                        )
                    );

                    // re-select driver badge (cleanup)
                    await page
                        .locator('[data-test="badge-driver"]')
                        .nth(1)
                        .hover();
                    await page
                        .locator('[data-test="badge-driver"]')
                        .nth(1)
                        .click();
                    await expect(
                        byTestHandle(page, 'filter-reset-panel')
                    ).toBeHidden();
                });
            });
        }
    );

    test.describe.serial('fisher exact and pagination', () => {
        test.describe.configure({ retries: 0 });
        let page: Page;

        test.beforeAll(async ({ browser }) => {
            page = await browser.newPage({
                viewport: { width: 1600, height: 1000 },
            });
            await page.goto(MUTATIONS_AR_URL);
            await expect(
                page.locator('.lollipop-svgnode').first()
            ).toBeVisible({ timeout: 30000 });
        });

        test.afterAll(async () => {
            await page.close();
        });

        test.describe.serial('displaying fisher exact test label', () => {
            test.describe.configure({ retries: 0 });
            test('fisher test text and tooltip dynamically changes when filtering and selecting', async () => {
                await byTestHandle(page, 'missense_putative_driver_only')
                    .first()
                    .first()
                    .click({ force: true });

                await expect(
                    byTestHandle(page, 'fisherTestLabel')
                ).toHaveText(
                    'Fisher Exact Two-Sided Test p-value for filtered mutations - (A) Primary vs (B) Metastasis: 4.21e-8',
                    { timeout: 15000 }
                );

                await jsApiHover(page, '[data-test="infoIcon"]');
                await expect(
                    byTestHandle(page, 'patientMultipleMutationsMessage')
                ).toBeAttached({ timeout: 15000 });
                expect(
                    await byTestHandle(
                        page,
                        'patientMultipleMutationsMessage'
                    ).textContent()
                ).toBe('3 patients have more than one mutation in AR');

                await selectLollipop(page, '.lollipop-4');
                await expect(
                    byTestHandle(page, 'fisherTestLabel')
                ).toHaveText(
                    'Fisher Exact Two-Sided Test p-value for selected mutations - (A) Primary vs (B) Metastasis: 0.0305',
                    { timeout: 15000 }
                );

                await jsApiHover(page, '[data-test="infoIcon"]');
                await expect(
                    byTestHandle(page, 'patientMultipleMutationsMessage')
                ).toBeAttached({ timeout: 15000 });
                expect(
                    await byTestHandle(
                        page,
                        'patientMultipleMutationsMessage'
                    ).textContent()
                ).toBe('1 patient has more than one mutation in AR');

                // default value
                await page
                    .getByRole('button', { name: 'Remove filter' })
                    .first()
                    .click();
                await expect(
                    byTestHandle(page, 'fisherTestLabel')
                ).toHaveText(
                    'Fisher Exact Two-Sided Test p-value for all mutations - (A) Primary vs (B) Metastasis: 7.200e-6',
                    { timeout: 15000 }
                );

                await jsApiHover(page, '[data-test="infoIcon"]');
                await expect(
                    byTestHandle(page, 'patientMultipleMutationsMessage')
                ).toBeAttached({ timeout: 15000 });
                expect(
                    await byTestHandle(
                        page,
                        'patientMultipleMutationsMessage'
                    ).textContent()
                ).toBe('4 patients have more than one mutation in AR');
            });
        });

        test.describe.serial(
            'displaying table header and pagination status text',
            () => {
                test.describe.configure({ retries: 0 });
                test('displays correct text and number of mutations and protein changes when filtering and selecting', async () => {
                    // filter value
                    await page
                        .locator('strong', { hasText: /^Inframe$/ })
                        .first()
                        .click();
                    await expect(
                        byTestHandle(page, 'LazyMobXTable_CountHeader')
                    ).toHaveText('14 Mutations', { timeout: 15000 });
                    await expect(
                        page.locator('.topPagination').first()
                    ).toHaveText('Showing 1-14 of 14 Mutations', {
                        timeout: 15000,
                    });

                    await selectLollipop(page, '.lollipop-1');
                    await expect(
                        byTestHandle(page, 'LazyMobXTable_CountHeader')
                    ).toHaveText('1 Mutation', { timeout: 15000 });
                    await expect(
                        page.locator('.topPagination').first()
                    ).toHaveText('Showing 1-1 of 1 Mutation', {
                        timeout: 15000,
                    });

                    // default
                    await page
                        .getByRole('button', { name: 'Remove filter' })
                        .first()
                        .click();
                    await expect(
                        byTestHandle(page, 'LazyMobXTable_CountHeader')
                    ).toHaveText('16 Mutations', { timeout: 15000 });
                    await expect(
                        page.locator('.topPagination').first()
                    ).toHaveText('Showing 1-16 of 16 Mutations', {
                        timeout: 15000,
                    });
                });
            }
        );
    });

    test.describe('mutation table filtering options', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto(MUTATIONS_AR_URL);
            await expect(
                page.locator('.lollipop-svgnode').first()
            ).toBeVisible({ timeout: 30000 });
        });

        test('filters table with search box', async ({ page }) => {
            const numberBefore = await page.locator('tr').count();
            await setInputText(page, '[data-test=table-search-input]', 'w7');
            await expect
                .poll(async () => page.locator('tr').count(), {
                    timeout: 15000,
                })
                .toBeLessThan(numberBefore);
        });

        test('filters table with enriched in dropdown', async ({ page }) => {
            const numberBefore = await page.locator('tr').count();
            await byTestHandle(page, 'enrichedInDropdown').click();
            await page
                .locator('[id^="react-select-"][id*="option-0-0"]')
                .first()
                .click();
            await expect
                .poll(async () => page.locator('tr').count(), {
                    timeout: 15000,
                })
                .toBeLessThan(numberBefore);
        });

        test('filters table with significant only checkbox', async ({
            page,
        }) => {
            const numberBefore = await page.locator('tr').count();
            await byTestHandle(page, 'significantOnlyCheckbox').click();
            await expect
                .poll(async () => page.locator('tr').count(), {
                    timeout: 15000,
                })
                .toBeLessThan(numberBefore);
        });

        test('filters table with protein badge filtering', async ({ page }) => {
            const numberBefore = await page.locator('tr').count();
            await page
                .locator('strong', { hasText: /^Missense$/ })
                .first()
                .click();
            await expect
                .poll(async () => page.locator('tr').count(), {
                    timeout: 15000,
                })
                .toBeLessThan(numberBefore);
        });

        test('filters table with lollipop selection', async ({ page }) => {
            const numberBefore = await page.locator('tr').count();
            await selectLollipop(page, '.lollipop-1');
            await expect
                .poll(async () => page.locator('tr').count(), {
                    timeout: 15000,
                })
                .toBeLessThan(numberBefore);
        });
    });
});
