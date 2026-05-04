import { expect, Locator, Page } from '@playwright/test';

/**
 * Helpers ported from end-to-end-test/shared/specUtils_Async.js.
 * Scope: just what the oncoprint specs need. Not a full 1:1 port of the
 * wdio utility module — more helpers will be added as other specs get
 * ported. Kept deliberately thin: Playwright's auto-waiting locators
 * replace most of the wdio `waitFor*` dance, so the wdio helpers that
 * only existed to paper over wdio's lack of auto-retry collapse away.
 */

/** The oncoprint is ready when: loader is gone, legend SVG has painted, controls are mounted. */
export async function waitForOncoprint(page: Page, timeoutMs = 20000) {
    await expect(page.locator('.oncoprintLoadingIndicator')).toHaveCount(0, {
        timeout: timeoutMs,
    });
    await expect(page.locator('#oncoprintDiv svg rect').first()).toBeAttached({
        timeout: timeoutMs,
    });
    await expect(page.locator('.oncoprint__controls')).toBeAttached({
        timeout: timeoutMs,
    });
    // Wait for the legend SVG to actually paint at least one <text> node
    // rather than sleeping for a fixed 1s. The legend renders after the
    // data grid; this is the deterministic signal that the wdio-era
    // 1000ms `waitForTimeout` was approximating.
    await expect(
        page.locator('#oncoprintDiv .oncoprint-legend-div svg text').first()
    ).toBeAttached({ timeout: timeoutMs });
}

/**
 * Track options button/dropdown selectors for the nth track (1-indexed).
 * The oncoprintjs library tags each track's options toggle with `.nth-N`.
 */
export function getNthOncoprintTrackOptionsSelectors(n: number) {
    return {
        button: `#oncoprintDiv .oncoprintjs__track_options__toggle_btn_img.nth-${n}`,
        dropdown: `#oncoprintDiv .oncoprintjs__track_options__dropdown.nth-${n}`,
    };
}

/** Track-group header options selectors (0-indexed). */
export function getGroupHeaderOptionsSelectors(trackGroupIndex: number) {
    return {
        button: `#oncoprintDiv .oncoprintjs__header__toggle_btn_img.track-group-${trackGroupIndex}`,
        dropdown: `#oncoprintDiv .oncoprintjs__header__dropdown.track-group-${trackGroupIndex}`,
    };
}

/**
 * Toggle a dropdown to the desired open/closed state. Equivalent to the
 * wdio setDropdownOpen helper — click the button, retry if the dropdown
 * didn't reach the expected visibility state.
 */
export async function setDropdownOpen(
    page: Page,
    open: boolean,
    buttonSel: string,
    dropdownSel: string
) {
    const button = page.locator(buttonSel);
    const dropdown = page.locator(dropdownSel);
    await button.waitFor({ state: 'visible', timeout: 10000 });

    for (let attempt = 0; attempt < 5; attempt++) {
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

/** Open (or close) the "Mutations" color menu in the oncoprint controls. */
export async function setOncoprintMutationsMenuOpen(page: Page, open: boolean) {
    const button = '#mutationColorDropdown';
    const dropdown = 'div.oncoprint__controls__mutation_color_menu';
    await page.locator('div.oncoprint__controls').hover();
    await page.locator(button).waitFor({ state: 'visible' });
    for (let attempt = 0; attempt < 5; attempt++) {
        const isOpen = await page.locator(dropdown).isVisible();
        if (isOpen === open) return;
        await page.locator(button).click();
        await page.waitForTimeout(200);
    }
    throw new Error(`Couldn't ${open ? 'open' : 'close'} mutations menu`);
}

/** Open (or close) the global-settings menu on the results page. */
export async function setSettingsMenuOpen(
    page: Page,
    open: boolean,
    buttonId = 'GlobalSettingsButton'
) {
    const button = `button[data-test="${buttonId}"]`;
    const dropdown = `div[data-test="GlobalSettingsDropdown"]`;
    await page.locator(button).waitFor({ state: 'visible' });
    for (let attempt = 0; attempt < 5; attempt++) {
        const isOpen = await page.locator(dropdown).isVisible();
        if (isOpen === open) return;
        await page.locator(button).click();
        await page.waitForTimeout(200);
    }
    throw new Error(`Couldn't ${open ? 'open' : 'close'} settings menu`);
}

/**
 * Screenshot the oncoprint with hover effects and floating UI suppressed.
 * Wraps Playwright's toHaveScreenshot with the same hides/masks the wdio
 * checkOncoprintElement helper used. Callers pass the snapshot name.
 */
export async function expectOncoprintScreenshot(
    page: Page,
    snapshotName: string,
    opts: { selector?: string; extraMasks?: string[] } = {}
) {
    const target = page.locator(opts.selector ?? '.oncoprintContainer');

    // If the view-dropdown ended up open from a prior interaction, close it
    // so it doesn't leak into the screenshot (mirrors wdio behavior).
    await page.evaluate(() => {
        const open = document.querySelector(
            '.oncoprint__controls .open #viewDropdownButton'
        );
        if (open instanceof HTMLElement) open.click();
    });

    // Clear any hover highlights the oncoprint canvas may be holding.
    await page.evaluate(() => {
        const fo = (window as any).frontendOnc;
        if (fo?.clearMouseOverEffects) fo.clearMouseOverEffects();
    });

    // Park the mouse so tooltips/hovers don't leak in.
    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);

    const maskSelectors = [
        '.qtip',
        '.dropdown-menu',
        '.oncoprintjs__track_options__dropdown',
        // Do NOT mask .oncoprintjs__cell_overlay_div — it's a full-size
        // transparent hit-testing div over the entire oncoprint cell
        // grid + heatmap area. Playwright's mask paints matched
        // elements solid magenta, so masking this one wipes out the
        // entire data region of every screenshot. Tooltip/hover state
        // is already cleared above via clearMouseOverEffects + the
        // page.mouse.move(0, 0) park, which is what the overlay was
        // (incorrectly) being masked for.
        ...(opts.extraMasks ?? []),
    ];
    const mask = maskSelectors.map(s => page.locator(s));

    await expect(target).toHaveScreenshot(snapshotName, { mask });
}

/** Wait until exactly `n` study checkboxes are present on the query page. */
export async function waitForNumberOfStudyCheckboxes(page: Page, n: number) {
    await expect(
        page.locator('[data-test="StudySelect"] input[type="checkbox"]')
    ).toHaveCount(n, { timeout: 30000 });
}

/** Clear an input and type the given text. */
export async function setInputText(page: Page, selector: string, text: string) {
    const el = page.locator(selector);
    await el.fill('');
    await el.fill(text);
}

/** Evaluate an expression against `window.frontendOnc` inside the page. */
export async function evalFrontendOnc<T>(
    page: Page,
    fn: (onc: any) => T
): Promise<T> {
    return await page.evaluate(
        fnSource =>
            new Function('onc', `return (${fnSource})(onc)`)(
                (window as any).frontendOnc
            ),
        fn.toString()
    );
}

/** Concatenated text of every <text> node in the oncoprint legend SVG. */
export async function getTextInOncoprintLegend(page: Page): Promise<string> {
    return await page.evaluate(() => {
        const nodes = document.querySelectorAll(
            '#oncoprintDiv .oncoprint-legend-div svg text'
        );
        return Array.from(nodes)
            .map(n => n.innerHTML)
            .join(' ');
    });
}

/** Sample/patient id order produced by the oncoprint model. */
export async function getFrontendOncIdOrder(page: Page): Promise<string> {
    return await page.evaluate(() =>
        (window as any).frontendOnc.getIdOrder().join(',')
    );
}

/** Number of tracks currently in the oncoprint model. */
export async function getFrontendOncTrackCount(page: Page): Promise<number> {
    return await page.evaluate(
        () => (window as any).frontendOnc.model.getTracks().length
    );
}

/**
 * 1-indexed position of the first track whose label matches `pattern`,
 * or -1 if none. Matches the `.nth-N` suffix the oncoprintjs view
 * attaches to each track's options button/dropdown — see
 * oncoprinttrackoptionsview.ts, where nth-(i+1) is assigned in
 * getTracks() iteration order. Reads the model directly so callers can
 * skip the brittle "probe each Edit-Colors modal to read its title"
 * dance.
 */
export async function findOncoprintTrackIndexByLabel(
    page: Page,
    pattern: RegExp
): Promise<number> {
    return await page.evaluate(
        src => {
            const re = new RegExp(src.source, src.flags);
            const model = (window as any).frontendOnc.model;
            const ids = model.getTracks();
            for (let i = 0; i < ids.length; i++) {
                const label = model.getTrackLabel(ids[i]) || '';
                if (re.test(label)) return i + 1;
            }
            return -1;
        },
        { source: pattern.source, flags: pattern.flags }
    );
}

/** Click the "Query by Gene" button once it's enabled. */
export async function clickQueryByGeneButton(page: Page) {
    const btn = page.locator('[data-test=queryByGeneButton]');
    await expect(btn).not.toHaveClass(/disabled/);
    await btn.click();
    // Page scrolls to the gene query box; ensure it's in view.
    await page.evaluate(() => window.scrollTo(0, 0));
}

/** Helper matching wdio `getElementByTestHandle`. */
export function byTestHandle(page: Page, handle: string): Locator {
    return page.locator(`[data-test="${handle}"]`);
}
