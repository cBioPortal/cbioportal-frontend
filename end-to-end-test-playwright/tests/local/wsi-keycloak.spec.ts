import { test, expect } from '../../fixtures';
import {
    ensureLocalLogin,
    localStackHasWsiCapabilityEndpoint,
    localStackUsesSaml,
} from './helpers';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:3001'
).replace(/\/$/, '');

test.describe('Keycloak-authenticated WSI capability', () => {
    test('exchanges the authenticated SAML session for a WSI capability', async ({
        page,
    }) => {
        test.skip(
            !(await localStackUsesSaml(page, CBIOPORTAL_URL)),
            'Local stack is not running with SAML authentication enabled.'
        );
        test.skip(
            !(await localStackHasWsiCapabilityEndpoint(page, CBIOPORTAL_URL)),
            'WSI capability endpoint is not exposed on this local backend.'
        );
        await ensureLocalLogin(page, CBIOPORTAL_URL);

        const result = await page.evaluate(async () => {
            const response = await fetch(
                '/api/wsi/v2/slides/msk_spectrum_tme_2022/3020726/access',
                {
                    credentials: 'same-origin',
                    cache: 'no-store',
                }
            );
            const body = response.ok ? await response.json() : null;
            const payload = body
                ? JSON.parse(atob(body.accessToken.split('.')[1]))
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
                tokenType: 'Bearer',
                expiresIn: expect.any(Number),
                sourceUrl: expect.any(String),
                tileMetadata: expect.any(Object),
            })
        );
        expect(result.body.accessToken).toEqual(expect.any(String));
        expect(result.payload).toEqual(
            expect.objectContaining({
                scope: 'wsi:read',
                study_id: 'msk_spectrum_tme_2022',
                image_id: '3020726',
                wsi_auth_version: 2,
            })
        );
        expect(result.body.accessToken.split('.')).toHaveLength(3);
        expect(result.body.expiresIn).toBeGreaterThanOrEqual(60);
        expect(result.body.expiresIn).toBeLessThanOrEqual(300);
    });

    test('does not issue a capability for a study outside the session groups', async ({
        page,
    }) => {
        test.skip(
            !(await localStackUsesSaml(page, CBIOPORTAL_URL)),
            'Local stack is not running with SAML authentication enabled.'
        );
        test.skip(
            !(await localStackHasWsiCapabilityEndpoint(page, CBIOPORTAL_URL)),
            'WSI capability endpoint is not exposed on this local backend.'
        );
        await ensureLocalLogin(page, CBIOPORTAL_URL);
        const status = await page.evaluate(
            async () =>
                (
                    await fetch(
                        '/api/wsi/v2/slides/study-without-access/3020726/access',
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
        page,
        request,
    }) => {
        test.skip(
            !(await localStackHasWsiCapabilityEndpoint(page, CBIOPORTAL_URL)),
            'WSI capability endpoint is not exposed on this local backend.'
        );
        const response = await request.get(
            `${CBIOPORTAL_URL}/api/wsi/v2/slides/msk_spectrum_tme_2022/3020726/access`,
            { failOnStatusCode: false }
        );
        expect(response.status()).toBe(401);
    });
});
