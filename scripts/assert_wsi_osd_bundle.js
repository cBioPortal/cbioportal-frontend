const fs = require('fs');
const path = require('path');

// A message string of OpenSeadragon's own code, kept by minification. The
// library name alone is not enough: the webpack runtime in an initial bundle
// names the wsi-openseadragon chunk.
const OPENSEADRAGON_MARKER = '[Viewer.addTiledImage]';

function containsOpenSeadragon(bundle) {
    return bundle.includes(OPENSEADRAGON_MARKER);
}

function getInitialBundlePaths(distDir, indexHtml) {
    const initialBundleMatches = [
        ...indexHtml.matchAll(/src="\/(reactapp\/[^"]+\.js)"/g),
    ];
    return initialBundleMatches.map(match => path.join(distDir, match[1]));
}

function assertWsiOsdBundle(options = {}) {
    const distDir = options.distDir || path.join(__dirname, '..', 'dist');
    const reactAppDir = path.join(distDir, 'reactapp');
    const indexHtmlPath = path.join(distDir, 'index.html');

    if (!fs.existsSync(indexHtmlPath)) {
        throw new Error(`Missing frontend HTML entrypoint: ${indexHtmlPath}`);
    }

    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    const initialBundlePaths = getInitialBundlePaths(distDir, indexHtml);

    if (!initialBundlePaths.length) {
        throw new Error(
            `Could not find any initial frontend JS bundles in ${indexHtmlPath}`
        );
    }

    const bundleEntries = initialBundlePaths.map(bundlePath => {
        if (!fs.existsSync(bundlePath)) {
            throw new Error(`Missing frontend bundle: ${bundlePath}`);
        }

        return {
            bundlePath,
            bundle: fs.readFileSync(bundlePath, 'utf8'),
        };
    });

    const initialOsdBundle = bundleEntries.find(({ bundle }) =>
        containsOpenSeadragon(bundle)
    );
    if (initialOsdBundle) {
        throw new Error(
            `OpenSeadragon must only load in the asynchronous wsi-openseadragon chunk, but it is in the initial bundle ${initialOsdBundle.bundlePath}`
        );
    }

    const osdChunkNames = fs
        .readdirSync(reactAppDir)
        .filter(name => /^wsi-openseadragon(?:\.|-).*\.js$/.test(name));

    if (osdChunkNames.length !== 1) {
        throw new Error(
            `Expected one asynchronous wsi-openseadragon chunk in ${reactAppDir}, found ${osdChunkNames.length}`
        );
    }

    const osdBundlePath = path.join(reactAppDir, osdChunkNames[0]);
    if (!containsOpenSeadragon(fs.readFileSync(osdBundlePath, 'utf8'))) {
        throw new Error(
            `Expected OpenSeadragon in the wsi-openseadragon chunk ${osdBundlePath}`
        );
    }

    return {
        distDir,
        reactAppDir,
        osdBundlePath,
    };
}

if (require.main === module) {
    const result = assertWsiOsdBundle();
    console.log(
        `WSI OpenSeadragon bundle check passed (${path.relative(
            result.reactAppDir,
            result.osdBundlePath
        )})`
    );
}

module.exports = {
    assertWsiOsdBundle,
    OPENSEADRAGON_MARKER,
    getInitialBundlePaths,
};
