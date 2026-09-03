// Shared go_to_page action for ChatSidebar's postMessage handler and
// portalWebMcp.ts — keep in sync with the go_to_page tool in
// chat-sidebar-server/src/core.ts.
//
// Validates the URL itself: WebMCP opens this to arbitrary in-browser
// agents that skip the iframe's isPortalLink check.

import { getBrowserWindow } from 'cbioportal-frontend-commons';

export const GO_TO_PAGE_TOOL_NAME = 'go_to_page';

export const GO_TO_PAGE_DESCRIPTION =
    "Immediately navigates the user's browser to a cBioPortal URL — the user is taken there right away, with no confirmation step.";

const PORTAL_PATHS = [
    '/study',
    '/results',
    '/patient',
    '/comparison',
    '/index.do',
];

function isPortalPath(pathname: string): boolean {
    return PORTAL_PATHS.some(
        p => pathname === p || pathname.startsWith(p + '/')
    );
}

export function goToPage(url: string): { navigated: boolean } {
    let parsed: URL;
    try {
        parsed = new URL(url, window.location.origin);
    } catch {
        return { navigated: false };
    }
    if (
        parsed.origin !== window.location.origin ||
        !isPortalPath(parsed.pathname)
    ) {
        return { navigated: false };
    }
    getBrowserWindow().routingStore.updateRoute(
        Object.fromEntries(parsed.searchParams.entries()),
        parsed.pathname,
        /* clear */ true,
        /* replace */ false
    );
    return { navigated: true };
}
