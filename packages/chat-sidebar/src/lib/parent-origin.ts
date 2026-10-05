// The host portal's origin, handed to this iframe in its URL. Messages are sent
// only here, and only messages from here are accepted.
const PARENT_ORIGIN =
    new URLSearchParams(window.location.search).get('parentOrigin') ||
    window.location.origin;

export function parentOrigin(): string {
    return PARENT_ORIGIN;
}

// The host portal's URL (origin plus any base path), also handed over in this
// iframe's URL. Only trusted when it is on the parent's origin.
const PORTAL_URL = (() => {
    const param = new URLSearchParams(window.location.search).get('portalUrl');
    try {
        if (param && new URL(param).origin === PARENT_ORIGIN) {
            return param.replace(/\/+$/, '');
        }
    } catch {
        /* malformed; fall back to the parent's origin */
    }
    return PARENT_ORIGIN;
})();

export function portalUrl(): string {
    return PORTAL_URL;
}

export function isFromParent(e: MessageEvent): boolean {
    return e.source === window.parent && e.origin === PARENT_ORIGIN;
}
