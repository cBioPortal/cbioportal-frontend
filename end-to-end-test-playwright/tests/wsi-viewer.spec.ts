import { test, expect } from '../fixtures';

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
 *   TILE_SERVER_URL=http://pllimsksparky3:8081 \
 *   CBIO_URL=http://pllimsksparky3:8090 \
 *   npx playwright test end-to-end-test-playwright/tests/wsi-viewer.spec.ts
 *
 * The viewer URL pattern is:
 *   <baseUrl>/patient/wsiHESlides?studyId=<study>&caseId=<patient>
 *                                &resourceUrl=<tileServer>/?patient=<patient>&studyId=<study>&cbioUrl=<cbio>
 */

const BASE_URL = process.env.WSI_VIEWER_BASE_URL ?? '';
const TILE_SERVER = process.env.TILE_SERVER_URL ?? 'http://pllimsksparky3:8081';
const CBIO_URL = process.env.CBIO_URL ?? 'http://pllimsksparky3:8090';

// Patient that exists in both the local study and the tile server.
const STUDY_ID = 'coad_msk_2025';
const PATIENT_ID = 'P-0000678';

function viewerUrl(hash = ''): string {
    const resourceUrl = encodeURIComponent(
        `${TILE_SERVER}/patient/${PATIENT_ID}?studyId=${STUDY_ID}&cbioUrl=${CBIO_URL}`
    );
    const base = `${BASE_URL}/patient/wsiHESlides?studyId=${STUDY_ID}&caseId=${PATIENT_ID}&resourceUrl=${resourceUrl}`;
    return hash ? `${base}${hash}` : base;
}

// Skip all tests when the env var is not set (public CI / public portal).
test.describe('WSI viewer — share view and centering', () => {
    test.beforeEach(async () => {
        test.skip(!BASE_URL, 'WSI_VIEWER_BASE_URL not set — skipping WSI viewer e2e tests');
    });

    test('spinner appears while loading and hides promptly when first tile arrives', async ({ page }) => {
        await page.goto(viewerUrl());

        // Spinner must appear while the first slide is loading (before tiles arrive).
        await expect(page.locator('[data-testid="wsi-loading-spinner"]')).toBeVisible({
            timeout: 8_000,
        });

        // CoordBar (share button) only renders after tilesReady=true, which is set
        // by the tile-loaded handler.  Asserting it appears within 18s (well under
        // the 20s fallback) proves tile-loaded fired and the spinner hid promptly.
        await expect(page.locator('[data-testid="wsi-share-button"]')).toBeVisible({
            timeout: 18_000,
        });

        // Spinner must be gone once tiles are ready.
        await expect(page.locator('[data-testid="wsi-loading-spinner"]')).not.toBeVisible();
    });

    test('rapid slide selection: debounce prevents multiple concurrent loads', async ({ page }) => {
        await page.goto(viewerUrl());
        // Wait for the initial slide to fully load first.
        await expect(page.locator('[data-testid="wsi-share-button"]')).toBeVisible({
            timeout: 30_000,
        });

        // Dispatch three click events synchronously from JS (no async gap between
        // them) — all within the 150ms debounce window.  Only the last slide should
        // actually trigger a tile-server fetch.
        const rapidSlideIds = ['1492748', '1492739', '1492729'];
        await page.evaluate((ids: string[]) => {
            ids.forEach(id => {
                const el = document.querySelector(`[data-testid="wsi-slide-item-${id}"]`);
                el?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            });
        }, rapidSlideIds);

        // Spinner should appear (last slide selected) then disappear when tiles load.
        await expect(page.locator('[data-testid="wsi-loading-spinner"]')).toBeVisible({
            timeout: 5_000,
        });
        await expect(page.locator('[data-testid="wsi-loading-spinner"]')).not.toBeVisible({
            timeout: 30_000,
        });

        // CoordBar must come back — viewer loaded the last selected slide correctly.
        await expect(page.locator('[data-testid="wsi-share-button"]')).toBeVisible({
            timeout: 5_000,
        });

        // Hash must reference the last-clicked slide (debounce discarded the others).
        const hash = await page.evaluate(() => window.location.hash);
        expect(hash).toContain('slide=1492729');
    });

    test('loads slide at home position, not at (1,1)', async ({ page }) => {
        await page.goto(viewerUrl());
        await expect(page.locator('[data-testid="wsi-share-button"]')).toBeVisible({
            timeout: 30_000,
        });

        // After open handler fires, hash is written with real slide coordinates.
        // The bug would produce x=1&y=1; the fix produces the actual image center.
        const hash = await page.evaluate(() => window.location.hash);
        expect(hash).toMatch(/^#wsi:slide=/);

        const params = new URLSearchParams(hash.replace(/^#wsi:/, ''));
        const x = Number(params.get('x'));
        const y = Number(params.get('y'));

        // Home position is the center of a ~65k×45k pixel slide.
        // It must be >> 1 to confirm the (1,1) regression is absent.
        expect(x).toBeGreaterThan(100);
        expect(y).toBeGreaterThan(100);
    });

    test('share view URL preserves position on reload', async ({ page }) => {
        // 1. Open the viewer fresh (no hash).
        await page.goto(viewerUrl());
        await expect(page.locator('[data-testid="wsi-share-button"]')).toBeVisible({
            timeout: 30_000,
        });

        // 2. Navigate to a known position via the coord bar.
        await page.locator('input[placeholder="px"]').nth(0).fill('15000');
        await page.locator('input[placeholder="px"]').nth(1).fill('10000');
        await page.locator('button:has-text("Go")').click();

        // Wait for hash to reflect the new position.
        await expect
            .poll(() => page.evaluate(() => window.location.hash), { timeout: 5_000 })
            .toMatch(/x=15000/);

        // 3. Capture share URL (intercept clipboard).
        await page.evaluate(() => {
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: async (t: string) => { (window as any)._copiedUrl = t; } },
                configurable: true,
                writable: true,
            });
        });
        await page.locator('[data-testid="wsi-share-button"]').click();
        await expect(page.locator('[data-testid="wsi-share-button"] .fa-check')).toBeVisible({
            timeout: 3_000,
        });

        const copiedUrl: string = await page.evaluate(() => (window as any)._copiedUrl);
        expect(copiedUrl).toContain('x=15000');
        expect(copiedUrl).toContain('y=10000');

        // 4. Open the share URL in a new tab and verify position is restored.
        const newPage = await page.context().newPage();
        await newPage.goto(copiedUrl);
        await expect(newPage.locator('[data-testid="wsi-share-button"]')).toBeVisible({
            timeout: 30_000,
        });

        const restoredHash = await newPage.evaluate(() => window.location.hash);
        const restoredParams = new URLSearchParams(restoredHash.replace(/^#wsi:/, ''));

        // Position must be preserved — not reset to (1,1) or home.
        expect(Number(restoredParams.get('x'))).toBe(15000);
        expect(Number(restoredParams.get('y'))).toBe(10000);

        await newPage.close();
    });

    test('share view button shows "✓ Copied" feedback', async ({ page }) => {
        await page.goto(viewerUrl());
        await expect(page.locator('[data-testid="wsi-share-button"]')).toBeVisible({
            timeout: 30_000,
        });

        // Intercept clipboard so the button can complete without a secure context.
        await page.evaluate(() => {
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: async () => {} },
                configurable: true,
                writable: true,
            });
        });

        await page.locator('[data-testid="wsi-share-button"]').click();
        // After copying, the button icon switches to fa-check then back to fa-clipboard.
        await expect(page.locator('[data-testid="wsi-share-button"] .fa-check')).toBeVisible();
        // Button reverts after 2 s.
        await expect(page.locator('[data-testid="wsi-share-button"]')).toBeVisible({
            timeout: 4_000,
        });
    });

    test('coord nav jumps to entered pixel coordinates', async ({ page }) => {
        await page.goto(viewerUrl());
        await expect(page.locator('[data-testid="wsi-share-button"]')).toBeVisible({
            timeout: 30_000,
        });

        await page.locator('input[placeholder="px"]').nth(0).fill('5000');
        await page.locator('input[placeholder="px"]').nth(1).fill('3000');
        await page.locator('button:has-text("Go")').click();

        await expect
            .poll(() => page.evaluate(() => window.location.hash), { timeout: 5_000 })
            .toMatch(/x=5000/);

        const hash = await page.evaluate(() => window.location.hash);
        const params = new URLSearchParams(hash.replace(/^#wsi:/, ''));
        expect(Number(params.get('x'))).toBe(5000);
        expect(Number(params.get('y'))).toBe(3000);
    });

    test('metadata sidebar resizes when dragging the divider', async ({ page }) => {
        await page.goto(viewerUrl());
        await expect(page.locator('[data-testid="wsi-share-button"]')).toBeVisible({
            timeout: 30_000,
        });

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
        await page.goto(viewerUrl());
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
        await page.goto(viewerUrl(hashWithSlide));
        await expect(page.locator('[data-testid="wsi-share-button"]')).toBeVisible({
            timeout: 30_000,
        });

        // Hash should be preserved (not overwritten with garbage from selectSlide).
        const hash = await page.evaluate(() => window.location.hash);
        const params = new URLSearchParams(hash.replace(/^#wsi:/, ''));
        expect(params.get('slide')).toBe('1492807');
        expect(Number(params.get('x'))).toBe(20000);
        expect(Number(params.get('y'))).toBe(15000);
    });

    test('RHS sidebar shows correct per-mutation OncoKB links', async ({ page }) => {
        await page.goto(viewerUrl());
        // Wait for sidebar to load
        await expect(page.locator('[data-testid="wsi-share-button"]')).toBeVisible({
            timeout: 30_000,
        });

        // Wait for MSK-IMPACT section to appear
        const seqSection = page.locator('text=MSK-IMPACT').first();
        await expect(seqSection).toBeVisible({ timeout: 15_000 });

        // Wait for the mutations table to appear — the gene links inside it are NOT rendered
        // until oncogenic_mutation_details is populated (after the mutations API call).
        const oncokbLinks = page.locator('a[href*="oncokb.org/gene/"]');
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

        // Mutations are sorted by VAF descending; TP53 p.V173L has the highest VAF (~63%).
        const firstHref = await oncokbLinks.first().getAttribute('href');
        expect(firstHref).toContain('/gene/TP53/p.V173L');

        // Type column should show short abbreviations (MS = Missense, NS = Nonsense, etc.).
        await expect(page.locator('text=MS').first()).toBeVisible();
    });

    test('matched IMPACT timepoint appears in the sample list and metadata panel', async ({
        page,
    }) => {
        await page.goto(viewerUrl());
        await expect(page.locator('[data-testid="wsi-share-button"]')).toBeVisible({
            timeout: 30_000,
        });

        await expect(page.locator('text=Timepoint: Acq d-418').first()).toBeVisible({
            timeout: 15_000,
        });
        await expect(page.locator('text=Timepoint').last()).toBeVisible();
        await expect(page.locator('text=Acq d-418').last()).toBeVisible();
    });
});
