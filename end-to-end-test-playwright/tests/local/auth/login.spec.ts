import { test, expect } from '../../../fixtures';
import {
    ALL_STUDIES_USER,
    ALLOWED_STUDY,
    AUTH_MODE,
    CBIOPORTAL_URL,
    logIn,
    onlyInAuthModes,
    OTHER_STUDY,
    RESTRICTED_USER,
    signOut,
} from './auth-helpers';

test.describe('login through Keycloak', () => {
    onlyInAuthModes('saml', 'saml_plus_basic', 'oauth2');

    test('sends anonymous visitors to the Keycloak login form', async ({
        page,
        request,
    }) => {
        expect(
            (await request.get(`${CBIOPORTAL_URL}/api/studies`)).status()
        ).toBe(401);
        await page.goto(CBIOPORTAL_URL);
        await expect(page.locator('#kc-form-login')).toBeVisible();
    });

    test('lists every study for a user with all study roles', async ({
        page,
    }) => {
        await logIn(page, ALL_STUDIES_USER);
        await expect(page.locator(`.studyItem_${ALLOWED_STUDY}`)).toBeVisible();
        await expect(page.locator(`.studyItem_${OTHER_STUDY}`)).toBeVisible();
    });

    test('lists only permitted studies for a restricted user', async ({
        page,
    }) => {
        await logIn(page, RESTRICTED_USER);
        await expect(page.locator(`.studyItem_${ALLOWED_STUDY}`)).toBeVisible();
        await expect(page.locator('[data-test=StudySelect]')).toHaveCount(1);
        expect(
            (
                await page.request.get(
                    `${CBIOPORTAL_URL}/api/studies/${OTHER_STUDY}`
                )
            ).status()
        ).toBe(403);
    });

    test('sign out ends the portal session', async ({ page }) => {
        await logIn(page, ALL_STUDIES_USER);
        await signOut(page);
        if (AUTH_MODE === 'oauth2') {
            // Without an end-session endpoint, OIDC logout stays on the
            // portal and the Keycloak session remains.
            await page.waitForURL(/\/login\?logout_success/);
        } else {
            // SAML single logout also ends the Keycloak session, so the
            // next login asks for credentials again.
            await expect(page.locator('#kc-form-login')).toBeVisible();
        }
        expect(
            (await page.request.get(`${CBIOPORTAL_URL}/api/studies`)).status()
        ).toBe(401);
    });
});
