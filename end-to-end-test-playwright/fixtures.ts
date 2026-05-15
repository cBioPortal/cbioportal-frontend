import fs from 'fs';
import path from 'path';
import {
    test as baseTest,
    expect,
    Browser,
    BrowserContext,
    Locator,
    Page,
    TestInfo,
} from '@playwright/test';

// LOCALDEV defaults ON: the suite runs against the public cbioportal
// origin (e.g. https://www.cbioportal.org) but expects the locally-built
// frontend dist from https://localhost:3000 (served by serveDist) to be
// loaded into that origin. The backend gates that swap on a
// `?localdist=true` URL param — without the param, the public bundle
// loads and any local changes go untested. The sibling `?localdev=true`
// param is for the live webpack/rspack dev server and only swaps a
// subset of assets (notably it leaves styles.css alone), so it can't be
// used here. Opt out with LOCALDEV=0 to test the deployed bundle. The
// legacy WDIO suite handles this in end-to-end-test/shared/specUtils.js
// (getUrl/goToUrlAndSetLocalStorage, which picks `localdist` vs
// `localdev` via useLocalDist); this fixture is the Playwright
// equivalent and pins to `localdist` because CI's serveDist needs it.
//
// Test files should import { test, expect } from this module instead of
// from '@playwright/test' so the override applies uniformly. Tests that
// create their own page via `browser.newPage()` (e.g. inside
// describe.serial blocks that share a page across tests) are covered too,
// because we patch `browser.newPage` / `browser.newContext` here.
const LOCALDEV = process.env.LOCALDEV !== '0';

function withLocaldev(url: string): string {
    if (!LOCALDEV) return url;
    if (/[?&]localdist=/.test(url)) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}localdist=true`;
}

// Idempotent: page.goto already early-returns if localdev= is present, so
// double-patching is a no-op, but the symbol guard avoids stacking wrappers.
const PATCHED = Symbol.for('cbio-localdev-patched');

function patchPageGoto(page: Page): Page {
    if ((page as any)[PATCHED]) return page;
    (page as any)[PATCHED] = true;
    const originalGoto = page.goto.bind(page);
    page.goto = ((url: string, options?: Parameters<typeof originalGoto>[1]) =>
        originalGoto(withLocaldev(url), options)) as typeof page.goto;
    return page;
}

function patchContext(context: BrowserContext): BrowserContext {
    if ((context as any)[PATCHED]) return context;
    (context as any)[PATCHED] = true;
    const originalNewPage = context.newPage.bind(context);
    context.newPage = (async () =>
        patchPageGoto(await originalNewPage())) as typeof context.newPage;
    context.pages().forEach(patchPageGoto);
    context.on('page', patchPageGoto);
    return context;
}

function patchBrowser(browser: Browser): Browser {
    if ((browser as any)[PATCHED]) return browser;
    (browser as any)[PATCHED] = true;
    const originalNewPage = browser.newPage.bind(browser);
    const originalNewContext = browser.newContext.bind(browser);
    browser.newPage = (async (
        options?: Parameters<typeof originalNewPage>[0]
    ) =>
        patchPageGoto(
            await originalNewPage(options)
        )) as typeof browser.newPage;
    browser.newContext = (async (
        options?: Parameters<typeof originalNewContext>[0]
    ) =>
        patchContext(
            await originalNewContext(options)
        )) as typeof browser.newContext;
    return browser;
}

// HAR record/replay against *.cbioportal.org. Backend response timing is a
// significant source of remote_e2e flakiness — same test, slightly
// different DOM at screenshot time depending on which order/latency a
// dozen XHRs finished in. Routing those XHRs through a per-test HAR
// fixture takes the network out of the loop on replay: identical bytes,
// identical timing, identical screenshots.
//
// PW_HAR_MODE controls behavior:
//   record  — pass requests through to the real backend AND write them
//             to tests/__hars__/<spec>/<test-slug>.har. Use this to
//             refresh fixtures.
//   replay  — serve from the HAR. Requests missing from it pass through
//             to the network (notFound: 'fallback'); this lets a partial
//             HAR still work while you grow the corpus.
//   off (or unset) — fixture is a no-op; tests hit the real backend.
//
// Scope is restricted by URL to *.cbioportal.org so the local frontend
// bundle (localhost:3000 in LOCALDEV mode) and third-party origins
// (oncokb.org, genomenexus.org) flow through untouched. Limiting scope
// keeps HARs small and keeps "the frontend code under test" out of the
// frozen-in-time fixture.
const HAR_MODE = (process.env.PW_HAR_MODE || '').toLowerCase();
const HAR_URL_PATTERN = /^https?:\/\/[^/]*cbioportal\.org\//i;

function harPathFor(testInfo: TestInfo): string {
    // Per-test HAR (not per-spec) because routeFromHAR in `update: true`
    // overwrites the file on context close — multiple tests sharing one
    // HAR would clobber each other's recordings. Per-test files mean
    // `record` mode is idempotent: rerun a single test, only its HAR
    // moves.
    const specBasename = path.basename(testInfo.file).replace(/\.spec\.[tj]sx?$/, '');
    const slug = testInfo.titlePath
        .slice(1)
        .join('-')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase()
        .slice(0, 120);
    return path.join(
        path.dirname(testInfo.file),
        '__hars__',
        specBasename,
        `${slug}.har`
    );
}

async function setupHar(
    context: BrowserContext,
    testInfo: TestInfo
): Promise<void> {
    if (HAR_MODE !== 'record' && HAR_MODE !== 'replay') return;
    const harPath = harPathFor(testInfo);
    const recording = HAR_MODE === 'record';
    if (!recording && !fs.existsSync(harPath)) {
        // No fixture yet → don't install the route at all. The first
        // record run for this test will create it.
        return;
    }
    await context.routeFromHAR(harPath, {
        url: HAR_URL_PATTERN,
        update: recording,
        // 'attach' stores response bodies as separate sibling files
        // rather than base64-inlining them, keeping the .har JSON
        // small/diffable and the binary blobs as opaque files git can
        // still LFS-handle if needed.
        updateContent: 'attach',
        // 'minimal' drops timing, server IP, and other fields that
        // would otherwise churn on every re-record without changing
        // replay behavior.
        updateMode: 'minimal',
        // Fallback to the network on a miss in replay mode rather than
        // failing the request. Stricter ('abort') would surface gaps
        // immediately but breaks the test on the first new endpoint;
        // fallback lets the suite limp along until a fresh record pass.
        ...(recording ? {} : { notFound: 'fallback' as const }),
    });
}

export const test = baseTest.extend({
    browser: async ({ browser }, use) => {
        await use(patchBrowser(browser));
    },
    context: async ({ context }, use, testInfo) => {
        await setupHar(context, testInfo);
        await use(patchContext(context));
    },
    page: async ({ page }, use) => {
        await use(patchPageGoto(page));
    },
});

export { expect, Browser, BrowserContext, Locator, Page };
