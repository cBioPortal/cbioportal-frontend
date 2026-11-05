import { test, expect } from '../fixtures';
import {
    installFoundationMocks,
    STUDY_ID,
    PATIENT_ID,
    SLIDE_KEY,
    SECOND_SLIDE_KEY,
    CLINICAL_CANCER_TYPE,
    sealedSourceFor,
    TileServerRequest,
} from './wsi-foundation-mocks';

/** A well-formed slide key that the hierarchy does not publish. */
const MISSING_SLIDE_KEY = '000000000000';

/** The slide key a tile or thumbnail request names. */
function requestedSlideKey(request: TileServerRequest): string {
    return new URL(request.url).searchParams.get('key') || '';
}

/**
 * Every tile and thumbnail request names a published slide by study, key and
 * sealed source, carries no Authorization header (the session cookie
 * authorizes it), and never names the source image.
 */
function expectSlideAddressedByKey(
    requests: TileServerRequest[],
    slideKeys: string[]
) {
    expect(requests.length).toBeGreaterThan(0);
    for (const request of requests) {
        const url = new URL(request.url);
        const key = url.searchParams.get('key') || '';
        expect(slideKeys).toContain(key);
        expect(url.searchParams.get('studyId')).toBe(STUDY_ID);
        expect(url.searchParams.get('enc')).toBe(sealedSourceFor(key));
        if (url.pathname.endsWith('/thumbnails')) {
            // The tile server sizes thumbnails itself.
            expect(url.searchParams.has('tw')).toBe(false);
            expect(url.searchParams.has('th')).toBe(false);
        } else {
            expect(url.pathname).toMatch(/\/wsi\/tiles\/zxy\/\d+\/\d+\/\d+$/);
        }
        expect(request.headers.authorization).toBeUndefined();
        expect(request.url).not.toMatch(/imageId|image_id/i);
    }
}

if (process.env.PW_SUITE === 'wsi') {
    test.describe('WSI foundation browser contract', () => {
        test('loads a deep-linked slide and serves the viewer without enrichment', async ({
            page,
        }) => {
            const accessRequests: string[] = [];
            const tileServerRequests: TileServerRequest[] = [];
            const enrichmentRequests = await installFoundationMocks(page, {
                accessRequests,
                tileServerRequests,
            });
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
                `/wsi/patient/${PATIENT_ID}?studyId=${STUDY_ID}#wsi:slide=${SLIDE_KEY}&x=256&y=256&z=0.75`
            );

            await expect(page.getByTestId('wsi-route-unavailable')).toHaveCount(
                0
            );
            await expect(
                page.getByTestId(`wsi-slide-item-${SLIDE_KEY}`)
            ).toBeVisible({ timeout: 30000 });
            // Nothing is filtered, so the list shows no slide count.
            await expect(
                page.getByTestId('wsi-filtered-slide-count')
            ).toHaveCount(0);
            await expect(
                page.getByRole('button', { name: 'Zoom in' })
            ).toBeVisible({
                timeout: 30000,
            });
            await expect(
                page.getByRole('button', { name: 'Fit to view' })
            ).toBeVisible();
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
            expect(new URL(page.url()).hash).toContain(`slide=${SLIDE_KEY}`);
            const clinical = page.getByTestId('wsi-sidebar-section-clinical');
            await expect(clinical).toContainText('Cancer Type Detailed');
            await expect(clinical).toContainText(CLINICAL_CANCER_TYPE);
            await expect(clinical).toContainText('Number of Samples');
            await expect(clinical).not.toContainText('Slide Available');
            // Slides are addressed only by their opaque key and sealed
            // source; no access token is requested.
            expectSlideAddressedByKey(tileServerRequests, [SLIDE_KEY]);
            expect(
                tileServerRequests.some(request =>
                    new URL(request.url).pathname.endsWith('/thumbnails')
                )
            ).toBe(true);
            expect(accessRequests).toEqual([]);
            const slideItem = page.getByTestId(`wsi-slide-item-${SLIDE_KEY}`);
            for (const attribute of ['title', 'aria-label']) {
                const value = (await slideItem.getAttribute(attribute)) ?? '';
                expect(value).not.toContain(SLIDE_KEY);
                expect(value).not.toContain(sealedSourceFor(SLIDE_KEY));
                expect(value).not.toMatch(/Barcode|Image ID|Accession/);
            }
            await expect(
                page.getByTestId('wsi-sidebar-section-imageProperties')
            ).not.toContainText(/Barcode|Image ID|Accession/);
            // The sealed source is sent, never shown.
            expect(await page.content()).not.toContain('sealed.');
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
            await expect(
                page.getByRole('button', { name: 'Fit to view' })
            ).toBeVisible({
                timeout: 30000,
            });
            expect(chunkRequests).toBeGreaterThanOrEqual(2);
        });

        test('opens the slide named by a slideKey link', async ({ page }) => {
            const tileServerRequests: TileServerRequest[] = [];
            await installFoundationMocks(page, {
                includeSecondSlide: true,
                tileServerRequests,
            });

            await page.goto(
                `/wsi/patient/${PATIENT_ID}?studyId=${STUDY_ID}&slideKey=${SECOND_SLIDE_KEY}`
            );

            await expect(
                page.getByTestId(`wsi-slide-item-${SECOND_SLIDE_KEY}`)
            ).toHaveAttribute('aria-current', 'true', { timeout: 30000 });
            await expect(
                page.locator('[data-testid^="wsi-slide-item-"]')
            ).toHaveCount(2);
            await expect(
                page.getByRole('button', { name: 'Fit to view' })
            ).toBeVisible({
                timeout: 30000,
            });
            await expect(
                page.getByTestId('wsi-requested-slide-unavailable')
            ).toHaveCount(0);
            await expect
                .poll(() => tileServerRequests.map(requestedSlideKey), {
                    timeout: 30000,
                })
                .toContain(SECOND_SLIDE_KEY);
            expectSlideAddressedByKey(tileServerRequests, [
                SLIDE_KEY,
                SECOND_SLIDE_KEY,
            ]);
            expect(new URL(page.url()).hash).toContain(
                `slide=${SECOND_SLIDE_KEY}`
            );
        });

        test('keeps a coordinate hash ahead of the slideKey link', async ({
            page,
        }) => {
            await installFoundationMocks(page, { includeSecondSlide: true });

            await page.goto(
                `/wsi/patient/${PATIENT_ID}?studyId=${STUDY_ID}&slideKey=${SECOND_SLIDE_KEY}#wsi:slide=${SLIDE_KEY}&x=256&y=256&z=0.75`
            );

            await expect(
                page.getByTestId(`wsi-slide-item-${SLIDE_KEY}`)
            ).toHaveAttribute('aria-current', 'true', { timeout: 30000 });
        });

        test('shows a notice and the default slide for an unknown slideKey without requesting it', async ({
            page,
        }) => {
            const accessRequests: string[] = [];
            const tileServerRequests: TileServerRequest[] = [];
            await installFoundationMocks(page, {
                includeSecondSlide: true,
                accessRequests,
                tileServerRequests,
            });

            await page.goto(
                `/wsi/patient/${PATIENT_ID}?studyId=${STUDY_ID}&slideKey=${MISSING_SLIDE_KEY}`
            );

            await expect(
                page.getByTestId('wsi-requested-slide-unavailable')
            ).toContainText('The requested slide is not available', {
                timeout: 30000,
            });
            await expect(
                page.getByTestId(`wsi-slide-item-${SLIDE_KEY}`)
            ).toHaveAttribute('aria-current', 'true', { timeout: 30000 });
            await expect(
                page.getByRole('button', { name: 'Fit to view' })
            ).toBeVisible({
                timeout: 30000,
            });
            await expect
                .poll(() => tileServerRequests.map(requestedSlideKey), {
                    timeout: 30000,
                })
                .toContain(SLIDE_KEY);
            // Tiles and thumbnails are only requested for slides the
            // hierarchy published; the unknown slide key never reaches the
            // tile server.
            expectSlideAddressedByKey(tileServerRequests, [
                SLIDE_KEY,
                SECOND_SLIDE_KEY,
            ]);
            expect(
                tileServerRequests.some(request =>
                    request.url.includes(MISSING_SLIDE_KEY)
                )
            ).toBe(false);
            expect(accessRequests).toEqual([]);
        });

        // Only refused tiles fail the slide; thumbnails may load or not.
        for (const [status, refuses] of [
            [401, 'all'],
            [403, 'all'],
            [401, 'tiles'],
        ] as const) {
            test(`asks to sign in again when the ingress answers ${status}${
                refuses === 'tiles' ? ' for tiles' : ''
            }`, async ({ page }) => {
                await installFoundationMocks(page, {
                    ingressStatus: status,
                    ingressRefuses: refuses,
                });

                await page.goto(
                    `/wsi/patient/${PATIENT_ID}?studyId=${STUDY_ID}`
                );

                await expect(
                    page.getByTestId('wsi-viewer-error')
                ).toContainText('sign in again', { timeout: 30000 });
                await expect(
                    page.getByRole('button', { name: 'Retry' })
                ).toBeVisible();
            });
        }

        test('opens the slide when the ingress refuses only its thumbnails', async ({
            page,
        }) => {
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
            page.on('response', response => {
                if (/\/wsi\/tiles\//.test(new URL(response.url()).pathname)) {
                    tileResponses.push(response.status());
                }
            });
            await installFoundationMocks(page, {
                ingressStatus: 403,
                ingressRefuses: 'thumbnails',
            });

            await page.goto(`/wsi/patient/${PATIENT_ID}?studyId=${STUDY_ID}`);

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
            expect(tileResponses.length).toBeGreaterThan(0);
            expect(tileResponses.every(status => status === 200)).toBe(true);
            await expect(page.getByTestId('wsi-viewer-error')).toHaveCount(0);
            await expect(
                page.getByRole('button', { name: 'Zoom in' })
            ).toBeVisible();
        });
    });
}
