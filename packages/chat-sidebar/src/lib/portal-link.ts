import { parentOrigin, portalUrl } from './parent-origin';

// Hosts whose links are treated as the host portal's own: tools such as
// cbioportal-navigator emit www.cbioportal.org links regardless of where the
// portal runs. Overridden by the server's PORTAL_LINK_ALIASES. Keep in sync
// with PORTAL_LINK_ALIASES in src/shared/components/chatSidebar/navigateTool.ts.
const DEFAULT_PORTAL_LINK_ALIASES = ['www.cbioportal.org', 'cbioportal.org'];

// Served by the backend rather than the app's router, so they open in a new
// tab. Keep in sync with NON_PAGE_PREFIXES in navigateTool.ts.
const NON_PAGE_PREFIXES = ['/api', '/chat-sidebar', '/login', '/logout'];

let aliases = DEFAULT_PORTAL_LINK_ALIASES;

export function setPortalLinkAliases(hosts: string[]) {
    aliases = hosts.map(h => h.toLowerCase());
}

function isUnderPrefix(pathname: string, prefix: string): boolean {
    return pathname === prefix || pathname.startsWith(prefix + '/');
}

// Relative links are written as portal paths ("/study?id=x"), so they are
// taken as relative to the portal's base path rather than the host's root.
function isRelative(href: string): boolean {
    try {
        new URL(href);
        return false;
    } catch {
        return true;
    }
}

export interface PortalLink {
    // The link on the host portal, for display and new-tab opening.
    href: string;
    // Path, query and hash relative to the portal's base path, for in-place
    // navigation; null when the link isn't an app page.
    path: string | null;
}

/**
 * Resolves a link that belongs to the host portal — relative, on the portal's
 * own origin, or on an alias host — to its address there. Null for any other
 * link.
 */
export function resolvePortalLink(href: string | undefined): PortalLink | null {
    if (!href) return null;
    const portal = new URL(portalUrl());
    const basePath = portal.pathname.replace(/\/+$/, '');
    let url: URL;
    try {
        url = new URL(href, portal.origin);
    } catch {
        return null;
    }

    let pathname = url.pathname;
    if (url.origin === portal.origin) {
        if (basePath && isUnderPrefix(pathname, basePath)) {
            pathname = pathname.slice(basePath.length) || '/';
        } else if (basePath && !isRelative(href)) {
            // Same origin but outside the portal, e.g. another app on the host.
            return null;
        }
    } else if (
        !/^https?:$/.test(url.protocol) ||
        !aliases.includes(url.hostname.toLowerCase())
    ) {
        return null;
    }

    const path = pathname + url.search + url.hash;
    const isPage = !NON_PAGE_PREFIXES.some(p => isUnderPrefix(pathname, p));
    return {
        href: portal.origin + basePath + path,
        path: isPage ? path : null,
    };
}

// This iframe can't call the router directly.
export function notifyNavigate(path: string) {
    if (window.parent && window.parent !== window) {
        window.parent.postMessage(
            { type: 'chat-sidebar:navigate', path },
            parentOrigin()
        );
    }
}
