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
 *   npx playwright test end-to-end-test-playwright/tests/wsi-viewer.spec.ts
 *
 * The viewer URL pattern is:
 *   <baseUrl>/patient/wsiHESlides?studyId=<study>&caseId=<patient>
 *                                &resourceUrl=<tileServer>/?patient=<patient>&studyId=<study>&cbioUrl=<cbio>
 *
 * By default these tests route tile requests back through the frontend dev
 * server origin so the webpack proxy can forward `/patient/` and `/tiles/`
 * without cross-origin issues. Set TILE_SERVER_URL explicitly only when
 * running against a tile server that already sends the needed CORS headers.
 */

const WSI_TEST_CONFIG = {
    baseUrl: process.env.WSI_VIEWER_BASE_URL ?? '',
    tileServerUrl:
        process.env.TILE_SERVER_URL ??
        process.env.WSI_VIEWER_BASE_URL ??
        'http://pllimsksparky3:3000',
    cbioUrl: process.env.CBIO_URL ?? 'http://pllimsksparky3:8090',
    studyId: 'coad_msk_2025',
    defaultPatientId: 'P-0000678',
    rapidSelectionPatientId: 'P-0095109',
} as const;

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

async function waitForHashToContain(
    page: Page,
    text: string,
    timeout = 5_000
) {
    await expect
        .poll(() => page.evaluate(() => window.location.hash), { timeout })
        .toContain(text);
}

async function gotoViewer(
    page: Page,
    opts: { hash?: string; patientId?: string } = {}
) {
    await page.goto(
        viewerUrl(opts.hash ?? '', opts.patientId ?? WSI_TEST_CONFIG.defaultPatientId)
    );
}

async function waitForViewerReady(
    page: Page,
    timeout = 30_000
) {
    await expect(shareButton(page)).toBeVisible({ timeout });
}

async function goToCoordinates(page: Page, x: number, y: number) {
    await page.locator('input[placeholder="px"]').nth(0).fill(String(x));
    await page.locator('input[placeholder="px"]').nth(1).fill(String(y));
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

// Skip all tests when the env var is not set (public CI / public portal).
test.describe('WSI viewer — share view and centering', () => {
    test.beforeEach(async () => {
        test.skip(
            !WSI_TEST_CONFIG.baseUrl,
            'WSI_VIEWER_BASE_URL not set — skipping WSI viewer e2e tests'
        );
    });

    test('spinner appears while loading and hides promptly when first tile arrives', async ({ page }) => {
        await gotoViewer(page);

        // Spinner must appear while the first slide is loading (before tiles arrive).
        await expect(page.locator('[data-testid="wsi-loading-spinner"]')).toBeVisible({
            timeout: 8_000,
        });

        // CoordBar (share button) only renders after tilesReady=true, which is set
        // by the tile-loaded handler.  Asserting it appears within 18s (well under
        // the 20s fallback) proves tile-loaded fired and the spinner hid promptly.
        await waitForViewerReady(page, 18_000);

        // Spinner must be gone once tiles are ready.
        await expect(page.locator('[data-testid="wsi-loading-spinner"]')).not.toBeVisible();
    });

    test('rapid slide selection: debounce prevents multiple concurrent loads', async ({ page }) => {
        await gotoViewer(page, {
            patientId: WSI_TEST_CONFIG.rapidSelectionPatientId,
        });
        // Wait for the initial slide to fully load first.
        await waitForViewerReady(page);

        // Dispatch three click events synchronously from JS (no async gap between
        // them) — all within the 150ms debounce window.  Only the last slide should
        // actually trigger a tile-server fetch.
        const rapidSlideIds = await page.locator('[data-testid^="wsi-slide-item-"]').evaluateAll(
            (elements: Element[]) =>
                elements
                    .map(el => el.getAttribute('data-testid') ?? '')
                    .filter(Boolean)
                    .map(testId => testId.replace('wsi-slide-item-', ''))
                    .slice(0, 3)
        );
        expect(rapidSlideIds.length).toBe(3);

        await page.evaluate((ids: string[]) => {
            ids.forEach(id => {
                const el = document.querySelector(`[data-testid="wsi-slide-item-${id}"]`);
                el?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
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

    test('metadata sidebar resizes when dragging the divider', async ({ page }) => {
        await gotoViewer(page);
        await waitForViewerReady(page);

        const sidebar = page.locator('[data-testid="wsi-metadata-sidebar"]');
        const handle = page.locator('[data-testid="wsi-metadata-resize-handle"]');

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
            .poll(async () => (await sidebar.boundingBox())?.width ?? 0, { timeout: 5_000 })
            .toBeGreaterThan((before?.width ?? 0) + 80);
    });

    test('download button triggers a JPEG download named by patient/slide/position', async ({
        page,
    }) => {
        await gotoViewer(page);
        await expect(page.locator('[data-testid="wsi-download-button"]')).toBeVisible({
            timeout: 30_000,
        });

        // Intercept document.createElement('a') to capture the download filename
        // without needing a real file-system download.
        await page.evaluate(() => {
            const origCreate = document.createElement.bind(document);
            (document as any).createElement = (tag: string) => {
                const el = origCreate(tag);
                if (tag === 'a') {
                    el.click = () => { (window as any)._downloadName = (el as HTMLAnchorElement).download; };
                }
                return el;
            };
        });

        await page.locator('[data-testid="wsi-download-button"]').click();
        await page.waitForTimeout(500); // toBlob is async

        const filename: string = await page.evaluate(() => (window as any)._downloadName ?? '');
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

    test('RHS sidebar shows correct per-mutation OncoKB links', async ({ page }) => {
        await gotoViewer(page);
        // Wait for sidebar to load
        await waitForViewerReady(page);

        // Wait for MSK-IMPACT section to appear
        const seqSection = page.locator('text=MSK-IMPACT').first();
        await expect(seqSection).toBeVisible({ timeout: 15_000 });

        // Wait for the mutations table to appear — the gene links inside it are NOT rendered
        // until oncogenic_mutation_details is populated (after the mutations API call).
        const mutationSection = seqSection.locator('..');
        const oncokbLinks = mutationSection.locator('a[href*="oncokb.org/gene/"]');
        await expect(oncokbLinks.first()).toBeVisible({ timeout: 15_000 });

        // The mutations API returns 11 mutations for P-0000678-T01-IM3; all should have links.
        const count = await oncokbLinks.count();
        expect(count).toBe(11);

        // KRAS, ETV1, and SOX9 should all be visible in the table (ETV1 + SOX9 were previously
        // missing when CVR_ONCOGENIC_MUTATIONS was used as the source).
        await expect(page.locator('text=KRAS').first()).toBeVisible();
        await expect(page.locator('text=ETV1').first()).toBeVisible();
        await expect(page.locator('text=SOX9').first()).toBeVisible();

        // Variant column strips the "p." prefix for space saving.
        await expect(page.locator('text=G13D').first()).toBeVisible();

        // Every link should be a single-gene OncoKB URL.
        const allHrefs = await oncokbLinks.evaluateAll(
            (links: HTMLAnchorElement[]) => links.map(a => a.getAttribute('href') ?? '')
        );
        for (const href of allHrefs) {
            expect(href).not.toContain('%3B');
            expect(href).toMatch(/oncokb\.org\/gene\/[A-Z0-9]+\/p\./);
        }

        // Mutation ordering is annotation-first (OncoKB/CIViC/hotspot), not pure VAF order.
        // Assert representative links are present without pinning the first row to a
        // data-order assumption that no longer matches the viewer behavior.
        expect(allHrefs).toContain('https://www.oncokb.org/gene/KRAS/p.G13D');
        expect(allHrefs).toContain('https://www.oncokb.org/gene/TP53/p.V173L');

        // Type column should show short abbreviations (MS = Missense, NS = Nonsense, etc.).
        await expect(page.locator('text=MS').first()).toBeVisible();
    });

    test('matched IMPACT timepoint appears in the sample list and metadata panel', async ({
        page,
    }) => {
        await gotoViewer(page);
        await waitForViewerReady(page);

        await expect(page.locator('text=Timepoint: Acq d-418').first()).toBeVisible({
            timeout: 15_000,
        });
        await expect(page.locator('text=Timepoint').last()).toBeVisible();
        await expect(page.locator('text=Acq d-418').last()).toBeVisible();
    });
});
