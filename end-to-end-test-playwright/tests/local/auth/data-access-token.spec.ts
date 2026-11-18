import { test, expect } from '../../../fixtures';
import {
    ALLOWED_STUDY,
    CBIOPORTAL_URL,
    logIn,
    onlyInAuthModes,
    OTHER_STUDY,
    RESTRICTED_USER,
    studyIds,
} from './auth-helpers';

test.describe('data access tokens from Keycloak', () => {
    onlyInAuthModes('saml_plus_basic');

    test('a downloaded token reads the same studies as its user', async ({
        page,
        playwright,
    }) => {
        await logIn(page, RESTRICTED_USER);
        await page.goto(`${CBIOPORTAL_URL}/webAPI`);

        const tokenFile = page
            .context()
            .waitForEvent('response', r =>
                r.url().includes('/api/data-access-token/oauth2')
            );
        await page.getByRole('button', { name: 'Download Token' }).click();
        const response = await tokenFile;
        expect(response.status()).toBe(200);
        expect(response.headers()['content-disposition']).toContain(
            'cbioportal_data_access_token.txt'
        );

        // The popup's download body is not readable, so request another
        // token through the same Keycloak session.
        const body = await (
            await page.request.get(`${CBIOPORTAL_URL}/api/data-access-token`)
        ).text();
        const token = body.replace(/^token:\s*/, '').trim();

        const api = await playwright.request.newContext({
            extraHTTPHeaders: { Authorization: `Bearer ${token}` },
        });
        expect(
            await studyIds(await api.get(`${CBIOPORTAL_URL}/api/studies`))
        ).toEqual([ALLOWED_STUDY]);
        expect(
            (
                await api.get(`${CBIOPORTAL_URL}/api/studies/${OTHER_STUDY}`)
            ).status()
        ).toBe(403);
        await api.dispose();
    });

    test('rejects an invalid token', async ({ playwright }) => {
        const api = await playwright.request.newContext({
            extraHTTPHeaders: { Authorization: 'Bearer not-a-token' },
        });
        expect((await api.get(`${CBIOPORTAL_URL}/api/studies`)).status()).toBe(
            401
        );
        await api.dispose();
    });
});
