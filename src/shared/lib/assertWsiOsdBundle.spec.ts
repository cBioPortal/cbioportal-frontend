import fs from 'fs';
import os from 'os';
import path from 'path';

const {
    assertWsiOsdBundle,
    OPENSEADRAGON_MARKER,
} = require('../../../scripts/assert_wsi_osd_bundle');

const OSD_LIBRARY = `console.error(${JSON.stringify(
    `${OPENSEADRAGON_MARKER} options is required`
)});`;
// The webpack runtime names async chunks in the initial bundle.
const RUNTIME_CHUNK_NAMES = 'n.u=e=>({546:"wsi-openseadragon"})[e]+".js";';

function makeTempDist() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wsi-osd-bundle-'));
    const distDir = path.join(root, 'dist');
    const reactAppDir = path.join(distDir, 'reactapp');
    fs.mkdirSync(reactAppDir, { recursive: true });
    return { root, distDir };
}

function writeBundleFixture(
    distDir: string,
    bundles: Record<string, string>,
    html = '<script defer src="/reactapp/common.bundle.js"></script><script defer src="/reactapp/main.app.js"></script>'
) {
    fs.writeFileSync(path.join(distDir, 'index.html'), html);
    Object.entries(bundles).forEach(([relativePath, content]) => {
        const targetPath = path.join(distDir, relativePath);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, content);
    });
}

function withDist(
    bundles: Record<string, string>,
    check: (distDir: string) => void
) {
    const { root, distDir } = makeTempDist();
    try {
        writeBundleFixture(distDir, bundles);
        check(distDir);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
}

describe('assertWsiOsdBundle', () => {
    it('accepts one asynchronous OpenSeadragon chunk', () => {
        withDist(
            {
                'reactapp/common.bundle.js': 'window.__common__ = true;',
                'reactapp/main.app.js': RUNTIME_CHUNK_NAMES,
                'reactapp/wsi-openseadragon.123.js': OSD_LIBRARY,
            },
            distDir => {
                const result = assertWsiOsdBundle({ distDir });
                expect(path.basename(result.osdBundlePath)).toBe(
                    'wsi-openseadragon.123.js'
                );
            }
        );
    });

    it('fails when OpenSeadragon is also in an initial bundle', () => {
        withDist(
            {
                'reactapp/common.bundle.js': OSD_LIBRARY,
                'reactapp/main.app.js': RUNTIME_CHUNK_NAMES,
                'reactapp/wsi-openseadragon.123.js': OSD_LIBRARY,
            },
            distDir =>
                expect(() => assertWsiOsdBundle({ distDir })).toThrow(
                    /initial bundle .*common\.bundle\.js/
                )
        );
    });

    it('fails when OpenSeadragon is in an initial bundle and no chunk is emitted', () => {
        withDist(
            {
                'reactapp/common.bundle.js': 'window.__common__ = true;',
                'reactapp/main.app.js': OSD_LIBRARY,
            },
            distDir =>
                expect(() => assertWsiOsdBundle({ distDir })).toThrow(
                    /initial bundle .*main\.app\.js/
                )
        );
    });

    it('fails when the asynchronous chunk is missing', () => {
        withDist(
            {
                'reactapp/common.bundle.js': 'window.__common__ = true;',
                'reactapp/main.app.js': RUNTIME_CHUNK_NAMES,
            },
            distDir =>
                expect(() => assertWsiOsdBundle({ distDir })).toThrow(
                    /Expected one asynchronous wsi-openseadragon chunk .* found 0/
                )
        );
    });

    it('fails when the asynchronous chunk does not hold OpenSeadragon', () => {
        withDist(
            {
                'reactapp/common.bundle.js': 'window.__common__ = true;',
                'reactapp/main.app.js': RUNTIME_CHUNK_NAMES,
                'reactapp/wsi-openseadragon.123.js': 'window.__osd__ = true;',
            },
            distDir =>
                expect(() => assertWsiOsdBundle({ distDir })).toThrow(
                    /Expected OpenSeadragon in the wsi-openseadragon chunk/
                )
        );
    });

    it('fails when multiple asynchronous chunks are emitted', () => {
        withDist(
            {
                'reactapp/common.bundle.js': 'window.__common__ = true;',
                'reactapp/main.app.js': RUNTIME_CHUNK_NAMES,
                'reactapp/wsi-openseadragon.123.js': OSD_LIBRARY,
                'reactapp/wsi-openseadragon.456.js': OSD_LIBRARY,
            },
            distDir =>
                expect(() => assertWsiOsdBundle({ distDir })).toThrow(
                    /Expected one asynchronous wsi-openseadragon chunk .* found 2/
                )
        );
    });
});
