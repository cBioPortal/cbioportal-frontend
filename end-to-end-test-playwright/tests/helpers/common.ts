import { expect, Locator, Page } from '@playwright/test';

/**
 * Shared Playwright helpers ported from
 * end-to-end-test/shared/specUtils_Async.js.
 *
 * Only the subset of wdio helpers that actually translates to
 * meaningful Playwright code lives here — Playwright's auto-waiting
 * locators collapse most of the wdio `waitFor*` ceremony.
 */

/** cbioportal exposes `window.ajaxQuiet` while any XHR is in-flight. */
export async function waitForNetworkQuiet(page: Page, timeoutMs = 30000) {
    await page.waitForFunction(() => (window as any).ajaxQuiet === true, null, {
        timeout: timeoutMs,
    });
}

/**
 * Wait for all in-flight CSS-driven font loads to settle, bounded so a
 * stuck @font-face fetch can't deadlock the test. ajaxQuiet only covers
 * XHRs — font subresources (e.g. font-awesome from cdnjs, app webfonts
 * from /reactapp/) aren't XHRs and finish independently. When the proxy
 * makes cbioportal API responses cache-fast, ajaxQuiet flips before the
 * icon font arrives, the screenshot snaps with system-font fallback
 * glyphs, and every text/icon line diffs by sub-pixels against the
 * reference. Calling this right before each snapshot eliminates that
 * race regardless of proxy presence.
 */
export async function waitForFontsLoaded(page: Page, timeoutMs = 8000) {
    try {
        await Promise.race([
            page.evaluate(async () => {
                const fonts = (document as any).fonts;
                if (!fonts) return;
                // document.fonts.ready only awaits fonts the browser
                // has *already chosen to fetch*. Chromium fetches
                // @font-face entries lazily — only when a glyph that
                // resolves to that family is needed for rendering —
                // so fonts.ready can resolve true before the icon
                // font (FontAwesome) has even been requested, even if
                // the page is already mid-render. Iterating and
                // calling load() on each registered FontFace forces
                // every declared @font-face to be fetched, after
                // which fonts.ready actually waits for them.
                const promises: Promise<unknown>[] = [];
                for (const f of fonts) {
                    promises.push(f.load().catch(() => {}));
                }
                await Promise.allSettled(promises);
                await fonts.ready;
            }),
            new Promise(resolve => setTimeout(resolve, timeoutMs)),
        ]);
    } catch {
        // Page closed / nav race — never block a screenshot on this.
    }
}

/** Convenience locator for elements tagged with a data-test attribute. */
export function byTestHandle(page: Page, handle: string): Locator {
    return page.locator(`[data-test="${handle}"]`);
}

/**
 * Screenshot `selector` with the mouse parked in the corner and hover
 * effects cleared — mirrors the wdio `checkElementWithMouseDisabled`
 * helper. Accepts an optional list of selectors to mask or hide so
 * tooltips / floating UI don't leak into the snapshot.
 */
export async function expectElementScreenshot(
    page: Page,
    selector: string,
    snapshotName: string,
    opts: {
        masks?: string[];
        hide?: string[];
        pauseMs?: number;
        // When true, the mouse is NOT moved to (0,0) before the snapshot.
        // Use this for tooltip tests where the hover must remain active so
        // the tooltip stays visible in the capture. In Docker/headless mode
        // the browser processes mouseleave events fast enough that the
        // tooltip disappears within its 50 ms leave-delay before the
        // screenshot is taken if the mouse is moved away.
        keepMouse?: boolean;
    } = {}
) {
    const target = page.locator(selector);
    await target.waitFor({ state: 'visible' });

    if (opts.hide?.length) {
        await page.addStyleTag({
            content: opts.hide
                .map(s => `${s} { opacity: 0 !important; }`)
                .join('\n'),
        });
    }

    if (!opts.keepMouse) {
        await page.mouse.move(0, 0);
    }
    if (opts.pauseMs) await page.waitForTimeout(opts.pauseMs);

    await waitForFontsLoaded(page);
    const mask = (opts.masks ?? ['.qtip']).map(s => page.locator(s));
    await expect(target).toHaveScreenshot(snapshotName, {
        mask,
        timeout: 30000,
    });
}

/**
 * Full-page screenshot variant: wdio's checkElementWithMouseDisabled with
 * selector='body'. Uses a fixed viewport so pages that render tall can
 * still produce deterministic captures.
 */
export async function expectPageScreenshot(
    page: Page,
    snapshotName: string,
    opts: {
        masks?: string[];
        hide?: string[];
        pauseMs?: number;
        fullPage?: boolean;
    } = {}
) {
    if (opts.hide?.length) {
        await page.addStyleTag({
            content: opts.hide
                .map(s => `${s} { opacity: 0 !important; }`)
                .join('\n'),
        });
    }
    await page.mouse.move(0, 0);
    if (opts.pauseMs) await page.waitForTimeout(opts.pauseMs);

    await waitForFontsLoaded(page);
    const mask = (opts.masks ?? ['.qtip']).map(s => page.locator(s));
    await expect(page).toHaveScreenshot(snapshotName, {
        mask,
        fullPage: opts.fullPage ?? false,
    });
}

/**
 * Clear and type into an input — the wdio setInputText sequence without
 * the `.clearValue()` race-condition workaround (Playwright's fill handles it).
 */
export async function setInputText(page: Page, selector: string, text: string) {
    const el = page.locator(selector);
    await el.fill('');
    await el.fill(text);
}

/**
 * Click a Bootstrap/React dropdown toggle and retry if the menu doesn't
 * settle into the desired open/closed state. Generic across the app.
 */
export async function setDropdownOpen(
    page: Page,
    open: boolean,
    buttonSel: string,
    dropdownSel: string,
    timeoutMs = 10000
) {
    const button = page.locator(buttonSel);
    const dropdown = page.locator(dropdownSel);
    await button.waitFor({ state: 'visible', timeout: timeoutMs });

    for (let i = 0; i < 5; i++) {
        const isOpen =
            (await dropdown.count()) > 0 && (await dropdown.isVisible());
        if (isOpen === open) return;
        await button.click();
        await page.waitForTimeout(200);
    }
    throw new Error(
        `Couldn't ${open ? 'open' : 'close'} dropdown ${dropdownSel}`
    );
}

/** Open/close the results-page global settings menu. */
export async function setResultsPageSettingsMenuOpen(
    page: Page,
    open: boolean
) {
    await setDropdownOpen(
        page,
        open,
        'button[data-test="GlobalSettingsButton"]',
        'div[data-test="GlobalSettingsDropdown"]'
    );
}

/** Wait until the study query page has rendered at least one cancer study row. */
export async function waitForStudyQueryPage(page: Page, timeoutMs = 20000) {
    await expect(
        page.locator('[data-test="cancerTypeListContainer"]')
    ).toBeVisible({ timeout: timeoutMs });
}

/** Wait until the study-view spinner clears. */
export async function waitForStudyView(page: Page, timeoutMs = 20000) {
    await expect(page.locator('.sk-spinner')).toHaveCount(0, {
        timeout: timeoutMs,
    });
}

/**
 * Write `{ serverConfig: props }` into `localStorage.frontendConfig`.
 * The app reads this at boot, so callers must navigate/reload *after*
 * setting it for the override to take effect.
 */
export async function setServerConfiguration(
    page: Page,
    props: Record<string, unknown>
) {
    await page.evaluate(serverConfig => {
        localStorage.setItem(
            'frontendConfig',
            JSON.stringify({ serverConfig })
        );
    }, props);
}

/**
 * Set a checkbox to the desired state, clicking only if its current
 * state doesn't match. Mirrors the wdio `setCheckboxChecked` helper.
 */
export async function setCheckboxChecked(
    page: Page,
    checked: boolean,
    selector: string
) {
    const cb = page.locator(selector);
    await cb.waitFor({ state: 'visible' });
    const isChecked = await cb.isChecked();
    if (isChecked !== checked) await cb.click();
}

/** Wait for the comparison-tab overlap chart to render. */
export async function waitForGroupComparisonTabOpen(
    page: Page,
    timeoutMs = 10000
) {
    await expect(
        page.locator('[data-test=ComparisonPageOverlapTabDiv]')
    ).toBeVisible({ timeout: timeoutMs });
}
