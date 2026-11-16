import { test, expect } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');
const STUDY_ID = 'study_es_0';

test.describe('study view user settings', () => {
    test('fetches the saved settings once when study view is left before they arrive', async ({
        page,
    }) => {
        // Saved settings are only fetched for a logged-in user.
        await goToUrlAndSetLocalStorage(page, CBIOPORTAL_URL, true);

        // Holds the settings response back until study view has been left.
        let releaseSettings = () => {};
        const settingsReleased = new Promise<void>(
            resolve => (releaseSettings = resolve)
        );
        const isSettingsFetch = (url: URL) =>
            url.pathname === '/api/session/settings/fetch';
        await page.route(isSettingsFetch, async route => {
            await settingsReleased;
            await route.continue();
        });
        let settingsRequests = 0;
        page.on('request', request => {
            if (isSettingsFetch(new URL(request.url()))) {
                settingsRequests++;
            }
        });

        await page.goto(`${CBIOPORTAL_URL}/study/summary?id=${STUDY_ID}`);
        await expect(page.locator('[data-test=selected-info]')).toBeVisible({
            timeout: 30000,
        });
        await page.locator('#cbioportal-logo').click();
        await expect(
            page.locator('[data-test=cancerTypeListContainer]')
        ).toBeAttached({ timeout: 30000 });

        const settingsResponse = page.waitForResponse(response =>
            isSettingsFetch(new URL(response.url()))
        );
        releaseSettings();
        await settingsResponse;

        // A refetch would follow each response immediately.
        await page.waitForTimeout(1000);
        expect(settingsRequests).toBe(1);
    });
});
