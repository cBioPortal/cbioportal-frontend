import { Page } from '@playwright/test';
import { test, expect } from '../../../fixtures';
import { keycloakLogin } from '../helpers';

/**
 * Users, studies and login steps for the specs in tests/local/auth, which
 * run against the Keycloak setups in cbioportal-docker-compose
 * (dev/keycloak). See dev/README.md there for the users and their roles.
 */

export const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

// The `authenticate` value of the backend under test. The default localdb
// job runs saml; the auth jobs set saml_plus_basic or oauth2.
export const AUTH_MODE = process.env.PW_AUTH_MODE || 'saml';

export const PASSWORD = 'P@ssword1';

// testuser has a role for every study in the CI realm; restricteduser and
// the basic-login user only for ALLOWED_STUDY.
export const ALL_STUDIES_USER = {
    username: 'testuser',
    email: 'testuser@thehyve.nl',
};
export const RESTRICTED_USER = {
    username: 'restricteduser',
    email: 'restricteduser@example.org',
};
export const BASIC_USER = 'basicuser';

export const ALLOWED_STUDY = 'study_es_0';
export const OTHER_STUDY = 'ascn_test_study';

/** Skip the enclosing describe unless the backend runs one of `modes`. */
export function onlyInAuthModes(...modes: string[]) {
    test.skip(
        !modes.includes(AUTH_MODE),
        `needs authenticate=${modes.join(' or ')}, backend runs ${AUTH_MODE}`
    );
}

export async function logIn(
    page: Page,
    user: { username: string; email: string }
) {
    await page.goto(CBIOPORTAL_URL);
    await keycloakLogin(page, 30000, user.username, PASSWORD);
    await expect(page.locator('#dat-dropdown')).toContainText(
        `Logged in as ${user.email}`
    );
}

export async function signOut(page: Page) {
    // An API call that returns 401 after logout sends the page through
    // login again (redirectToLogin in appBootstrapper.tsx). With OIDC the
    // Keycloak session is still open, so that would sign the user back in.
    // Let the home page finish loading before signing out.
    await expect(page.locator('[data-test=StudySelect]').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    await page.locator('#dat-dropdown').click();
    await page.getByRole('link', { name: 'Sign out' }).click();
}

export async function studyIds(response: {
    json(): Promise<{ studyId: string }[]>;
}) {
    return (await response.json()).map(s => s.studyId).sort();
}
