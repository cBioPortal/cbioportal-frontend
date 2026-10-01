import { test, expect } from '../fixtures';
import {
    installFoundationMocks,
    STUDY_ID,
    PATIENT_ID,
    IMAGE_ID,
    SECOND_IMAGE_ID,
    CLINICAL_CANCER_TYPE,
} from './wsi-foundation-mocks';

/** "{study}/{patient}/{imageId}" of a slide access request. */
function slideAccessTarget(url: string): string {
    const parsed = new URL(url);
    const studyAndPatient = decodeURIComponent(parsed.pathname)
        .replace(/^.*\/api\/wsi\/v2\/resources\//, '')
        .replace(/\/access$/, '');
    return `${studyAndPatient}/${parsed.searchParams.get('imageId')}`;
}

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
            const clinical = page.getByTestId('wsi-sidebar-section-clinical');
            await expect(clinical).toContainText('Cancer Type Detailed');
            await expect(clinical).toContainText(CLINICAL_CANCER_TYPE);
            await expect(clinical).toContainText('Number of Samples');
            await expect(clinical).not.toContainText('Slide Available');
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

        test('opens the slide named by an encoded imageId link', async ({
            page,
        }) => {
            const accessRequests: string[] = [];
            await installFoundationMocks(page, {
                includeSecondSlide: true,
                accessRequests,
            });

            await page.goto(
                `/wsi/patient/${PATIENT_ID}?studyId=${STUDY_ID}&imageId=${encodeURIComponent(
                    SECOND_IMAGE_ID
                )}`
            );

            await expect(
                page.getByTestId('wsi-filtered-slide-count')
            ).toHaveText('Showing 2 slides', { timeout: 30000 });
            await expect(
                page.getByTestId(`wsi-slide-item-${SECOND_IMAGE_ID}`)
            ).toHaveAttribute('aria-current', 'true', { timeout: 30000 });
            await expect(page.getByTitle('Fit to view')).toBeVisible({
                timeout: 30000,
            });
            await expect(
                page.getByTestId('wsi-requested-slide-unavailable')
            ).toHaveCount(0);
            await expect
                .poll(() => accessRequests.map(slideAccessTarget), {
                    timeout: 30000,
                })
                .toContain(`${STUDY_ID}/${PATIENT_ID}/${SECOND_IMAGE_ID}`);
            expect(new URL(page.url()).hash).toContain(
                `slide=${encodeURIComponent(SECOND_IMAGE_ID)}`
            );
        });

        test('keeps a coordinate hash ahead of the imageId link', async ({
            page,
        }) => {
            await installFoundationMocks(page, { includeSecondSlide: true });

            await page.goto(
                `/wsi/patient/${PATIENT_ID}?studyId=${STUDY_ID}&imageId=${encodeURIComponent(
                    SECOND_IMAGE_ID
                )}#wsi:slide=${IMAGE_ID}&x=256&y=256&z=0.75`
            );

            await expect(
                page.getByTestId(`wsi-slide-item-${IMAGE_ID}`)
            ).toHaveAttribute('aria-current', 'true', { timeout: 30000 });
        });

        test('shows a notice and the default slide for an unknown imageId without requesting it', async ({
            page,
        }) => {
            const accessRequests: string[] = [];
            await installFoundationMocks(page, {
                includeSecondSlide: true,
                accessRequests,
            });

            await page.goto(
                `/wsi/patient/${PATIENT_ID}?studyId=${STUDY_ID}&imageId=missing-slide`
            );

            await expect(
                page.getByTestId('wsi-requested-slide-unavailable')
            ).toContainText('The requested slide is not available', {
                timeout: 30000,
            });
            await expect(
                page.getByTestId(`wsi-slide-item-${IMAGE_ID}`)
            ).toHaveAttribute('aria-current', 'true', { timeout: 30000 });
            await expect(page.getByTitle('Fit to view')).toBeVisible({
                timeout: 30000,
            });
            await expect
                .poll(() => accessRequests.length, { timeout: 30000 })
                .toBeGreaterThan(0);
            // Access is only requested for slides the hierarchy published; the
            // unknown image ID never reaches the backend.
            expect(accessRequests.map(slideAccessTarget)).toContain(
                `${STUDY_ID}/${PATIENT_ID}/${IMAGE_ID}`
            );
            expect(
                accessRequests
                    .map(slideAccessTarget)
                    .filter(
                        path =>
                            ![
                                `${STUDY_ID}/${PATIENT_ID}/${IMAGE_ID}`,
                                `${STUDY_ID}/${PATIENT_ID}/${SECOND_IMAGE_ID}`,
                            ].includes(path)
                    )
            ).toEqual([]);
            expect(
                accessRequests.some(url => url.includes('missing-slide'))
            ).toBe(false);
        });
    });
}
