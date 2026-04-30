import {
    test as baseTest,
    expect,
    Browser,
    BrowserContext,
    Page,
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

export const test = baseTest.extend({
    browser: async ({ browser }, use) => {
        await use(patchBrowser(browser));
    },
    context: async ({ context }, use) => {
        await use(patchContext(context));
    },
    page: async ({ page }, use) => {
        await use(patchPageGoto(page));
    },
});

export { expect };
