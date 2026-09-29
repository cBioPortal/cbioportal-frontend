import { isFromParent, parentOrigin } from './parent-origin';

// Mirrors the host's pageEvents.ts, loosely — details are passed on as sent.
export interface PageEvent {
    kind: 'snapshot';
    at: string;
    pending: boolean;
    href: string;
    details: Record<string, unknown>;
}

// Opted into on the host, which hands the choice over in this iframe's URL.
const DEBUG_EVENTS =
    new URLSearchParams(window.location.search).get('debugEvents') === '1';

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

// The host pushes every page change here (its pageEvents.ts); this keeps the
// latest, which is where the chat reads what the user is looking at.
export function listenForPageEvents(): void {
    if (!window.parent || window.parent === window) return;
    window.addEventListener('message', (e: MessageEvent) => {
        if (!isFromParent(e) || e.data?.type !== 'chat-sidebar:pageEvent') {
            return;
        }
        const event = e.data.event as PageEvent;
        latest.snapshot = event;
        if (!event.pending) {
            latest.settledSnapshot = event;
        }
        if (DEBUG_EVENTS) {
            console.log('[sidebar ← portal]', event.kind, event);
        }
    });
    // Posted only once listening, so the host's opening snapshot isn't missed.
    window.parent.postMessage({ type: 'chat-sidebar:ready' }, parentOrigin());
}
