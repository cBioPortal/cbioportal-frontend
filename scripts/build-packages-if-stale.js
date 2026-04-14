#!/usr/bin/env node
/*
 * Build workspace packages, skipping any whose dist/ is up-to-date
 * relative to src/. Used by `yarn run buildModules` to avoid re-running
 * Rollup on unchanged packages.
 *
 * A package is "stale" if its src/ contains any file newer than
 * dist/index.js, or dist/index.js doesn't exist.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const packagesDir = path.join(repoRoot, 'packages');

function latestMtime(dir) {
    let latest = 0;
    if (!fs.existsSync(dir)) return -1;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === 'dist') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            const sub = latestMtime(full);
            if (sub > latest) latest = sub;
        } else {
            const st = fs.statSync(full);
            if (st.mtimeMs > latest) latest = st.mtimeMs;
        }
    }
    return latest;
}

const packages = fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .filter(name =>
        fs.existsSync(path.join(packagesDir, name, 'package.json'))
    );

const stale = [];
for (const pkg of packages) {
    const pkgDir = path.join(packagesDir, pkg);
    // Skip pure-config packages that have no build output
    const pj = JSON.parse(
        fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8')
    );
    if (!pj.scripts || !pj.scripts.build) {
        continue;
    }
    const srcMtime = latestMtime(path.join(pkgDir, 'src'));
    if (srcMtime < 0) continue; // no src dir — nothing to check
    const distFile = path.join(pkgDir, 'dist', 'index.js');
    const distMtime = fs.existsSync(distFile)
        ? fs.statSync(distFile).mtimeMs
        : -1;
    if (srcMtime > distMtime) {
        stale.push(pj.name);
    }
}

if (stale.length === 0) {
    console.log('[buildModules] all packages up-to-date, skipping');
    process.exit(0);
}

console.log(`[buildModules] building ${stale.length} stale package(s):`);
for (const n of stale) console.log('  - ' + n);

const scopeArgs = stale.flatMap(n => ['--scope', n]);
const result = spawnSync(
    'npx',
    [
        'lerna',
        'run',
        'build',
        '--ignore=cbioportal-frontend',
        '--stream',
        '--concurrency=4',
        ...scopeArgs,
    ],
    { stdio: 'inherit', cwd: repoRoot }
);
process.exit(result.status || 0);
