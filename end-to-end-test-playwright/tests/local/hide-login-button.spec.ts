import { test, expect } from '../../fixtures';
import { goToUrlAndSetLocalStorageWithProperty } from './helpers';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

// Source: end-to-end-test/local/specs/hide-login-button.spec.js
test('hide logged-in button feature: respects skin_hide_logout_button', async ({
    page,
}) => {
    await goToUrlAndSetLocalStorageWithProperty(page, CBIOPORTAL_URL, true, {
        skin_hide_logout_button: true,
    });
    await expect(page.locator('#rightHeaderContent .identity')).toHaveCount(0);
});
