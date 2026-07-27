import { Page } from '@playwright/test';

/**
 * Helpers specific to the localdb e2e suite (Keycloak-protected
 * cbioportal backend, locally-served frontend dist). The remote suite
 * runs against the public unauthenticated origin and doesn't need any
 * of this.
 *
 * Mirrors the wdio helpers in end-to-end-test/shared/specUtils_Async.js
 * (keycloakLogin, goToUrlAndSetLocalStorage, ...) but uses Playwright
 * locators / auto-waiting instead of waitForExist/isDisplayed dances.
 */

const KEYCLOAK_USERNAME = process.env.KEYCLOAK_USERNAME ?? 'testuser';
const KEYCLOAK_PASSWORD = process.env.KEYCLOAK_PASSWORD ?? 'P@ssword1';

export async function localStackUsesSaml(
    page: Page,
    baseUrl: string
): Promise<boolean> {
    const response = await page.request.get(baseUrl);
    const html = await response.text();
    const configMatch = html.match(/window\.rawServerConfig = (\{.*?\});/s);
    if (!configMatch) {
        return false;
    }

    try {
        const serverConfig = JSON.parse(configMatch[1]);
        const authMethod = serverConfig.authenticationMethod;
        return (
            typeof authMethod === 'string' &&
            authMethod.toLowerCase().includes('saml')
        );
    } catch {
        return false;
    }
}

export async function ensureLocalLogin(page: Page, baseUrl: string) {
    if (await localStackUsesSaml(page, baseUrl)) {
        await page.goto(`${baseUrl}/saml2/authenticate/cbio-idp`);
        await keycloakLogin(page);
        return;
    }

    await page.goto(baseUrl);
}

export async function localStackHasWsiCapabilityEndpoint(
    page: Page,
    baseUrl: string
): Promise<boolean> {
    const response = await page.request.get(
        `${baseUrl}/api/wsi/access-token?studyId=coad_msk_2025`,
        {
            failOnStatusCode: false,
        }
    );
    return response.status() !== 404;
}

/**
 * If the current URL is the Keycloak realm login form, submit the test
 * credentials and wait for the SAML round-trip to land back on the
 * portal. No-op when the page is already past the login (e.g. an
 * existing JSESSIONID kept the SAML flow from prompting again, or the
 * test has already authenticated earlier in the file).
 *
 * Note: page.goto resolves at the 'load' event for the *final* document
 * the SAML auto-submit form lands on, so by the time we check page.url
 * here, the URL has stabilized either at keycloak (login required) or
 * at the cbioportal origin (already authenticated). We don't need an
 * additional waitForFunction guard.
 */
export async function keycloakLogin(page: Page, timeoutMs = 30000) {
    // page.goto resolves at the 'load' event of whatever document it
    // first lands on, which during the SAML round-trip is often the
    // intermediate /saml2/authenticate auto-submit form (a static HTML
    // page that JS-submits to keycloak). Wait until navigation settles
    // on either the keycloak login form (auth required) or back on the
    // cbioportal origin (already authenticated).
    await page.waitForFunction(
        () => {
            const u = location.href;
            if (u.includes('/saml2/authenticate')) return false;
            if (u.includes('/login/saml2/')) return false;
            return true;
        },
        null,
        { timeout: timeoutMs }
    );
    if (!page.url().includes('/auth/realms/cbio')) {
        return; // already past the login page (existing keycloak session)
    }

    await page.locator('#username').fill(KEYCLOAK_USERNAME);
    await page.locator('#password').fill(KEYCLOAK_PASSWORD);
    // Submitting the keycloak form bounces the page through several
    // origins/paths in quick succession:
    //   keycloak login-actions/authenticate (POST 200, sets a self-
    //   submitting form) → localhost:8080/login/saml2/sso/cbio-idp
    //   (302) → localhost:8080/. We need to land on the *final*
    //   document — bailing out at the SAML callback intermediate page
    //   triggers "Execution context was destroyed" on the next
    //   page.evaluate.
    await Promise.all([
        page.waitForURL(
            url => {
                const s = url.toString();
                return (
                    !s.includes('/auth/realms/cbio') &&
                    !s.includes('/login/saml2/') &&
                    !s.includes('/saml2/authenticate')
                );
            },
            { timeout: timeoutMs, waitUntil: 'load' }
        ),
        page.locator('#kc-login').click(),
    ]);
}

/**
 * Navigate to `url`, log in via Keycloak when the SAML flow lands on
 * the realm login form, then write a frontendConfig.serverConfig
 * override into localStorage and reload so the override applies on the
 * next render. Mirrors the wdio
 * `goToUrlAndSetLocalStorageWithProperty`.
 */
export async function goToUrlAndSetLocalStorageWithProperty(
    page: Page,
    url: string,
    authenticated: boolean,
    serverConfig: Record<string, unknown>
) {
    await goToUrlAndSetLocalStorage(page, url, authenticated);
    await page.evaluate(props => {
        const existingConfigRaw = localStorage.getItem('frontendConfig');
        const existingConfig = existingConfigRaw
            ? JSON.parse(existingConfigRaw)
            : {};
        localStorage.setItem(
            'frontendConfig',
            JSON.stringify({
                ...existingConfig,
                serverConfig: {
                    ...(existingConfig.serverConfig ?? {}),
                    ...props,
                },
            })
        );
    }, serverConfig);
    await goToUrlAndSetLocalStorage(page, url, authenticated);
}

export async function goToUrlAndSetLocalStorage(
    page: Page,
    url: string,
    authenticated: boolean
) {
    await page.goto(url);
    if (authenticated) {
        await keycloakLogin(page);
        // The Keycloak SAML redirect drops URL fragments (#...). If the target
        // URL has a hash and the current URL no longer contains it (i.e. an
        // actual login just occurred), navigate again so the fragment is
        // processed by the app.
        const hashIndex = url.indexOf('#');
        if (hashIndex !== -1 && !page.url().includes(url.slice(hashIndex))) {
            await page.goto(url);
        }
    }
}
