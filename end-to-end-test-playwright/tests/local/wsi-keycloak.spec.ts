import { test, expect } from '../../fixtures';
import { keycloakLogin } from './helpers';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:3001'
).replace(/\/$/, '');

test.describe('Keycloak-authenticated WSI capability', () => {
    test('exchanges the authenticated SAML session for a WSI capability', async ({
        page,
    }) => {
        await page.goto(`${CBIOPORTAL_URL}/saml2/authenticate/cbio-idp`);
        await keycloakLogin(page);

        const result = await page.evaluate(async () => {
            const response = await fetch(
                '/api/wsi/access-token?studyId=coad_msk_2025',
                {
                    credentials: 'same-origin',
                    cache: 'no-store',
                }
            );
            const body = response.ok ? await response.json() : null;
            const payload = body
                ? JSON.parse(atob(body.access_token.split('.')[1]))
                : null;
            return {
                status: response.status,
                body,
                payload,
            };
        });

        expect(result.status).toBe(200);
        expect(result.body).toEqual(
            expect.objectContaining({
                token_type: 'Bearer',
                expires_in: expect.any(Number),
            })
        );
        expect(result.body.access_token).toEqual(expect.any(String));
        expect(result.payload).toEqual(
            expect.objectContaining({
                scope: 'wsi:read',
                study_id: 'coad_msk_2025',
            })
        );
        expect(result.body.access_token.split('.')).toHaveLength(3);
        expect(result.body.expires_in).toBeGreaterThanOrEqual(60);
        expect(result.body.expires_in).toBeLessThanOrEqual(900);
    });

    test('does not issue a capability for a study outside the session groups', async ({
        page,
    }) => {
        await page.goto(`${CBIOPORTAL_URL}/saml2/authenticate/cbio-idp`);
        await keycloakLogin(page);
        const status = await page.evaluate(
            async () =>
                (
                    await fetch(
                        '/api/wsi/access-token?studyId=study-without-access',
                        {
                            credentials: 'same-origin',
                            cache: 'no-store',
                        }
                    )
                ).status
        );
        expect(status).toBe(403);
    });

    test('rejects the capability exchange without the Keycloak session', async ({
        request,
    }) => {
        const response = await request.get(
            `${CBIOPORTAL_URL}/api/wsi/access-token`,
            { failOnStatusCode: false }
        );
        expect(response.status()).toBe(401);
    });
});
