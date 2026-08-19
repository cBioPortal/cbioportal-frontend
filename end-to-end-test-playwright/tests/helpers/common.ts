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

    const mask = (opts.masks ?? ['.qtip']).map(s => page.locator(s));
    await expect(page).toHaveScreenshot(snapshotName, {
        mask,
        fullPage: opts.fullPage ?? false,
        // Full-page patient/cohort views continue settling after the backend
        // reports ajaxQuiet. Give Playwright enough time to observe two
        // consecutive stable frames on the public portal.
        timeout: 30000,
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

// IGV waits for UCSC cytoband metadata before laying out tracks. The public
// CI browser cannot reach that endpoint reliably, so serve the chromosome
// used by the deterministic screenshot fixtures locally.
const HG19_CYTOBAND_URL =
    'https://hgdownload.soe.ucsc.edu/goldenPath/hg19/database/cytoBand.txt.gz';
const HG19_NCBI_REFSEQ_URL =
    'https://hgdownload.soe.ucsc.edu/goldenPath/hg19/database/ncbiRefSeq.txt.gz';
const HG19_CHR7_CYTOBANDS = `chr7\t0\t2800000\tp22.3\tgneg
chr7\t2800000\t4500000\tp22.2\tgpos25
chr7\t4500000\t7300000\tp22.1\tgneg
chr7\t7300000\t13800000\tp21.3\tgpos100
chr7\t13800000\t16500000\tp21.2\tgneg
chr7\t16500000\t20900000\tp21.1\tgpos100
chr7\t20900000\t25500000\tp15.3\tgneg
chr7\t25500000\t28000000\tp15.2\tgpos50
chr7\t28000000\t28800000\tp15.1\tgneg
chr7\t28800000\t35000000\tp14.3\tgpos75
chr7\t35000000\t37200000\tp14.2\tgneg
chr7\t37200000\t43300000\tp14.1\tgpos75
chr7\t43300000\t45400000\tp13\tgneg
chr7\t45400000\t49000000\tp12.3\tgpos75
chr7\t49000000\t50500000\tp12.2\tgneg
chr7\t50500000\t54000000\tp12.1\tgpos75
chr7\t54000000\t58000000\tp11.2\tgneg
chr7\t58000000\t59900000\tp11.1\tacen
chr7\t59900000\t61700000\tq11.1\tacen
chr7\t61700000\t67000000\tq11.21\tgneg
chr7\t67000000\t72200000\tq11.22\tgpos50
chr7\t72200000\t77500000\tq11.23\tgneg
chr7\t77500000\t86400000\tq21.11\tgpos100
chr7\t86400000\t88200000\tq21.12\tgneg
chr7\t88200000\t91100000\tq21.13\tgpos75
chr7\t91100000\t92800000\tq21.2\tgneg
chr7\t92800000\t98000000\tq21.3\tgpos75
chr7\t98000000\t103800000\tq22.1\tgneg
chr7\t103800000\t104500000\tq22.2\tgpos50
chr7\t104500000\t107400000\tq22.3\tgneg
chr7\t107400000\t114600000\tq31.1\tgpos75
chr7\t114600000\t117400000\tq31.2\tgneg
chr7\t117400000\t121100000\tq31.31\tgpos75
chr7\t121100000\t123800000\tq31.32\tgneg
chr7\t123800000\t127100000\tq31.33\tgpos75
chr7\t127100000\t129200000\tq32.1\tgneg
chr7\t129200000\t130400000\tq32.2\tgpos25
chr7\t130400000\t132600000\tq32.3\tgneg
chr7\t132600000\t138200000\tq33\tgpos50
chr7\t138200000\t143100000\tq34\tgneg
chr7\t143100000\t147900000\tq35\tgpos75
chr7\t147900000\t152600000\tq36.1\tgneg
chr7\t152600000\t155100000\tq36.2\tgpos25
chr7\t155100000\t159138663\tq36.3\tgneg`;
const HG19_NCBI_REFSEQ = `125\tNM_201283.2\tchr7\t+\t55086709\t55224632\t55086970\t55224536\t10\t55086709,55209978,55210997,55214298,55218986,55220238,55221703,55223522,55224225,55224451,\t55087058,55210130,55211181,55214433,55219055,55220357,55221845,55223639,55224352,55224632,\t0\tEGFR\tcmpl\tcmpl\t0,1,0,1,1,1,0,1,1,2,
125\tNM_201282.2\tchr7\t+\t55086709\t55236328\t55086970\t55236222\t16\t55086709,55209978,55210997,55214298,55218986,55220238,55221703,55223522,55224225,55224451,55225355,55227831,55229191,55231425,55232972,55236215,\t55087058,55210130,55211181,55214433,55219055,55220357,55221845,55223639,55224525,55225446,55228031,55229324,55231516,55233130,55236328,\t0\tEGFR\tcmpl\tcmpl\t0,1,0,1,1,1,0,1,1,2,1,2,1,2,0,2,
125\tNM_005228.5\tchr7\t+\t55086709\t55279321\t55086970\t55273310\t28\t55086709,55209978,55210997,55214298,55218986,55220238,55221703,55223522,55224225,55225355,55227831,55229191,55231425,55232972,55238867,55240675,55241613,55242414,55248985,55259411,55260458,55266409,55268008,55268880,55269427,55270209,55272948,\t55087058,55210130,55211181,55214433,55219055,55220357,55221845,55223639,55225446,55228031,55229324,55231516,55233130,55238906,55240817,55241736,55242513,55249171,55259567,55260534,55266556,55268106,55269048,55269475,55270318,55279321,\t0\tEGFR\tcmpl\tcmpl\t0,1,0,1,1,1,0,1,1,2,1,2,1,2,1,2,1,2,0,2,2,0,0,0,0,0,1,1,
1006\tNR_047551.1\tchr7\t-\t55247442\t55256642\t55256642\t55256642\t2\t55247442,55256549,\t55250170,55256642,\t0\tEGFR-AS1\tnone\tnone\t-1,-1,`;

export async function mockHg19CytobandEndpoint(page: Page): Promise<void> {
    await page.route(HG19_CYTOBAND_URL, route =>
        route.fulfill({
            status: 200,
            contentType: 'text/plain',
            body: HG19_CHR7_CYTOBANDS,
        })
    );
    await page.route(HG19_NCBI_REFSEQ_URL, route =>
        route.fulfill({
            status: 200,
            contentType: 'text/plain',
            body: HG19_NCBI_REFSEQ,
        })
    );
}

/**
 * Wait until the IGV column container has rendered and stabilized.
 * Polls until the loading message is gone and the `.igv-column-container`
 * reports a track-sized height that hasn't changed between two consecutive
 * 500 ms intervals. The minimum height excludes the toolbar-only shell that
 * IGV briefly mounts before its tracks have been laid out.
 */
export async function waitForIgvRendered(
    page: Page,
    timeout = 60000
): Promise<void> {
    // Public-server IGV initialization occasionally leaves only the toolbar
    // mounted when an external genome request is transiently unavailable.
    // Retry the same deterministic page once, but never accept the toolbar as
    // a rendered result: screenshots must still wait for a real track layout.
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            await expect(page.locator('.cnSegmentsMSKTab')).toBeVisible({
                timeout,
            });
            await page.waitForFunction(
                () => {
                    const igvColumn = Array.from(
                        document.querySelectorAll('.igv-column-container')
                    ).find(element => {
                        const htmlElement = element as HTMLElement;
                        const rect = element.getBoundingClientRect();
                        return (
                            htmlElement.offsetParent !== null &&
                            getComputedStyle(element).visibility !== 'hidden' &&
                            rect.width > 0 &&
                            rect.height > 150
                        );
                    }) as HTMLElement | undefined;
                    if (!igvColumn) return false;
                    const locusSearch = document.querySelector(
                        '.igv-search-container input'
                    ) as HTMLInputElement | null;
                    // The browser initially renders the whole-genome track
                    // while the requested gene locus is still being applied.
                    // Do not let that stable intermediate state reach a
                    // screenshot assertion.
                    if (locusSearch?.value.trim().toLowerCase() === 'all') {
                        return false;
                    }
                    const loadingText = Array.from(
                        document.querySelectorAll('body *')
                    ).some(
                        el =>
                            el.textContent?.includes(
                                'Loading copy number segments data...'
                            ) && (el as HTMLElement).offsetParent !== null
                    );
                    if (loadingText) return false;
                    const height = igvColumn.getBoundingClientRect().height;
                    const last = (window as any).__lastIgvColumnHeight;
                    (window as any).__lastIgvColumnHeight = height;
                    return last !== undefined && Math.abs(height - last) < 1;
                },
                null,
                { polling: 500, timeout }
            );
            return;
        } catch (error) {
            if (attempt === 1) throw error;
            await page.reload({ waitUntil: 'domcontentloaded' });
        }
    }
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
