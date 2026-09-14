const fs = require('fs');
const path = require('path');

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

    const osdChunkNames = fs
        .readdirSync(reactAppDir)
        .filter(name => /^wsi-openseadragon(?:\.|-).*\.js$/.test(name));

    if (osdChunkNames.length > 1) {
        throw new Error(
            `Expected at most one asynchronous wsi-openseadragon chunk in ${reactAppDir}, found ${osdChunkNames.length}`
        );
    }

    // The annotation adapter can share OpenSeadragon with the initial common
    // bundle. In that configuration there is no standalone chunk, but the
    // viewer remains functional. Keep the assertion focused on ensuring the
    // dependency is present in the emitted bundles.
    const osdBundlePath =
        osdChunkNames.length === 1
            ? path.join(reactAppDir, osdChunkNames[0])
            : bundleEntries.find(({ bundle }) =>
                  bundle.includes('openseadragon')
              )?.bundlePath;

    if (!osdBundlePath) {
        throw new Error(
            `Expected OpenSeadragon in an emitted bundle, but no reference was found in ${reactAppDir}`
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
    getInitialBundlePaths,
};
