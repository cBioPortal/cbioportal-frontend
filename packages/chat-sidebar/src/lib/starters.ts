import { PageEvent } from './page-events';

// Experiment: asks the server for page-aware welcome starters and only logs
// them, to gauge their latency and quality before they're shown anywhere.

// The host can resend an unchanged page; only a changed one is worth a call.
let lastSentBody: string | undefined;

export function requestStarters(event: PageEvent): void {
    const body = JSON.stringify({ href: event.href, details: event.details });
    if (body === lastSentBody) return;
    lastSentBody = body;

    const start = performance.now();
    fetch('/api/chat/starters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
    })
        .then(async response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const { suggestions, ms } = await response.json();
            console.log('[starters]', {
                roundTripMs: Math.round(performance.now() - start),
                serverMs: ms,
                href: event.href,
                suggestions,
            });
        })
        .catch(err => {
            console.warn('[chat-sidebar] starters failed', err);
        });
}
