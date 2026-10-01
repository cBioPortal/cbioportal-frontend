import { setFollowupsPage, setFollowupsSidebarOpen } from './followups';
import { isFromParent, parentOrigin } from './parent-origin';
import { setSettledSnapshot, setSidebarOpen } from './starters';

// Mirrors the host's pageEvents.ts, loosely — details are passed on as sent.
export interface PageEvent {
    kind: 'snapshot';
    at: string;
    pending: boolean;
    href: string;
    details: Record<string, unknown>;
}

export interface LatestPageEvents {
    snapshot?: PageEvent;
    // Latest snapshot the host sent once the page finished loading — the
    // plain latest snapshot may still be mid-load.
    settledSnapshot?: PageEvent;
}

const latest: LatestPageEvents = {};

export function getLatestPageEvents(): Readonly<LatestPageEvents> {
    return latest;
}

// Mirrors the host's pageDetails.ts pageType values.
export type PageType = 'study' | 'results' | 'groupComparison' | 'patient';

// Undefined on pages without page details (home, query, static pages).
let pageType: PageType | undefined;

const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function getPageType(): PageType | undefined {
    return pageType;
}

// A pending snapshot without details keeps the previous page type: Study View
// reports no details until its study ids resolve, which would otherwise flash
// the no-page state.
function updatePageType(event: PageEvent): void {
    let next: PageType | undefined;
    if (event.details.available) {
        next = event.details.pageType as PageType;
    } else if (event.pending) {
        return;
    }
    if (next === pageType) return;
    pageType = next;
    for (const listener of listeners) listener();
}

// The host pushes every page change here (its pageEvents.ts); this keeps the
// latest, which is where the chat reads what the user is looking at. It also
// reports whether the sidebar is open, which gates the starters and follow-ups
// requests.
export function listenForPageEvents(): void {
    if (!window.parent || window.parent === window) return;
    window.addEventListener('message', (e: MessageEvent) => {
        if (!isFromParent(e)) return;
        if (e.data?.type === 'chat-sidebar:open') {
            setSidebarOpen(Boolean(e.data.open));
            setFollowupsSidebarOpen(Boolean(e.data.open));
            return;
        }
        if (e.data?.type !== 'chat-sidebar:pageEvent') return;
        const event = e.data.event as PageEvent;
        latest.snapshot = event;
        if (!event.pending) {
            latest.settledSnapshot = event;
            setSettledSnapshot(event);
        }
        updatePageType(event);
        setFollowupsPage(event);
    });
    // Posted only once listening, so the host's opening snapshot isn't missed.
    window.parent.postMessage({ type: 'chat-sidebar:ready' }, parentOrigin());
}
