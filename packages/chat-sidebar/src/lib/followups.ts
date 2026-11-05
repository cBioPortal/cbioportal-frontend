import { FollowupsExchange } from './followupsInput';
import { PageEvent } from './page-events';
import { embedded } from './parent-origin';
import { PREFIX } from './threadStorage';

// Follow-up suggestions shown above the composer after a reply, generated
// server-side from the latest exchange and the page the user is on when they
// are requested. They belong to the reply: a new reply replaces them, but a
// page change doesn't, so each reply costs at most one request.

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
// Enough to switch between a few threads and back without regenerating. Also
// the cap on stored replies, which at a few hundred bytes each stays small
// next to the chats sharing the quota.
const MAX_CACHED = 20;

// Ready results by reply id, oldest first, so a reload or another tab shows a
// restored reply's suggestions without requesting them again.
const STORAGE_KEY = `${PREFIX}followups`;

const IDLE: FollowupsState = { status: 'idle', suggestions: [] };
const LOADING: FollowupsState = { status: 'loading', suggestions: [] };
const ERROR: FollowupsState = { status: 'error', suggestions: [] };

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
// The latest settled page.
let page: FollowupsPage | undefined = embedded
    ? undefined
    : { href: '', details: { available: false } };
let target: FollowupsExchange | null = null;

// Finished results by reply id, errors included, so an error isn't retried
// for the same reply.
const cache = new Map<string, FollowupsState>();
let inFlight: { key: string; controller: AbortController } | undefined;

export function setFollowupsPage(event: PageEvent): void {
    pagePending = event.pending;
    if (!event.pending) {
        page = { href: event.href, details: event.details };
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

// [reply id, suggestions]
type StoredEntry = [string, Followup[]];

function readStored(): StoredEntry[] {
    try {
        const parsed: unknown = JSON.parse(
            localStorage.getItem(STORAGE_KEY) ?? '[]'
        );
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (entry): entry is StoredEntry =>
                Array.isArray(entry) &&
                typeof entry[0] === 'string' &&
                Array.isArray(entry[1]) &&
                entry[1].length > 0 &&
                entry[1].every(isFollowup)
        );
    } catch {
        return [];
    }
}

// Read on every miss rather than once at load, so results another tab stored
// since are picked up too.
function lookUpStored(key: string): FollowupsState | undefined {
    const entry = readStored().find(([storedKey]) => storedKey === key);
    return entry && { status: 'ready', suggestions: entry[1] };
}

// Written straight to localStorage rather than through threadStorage, whose
// quota handling deletes old chats to make room — suggestions are never worth
// that, so a failed write is just skipped. Re-reads before writing so entries
// stored by another tab are kept.
function store(key: string, suggestions: readonly Followup[]): void {
    const entries = readStored().filter(([storedKey]) => storedKey !== key);
    entries.push([key, [...suggestions]]);
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(entries.slice(-MAX_CACHED))
        );
    } catch {
        /* this reply's suggestions are requested again after a reload */
    }
}

// Errors are kept in memory only, so a reload retries them.
function remember(key: string, result: FollowupsState): void {
    cache.delete(key);
    cache.set(key, result);
    if (cache.size > MAX_CACHED) {
        cache.delete(cache.keys().next().value!);
    }
    if (result.status === 'ready') store(key, result.suggestions);
}

// Requested only while the sidebar is open; a request left running when it
// closes still finishes. Once a reply's request has started, page changes
// neither restart nor abort it.
function update(): void {
    if (!target) {
        abortInFlight();
        publish(IDLE);
        return;
    }
    const key = target.messageId;
    const cached = cache.get(key);
    if (cached) {
        abortInFlight();
        publish(cached);
        return;
    }
    if (inFlight?.key === key) return;
    const stored = lookUpStored(key);
    if (stored) {
        abortInFlight();
        remember(key, stored);
        publish(stored);
        return;
    }
    abortInFlight();
    publish(LOADING);
    // After a navigation the new page is still loading: wait for it rather
    // than suggest from the page the user just left.
    if (pagePending || !page) return;
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
