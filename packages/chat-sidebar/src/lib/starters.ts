import { PageEvent } from './page-events';

// Page-aware welcome starters, generated server-side from each settled page
// snapshot.

export interface Starter {
    title: string;
    prompt: string;
}

export interface StartersState {
    // idle: not embedded in the portal, so no snapshot will ever arrive.
    status: 'idle' | 'loading' | 'ready' | 'error';
    suggestions: Starter[];
    // Bumped per request, so a superseded response is ignored.
    generation: number;
}

// Embedded, the host's first snapshot is on its way, so start in loading
// rather than flashing the fallback starters.
let state: StartersState = {
    status: window.parent && window.parent !== window ? 'loading' : 'idle',
    suggestions: [],
    generation: 0,
};

const listeners = new Set<() => void>();

export function subscribeToStarters(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function getStartersState(): StartersState {
    return state;
}

function setState(next: Partial<StartersState>): void {
    state = { ...state, ...next };
    for (const listener of listeners) listener();
}

// Requested only while the user can see them: sidebar open, on the welcome
// screen. A page change while they can't just marks them stale; the request
// goes out once the welcome screen is next shown.
let sidebarOpen = false;
let welcomeVisible = false;
// The latest settled page, serialized as the request body, and the last one
// requested — the host can resend an unchanged page.
let latestBody: string | undefined;
let fetchedBody: string | undefined;
let inFlight: AbortController | undefined;

export function setSettledSnapshot(event: PageEvent): void {
    const body = JSON.stringify({ href: event.href, details: event.details });
    if (body === latestBody) return;
    latestBody = body;
    // A response for the previous page would be stale.
    inFlight?.abort();
    inFlight = undefined;
    setState({ status: 'loading', generation: state.generation + 1 });
    maybeFetch();
}

export function setSidebarOpen(open: boolean): void {
    sidebarOpen = open;
    maybeFetch();
}

export function setWelcomeVisible(visible: boolean): void {
    welcomeVisible = visible;
    maybeFetch();
}

// Left running if the welcome screen hides mid-request: the result still fits
// this page when a new chat opens. After an error, the fallback starters stay
// until the page changes.
function maybeFetch(): void {
    if (!sidebarOpen || !welcomeVisible || inFlight) return;
    if (latestBody === undefined || latestBody === fetchedBody) return;
    const body = latestBody;
    fetchedBody = body;
    const controller = new AbortController();
    inFlight = controller;
    const generation = state.generation;

    fetch('/api/chat/starters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: controller.signal,
    })
        .then(async response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const { suggestions } = await response.json();
            if (generation !== state.generation) return;
            setState({ status: 'ready', suggestions });
        })
        .catch(err => {
            if (controller.signal.aborted) return;
            console.warn('[chat-sidebar] starters failed', err);
            if (generation === state.generation) setState({ status: 'error' });
        })
        .finally(() => {
            if (inFlight === controller) inFlight = undefined;
        });
}
