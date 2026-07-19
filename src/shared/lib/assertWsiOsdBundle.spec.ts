import fs from 'fs';
import os from 'os';
import path from 'path';

const { assertWsiOsdBundle } = require('../../../scripts/assert_wsi_osd_bundle');

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

describe('assertWsiOsdBundle', () => {
    it('accepts OpenSeadragon bundled into an initial shared bundle', () => {
        const { root, distDir } = makeTempDist();
        try {
            writeBundleFixture(distDir, {
                'reactapp/common.bundle.js':
                    'window.__common__ = "openseadragon";',
                'reactapp/main.app.js': 'window.__main__ = true;',
            });

            const result = assertWsiOsdBundle({ distDir });

            expect(path.basename(result.osdBundlePath)).toBe(
                'common.bundle.js'
            );
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });

    it('fails when no initial bundle contains OpenSeadragon', () => {
        const { root, distDir } = makeTempDist();
        try {
            writeBundleFixture(distDir, {
                'reactapp/common.bundle.js': 'window.__common__ = true;',
                'reactapp/main.app.js': 'window.__main__ = true;',
            });

            expect(() => assertWsiOsdBundle({ distDir })).toThrow(
                /Expected OpenSeadragon to be bundled/
            );
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });

    it('fails when a legacy lazy-load pattern remains in an initial bundle', () => {
        const { root, distDir } = makeTempDist();
        try {
            writeBundleFixture(distDir, {
                'reactapp/common.bundle.js':
                    'window.__common__ = "openseadragon"; r.e("546");',
                'reactapp/main.app.js': 'window.__main__ = true;',
            });

            expect(() => assertWsiOsdBundle({ distDir })).toThrow(
                /OpenSeadragon is still emitted as a separate lazy chunk/
            );
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });
});
