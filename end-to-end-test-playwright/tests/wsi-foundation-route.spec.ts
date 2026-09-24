import { test, expect } from '../fixtures';
import { ensureLocalLogin } from './local/helpers';
import {
    installFoundationMocks,
    STUDY_ID as MOCK_STUDY_ID,
    PATIENT_ID as MOCK_PATIENT_ID,
    IMAGE_ID as MOCK_IMAGE_ID,
} from './wsi-foundation-mocks';

const baseUrl = process.env.WSI_VIEWER_BASE_URL ?? '';
const studyId = process.env.WSI_LIVE_STUDY_ID ?? 'msk_spectrum_tme_2022';
const patientId = process.env.WSI_LIVE_PATIENT_ID ?? 'P-0055908';

if (process.env.PW_SUITE === 'wsi' && process.env.WSI_CHILD_CONTRACT !== '1') {
    test.describe('WSI foundation patient entrypoint', () => {
        test('loads the standalone hierarchy viewer without molecular enrichment', async ({
            page,
        }) => {
            test.skip(
                !baseUrl,
                'WSI_VIEWER_BASE_URL is required for foundation E2E'
            );

            const enrichmentRequests: string[] = [];
            const consoleErrors: string[] = [];
            const requiredRequestFailures: string[] = [];
            await page.addInitScript(() => {
                const metrics: unknown[] = [];
                window.addEventListener(
                    'wsi-initial-slide-performance',
                    event => {
                        metrics.push((event as CustomEvent).detail);
                    }
                );
                (window as any).__wsiInitialSlidePerformance = metrics;
            });
            page.on('request', request => {
                if (/annotate|oncokb/i.test(request.url())) {
                    enrichmentRequests.push(request.url());
                }
            });
            page.on('requestfailed', request => {
                if (
                    /\/api\/wsi\/|\/wsi\/(tiles|thumbnails)/.test(
                        new URL(request.url()).pathname
                    )
                ) {
                    requiredRequestFailures.push(request.url());
                }
            });
            page.on('console', message => {
                if (message.type() === 'error')
                    consoleErrors.push(message.text());
            });

            if (process.env.WSI_AUTHENTICATED_E2E === 'true') {
                // Establish SAML at the backend's protected endpoint, then
                // verify the same session through the frontend proxy before
                // navigating to the viewer route.
                await ensureLocalLogin(
                    page,
                    baseUrl,
                    `/api/wsi/v2/hierarchy/${encodeURIComponent(
                        studyId
                    )}/${encodeURIComponent(patientId)}`
                );
            }
            await page.goto(
                `${baseUrl}/wsi/patient/${encodeURIComponent(
                    patientId
                )}?studyId=${encodeURIComponent(studyId)}`
            );

            await expect(page.getByTestId('wsi-route-unavailable')).toHaveCount(
                0
            );
            await expect(page.getByTitle('Zoom in')).toBeVisible({
                timeout: 60_000,
            });
            await expect(page.getByTitle('Fit to view')).toBeVisible();
            await expect
                .poll(async () =>
                    page.evaluate(
                        () =>
                            ((window as any).__wsiInitialSlidePerformance || [])
                                .length
                    )
                )
                .toBeGreaterThan(0);
            const performance = await page.evaluate(
                () =>
                    ((window as any).__wsiInitialSlidePerformance || []).slice(
                        -1
                    )[0]
            );
            expect(performance.outcome).toBe('success');
            expect(performance.firstTileReadyMs).toBeGreaterThan(0);
            expect(enrichmentRequests).toEqual([]);
            expect(requiredRequestFailures).toEqual([]);
            expect(consoleErrors).toEqual([]);
        });
    });
}

if (process.env.WSI_CHILD_CONTRACT === '1') {
    test('loads the mocked foundation browser contract', async ({ page }) => {
        const enrichmentRequests = await installFoundationMocks(page);
        const pageErrors: string[] = [];
        page.on('pageerror', error => pageErrors.push(error.message));

        await page.goto(
            `/wsi/patient/${MOCK_PATIENT_ID}?studyId=${MOCK_STUDY_ID}#wsi:slide=${MOCK_IMAGE_ID}&x=256&y=256&z=0.75`
        );

        await expect(page.getByTestId('wsi-route-unavailable')).toHaveCount(0);
        await expect(
            page.getByTestId('wsi-filtered-slide-count')
        ).toHaveText('Showing 1 slide', { timeout: 30000 });
        await expect(
            page.getByTestId(`wsi-slide-item-${MOCK_IMAGE_ID}`)
        ).toBeVisible();
        await expect(page.getByTitle('Zoom in')).toBeVisible({
            timeout: 30000,
        });
        await expect(page.getByTitle('Fit to view')).toBeVisible();
        expect(new URL(page.url()).hash).toContain(`slide=${MOCK_IMAGE_ID}`);
        expect(enrichmentRequests).toEqual([]);
        expect(pageErrors).toEqual([]);
    });
}
