// Source: end-to-end-test/local/specs/group-color-chooser.spec.js
import { test, expect, Page, Locator } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';
import {
    setDropdownOpen,
    waitForGroupComparisonTabOpen,
    waitForStudyView,
} from '../helpers/common';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');
const studyViewUrl = `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`;

const genderPies =
    '[data-test=chart-container-SEX] .studyViewPieChartGroup path';
const oncotreePies =
    '[data-test=chart-container-ONCOTREE_CODE] .studyViewPieChartGroup path';
const survivalPies =
    '[data-test=chart-container-OS_STATUS] .studyViewPieChartGroup path';
const groupsMenuButton = '[data-test=groups-button]';
const createNewGroupButton = '[data-test=create-new-group-btn]';
const finalizeGroupButton = 'button:has-text("Create")';
const colorIconRect = '[data-test=color-picker-icon] rect';
const colorIcon = '[data-test=color-picker-icon]';
const colorPickerBlue = '.circle-picker [title="#2986E2"]';
const colorIconBlue = 'svg rect[fill="#2986e2"]';
const colorPickerGreen = '.circle-picker [title="#109618"]';
const colorIconEmpty = 'svg rect[fill="#FFFFFF"]';
const warningSign = '.fa.fa-warning';
const groupCheckboxes = '[data-test=group-checkboxes] input';
const compareButton = 'button:has-text("Compare")';
const gbGroupButton = '[data-test=groupSelectorButtonGB]';
const oastGroupButton = '[data-test=groupSelectorButtonOAST]';

const gbGroupColorIcon = `[data-test="group-checkboxes"] [data-test="GB"] ${colorIcon}`;
const gbGroupColorIconRect = `[data-test="group-checkboxes"] [data-test="GB"] ${colorIconRect}`;
const gbGroupColorIconEmpty = `[data-test="group-checkboxes"] [data-test="GB"] ${colorIconEmpty}`;
const gbGroupColorIconBlue = `[data-test="group-checkboxes"] [data-test="GB"] ${colorIconBlue}`;

test.describe.serial('color chooser for groups menu in study view', () => {
    let page: Page;

    // Opens a circle-picker swatch by clicking `icon` (if not already open),
    // then clicks the swatch. Retries the open+click cycle if the swatch is
    // briefly detached mid-click due to circle-picker's initial re-render.
    const selectColorPickerSwatch = async (
        icon: string | Locator,
        swatchSel: string
    ) => {
        const iconLocator =
            typeof icon === 'string' ? page.locator(icon) : icon;
        for (let attempt = 0; attempt < 3; attempt++) {
            if (!(await page.locator(swatchSel).isVisible())) {
                // react-overlays 0.7.x's RootCloseWrapper adds its document-level
                // close handler during the opening click's event processing (inside
                // componentDidMount, which React runs while the click is still
                // bubbling from #reactRoot to document in React 18).  That handler
                // then fires when the same click reaches document — immediately
                // closing the picker that was just opened.
                //
                // Fix: register a bubble-phase listener on document BEFORE the
                // click fires.  Listeners fire in FIFO order per element/phase, so
                // ours always runs before the RootCloseWrapper handler (which is
                // only registered partway through the event's propagation).
                // stopImmediatePropagation silences all subsequent listeners at
                // document for this one event.
                await page.evaluate(() => {
                    document.addEventListener(
                        'click',
                        e => e.stopImmediatePropagation(),
                        { capture: false, once: true }
                    );
                });
                await iconLocator.click();
                // circle-picker does a secondary layout re-render right after
                // mounting; wait for it to settle before trying to click a swatch.
                await page.waitForTimeout(300);
            }
            try {
                await expect(page.locator(swatchSel)).toBeVisible({
                    timeout: 5000,
                });
                await page.locator(swatchSel).click({ timeout: 5000 });
                // The OverlayTrigger (trigger="click") doesn't auto-close when
                // content inside it is clicked — closure depends on whether React
                // remounts GroupCheckbox on the color update, which is
                // non-deterministic.  Wait briefly for an auto-close; if it
                // doesn't happen, click the icon again to force-toggle it shut.
                const autoClosedInTime = await expect(page.locator(swatchSel))
                    .not.toBeVisible({ timeout: 500 })
                    .then(() => true)
                    .catch(() => false);
                if (!autoClosedInTime) {
                    await iconLocator.click();
                    await expect(page.locator(swatchSel))
                        .not.toBeVisible({ timeout: 3000 })
                        .catch(() => {});
                }
                return;
            } catch {
                if (attempt === 2)
                    throw new Error(
                        `Could not click color swatch "${swatchSel}" after 3 attempts`
                    );
            }
        }
    };

    const openGroupsMenu = async () => {
        await setDropdownOpen(
            page,
            true,
            groupsMenuButton,
            createNewGroupButton
        );
    };
    const closeGroupsMenu = async () => {
        await setDropdownOpen(
            page,
            false,
            groupsMenuButton,
            createNewGroupButton
        );
    };
    const deleteAllGroups = async () => {
        await openGroupsMenu();
        try {
            await page
                .locator('[data-test="deleteGroupButton"]')
                .first()
                .waitFor({ state: 'attached', timeout: 5000 });
            const buttons = page.locator('[data-test="deleteGroupButton"]');
            const count = await buttons.count();
            for (let i = 0; i < count; i++) {
                await buttons.nth(0).click();
            }
        } catch (e) {
            // no groups to delete
        }
        await closeGroupsMenu();
    };

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await goToUrlAndSetLocalStorage(page, studyViewUrl, true);
        await waitForStudyView(page);
        await deleteAllGroups();
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('shows no icon color for new group', async () => {
        await page
            .locator(oncotreePies)
            .nth(2)
            .click();

        await openGroupsMenu();
        await page.locator(createNewGroupButton).click();
        await page.locator(finalizeGroupButton).click();

        await expect(page.locator(gbGroupColorIconRect)).toBeAttached();
        const groupGbColorIcon = page.locator(gbGroupColorIconRect);
        expect(await groupGbColorIcon.getAttribute('fill')).toBe('#FFFFFF');
    });

    test('shows new color in icon when new color is selected', async () => {
        await selectColorPickerSwatch(gbGroupColorIcon, colorPickerBlue);
        await expect(page.locator(gbGroupColorIconBlue)).toBeAttached();
        const groupGbColorIcon = page.locator(gbGroupColorIconRect);
        expect(await groupGbColorIcon.getAttribute('fill')).toBe('#2986e2');
    });

    test('selects no color after pressing same color', async () => {
        await selectColorPickerSwatch(gbGroupColorIcon, colorPickerBlue);
        await expect(page.locator(gbGroupColorIconEmpty)).toBeAttached();
        const groupGBColorIcon = page.locator(gbGroupColorIconRect);
        expect(await groupGBColorIcon.getAttribute('fill')).toBe('#FFFFFF');
    });

    test('warns of same color in groups selected for comparison', async () => {
        await setDropdownOpen(page, false, gbGroupColorIcon, colorPickerBlue);
        await closeGroupsMenu();

        await page
            .locator(oncotreePies)
            .nth(2)
            .click();
        await page
            .locator(oncotreePies)
            .nth(1)
            .click();

        await openGroupsMenu();

        await page.locator(createNewGroupButton).click();
        await page.locator(finalizeGroupButton).click();

        await expect(page.locator(colorIcon)).toHaveCount(2);

        await page
            .locator(groupCheckboxes)
            .nth(0)
            .click();
        await page
            .locator(groupCheckboxes)
            .nth(1)
            .click();

        await selectColorPickerSwatch(gbGroupColorIcon, colorPickerBlue);

        const secondColorIcon = page.locator(colorIcon).nth(1);
        await selectColorPickerSwatch(secondColorIcon, colorPickerBlue);

        await expect(page.locator(warningSign)).toBeAttached();
    });

    test('does not warn of same color when one of groups is not selected for comparison', async () => {
        await page
            .locator(groupCheckboxes)
            .first()
            .click();
        await expect(page.locator(warningSign)).toHaveCount(0);
    });

    test('shows default color for male/female groups', async () => {
        await page.locator(groupsMenuButton).click();
        await page
            .locator(genderPies)
            .nth(1)
            .click();

        await openGroupsMenu();
        await page.locator(createNewGroupButton).click();
        await page.locator(finalizeGroupButton).click();

        await expect(page.locator(colorIconRect)).toHaveCount(3);
        const groupGbColorIcon = page.locator(colorIconRect).nth(2);
        expect(await groupGbColorIcon.getAttribute('fill')).toBe('#E0699E');
    });

    test('shows undefined color when two groups with predefined colors are selected', async () => {
        await page.locator(groupsMenuButton).click();
        await page
            .locator(survivalPies)
            .nth(1)
            .click();

        await openGroupsMenu();
        await page.locator(createNewGroupButton).click();
        await page.locator(finalizeGroupButton).click();

        await expect(page.locator(colorIconRect)).toHaveCount(4);
        const livingFemaleColorIcon = page.locator(colorIconRect).nth(2);
        expect(await livingFemaleColorIcon.getAttribute('fill')).toBe(
            '#FFFFFF'
        );
    });

    test('stores group colors in study view user session', async () => {
        await page.reload();
        await expect(page.locator(groupsMenuButton)).toBeAttached();
        await page.locator(groupsMenuButton).click();
        await expect(page.locator(colorIconRect).first()).toBeAttached();
        expect(
            await page
                .locator(colorIconRect)
                .first()
                .getAttribute('fill')
        ).toBe('#2986e2');
    });

    test('uses custom colors in group comparison view', async () => {
        await page
            .locator(groupCheckboxes)
            .nth(0)
            .click();
        await page
            .locator(groupCheckboxes)
            .nth(1)
            .click();

        await selectColorPickerSwatch(
            page.locator(colorIcon).nth(1),
            colorPickerGreen
        );

        const context = page.context();
        const [comparisonPage] = await Promise.all([
            context.waitForEvent('page'),
            page.locator(compareButton).click(),
        ]);

        await waitForGroupComparisonTabOpen(comparisonPage);

        const gbStyle = await comparisonPage
            .locator(gbGroupButton)
            .getAttribute('style');
        expect(gbStyle).toContain('background-color: rgb(41, 134, 226)');

        const oastStyle = await comparisonPage
            .locator(oastGroupButton)
            .getAttribute('style');
        expect(oastStyle).toContain('background-color: rgb(16, 150, 24)');

        await comparisonPage.close();
    });
});
