import { Page, test, expect } from '../fixtures';
import { ensureLocalLogin } from './local/helpers';

const baseUrl = process.env.WSI_VIEWER_BASE_URL ?? '';
const studyId = process.env.WSI_LIVE_STUDY_ID ?? 'msk_spectrum_tme_2022';
const patientId = process.env.WSI_LIVE_PATIENT_ID ?? 'P-0055908';
const tileUrl =
    process.env.WSI_PROXY_REHEARSAL === '1'
        ? `${baseUrl}/wsi`
        : process.env.TILE_SERVER_URL ?? baseUrl;
const cbioUrl = process.env.CBIO_URL ?? 'http://localhost:8080';

function viewerUrl(hash = '') {
    const resourceUrl = encodeURIComponent(
        `${tileUrl}/patient/${patientId}?studyId=${studyId}&cbioUrl=${cbioUrl}`
    );
    return `${baseUrl}/patient/wsiHESlides?studyId=${studyId}&caseId=${patientId}&resourceUrl=${resourceUrl}${hash}`;
}

async function ready(page: Page) {
    await expect(page.getByTestId('wsi-share-button')).toBeVisible({
        timeout: 60_000,
    });
}

function parseWsiHash(hash: string) {
    const params = new URLSearchParams(hash.replace(/^#wsi:/, ''));
    return {
        slide: params.get('slide'),
        x: Number(params.get('x')),
        y: Number(params.get('y')),
        z: Number(params.get('z')),
    };
}

test.describe('WSI viewer navigation contract', () => {
    test.beforeEach(async ({ page }) => {
        test.skip(!baseUrl, 'WSI_VIEWER_BASE_URL not set');
        await ensureLocalLogin(page, baseUrl);
    });

    test('restores a shared slide and viewport after reload', async ({
        page,
    }) => {
        await page.goto(viewerUrl('#wsi:slide=3020726&x=1200&y=1000&z=1.2'));
        await ready(page);
        await page.getByTestId('wsi-share-button').click();
        const beforeReload = parseWsiHash(
            await page.evaluate(() => window.location.hash)
        );
        expect(beforeReload.slide).toBe('3020726');
        expect(Number.isFinite(beforeReload.x)).toBe(true);
        expect(Number.isFinite(beforeReload.y)).toBe(true);
        expect(Number.isFinite(beforeReload.z)).toBe(true);

        await page.reload();
        await ready(page);
        await page.getByTestId('wsi-share-button').click();
        const afterReload = parseWsiHash(
            await page.evaluate(() => window.location.hash)
        );

        expect(afterReload.slide).toBe(beforeReload.slide);
        expect(Math.abs(afterReload.x - beforeReload.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(afterReload.y - beforeReload.y)).toBeLessThanOrEqual(1);
        expect(afterReload.z).toBeCloseTo(beforeReload.z, 2);
    });

    test('keeps hierarchy and tile requests on the frontend origin', async ({
        page,
    }) => {
        const requests: string[] = [];
        page.on('request', request => requests.push(request.url()));
        await page.goto(viewerUrl());
        await ready(page);
        const origin = new URL(baseUrl).origin;
        const wsiRequests = requests
            .map(url => new URL(url))
            .filter(
                url =>
                    url.pathname.startsWith('/api/wsi/') ||
                    url.pathname.startsWith('/wsi/tiles/')
            );
        expect(
            wsiRequests.some(url => url.pathname.startsWith('/api/wsi/'))
        ).toBe(true);
        expect(
            wsiRequests.some(url => url.pathname.startsWith('/wsi/tiles/'))
        ).toBe(true);
        if (process.env.WSI_PROXY_REHEARSAL === '1') {
            expect(wsiRequests.every(url => url.origin === origin)).toBe(true);
            expect(wsiRequests.some(url => url.port === '8081')).toBe(false);
        }
    });
});
