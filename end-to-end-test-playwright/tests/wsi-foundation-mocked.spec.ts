import { test, expect } from '../fixtures';
import {
    installFoundationMocks,
    STUDY_ID,
    PATIENT_ID,
    IMAGE_ID,
} from './wsi-foundation-mocks';

if (process.env.PW_SUITE === 'wsi' && process.env.WSI_CHILD_CONTRACT !== '1') {
    test.describe('WSI foundation browser contract', () => {
        test('loads a deep-linked slide and serves the viewer without enrichment', async ({
            page,
        }) => {
            const enrichmentRequests = await installFoundationMocks(page);
            const pageErrors: string[] = [];
            const consoleErrors: string[] = [];
            const tileResponses: number[] = [];
            await page.addInitScript(() => {
                (window as any).__wsiInitialSlidePerformance = [];
                window.addEventListener(
                    'wsi-initial-slide-performance',
                    event => {
                        (window as any).__wsiInitialSlidePerformance.push(
                            (event as CustomEvent).detail
                        );
                    }
                );
            });
            page.on('pageerror', error => pageErrors.push(error.message));
            page.on('console', message => {
                if (message.type() === 'error') {
                    consoleErrors.push(message.text());
                }
            });
            page.on('response', response => {
                if (/\/wsi\/tiles\//.test(new URL(response.url()).pathname)) {
                    tileResponses.push(response.status());
                }
            });

            await page.goto(
                `/wsi/patient/${PATIENT_ID}?studyId=${STUDY_ID}#wsi:slide=${IMAGE_ID}&x=256&y=256&z=0.75`
            );

            await expect(page.getByTestId('wsi-route-unavailable')).toHaveCount(
                0
            );
            await expect(
                page.getByTestId('wsi-filtered-slide-count')
            ).toHaveText('Showing 1 slide', { timeout: 30000 });
            await expect(
                page.getByTestId(`wsi-slide-item-${IMAGE_ID}`)
            ).toBeVisible();
            await expect(page.getByTitle('Zoom in')).toBeVisible({
                timeout: 30000,
            });
            await expect(page.getByTitle('Fit to view')).toBeVisible();
            await expect
                .poll(
                    () =>
                        page.evaluate(
                            () =>
                                (window as any).__wsiInitialSlidePerformance
                                    .length
                        ),
                    { timeout: 30000 }
                )
                .toBeGreaterThan(0);
            const performance = await page.evaluate(
                () => (window as any).__wsiInitialSlidePerformance.slice(-1)[0]
            );
            expect(performance.outcome).toBe('success');
            expect(performance.firstTileReadyMs).toBeGreaterThan(0);
            await expect.poll(() => tileResponses.length).toBeGreaterThan(0);
            expect(tileResponses.every(status => status === 200)).toBe(true);
            expect(new URL(page.url()).hash).toContain(`slide=${IMAGE_ID}`);
            expect(enrichmentRequests).toEqual([]);
            expect(pageErrors).toEqual([]);
            expect(consoleErrors).toEqual([]);
        });

        test('retries a failed OpenSeadragon chunk after the network recovers', async ({
            page,
        }) => {
            await installFoundationMocks(page);
            let chunkRequests = 0;
            await page.route('**/*', async route => {
                if (
                    route
                        .request()
                        .url()
                        .includes('wsi-openseadragon')
                ) {
                    chunkRequests += 1;
                    // The controller warms the chunk while hierarchy data is
                    // loading, then requests it again when mounting OSD.
                    // Fail both attempts so Retry is the first successful
                    // load after the network recovers.
                    if (chunkRequests <= 2) {
                        await route.abort('failed');
                        return;
                    }
                }
                await route.fallback();
            });

            await page.goto(`/wsi/patient/${PATIENT_ID}?studyId=${STUDY_ID}`);
            await expect(
                page.getByTestId('wsi-viewer-error')
            ).toContainText('OSD init error', { timeout: 30000 });
            await page.getByRole('button', { name: 'Retry' }).click();
            await expect(page.getByTitle('Fit to view')).toBeVisible({
                timeout: 30000,
            });
            expect(chunkRequests).toBeGreaterThanOrEqual(2);
        });
    });
}
