import { test, expect } from '@playwright/test';
import { expectElementScreenshot } from './helpers/common';
import {
    CLINICAL_CATEGORICAL_URL,
    CLINICAL_DIV,
    CLINICAL_PLOT_DIV,
    DELETE_GROUP_URL,
    MUTATIONS_NO_TYPES_URL,
    MUTATIONS_PLOT,
    MUTATIONS_THREE_GROUPS_URL,
    MUTATIONS_TWO_GROUPS_URL,
    OVERLAP_DIV,
    selectClinicalTabPlotType,
} from './helpers/group-comparison';

/**
 * Independent group-comparison flows — mutations tab (3 cases), delete
 * group from session, and the clinical-table categorical render. Each
 * test loads its own session URL, so the whole file is shardable across
 * workers without shared state concerns.
 */

// Tests are independent — each cold-loads its own URL without shared state.
// Opt into parallel so shards running this file don't serialize unnecessarily.
test.describe.configure({ mode: 'parallel' });

test.describe('group comparison mutations tab', () => {
    test('two groups', async ({ page }) => {
        await page.goto(MUTATIONS_TWO_GROUPS_URL);
        await expect(
            page.locator('.borderedChart svg.lollipop-svgnode')
        ).toBeVisible({ timeout: 20000 });
        await page.waitForTimeout(4000);
        await expectElementScreenshot(
            page,
            MUTATIONS_PLOT,
            'group-comparison-mutations-two.png'
        );
    });

    test('two groups with no mutation types selected', async ({ page }) => {
        await page.goto(MUTATIONS_NO_TYPES_URL);
        await expect(
            page.locator('.borderedChart svg.lollipop-svgnode')
        ).toBeVisible({ timeout: 20000 });
        await page.waitForTimeout(4000);
        await expectElementScreenshot(
            page,
            MUTATIONS_PLOT,
            'group-comparison-mutations-no-types.png'
        );
    });

    test('three groups, first unselected', async ({ page }) => {
        await page.goto(MUTATIONS_THREE_GROUPS_URL);
        await expect(
            page.locator('.borderedChart svg.lollipop-svgnode')
        ).toBeVisible({ timeout: 20000 });
        const infoIcon = page.locator('[data-test="infoIcon"]').first();
        await expect(infoIcon).toBeVisible({ timeout: 20000 });
        await infoIcon.hover();
        await expect(
            page.locator('[data-test="patientMultipleMutationsMessage"]')
        ).toBeVisible();
        await page.waitForTimeout(4000);
        await expectElementScreenshot(
            page,
            MUTATIONS_PLOT,
            'group-comparison-mutations-three-first-unselected.png'
        );
    });
});

test.describe('group comparison delete group from session', () => {
    test('delete group from session', async ({ page }) => {
        await page.goto(DELETE_GROUP_URL);
        await expect(page.locator(OVERLAP_DIV)).toBeVisible({
            timeout: 20000,
        });
        await page
            .locator(
                'button[data-test="groupSelectorButtonGARS mutant"] [data-test="deleteButton"]'
            )
            .click();
        await page.waitForTimeout(1000);
        await expectElementScreenshot(
            page,
            'div.mainContainer',
            'group-comparison-delete-group.png'
        );
    });
});

test.describe('group comparison clinical tab categorical table', () => {
    test('race plot type table', async ({ page }) => {
        await page.goto(CLINICAL_CATEGORICAL_URL);
        await expect(page.locator(OVERLAP_DIV)).toBeVisible({
            timeout: 60000,
        });
        await expect(page.locator('a.tabAnchor_clinical')).toBeVisible();
        await page.locator('a.tabAnchor_clinical').click();
        await expect(page.locator(CLINICAL_PLOT_DIV)).toBeVisible({
            timeout: 20000,
        });
        await page.locator(`${CLINICAL_DIV} span[data-test="Race"]`).click();
        await selectClinicalTabPlotType(page, 'Table');
        await expectElementScreenshot(
            page,
            CLINICAL_PLOT_DIV,
            'group-comparison-clinical-race-table.png'
        );
    });
});
