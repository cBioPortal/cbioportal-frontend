// Revoking immediately after click() races the browser's read of the blob in
// some engines; the object URL is cheap enough to hold briefly.
const REVOKE_DELAY_MS = 40_000;

// The anchor has to be in the document for the click to count as user-initiated
// navigation in Firefox.
export function downloadHref(filename: string, href: string): void {
    if (typeof document === 'undefined') return;
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = filename;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
}

export function downloadBlob(filename: string, blob: Blob): void {
    if (typeof document === 'undefined') return;
    const url = URL.createObjectURL(blob);
    downloadHref(filename, url);
    setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}

export function downloadTextFile(
    filename: string,
    content: string,
    mimeType = 'text/markdown'
): void {
    downloadBlob(filename, new Blob([content], { type: mimeType }));
}
