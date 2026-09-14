// The host portal's origin, handed to this iframe in its URL. Messages are sent
// only here, and only messages from here are accepted.
const PARENT_ORIGIN =
    new URLSearchParams(window.location.search).get('parentOrigin') ||
    window.location.origin;

export function parentOrigin(): string {
    return PARENT_ORIGIN;
}

export function isFromParent(e: MessageEvent): boolean {
    return e.source === window.parent && e.origin === PARENT_ORIGIN;
}
