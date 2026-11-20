// Whether the user has told the assistant it may open portal pages without
// asking. Read when each go_to_page call arrives rather than cached, so a
// choice made in one tab applies in the others.

const ALWAYS_ALLOW_STORAGE_KEY = 'chat-sidebar:alwaysAllowNavigation';

export type NavigationDecision = 'allow-once' | 'allow-always' | 'deny';

// The go_to_page tool output. `decision` is set only when the user answered
// the approval card; a call let through by "Always allow" has none.
export interface GoToPageResult {
    navigated: boolean;
    declined?: true;
    decision?: NavigationDecision;
}

export function getAlwaysAllowNavigation(): boolean {
    try {
        return localStorage.getItem(ALWAYS_ALLOW_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

export function setAlwaysAllowNavigation(): void {
    try {
        localStorage.setItem(ALWAYS_ALLOW_STORAGE_KEY, 'true');
    } catch {
        /* private mode etc — the card just asks again next time */
    }
}
