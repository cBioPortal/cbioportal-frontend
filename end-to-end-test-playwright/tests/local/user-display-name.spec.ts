// Source: end-to-end-test/local/specs/user-display-name.spec.js
import { test, expect } from '../../fixtures';
import { goToUrlAndSetLocalStorageWithProperty } from './helpers';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

test.describe('displays appropriate user name/email', () => {
    test('shows email in the logged-in button with new value defined', async ({
        page,
    }) => {
        const userEmailAddress = 'other@email.com';
        await goToUrlAndSetLocalStorageWithProperty(
            page,
            CBIOPORTAL_URL,
            true,
            {
                user_display_name: userEmailAddress,
            }
        );
        await expect(
            page.locator('#dat-dropdown.btn-sm.dropdown-toggle.btn.btn-default')
        ).toHaveText(new RegExp(`Logged in as ${userEmailAddress}\\s*`));
    });

    test('does not display login button if no value defined', async ({
        page,
    }) => {
        await goToUrlAndSetLocalStorageWithProperty(
            page,
            CBIOPORTAL_URL,
            true,
            {
                user_display_name: null,
            }
        );
        await page
            .locator('#rightHeaderContent')
            .waitFor({ state: 'attached' });
        await expect(
            page.locator('#dat-dropdown.btn-sm.dropdown-toggle.btn.btn-default')
        ).toHaveCount(0);
    });
});
