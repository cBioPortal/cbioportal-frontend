import { test, expect } from '@playwright/test';

// Builds a Storybook iframe URL for a given story ID.
// Story IDs follow the pattern: {title-kebab}--{story-name-kebab}
// e.g. title "Shared/LoadingIndicator", story "Small" → "shared-loadingindicator--small"
function storyUrl(storyId: string) {
    return `/iframe.html?id=${storyId}&viewMode=story`;
}

// Wait for the component to be mounted and any CSS transitions to settle.
// LoadingIndicator has a fadein animation; we disable animations via Playwright
// but still wait for the DOM to stabilise.
async function waitForStory(page: any) {
    await page.waitForLoadState('networkidle');
}

test.describe('LoadingIndicator', () => {
    test('small spinner', async ({ page }) => {
        await page.goto(storyUrl('shared-loadingindicator--small'));
        await waitForStory(page);
        await expect(page.locator('[data-test="LoadingIndicator"]')).toBeVisible();
        await expect(page).toHaveScreenshot('small.png');
    });

    test('big spinner', async ({ page }) => {
        await page.goto(storyUrl('shared-loadingindicator--big'));
        await waitForStory(page);
        await expect(page.locator('[data-test="LoadingIndicator"]')).toBeVisible();
        await expect(page).toHaveScreenshot('big.png');
    });

    test('with loading message', async ({ page }) => {
        await page.goto(storyUrl('shared-loadingindicator--with-message'));
        await waitForStory(page);
        await expect(page.locator('[data-test="LoadingIndicator"]')).toBeVisible();
        await expect(page).toHaveScreenshot('with-message.png');
    });

    test('renders nothing when not loading', async ({ page }) => {
        await page.goto(storyUrl('shared-loadingindicator--not-loading'));
        await waitForStory(page);
        // The component should render nothing — no LoadingIndicator in the DOM.
        await expect(
            page.locator('[data-test="LoadingIndicator"]')
        ).not.toBeVisible();
        await expect(page).toHaveScreenshot('not-loading.png');
    });
});
