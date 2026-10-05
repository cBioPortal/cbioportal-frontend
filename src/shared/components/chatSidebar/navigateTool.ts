// Shared go_to_page action for ChatSidebar's postMessage handler and
// portalWebMcp.ts — keep in sync with the go_to_page tool in
// chat-sidebar-server/src/core.ts.
//
// Validates the URL itself: WebMCP opens this to arbitrary in-browser
// agents that skip the iframe's link resolution.

import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { getLoadConfig } from 'config/config';

export const GO_TO_PAGE_TOOL_NAME = 'go_to_page';

export const GO_TO_PAGE_DESCRIPTION =
    "Immediately navigates the user's browser to a cBioPortal URL — the user is taken there right away, with no confirmation step.";

// Hosts whose URLs are treated as this portal's own: tools such as
// cbioportal-navigator emit www.cbioportal.org links regardless of where the
// portal runs. Keep in sync with DEFAULT_PORTAL_LINK_ALIASES in
// packages/chat-sidebar/src/lib/portal-link.ts.
const PORTAL_LINK_ALIASES = ['www.cbioportal.org', 'cbioportal.org'];

// Served by the backend rather than the app's router. Keep in sync with
// NON_PAGE_PREFIXES in packages/chat-sidebar/src/lib/portal-link.ts.
const NON_PAGE_PREFIXES = ['/api', '/chat-sidebar', '/login', '/logout'];

export function normalizeBasePath(basePath: string | undefined): string {
    const trimmed = (basePath || '').replace(/^\/+|\/+$/g, '');
    return trimmed ? `/${trimmed}` : '';
}

function isUnderPrefix(pathname: string, prefix: string): boolean {
    return pathname === prefix || pathname.startsWith(prefix + '/');
}

// Relative URLs are portal paths ("/study?id=x", as the iframe sends them),
// so they are taken as relative to the base path rather than the host's root.
function isRelative(url: string): boolean {
    try {
        new URL(url);
        return false;
    } catch {
        return true;
    }
}

/**
 * Resolves a URL to a route in this portal's app (path, query and hash,
 * relative to the base path), or null when it isn't one.
 */
export function toPortalRoute(
    url: string,
    portal: { origin: string; basePath: string; aliases: string[] }
): string | null {
    let parsed: URL;
    try {
        parsed = new URL(url, portal.origin);
    } catch {
        return null;
    }

    let pathname = parsed.pathname;
    if (parsed.origin === portal.origin) {
        if (portal.basePath && isUnderPrefix(pathname, portal.basePath)) {
            pathname = pathname.slice(portal.basePath.length) || '/';
        } else if (portal.basePath && !isRelative(url)) {
            // Same origin but outside the portal, e.g. another app on the host.
            return null;
        }
    } else if (
        !/^https?:$/.test(parsed.protocol) ||
        !portal.aliases.includes(parsed.hostname.toLowerCase())
    ) {
        return null;
    }

    if (NON_PAGE_PREFIXES.some(p => isUnderPrefix(pathname, p))) {
        return null;
    }
    return pathname + parsed.search + parsed.hash;
}

export function goToPage(url: string): { navigated: boolean } {
    const route = toPortalRoute(url, {
        origin: window.location.origin,
        basePath: normalizeBasePath(getLoadConfig().basePath),
        aliases: PORTAL_LINK_ALIASES,
    });
    if (route === null) {
        return { navigated: false };
    }
    // push takes the URL as-is; updateRoute would rebuild it with the current
    // page's hash in place of the link's (filterJson, navCaseIds).
    getBrowserWindow().routingStore.push(route);
    return { navigated: true };
}
