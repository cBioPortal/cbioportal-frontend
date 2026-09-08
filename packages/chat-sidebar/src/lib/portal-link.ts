// Portal paths navigate the host page, not this iframe (path-only check —
// href may be relative or absolute).
const PORTAL_PATHS = [
    '/study',
    '/results',
    '/patient',
    '/comparison',
    '/index.do',
];

export function isPortalLink(href: string | undefined): boolean {
    if (!href) return false;
    try {
        const url = new URL(href, 'http://portal-link.invalid');
        return PORTAL_PATHS.some(
            p => url.pathname === p || url.pathname.startsWith(p + '/')
        );
    } catch {
        return false;
    }
}

// This iframe can't call the router directly.
export function notifyNavigate(url: string) {
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'chat-sidebar:navigate', url }, '*');
    }
}
