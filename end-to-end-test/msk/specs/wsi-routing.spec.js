const assert = require('assert');

const CBIOPORTAL_URL = (process.env.CBIOPORTAL_URL || '').replace(/\/$/, '');
const WSI_PATIENT_PATH = process.env.WSI_PATIENT_PATH;
const WSI_TILE_PATH = process.env.WSI_TILE_PATH;

if (!CBIOPORTAL_URL || !WSI_PATIENT_PATH || !WSI_TILE_PATH) {
    throw new Error(
        'Set CBIOPORTAL_URL, WSI_PATIENT_PATH, and WSI_TILE_PATH to run the MSK WSI routing test.'
    );
}

const expectedOrigin = new URL(CBIOPORTAL_URL).origin;

async function requestFromPortal(path) {
    return browser.execute(async requestPath => {
        const response = await fetch(requestPath, { credentials: 'include' });
        return {
            contentType: response.headers.get('content-type'),
            redirected: response.redirected,
            status: response.status,
            url: response.url,
        };
    }, path);
}

describe('MSK WSI routing', () => {
    before(async () => {
        assert.equal(
            new URL(CBIOPORTAL_URL).hostname,
            'cbioportal.mskcc.org',
            'This suite must target the MSK production hostname.'
        );
        await browser.url(CBIOPORTAL_URL);
    });

    for (const [name, path] of [
        ['patient metadata', WSI_PATIENT_PATH],
        ['tile', WSI_TILE_PATH],
    ]) {
        it(`${name} is served by the same-origin WSI route`, async () => {
            assert(path.startsWith('/'), `${name} path must start with /`);
            const result = await requestFromPortal(path);

            assert.equal(result.status, 200, JSON.stringify(result));
            assert.equal(result.redirected, false, JSON.stringify(result));
            assert.equal(new URL(result.url).origin, expectedOrigin);
            assert(!result.url.includes('slides.cbioportal.org'));
        });
    }
});
