#!/usr/bin/env node
/**
 * Synthesize a minimal Playwright-JSON-reporter-shaped report.json from
 * a test-results/ directory. Useful for runs that forced --reporter=line
 * (no native JSON was written) but left per-test artifact folders behind.
 *
 * The synthesized report only surfaces failures (test-results/ only
 * contains failing-test directories), and lacks pass counts, durations,
 * and suite hierarchy — just enough for the failures-viewer SPA to list
 * the tests with their expected/actual/diff/trace attachments.
 *
 * Usage:
 *   node scripts/failures-viewer/synth-report.js [test-results-dir] [out-file]
 * Defaults: ./test-results  and  ./test-results/report.json
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || 'test-results');
const out = path.resolve(process.argv[3] || path.join(root, 'report.json'));

if (!fs.existsSync(root)) {
    console.error(`test-results dir not found: ${root}`);
    process.exit(1);
}

const dirs = fs
    .readdirSync(root, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

const specs = dirs.map(name => {
    const dir = path.join(root, name);
    const files = fs.readdirSync(dir);
    const attachments = [];
    files.forEach(f => {
        const full = path.join(dir, f);
        if (f === 'error-context.md')
            attachments.push({
                name: 'error-context',
                path: full,
                contentType: 'text/markdown',
            });
        else if (f === 'trace.zip')
            attachments.push({
                name: 'trace',
                path: full,
                contentType: 'application/zip',
            });
        else if (f === 'test-failed-1.png')
            attachments.push({
                name: 'screenshot',
                path: full,
                contentType: 'image/png',
            });
        else if (f.endsWith('-expected.png'))
            attachments.push({
                name: 'expected',
                path: full,
                contentType: 'image/png',
            });
        else if (f.endsWith('-actual.png'))
            attachments.push({
                name: 'actual',
                path: full,
                contentType: 'image/png',
            });
        else if (f.endsWith('-diff.png'))
            attachments.push({
                name: 'diff',
                path: full,
                contentType: 'image/png',
            });
        else if (f.endsWith('.webm'))
            attachments.push({
                name: 'video',
                path: full,
                contentType: 'video/webm',
            });
    });
    return {
        title: name,
        file: name,
        tests: [
            {
                projectName: 'chromium',
                results: [
                    {
                        status: 'failed',
                        retry: 0,
                        attachments,
                    },
                ],
            },
        ],
    };
});

const report = {
    config: { version: 'synthesized' },
    suites: [
        {
            title: 'synthesized from test-results/',
            file: '',
            specs,
        },
    ],
    stats: { failed: specs.length },
};

fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(`wrote ${out} with ${specs.length} failure(s)`);
