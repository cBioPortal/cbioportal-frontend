import { FollowupsExchange } from './followupsInput';
import { PageEvent } from './page-events';

// Follow-up suggestions shown above the composer after a reply, generated
// server-side from the latest exchange and the page the user is on. They
// belong to that pair: a new reply or a page change replaces them.

export interface Followup {
    title: string;
    prompt: string;
}

export interface FollowupsState {
    // idle: nothing to suggest for (no finished reply, or the thread is
    // running). loading also covers waiting for the page to settle.
    status: 'idle' | 'loading' | 'ready' | 'error';
    // Filled in one at a time while loading.
    suggestions: readonly Followup[];
}

const FOLLOWUP_COUNT = 3;
// Enough to switch between a few threads and back without regenerating.
const MAX_CACHED = 20;

const IDLE: FollowupsState = { status: 'idle', suggestions: [] };
const LOADING: FollowupsState = { status: 'loading', suggestions: [] };
const ERROR: FollowupsState = { status: 'error', suggestions: [] };

const embedded = Boolean(window.parent && window.parent !== window);

let state: FollowupsState = IDLE;

const listeners = new Set<() => void>();

export function subscribeToFollowups(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function getFollowupsState(): FollowupsState {
    return state;
}

function publish(next: FollowupsState): void {
    if (next === state) return;
    state = next;
    for (const listener of listeners) listener();
}

// Not embedded, no page will ever arrive and there is no sidebar to open, so
// generate from the exchange alone.
let sidebarOpen = !embedded;
let pagePending = embedded;
interface FollowupsPage {
    href: string;
    details: Record<string, unknown>;
}
// The latest settled page, and it serialized for comparison — the host can
// resend an unchanged page.
let page: FollowupsPage | undefined = embedded
    ? undefined
    : { href: '', details: { available: false } };
let pageBody: string | undefined = page && JSON.stringify(page);
let target: FollowupsExchange | null = null;

// Finished results by exchange and page, errors included, so an error isn't
// retried until one of them changes.
const cache = new Map<string, FollowupsState>();
let inFlight: { key: string; controller: AbortController } | undefined;

export function setFollowupsPage(event: PageEvent): void {
    pagePending = event.pending;
    if (!event.pending) {
        page = { href: event.href, details: event.details };
        pageBody = JSON.stringify(page);
    }
    update();
}

export function setFollowupsSidebarOpen(open: boolean): void {
    sidebarOpen = open;
    update();
}

// The visible thread's latest exchange, or null when it has none to follow up
// on — including while a run is streaming, which aborts a pending request.
export function setFollowupsTarget(next: FollowupsExchange | null): void {
    if (
        next?.messageId === target?.messageId &&
        next?.question === target?.question &&
        next?.answer === target?.answer
    ) {
        return;
    }
    target = next;
    update();
}

function abortInFlight(): void {
    inFlight?.controller.abort();
    inFlight = undefined;
}

function remember(key: string, result: FollowupsState): void {
    cache.delete(key);
    cache.set(key, result);
    if (cache.size > MAX_CACHED) {
        cache.delete(cache.keys().next().value!);
    }
}

// Requested only while the sidebar is open; a request left running when it
// closes still finishes, since its result fits the same exchange and page.
function update(): void {
    if (!target) {
        abortInFlight();
        publish(IDLE);
        return;
    }
    // After a navigation the new page is still loading: wait for it rather
    // than suggest from the page the user just left.
    if (pagePending || !page || pageBody === undefined) {
        abortInFlight();
        publish(LOADING);
        return;
    }
    const key = `${target.messageId}\n${pageBody}`;
    const cached = cache.get(key);
    if (cached) {
        abortInFlight();
        publish(cached);
        return;
    }
    if (inFlight?.key === key) return;
    abortInFlight();
    publish(LOADING);
    if (sidebarOpen) request(key, target, page);
}

function request(
    key: string,
    exchange: FollowupsExchange,
    requestPage: FollowupsPage
): void {
    const controller = new AbortController();
    const current = { key, controller };
    inFlight = current;
    let received: readonly Followup[] = [];

    const settle = (result: FollowupsState) => {
        remember(key, result);
        if (inFlight !== current) return;
        inFlight = undefined;
        publish(result);
    };

    streamFollowups(
        {
            question: exchange.question,
            answer: exchange.answer,
            ...requestPage,
        },
        controller.signal,
        suggestions => {
            received = suggestions;
            if (inFlight === current) {
                publish({ status: 'loading', suggestions });
            }
        }
    )
        .then(() =>
            settle(
                received.length
                    ? { status: 'ready', suggestions: received }
                    : ERROR
            )
        )
        .catch(err => {
            if (controller.signal.aborted) return;
            console.warn('[chat-sidebar] follow-ups failed', err);
            // Keep whatever arrived before the failure.
            settle(
                received.length
                    ? { status: 'ready', suggestions: received }
                    : ERROR
            );
        });
}

function isFollowup(value: unknown): value is Followup {
    const candidate = value as Partial<Followup> | null;
    return (
        typeof candidate?.title === 'string' &&
        typeof candidate.prompt === 'string'
    );
}

// The endpoint streams NDJSON, one suggestion per line, as each is generated.
async function streamFollowups(
    body: Record<string, unknown>,
    signal: AbortSignal,
    onUpdate: (suggestions: readonly Followup[]) => void
): Promise<void> {
    const response = await fetch('/api/chat/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
    });
    if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
    }
    const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader();
    const suggestions: Followup[] = [];
    let buffer = '';
    while (suggestions.length < FOLLOWUP_COUNT) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
            if (!line.trim() || suggestions.length === FOLLOWUP_COUNT) continue;
            const suggestion = JSON.parse(line);
            if (!isFollowup(suggestion)) continue;
            suggestions.push(suggestion);
            onUpdate([...suggestions]);
        }
    }
    reader.cancel().catch(() => {});
}
