const fs = require('fs');
const path = require('path');

const forbiddenPatterns = [
    {
        pattern: "localRequire('openseadragon')",
        reason: 'legacy OpenSeadragon lazy-loader wrapper still present',
    },
    {
        pattern: '/* require.ensure */',
        reason: 'require.ensure-based lazy loading still present',
    },
    {
        pattern: 'r.e("546")',
        reason: 'OpenSeadragon is still emitted as a separate lazy chunk',
    },
    {
        pattern: 'wsi-openseadragon',
        reason: 'OpenSeadragon lazy chunk name still present in main bundle',
    },
];

function getInitialBundlePaths(distDir, indexHtml) {
    const initialBundleMatches = [
        ...indexHtml.matchAll(/src="\/(reactapp\/[^"]+\.js)"/g),
    ];
    return initialBundleMatches.map(match => path.join(distDir, match[1]));
}

function assertWsiOsdBundle(options = {}) {
    const distDir =
        options.distDir || path.join(__dirname, '..', 'dist');
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

    const matched = bundleEntries.flatMap(({ bundlePath, bundle }) =>
        forbiddenPatterns
            .filter(entry => bundle.includes(entry.pattern))
            .map(entry => ({ ...entry, bundlePath }))
    );

    if (matched.length > 0) {
        const details = matched
            .map(
                entry =>
                    `- ${entry.reason} in ${entry.bundlePath}: ${entry.pattern}`
            )
            .join('\n');
        throw new Error(
            `WSI OpenSeadragon bundle regression detected in initial frontend bundles\n${details}`
        );
    }

    const osdBundlePath = bundleEntries.find(({ bundle }) =>
        bundle.includes('openseadragon')
    )?.bundlePath;

    if (!osdBundlePath) {
        throw new Error(
            `Expected OpenSeadragon to be bundled into one of the initial frontend bundles referenced by ${indexHtmlPath}, but no reference was found`
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
