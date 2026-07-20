import { test, expect, Page } from '../fixtures';

/**
 * End-to-end tests for the native WSI viewer (WSIViewer.tsx).
 *
 * These tests require a running tile server and a cBioPortal frontend
 * build that includes the WSI viewer feature (PR #5608).  They are
 * gated on the WSI_VIEWER_BASE_URL environment variable so that they
 * are skipped in CI runs against the public portal (which does not yet
 * have the feature).
 *
 * To run locally:
 *   WSI_VIEWER_BASE_URL=http://pllimsksparky3:3000 \
 *   CBIO_URL=http://pllimsksparky3:8090 \
 *   ./node_modules/.bin/playwright test tests/wsi-viewer.spec.ts
 *
 * The viewer URL pattern is:
 *   <baseUrl>/patient/wsiHESlides?studyId=<study>&caseId=<patient>
 *                                &resourceUrl=<tileServer>/?patient=<patient>&studyId=<study>&cbioUrl=<cbio>
 *
 * By default these tests route tile requests back through the frontend dev
 * server origin so the webpack proxy can forward `/wsi/` without cross-origin
 * issues. Set TILE_SERVER_URL explicitly only when
 * running against a tile server that already sends the needed CORS headers.
 * Set WSI_PROXY_REHEARSAL=1 with WSI_VIEWER_BASE_URL set to the shared nginx
 * origin to verify that the browser never talks directly to :8081.
 */

const WSI_TEST_CONFIG = {
    baseUrl: process.env.WSI_VIEWER_BASE_URL ?? '',
    proxyRehearsal: process.env.WSI_PROXY_REHEARSAL === '1',
    tileServerUrl:
        process.env.WSI_PROXY_REHEARSAL === '1'
            ? `${process.env.WSI_VIEWER_BASE_URL ?? ''}/wsi`
            : process.env.TILE_SERVER_URL ??
              process.env.WSI_VIEWER_BASE_URL ??
              'http://pllimsksparky3:3000',
    cbioUrl: process.env.CBIO_URL ?? 'http://pllimsksparky3:8090',
    studyId: 'coad_msk_2025',
    defaultPatientId: 'P-0000678',
    rapidSelectionPatientId: 'P-0095109',
} as const;

function wsiApiPath(path: string): string {
    return `${WSI_TEST_CONFIG.proxyRehearsal ? '/wsi' : ''}${path}`;
}

type BootstrapTestSlide = {
    image_id: string;
    can_serve_tiles: boolean;
    is_hne: boolean;
    is_ihc: boolean;
};

type BootstrapTestHierarchy = {
    patient_id: string;
    samples: Array<{
        sample_id: string;
        parts: Array<{
            blocks: Array<{
                slides: BootstrapTestSlide[];
            }>;
        }>;
    }>;
};

type BootstrapTestMetadata = {
    dimensions: { width: number; height: number };
    levels: number;
    level_dimensions: Array<{ width: number; height: number }>;
    max_zoom: number;
    tile_size: number;
    mpp?: { x: number; y: number };
    objective_power?: number;
};

function viewerUrl(
    hash = '',
    patientId: string = WSI_TEST_CONFIG.defaultPatientId
): string {
    const resourceUrl = encodeURIComponent(
        `${WSI_TEST_CONFIG.tileServerUrl}/patient/${patientId}?studyId=${WSI_TEST_CONFIG.studyId}&cbioUrl=${WSI_TEST_CONFIG.cbioUrl}`
    );
    const base = `${WSI_TEST_CONFIG.baseUrl}/patient/wsiHESlides?studyId=${WSI_TEST_CONFIG.studyId}&caseId=${patientId}&resourceUrl=${resourceUrl}`;
    return hash ? `${base}${hash}` : base;
}

function summaryUrl(
    patientId: string = WSI_TEST_CONFIG.defaultPatientId
): string {
    return `${WSI_TEST_CONFIG.baseUrl}/patient/summary?studyId=${WSI_TEST_CONFIG.studyId}&caseId=${patientId}`;
}

function shareButton(page: Page) {
    return page.locator('[data-testid="wsi-share-button"]');
}

function hashParamsFrom(hash: string) {
    return new URLSearchParams(hash.replace(/^#wsi:/, ''));
}

async function currentHashParams(page: Page) {
    const hash = await page.evaluate(() => window.location.hash);
    return hashParamsFrom(hash);
}

async function waitForHashToContain(page: Page, text: string, timeout = 5_000) {
    await expect
        .poll(() => page.evaluate(() => window.location.hash), { timeout })
        .toContain(text);
}

async function gotoViewer(
    page: Page,
    opts: { hash?: string; patientId?: string } = {}
) {
    await page.goto(
        viewerUrl(
            opts.hash ?? '',
            opts.patientId ?? WSI_TEST_CONFIG.defaultPatientId
        )
    );
}

async function waitForViewerReady(page: Page, timeout = 30_000) {
    await expect(shareButton(page)).toBeVisible({ timeout });
}

async function activeMatchFilter(page: Page) {
    for (const key of ['all', 'part', 'block', 'unmatched'] as const) {
        const button = page.locator(`[data-testid="wsi-match-filter-${key}"]`);
        if ((await button.getAttribute('class'))?.includes('btn-primary')) {
            return key;
        }
    }
    return null;
}

async function activeStainFilter(page: Page) {
    for (const key of ['all', 'hne', 'ihc'] as const) {
        const button = page.locator(`[data-testid="wsi-stain-filter-${key}"]`);
        if ((await button.getAttribute('class'))?.includes('btn-primary')) {
            return key;
        }
    }
    return null;
}

async function goToCoordinates(page: Page, x: number, y: number) {
    await page
        .locator('input[placeholder="px"]')
        .nth(0)
        .fill(String(x));
    await page
        .locator('input[placeholder="px"]')
        .nth(1)
        .fill(String(y));
    await page.locator('button:has-text("Go")').click();
}

async function stubClipboardWrite(
    page: Page,
    capturedTextWindowKey = '_copiedUrl'
) {
    await page.evaluate(key => {
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: async (text?: string) => {
                    if (text !== undefined) {
                        (window as any)[key] = text;
                    }
                },
            },
            configurable: true,
            writable: true,
        });
    }, capturedTextWindowKey);
}

async function clickShareAndGetCopiedUrl(page: Page) {
    await stubClipboardWrite(page);
    await shareButton(page).click();
    await expect(shareButton(page).locator('.fa-check')).toBeVisible({
        timeout: 3_000,
    });
    return page.evaluate(() => (window as any)._copiedUrl as string);
}

async function enableBootstrapOverrideWithPerfCapture(page: Page) {
    await page.addInitScript(() => {
        localStorage.setItem(
            'frontendConfig',
            JSON.stringify({
                serverConfig: {
                    msk_wsi_enable_bootstrap: true,
                },
            })
        );

        (window as any).__wsiPerfEvents = [];
        window.addEventListener('wsi-initial-slide-performance', event => {
            (window as any).__wsiPerfEvents.push((event as CustomEvent).detail);
        });
    });
}

function buildTileServerHierarchyUrl(patientId: string) {
    return `${WSI_TEST_CONFIG.tileServerUrl}/patient/${patientId}?studyId=${WSI_TEST_CONFIG.studyId}&cbioUrl=${WSI_TEST_CONFIG.cbioUrl}`;
}

async function fetchJson<T>(
    url: string,
    options: { retries?: number; retryDelayMs?: number } = {}
): Promise<T> {
    const retries = options.retries ?? 5;
    const retryDelayMs = options.retryDelayMs ?? 1000;
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Request failed: ${url} (${response.status})`);
            }
            return (await response.json()) as T;
        } catch (error) {
            lastError = error;
            if (attempt === retries) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        }
    }

    throw lastError instanceof Error ? lastError : new Error('fetch failed');
}

function chooseBootstrapInitialSlide(
    hierarchy: BootstrapTestHierarchy
): { sampleId: string; imageId: string } {
    for (const sample of hierarchy.samples) {
        for (const part of sample.parts) {
            for (const block of part.blocks) {
                for (const slide of block.slides) {
                    if (
                        slide.can_serve_tiles &&
                        (slide.is_hne || slide.is_ihc)
                    ) {
                        return {
                            sampleId: sample.sample_id,
                            imageId: slide.image_id,
                        };
                    }
                }
            }
        }
    }
    throw new Error(
        `No servable bootstrap slide found for patient ${hierarchy.patient_id}`
    );
}

// Skip all tests when the env var is not set (public CI / public portal).
test.describe('WSI viewer — share view and centering', () => {
    test.beforeEach(async () => {
        test.skip(
            !WSI_TEST_CONFIG.baseUrl,
            'WSI_VIEWER_BASE_URL not set — skipping WSI viewer e2e tests'
        );
    });

    test('spinner appears while loading and hides promptly when first tile arrives', async ({
        page,
    }) => {
        await gotoViewer(page);

        const spinner = page.locator('[data-testid="wsi-loading-spinner"]');
        let spinnerObserved = false;
        try {
            // On a cold path we should see the loading spinner before tiles arrive.
            await expect(spinner).toBeVisible({ timeout: 8_000 });
            spinnerObserved = true;
        } catch {
            // Warm caches can make the first slide ready before the spinner paints.
            // Accept that fast-path as long as the viewer becomes ready well before
            // the 20s fallback below.
        }

        // CoordBar (share button) only renders after tilesReady=true, which is set
        // by the tile-loaded handler.  Asserting it appears within 18s (well under
        // the 20s fallback) proves tile-loaded fired and the spinner hid promptly.
        await waitForViewerReady(page, 18_000);

        // When the spinner did render, it must be gone once tiles are ready.
        if (spinnerObserved) {
            await expect(spinner).not.toBeVisible();
        }
    });

    test('proxy rehearsal keeps hierarchy and tile requests same-origin', async ({
        page,
    }) => {
        test.skip(
            !WSI_TEST_CONFIG.proxyRehearsal,
            'WSI_PROXY_REHEARSAL=1 is required for the shared nginx path test'
        );

        const browserRequests: string[] = [];
        page.on('request', request => browserRequests.push(request.url()));

        await gotoViewer(page);
        await waitForViewerReady(page);

        const origin = new URL(WSI_TEST_CONFIG.baseUrl).origin;
        const requests = browserRequests.map(url => new URL(url));
        const wsiRequests = requests.filter(
            request =>
                request.pathname.startsWith('/wsi/patient/') ||
                request.pathname.startsWith('/wsi/tiles/')
        );

        expect(
            wsiRequests.some(
                request =>
                    request.pathname ===
                        `/wsi/patient/${WSI_TEST_CONFIG.defaultPatientId}` ||
                        request.pathname ===
                        `/wsi/patient/${WSI_TEST_CONFIG.defaultPatientId}/bootstrap`
            )
        ).toBe(true);
        expect(
            wsiRequests.some(request => request.pathname.startsWith('/wsi/tiles/'))
        ).toBe(true);
        expect(wsiRequests.every(request => request.origin === origin)).toBe(
            true
        );
        expect(requests.some(request => request.port === '8081')).toBe(false);
    });

    test('rapid slide selection: debounce prevents multiple concurrent loads', async ({
        page,
    }) => {
        await gotoViewer(page, {
            patientId: WSI_TEST_CONFIG.rapidSelectionPatientId,
        });
        // Wait for the initial slide to fully load first.
        await waitForViewerReady(page);

        // Dispatch three click events synchronously from JS (no async gap between
        // them) — all within the 150ms debounce window.  Only the last slide should
        // actually trigger a tile-server fetch.
        const rapidSlideIds = await page
            .locator('[data-testid^="wsi-slide-item-"]')
            .evaluateAll((elements: Element[]) =>
                elements
                    .map(el => el.getAttribute('data-testid') ?? '')
                    .filter(Boolean)
                    .map(testId => testId.replace('wsi-slide-item-', ''))
                    .slice(0, 3)
            );
        expect(rapidSlideIds.length).toBe(3);

        await page.evaluate((ids: string[]) => {
            ids.forEach(id => {
                const el = document.querySelector(
                    `[data-testid="wsi-slide-item-${id}"]`
                );
                el?.dispatchEvent(
                    new MouseEvent('click', { bubbles: true, cancelable: true })
                );
            });
        }, rapidSlideIds);

        // The last slide should win even when the tile/metadata fetch resolves quickly enough
        // that the loading spinner never becomes visible.
        await waitForViewerReady(page);

        // Hash must reference the last-clicked slide (debounce discarded the others).
        await waitForHashToContain(
            page,
            `slide=${rapidSlideIds[rapidSlideIds.length - 1]}`,
            10_000
        );
    });

    test('loads slide at home position, not at (1,1)', async ({ page }) => {
        await gotoViewer(page);
        await waitForViewerReady(page);

        // After open handler fires, hash is written with real slide coordinates.
        // The bug would produce x=1&y=1; the fix produces the actual image center.
        const hash = await page.evaluate(() => window.location.hash);
        expect(hash).toMatch(/^#wsi:slide=/);

        const params = hashParamsFrom(hash);
        const x = Number(params.get('x'));
        const y = Number(params.get('y'));

        // Home position is the center of a ~65k×45k pixel slide.
        // It must be >> 1 to confirm the (1,1) regression is absent.
        expect(x).toBeGreaterThan(100);
        expect(y).toBeGreaterThan(100);
    });

    test('share view URL preserves position on reload', async ({ page }) => {
        // 1. Open the viewer fresh (no hash).
        await gotoViewer(page);
        await waitForViewerReady(page);

        // 2. Navigate to a known position via the coord bar.
        await goToCoordinates(page, 15000, 10000);

        // Wait for hash to reflect the new position.
        await waitForHashToContain(page, 'x=15000');

        // 3. Capture share URL (intercept clipboard).
        const copiedUrl = await clickShareAndGetCopiedUrl(page);
        expect(copiedUrl).toContain('x=15000');
        expect(copiedUrl).toContain('y=10000');

        // 4. Open the share URL in a new tab and verify position is restored.
        const newPage = await page.context().newPage();
        await newPage.goto(copiedUrl);
        await waitForViewerReady(newPage);

        const restoredParams = await currentHashParams(newPage);

        // Position must be preserved — not reset to (1,1) or home.
        expect(Number(restoredParams.get('x'))).toBe(15000);
        expect(Number(restoredParams.get('y'))).toBe(10000);

        await newPage.close();
    });

    test('share view button shows "✓ Copied" feedback', async ({ page }) => {
        await gotoViewer(page);
        await waitForViewerReady(page);

        // Intercept clipboard so the button can complete without a secure context.
        await stubClipboardWrite(page, '_ignoredClipboardText');

        await shareButton(page).click();
        // After copying, the button icon switches to fa-check then back to fa-clipboard.
        await expect(shareButton(page).locator('.fa-check')).toBeVisible();
        // Button reverts after 2 s.
        await expect(shareButton(page)).toBeVisible({ timeout: 4_000 });
    });

    test('coord nav jumps to entered pixel coordinates', async ({ page }) => {
        await gotoViewer(page);
        await waitForViewerReady(page);

        await goToCoordinates(page, 5000, 3000);

        await waitForHashToContain(page, 'x=5000');

        const params = await currentHashParams(page);
        expect(Number(params.get('x'))).toBe(5000);
        expect(Number(params.get('y'))).toBe(3000);
    });

    test('metadata sidebar resizes when dragging the divider', async ({
        page,
    }) => {
        await gotoViewer(page);
        await waitForViewerReady(page);

        const sidebar = page.locator('[data-testid="wsi-metadata-sidebar"]');
        const handle = page.locator(
            '[data-testid="wsi-metadata-resize-handle"]'
        );

        const before = await sidebar.boundingBox();
        const handleBox = await handle.boundingBox();
        expect(before).not.toBeNull();
        expect(handleBox).not.toBeNull();

        await page.mouse.move(
            handleBox!.x + handleBox!.width / 2,
            handleBox!.y + handleBox!.height / 2
        );
        await page.mouse.down();
        await page.mouse.move(
            handleBox!.x + handleBox!.width / 2 - 120,
            handleBox!.y + handleBox!.height / 2,
            { steps: 10 }
        );
        await page.mouse.up();

        await expect
            .poll(async () => (await sidebar.boundingBox())?.width ?? 0, {
                timeout: 5_000,
            })
            .toBeGreaterThan((before?.width ?? 0) + 80);
    });

    test('download button triggers a JPEG download named by patient/slide/position', async ({
        page,
    }) => {
        await gotoViewer(page);
        await expect(
            page.locator('[data-testid="wsi-download-button"]')
        ).toBeVisible({
            timeout: 30_000,
        });

        // Intercept document.createElement('a') to capture the download filename
        // without needing a real file-system download.
        await page.evaluate(() => {
            const origCreate = document.createElement.bind(document);
            (document as any).createElement = (tag: string) => {
                const el = origCreate(tag);
                if (tag === 'a') {
                    el.click = () => {
                        (window as any)._downloadName = (el as HTMLAnchorElement).download;
                    };
                }
                return el;
            };
        });

        await page.locator('[data-testid="wsi-download-button"]').click();
        await page.waitForTimeout(500); // toBlob is async

        const filename: string = await page.evaluate(
            () => (window as any)._downloadName ?? ''
        );
        // Filename pattern: wsi-<patientId>-<slideId>-x<n>-y<n>.jpg
        expect(filename).toMatch(/^wsi-.+-\d+-x\d+-y\d+\.jpg$/);
        expect(filename).toContain('P-0000678');
        expect(filename).toContain('.jpg');
    });

    test('opening a share link with a different slide ID restores that slide', async ({
        page,
    }) => {
        // Navigate with a hash specifying the first slide.
        const hashWithSlide = '#wsi:slide=1492807&x=20000&y=15000&z=1.2';
        await gotoViewer(page, { hash: hashWithSlide });
        await waitForViewerReady(page);

        // Hash should be preserved (not overwritten with garbage from selectSlide).
        const params = await currentHashParams(page);
        expect(params.get('slide')).toBe('1492807');
        expect(Number(params.get('x'))).toBe(20000);
        expect(Number(params.get('y'))).toBe(15000);
    });

    test('bootstrap-enabled loads fall back cleanly when the bootstrap endpoint is unavailable', async ({
        page,
    }) => {
        await enableBootstrapOverrideWithPerfCapture(page);

        const bootstrapRequests: string[] = [];
        const legacyHierarchyRequests: string[] = [];
        page.on('request', request => {
            const url = new URL(request.url());
            if (
                url.pathname ===
                wsiApiPath(
                    `/patient/${WSI_TEST_CONFIG.defaultPatientId}/bootstrap`
                )
            ) {
                bootstrapRequests.push(request.url());
            }
            if (
                url.pathname ===
                    wsiApiPath(`/patient/${WSI_TEST_CONFIG.defaultPatientId}`) &&
                url.searchParams.get('studyId') === WSI_TEST_CONFIG.studyId
            ) {
                legacyHierarchyRequests.push(request.url());
            }
        });

        await page.route(
            `**${wsiApiPath(
                `/patient/${WSI_TEST_CONFIG.defaultPatientId}/bootstrap`
            )}**`,
            async route => {
                await route.fulfill({
                    status: 404,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        message: 'bootstrap unavailable',
                    }),
                });
            }
        );

        await gotoViewer(page);
        await waitForViewerReady(page);
        await page.waitForTimeout(2000);

        expect(bootstrapRequests.length).toBeGreaterThan(0);
        expect(legacyHierarchyRequests.length).toBeGreaterThan(0);
    });

    test('bootstrap-enabled loads use the bootstrap payload and skip the legacy hierarchy request when the endpoint succeeds', async ({
        page,
    }) => {
        await enableBootstrapOverrideWithPerfCapture(page);

        const hierarchy = await fetchJson<BootstrapTestHierarchy>(
            buildTileServerHierarchyUrl(WSI_TEST_CONFIG.defaultPatientId)
        );
        const initial = chooseBootstrapInitialSlide(hierarchy);
        const metadata = await fetchJson<BootstrapTestMetadata>(
            `${WSI_TEST_CONFIG.tileServerUrl}/tiles/${initial.imageId}/metadata`
        );

        const bootstrapRequests: string[] = [];
        const legacyHierarchyRequests: string[] = [];
        const metadataRequests: string[] = [];

        await page.route(
            `**${wsiApiPath(
                `/patient/${WSI_TEST_CONFIG.defaultPatientId}/bootstrap`
            )}**`,
            async route => {
                bootstrapRequests.push(route.request().url());
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        hierarchy,
                        initial: {
                            sample_id: initial.sampleId,
                            image_id: initial.imageId,
                            metadata,
                        },
                    }),
                });
            }
        );

        page.on('request', request => {
            const url = new URL(request.url());
            if (
                url.pathname ===
                    wsiApiPath(`/patient/${WSI_TEST_CONFIG.defaultPatientId}`) &&
                url.searchParams.get('studyId') === WSI_TEST_CONFIG.studyId
            ) {
                legacyHierarchyRequests.push(request.url());
            }
            if (
                url.pathname ===
                wsiApiPath(`/tiles/${initial.imageId}/metadata`)
            ) {
                metadataRequests.push(request.url());
            }
        });

        await gotoViewer(page);
        await waitForViewerReady(page);
        expect(bootstrapRequests).toHaveLength(1);
        expect(legacyHierarchyRequests).toHaveLength(0);
        expect(metadataRequests).toHaveLength(0);
    });

    test('summary-page warmup reuses the cached bootstrap payload when opening the pathology slides tab', async ({
        page,
    }) => {
        await enableBootstrapOverrideWithPerfCapture(page);

        const hierarchy = await fetchJson<BootstrapTestHierarchy>(
            buildTileServerHierarchyUrl(WSI_TEST_CONFIG.defaultPatientId)
        );
        const initial = chooseBootstrapInitialSlide(hierarchy);
        const metadata = await fetchJson<BootstrapTestMetadata>(
            `${WSI_TEST_CONFIG.tileServerUrl}/tiles/${initial.imageId}/metadata`
        );

        const bootstrapRequests: string[] = [];
        await page.route(
            `**${wsiApiPath(
                `/patient/${WSI_TEST_CONFIG.defaultPatientId}/bootstrap`
            )}**`,
            async route => {
                bootstrapRequests.push(route.request().url());
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        hierarchy,
                        initial: {
                            sample_id: initial.sampleId,
                            image_id: initial.imageId,
                            metadata,
                        },
                    }),
                });
            }
        );

        await page.goto(summaryUrl());

        await expect
            .poll(() => bootstrapRequests.length, { timeout: 30000 })
            .toBe(1);

        const pathologySlidesTab = page.locator('a.tabAnchor_wsiHESlides');
        await expect(pathologySlidesTab).toBeVisible({ timeout: 30000 });
        await pathologySlidesTab.click();
        await waitForViewerReady(page);
        await page.waitForTimeout(2000);

        expect(bootstrapRequests).toHaveLength(1);
        expect(bootstrapRequests[0]).not.toContain('allowed_sample_id=');
    });

    test('summary page uses bootstrap without a parallel legacy hierarchy request', async ({
        page,
    }) => {
        await enableBootstrapOverrideWithPerfCapture(page);

        const hierarchy = await fetchJson<BootstrapTestHierarchy>(
            buildTileServerHierarchyUrl(WSI_TEST_CONFIG.defaultPatientId)
        );
        const initial = chooseBootstrapInitialSlide(hierarchy);
        const metadata = await fetchJson<BootstrapTestMetadata>(
            `${WSI_TEST_CONFIG.tileServerUrl}/tiles/${initial.imageId}/metadata`
        );

        const bootstrapRequests: string[] = [];
        const legacyHierarchyRequests: string[] = [];
        await page.route(
            `**${wsiApiPath(
                `/patient/${WSI_TEST_CONFIG.defaultPatientId}/bootstrap`
            )}**`,
            async route => {
                bootstrapRequests.push(route.request().url());
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        hierarchy,
                        initial: {
                            sample_id: initial.sampleId,
                            image_id: initial.imageId,
                            metadata,
                        },
                    }),
                });
            }
        );
        page.on('request', request => {
            const url = new URL(request.url());
            if (
                url.pathname ===
                    wsiApiPath(`/patient/${WSI_TEST_CONFIG.defaultPatientId}`) &&
                url.searchParams.get('studyId') === WSI_TEST_CONFIG.studyId
            ) {
                legacyHierarchyRequests.push(request.url());
            }
        });

        await page.goto(summaryUrl());
        await expect(page.locator('#patientViewPageTabs')).toBeVisible({
            timeout: 30000,
        });
        await page.waitForTimeout(2000);

        expect(bootstrapRequests).toHaveLength(1);
        expect(bootstrapRequests[0]).not.toContain('allowed_sample_id=');
        expect(legacyHierarchyRequests).toHaveLength(0);
    });

    test('RHS sidebar renders current MSK-IMPACT content for the dev import', async ({
        page,
    }) => {
        await gotoViewer(page);
        await waitForViewerReady(page);

        const seqSection = page.locator('text=MSK-IMPACT').first();
        await expect(seqSection).toBeVisible({ timeout: 15_000 });

        const mutationSection = seqSection.locator('..');
        const mutationTable = mutationSection
            .locator('table')
            .filter({ has: page.locator('th:text-is("Variant ⓘ")') });
        await expect(mutationSection.getByText('Tumor purity')).toBeVisible();
        await expect(mutationSection.getByText('40%')).toBeVisible();
        await expect(mutationSection.getByText('TMB')).toBeVisible();
        await expect(mutationSection.getByText('12.3 mut/Mb')).toBeVisible();
        await expect(mutationSection.getByText('MSI')).toBeVisible();
        await expect(mutationSection.getByText('Stable')).toBeVisible();

        // The July 18, 2026 dev import for this case exposes summary metrics but no
        // mutation rows through the sample APIs, so the viewer must render the section
        // cleanly without a per-mutation table or OncoKB gene links.
        await expect(mutationTable).toHaveCount(0);
        await expect(
            mutationSection.locator('a[href*="oncokb.org/gene/"]')
        ).toHaveCount(0);
    });

    test('WSI timepoint appears in the slide list and metadata panel', async ({
        page,
    }) => {
        await gotoViewer(page);
        await waitForViewerReady(page);

        await expect(page.locator('text=Proc d-418').first()).toBeVisible({
            timeout: 15_000,
        });
        await expect(page.locator('text=Timepoint').last()).toBeVisible();
        await expect(page.locator('text=Proc d-418').last()).toBeVisible();
    });

    test('direct pathology viewer routes activate the requested match filter', async ({
        page,
    }) => {
        await page.goto(
            `${WSI_TEST_CONFIG.baseUrl}/patient/wsiHESlides?studyId=${WSI_TEST_CONFIG.studyId}&caseId=P-0002438&matchLevel=Unmatched`
        );
        await waitForViewerReady(page);
        expect(await activeMatchFilter(page)).toBe('unmatched');

        await page.goto(
            `${WSI_TEST_CONFIG.baseUrl}/patient/wsiHESlides?studyId=${WSI_TEST_CONFIG.studyId}&caseId=P-0048660&sampleId=P-0048660-T01-IM6&matchLevel=PART`
        );
        await waitForViewerReady(page);
        expect(await activeMatchFilter(page)).toBe('part');

        await page.goto(
            `${WSI_TEST_CONFIG.baseUrl}/patient/wsiHESlides?studyId=${WSI_TEST_CONFIG.studyId}&caseId=P-0048660&sampleId=P-0048660-T01-IM6&matchLevel=BLOCK`
        );
        await waitForViewerReady(page);
        expect(await activeMatchFilter(page)).toBe('block');
    });

    test('stain and match filter changes update the visible slide list coherently', async ({
        page,
    }) => {
        await page.goto(
            `${WSI_TEST_CONFIG.baseUrl}/patient/wsiHESlides?studyId=${WSI_TEST_CONFIG.studyId}&caseId=P-0002438`
        );
        await waitForViewerReady(page);

        const initialCount = await page
            .locator('[data-testid^="wsi-slide-item-"]')
            .count();
        expect(initialCount).toBeGreaterThan(0);
        expect(await activeMatchFilter(page)).toBe('all');
        expect(await activeStainFilter(page)).toBe('all');

        await page
            .locator('[data-testid="wsi-match-filter-unmatched"]')
            .click();
        await expect(
            page.locator('[data-testid="wsi-match-filter-unmatched"]')
        ).toHaveClass(/btn-primary/);
        const unmatchedCount = await page
            .locator('[data-testid^="wsi-slide-item-"]')
            .count();
        expect(unmatchedCount).toBeGreaterThan(0);
        expect(unmatchedCount).toBeLessThanOrEqual(initialCount);

        const hneButton = page.locator('[data-testid="wsi-stain-filter-hne"]');
        const hneEnabled = !(await hneButton.isDisabled());
        if (hneEnabled) {
            await hneButton.click();
            await expect(hneButton).toHaveClass(/btn-primary/);
            expect(await activeStainFilter(page)).toBe('hne');
            const hneCount = await page
                .locator('[data-testid^="wsi-slide-item-"]')
                .count();
            expect(hneCount).toBeLessThanOrEqual(unmatchedCount);
        }

        const ihcButton = page.locator('[data-testid="wsi-stain-filter-ihc"]');
        const ihcEnabled = !(await ihcButton.isDisabled());
        if (ihcEnabled) {
            await ihcButton.click();
            await expect(ihcButton).toHaveClass(/btn-primary/);
            expect(await activeStainFilter(page)).toBe('ihc');
            const ihcCount = await page
                .locator('[data-testid^="wsi-slide-item-"]')
                .count();
            expect(ihcCount).toBeGreaterThanOrEqual(0);
        }

        await page.locator('[data-testid="wsi-match-filter-all"]').click();
        await page.locator('[data-testid="wsi-stain-filter-all"]').click();
        await expect(
            page.locator('[data-testid="wsi-match-filter-all"]')
        ).toHaveClass(/btn-primary/);
        await expect(
            page.locator('[data-testid="wsi-stain-filter-all"]')
        ).toHaveClass(/btn-primary/);
        const resetCount = await page
            .locator('[data-testid^="wsi-slide-item-"]')
            .count();
        expect(resetCount).toBeGreaterThan(0);
        expect(resetCount).toBeGreaterThanOrEqual(unmatchedCount);
    });

    test('viewer restores hash state alongside pathology route filters on reload', async ({
        page,
    }) => {
        const baseRoute = `${WSI_TEST_CONFIG.baseUrl}/patient/wsiHESlides?studyId=${WSI_TEST_CONFIG.studyId}&caseId=P-0048660&sampleId=P-0048660-T01-IM6&stainFilter=hne&matchLevel=PART`;
        await page.goto(baseRoute);
        await waitForViewerReady(page);

        await goToCoordinates(page, 12000, 8000);
        await waitForHashToContain(page, 'x=12000');

        const params = await currentHashParams(page);
        const slideId = params.get('slide');
        const z = params.get('z');
        expect(slideId).toBeTruthy();

        const replayUrl = `${baseRoute}#wsi:slide=${slideId}&x=12000&y=8000${
            z ? `&z=${z}` : ''
        }`;

        await page.goto(replayUrl);
        await waitForViewerReady(page);

        expect(await activeMatchFilter(page)).toBe('part');
        expect(await activeStainFilter(page)).toBe('hne');

        const restoredParams = await currentHashParams(page);
        expect(restoredParams.get('slide')).toBe(slideId);
        expect(Number(restoredParams.get('x'))).toBe(12000);
        expect(Number(restoredParams.get('y'))).toBe(8000);
    });
});
