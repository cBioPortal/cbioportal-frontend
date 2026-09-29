import { isFromParent, parentOrigin } from './parent-origin';

// Mirrors the host's pageEvents.ts, loosely — this side only reads pending,
// and leaves the payload as sent.
export interface PageEvent {
    kind: 'snapshot';
    at: string;
    pending: boolean;
    href: string;
    details: unknown;
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

// The host pushes every page change here (its pageEvents.ts), and only when
// opted in there — so this logs whatever arrives. Nothing consumes it yet
// beyond keeping the latest.
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
        console.log('[sidebar ← portal]', event.kind, event);
    });
    // Posted only once listening, so the host's opening snapshot isn't missed.
    window.parent.postMessage({ type: 'chat-sidebar:ready' }, parentOrigin());
}
