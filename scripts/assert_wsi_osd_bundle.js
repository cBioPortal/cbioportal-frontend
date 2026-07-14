const fs = require('fs');
const path = require('path');

const bundlePath = path.join(
    __dirname,
    '..',
    'dist',
    'reactapp',
    'main.app.js'
);

if (!fs.existsSync(bundlePath)) {
    throw new Error(`Missing frontend bundle: ${bundlePath}`);
}

const bundle = fs.readFileSync(bundlePath, 'utf8');

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

const matched = forbiddenPatterns.filter(entry =>
    bundle.includes(entry.pattern)
);

if (matched.length > 0) {
    const details = matched
        .map(entry => `- ${entry.reason}: ${entry.pattern}`)
        .join('\n');
    throw new Error(
        `WSI OpenSeadragon bundle regression detected in ${bundlePath}\n${details}`
    );
}

if (!bundle.includes('openseadragon')) {
    throw new Error(
        `Expected OpenSeadragon to be bundled into ${bundlePath}, but no reference was found`
    );
}

console.log('WSI OpenSeadragon bundle check passed');
