import { test, expect } from '@playwright/test';

/**
 * Diagnostic probe — not part of the regular suite. Confirms whether
 * the runner can:
 *   1. Create a WebGL context at all (i.e. SwiftShader is linked in).
 *   2. Get the renderer name (tells us SwiftShader vs SwANGLE vs HW).
 *   3. Read pixels back via canvas.toDataURL() (works even if Chromium's
 *      screenshot path skips GPU surfaces).
 *
 * Also probes the live oncoprint page to see whether the page's own
 * canvas elements are WebGL or 2D, and what their backing pixels look
 * like via toDataURL().
 *
 * Failures here are intentional — they're how the data surfaces in the
 * test report. Each test pushes its findings into the assertion
 * message so they show up in the merged HTML report.
 */

test.describe('webgl probe', () => {
    test('blank-page WebGL context + renderer name', async ({ page }) => {
        await page.goto('about:blank');
        const info = await page.evaluate(() => {
            const c = document.createElement('canvas');
            c.width = 256;
            c.height = 256;
            const gl =
                (c.getContext('webgl2') as WebGL2RenderingContext | null) ||
                (c.getContext('webgl') as WebGLRenderingContext | null) ||
                (c.getContext(
                    'experimental-webgl'
                ) as WebGLRenderingContext | null);
            if (!gl) return { ok: false, reason: 'getContext returned null' };
            const dbg = gl.getExtension('WEBGL_debug_renderer_info');
            const renderer = dbg
                ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)
                : gl.getParameter(gl.RENDERER);
            const vendor = dbg
                ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL)
                : gl.getParameter(gl.VENDOR);
            // Render a single red triangle to verify the pipeline
            gl.clearColor(1, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            const pixels = new Uint8Array(4);
            gl.readPixels(128, 128, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            return {
                ok: true,
                renderer,
                vendor,
                version: gl.getParameter(gl.VERSION),
                pixel: Array.from(pixels),
                dataUrlPrefix: c.toDataURL().slice(0, 60),
            };
        });
        // Print + assert a flag so the merged HTML shows something diagnostic
        console.log('WEBGL PROBE:', JSON.stringify(info, null, 2));
        expect(
            info,
            `WebGL probe result: ${JSON.stringify(info)}`
        ).toMatchObject({ ok: true });
    });

    test('oncoprint page canvases — count, type, dataURL prefix', async ({
        page,
    }) => {
        await page.goto(
            '/results/oncoprint?cancer_study_id=acc_tcga&Z_SCORE_THRESHOLD=2.0' +
                '&case_set_id=acc_tcga_all&data_priority=0&gene_list=BRAF&geneset_list=' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_gistic' +
                '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_mutations' +
                '&Action=Submit&tab_index=tab_visualize'
        );
        // Let the oncoprint actually render
        await page.waitForLoadState('networkidle', { timeout: 60_000 });
        await page.waitForTimeout(2000);

        const probe = await page.evaluate(() => {
            const canvases = Array.from(document.querySelectorAll('canvas'));
            return canvases.map((c, i) => {
                const types: Record<string, boolean> = {
                    webgl2: false,
                    webgl: false,
                    '2d': false,
                };
                for (const t of ['webgl2', 'webgl', '2d'] as const) {
                    try {
                        types[t] = !!c.getContext(t);
                    } catch (_) {}
                }
                let preview = '';
                try {
                    preview = c.toDataURL().slice(0, 50);
                } catch (e) {
                    preview = `toDataURL error: ${(e as Error).message}`;
                }
                return {
                    index: i,
                    width: c.width,
                    height: c.height,
                    boundingRect: {
                        w: Math.round(c.getBoundingClientRect().width),
                        h: Math.round(c.getBoundingClientRect().height),
                    },
                    contextTypes: types,
                    dataUrlPrefix: preview,
                };
            });
        });
        console.log('ONCOPRINT CANVASES:', JSON.stringify(probe, null, 2));
        expect(
            probe,
            `Oncoprint canvas inventory: ${JSON.stringify(probe)}`
        ).toBeTruthy();
    });
});
