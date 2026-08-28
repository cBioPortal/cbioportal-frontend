import { test, expect } from '../../fixtures';
import {
    ensureLocalLogin,
    localStackHasWsiCapabilityEndpoint,
    localStackUsesSaml,
} from './helpers';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:3001'
).replace(/\/$/, '');
const COAD_VIEWER_URL = `${CBIOPORTAL_URL}/patient/wsiHESlides?studyId=coad_msk_2025&caseId=P-0011144&sampleId=P-0011144-T01-IM5&stainFilter=hne&matchLevel=BLOCK#wsi:slide=1912196&x=34494&y=26322&z=3.400034`;
const WSI_STUDY_ID = 'coad_msk_2025';
const WSI_SLIDE_ID = '1912196';

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
                '/api/wsi/slides/coad_msk_2025/1912196/access',
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
                study_id: WSI_STUDY_ID,
                image_id: WSI_SLIDE_ID,
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
                        '/api/wsi/slides/study-without-access/3020726/access',
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
            `${CBIOPORTAL_URL}/api/wsi/slides/${WSI_STUDY_ID}/${WSI_SLIDE_ID}/access`,
            { failOnStatusCode: false }
        );
        expect(response.status()).toBe(401);
    });

    test('loads the complete COAD viewer without unauthorized WSI requests', async ({
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

        const responses: Array<{ url: string; status: number }> = [];
        const failedRequests: string[] = [];
        page.on('response', response => {
            const pathname = new URL(response.url()).pathname;
            if (
                pathname.includes('/api/wsi/') ||
                pathname.includes('/tiles/') ||
                pathname.includes('/annotations')
            ) {
                responses.push({
                    url: response.url(),
                    status: response.status(),
                });
            }
        });
        page.on('requestfailed', request => {
            const pathname = new URL(request.url()).pathname;
            if (
                pathname.includes('/api/wsi/') ||
                pathname.includes('/tiles/') ||
                pathname.includes('/annotations')
            ) {
                failedRequests.push(request.url());
            }
        });

        await page.goto(COAD_VIEWER_URL);
        await expect(
            page.locator('[data-testid="wsi-share-button"]')
        ).toBeVisible({ timeout: 30000 });
        await expect(page.locator('.openseadragon-canvas').first()).toBeVisible(
            {
                timeout: 30000,
            }
        );
        await expect(
            page.locator('[data-testid="wsi-annotation-toolbar"]')
        ).toBeVisible({ timeout: 30000 });
        await expect(
            page.locator('[data-testid="wsi-viewer-error"]')
        ).toHaveCount(0);

        const hasResponse = (pattern: RegExp) =>
            responses.some(response => pattern.test(response.url));
        await expect
            .poll(() => hasResponse(/\/api\/wsi\/hierarchy\//))
            .toBe(true);
        await expect
            .poll(() => hasResponse(/\/api\/wsi\/slides\/.*\/access/))
            .toBe(true);
        await expect
            .poll(() => hasResponse(/\/tiles\/(?:zxy\/|.*\/metadata)/))
            .toBe(true);
        await expect
            .poll(() => hasResponse(/\/annotations(?:\?|$)/))
            .toBe(true);

        expect(failedRequests).toEqual([]);
        expect(
            responses.filter(response => [401, 403].includes(response.status))
        ).toEqual([]);
    });
});
