import { test as baseTest, expect } from '@playwright/test';

// When LOCALDEV=1 the suite runs against the public cbioportal origin
// (e.g. https://www.cbioportal.org) but expects the locally-built
// frontend bundle from https://localhost:3000 to be loaded into that
// origin. The backend gates that swap on a `?localdev=true` URL param —
// without the param, the public bundle loads and any local changes go
// untested. The legacy WDIO suite handles this in
// end-to-end-test/shared/specUtils.js (getUrl/goToUrlAndSetLocalStorage);
// this fixture is the Playwright equivalent.
//
// Test files should import { test, expect } from this module instead of
// from '@playwright/test' so the override applies uniformly.
const LOCALDEV = process.env.LOCALDEV === '1';

function withLocaldev(url: string): string {
    if (!LOCALDEV) return url;
    if (/[?&]localdev=/.test(url)) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}localdev=true`;
}

export const test = baseTest.extend({
    page: async ({ page }, use) => {
        const originalGoto = page.goto.bind(page);
        page.goto = ((
            url: string,
            options?: Parameters<typeof originalGoto>[1]
        ) => originalGoto(withLocaldev(url), options)) as typeof page.goto;
        await use(page);
    },
});

export { expect };
