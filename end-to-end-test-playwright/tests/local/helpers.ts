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
const BASIC_USERNAME = process.env.WSI_BASIC_LOGIN_USERNAME ?? 'wsi-ci-user';
const BASIC_PASSWORD = process.env.WSI_BASIC_LOGIN_PASSWORD ?? 'wsi-ci-password';

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
    // Submitting the Keycloak form bounces through the IdP and the portal's
    // SAML callback. Some local Spring Security responses leave the browser
    // on that callback document after setting the session cookie. The caller
    // verifies the session with a protected API request, so the callback is
    // a valid completion point for this helper.
    await Promise.all([
        page.waitForURL(
            url => {
                const s = url.toString();
                return (
                    !s.includes('/auth/realms/cbio') &&
                    !s.includes('/saml2/authenticate')
                );
            },
            { timeout: timeoutMs, waitUntil: 'load' }
        ),
        page.locator('#kc-login').click(),
    ]);
}

/** Open the configured auth portal (or frontend fallback) and log in. */
export async function ensureLocalLogin(
    page: Page,
    baseUrl: string,
    loginProbePath = '/'
) {
    const normalizedBase = baseUrl.endsWith('/')
        ? baseUrl.slice(0, -1)
        : baseUrl;
    const authPortalUrl = process.env.WSI_AUTH_PORTAL_URL;
    const authBase = authPortalUrl
        ? authPortalUrl.replace(/\/$/, '')
        : normalizedBase;
    // Start SAML at its explicit portal initiation endpoint. An API request
    // through the frontend proxy may be answered with JSON 401 rather than a
    // browser redirect, so it cannot reliably establish the session by itself.
    const loginUrl = authPortalUrl
        ? `${authBase}/saml2/authenticate/cbio-idp`
        : loginProbePath === '/'
        ? baseUrl
        : `${normalizedBase}${loginProbePath}`;
    await page.goto(loginUrl);
    await keycloakLogin(page);
    if (authPortalUrl) {
        // The local validation stack serves the portal over HTTP and the
        // frontend over HTTPS. Copy the authenticated portal cookies to the
        // frontend origin so the proxy request uses the same session.
        const frontendOrigin = new URL(normalizedBase).origin;
        const copyPortalCookies = async () => {
            const portalCookies = await page.context().cookies(authBase);
            await page.context().addCookies(
                portalCookies.map(({ domain: _domain, path: _path, ...cookie }) => ({
                    ...cookie,
                    url: frontendOrigin,
                    sameSite: 'Lax' as const,
                    secure: new URL(frontendOrigin).protocol === 'https:',
                }))
            );
            return portalCookies;
        };

        const portalProbe = await page.context().request.get(
            `${authBase}${loginProbePath}`,
            { maxRedirects: 0 }
        );
        let portalCookies = await copyPortalCookies();
        // Keycloak 16 can leave the browser on the Spring SAML callback after
        // posting a valid assertion. In that local fixture the callback does
        // not always persist the portal session, even though the SAML flow was
        // exercised. Keep the fallback explicit and local-only: it uses the
        // same `saml_plus_basic` stack and still verifies the protected proxy,
        // while making the failure actionable instead of reporting a viewer
        // error for a missing test session.
        if (
            portalProbe.status() >= 400 ||
            portalProbe.status() === 302
        ) {
            if (process.env.WSI_ALLOW_BASIC_FALLBACK !== 'true') {
                const cookieNames = portalCookies.map(cookie => cookie.name).join(',');
                throw new Error(
                    `SAML portal probe failed (${portalProbe.status()}); cookies=${cookieNames || 'none'}`
                );
            }
            const basicLogin = await page.context().request.post(
                `${authBase}/j_spring_security_check`,
                {
                    form: {
                        j_username: BASIC_USERNAME,
                        j_password: BASIC_PASSWORD,
                        user_id: BASIC_USERNAME,
                    },
                    maxRedirects: 0,
                }
            );
            if (basicLogin.status() !== 302) {
                throw new Error(`basic login fallback failed (${basicLogin.status()})`);
            }
            portalCookies = await copyPortalCookies();
        }
        const probe = await page.goto(`${normalizedBase}${loginProbePath}`);
        if (!probe || probe.status() >= 400) {
            throw new Error(
                `authenticated WSI probe failed (${probe?.status() ?? 'no response'})`
            );
        }
    }
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
        localStorage.setItem(
            'frontendConfig',
            JSON.stringify({ serverConfig: props })
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
