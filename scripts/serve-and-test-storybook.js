#!/usr/bin/env node
/**
 * Starts http-server on port 6006 serving storybook-static/,
 * runs Playwright visual tests, then shuts down the server.
 * Exit code mirrors the test result.
 */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const STORYBOOK_DIR = path.join(ROOT, 'storybook-static');
const PORT = 6006;

function waitForServer(url, retries = 20) {
    return new Promise((resolve, reject) => {
        const attempt = () => {
            http.get(url, res => {
                res.resume();
                resolve();
            }).on('error', () => {
                if (--retries <= 0) return reject(new Error(`Server at ${url} never started`));
                setTimeout(attempt, 500);
            });
        };
        attempt();
    });
}

async function main() {
    const server = spawn(
        process.execPath,
        [path.join(ROOT, 'node_modules/http-server/bin/http-server'), STORYBOOK_DIR, '-p', PORT, '--silent'],
        { stdio: 'inherit' }
    );

    try {
        await waitForServer(`http://localhost:${PORT}/`);
        console.log(`✓ Storybook static server ready on port ${PORT}`);

        const playwrightArgs = [
            'test',
            '-c',
            path.join(ROOT, 'storybook-visual-tests/playwright.config.ts'),
            ...process.argv.slice(2),
        ];

        const pw = spawn(
            path.join(ROOT, 'node_modules/.bin/playwright'),
            playwrightArgs,
            { stdio: 'inherit', cwd: ROOT }
        );

        const code = await new Promise(resolve => pw.on('close', resolve));
        process.exitCode = code;
    } finally {
        server.kill();
    }
}

main().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
