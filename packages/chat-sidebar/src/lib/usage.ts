import { throwIfUnauthorized } from './chatApi';

// The user's usage against their allowance, as the server counts it. The
// server alone enforces the limit; this is only for display. It is fetched
// again when something could have changed it — a reply or report finishing,
// the tab coming back into view — rather than polled.

export interface UsageState {
    // Can pass 100: a reply that starts under the limit runs to completion.
    percentUsed: number;
    // How far back usage counts; null until a fetch has said.
    windowHours: number | null;
    // When usage next falls below the allowance; null while it already is.
    availableAt: Date | null;
}

export type UsageLevel = 'normal' | 'warning' | 'limit';

const WARNING_PERCENT = 80;

// The limit is whatever the server refuses at, which availableAt marks
// exactly; the percentage only separates normal from warning.
export function getUsageLevel(usage: UsageState): UsageLevel {
    if (usage.availableAt) return 'limit';
    return usage.percentUsed >= WARNING_PERCENT ? 'warning' : 'normal';
}

// Whole percent, capped at 100 for the overshoot of a finished reply.
export function formatPercentUsed(usage: UsageState): string {
    const percent = usage.availableAt ? 100 : usage.percentUsed;
    if (percent > 0 && percent < 1) return '<1%';
    return `${Math.min(100, Math.round(percent))}%`;
}

export function formatWindow(hours: number): string {
    if (hours % 24 === 0) {
        const days = hours / 24;
        return days === 1 ? 'day' : `${days} days`;
    }
    return hours === 1 ? 'hour' : `${hours} hours`;
}

const USAGE_API = '/api/chat/usage';

// null until the first fetch answers.
let state: UsageState | null = null;

const listeners = new Set<() => void>();

export function subscribeToUsage(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function getUsageState(): UsageState | null {
    return state;
}

function publish(next: UsageState): void {
    state = next;
    scheduleRelease(next.availableAt);
    for (const listener of listeners) listener();
}

// Nothing else happens when the limit lifts, so a tab left open would keep
// showing it; fetch again once it should have.
const RELEASE_SLACK_MS = 5_000;
// setTimeout overflows past about 24.8 days.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;
let releaseTimer: ReturnType<typeof setTimeout> | undefined;

function scheduleRelease(availableAt: Date | null): void {
    clearTimeout(releaseTimer);
    releaseTimer = undefined;
    if (!availableAt) return;
    const delay = Math.min(
        Math.max(0, availableAt.getTime() - Date.now()) + RELEASE_SLACK_MS,
        MAX_TIMEOUT_MS
    );
    releaseTimer = setTimeout(() => void refreshUsage(), delay);
}

function parseDate(value: unknown): Date | null {
    if (typeof value !== 'string') return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

// One fetch at a time, so an older answer never overwrites a newer one; a
// call while one is running fetches once more after it.
let inFlight = false;
let again = false;

export async function refreshUsage(): Promise<void> {
    if (inFlight) {
        again = true;
        return;
    }
    inFlight = true;
    try {
        do {
            again = false;
            await fetchUsage();
        } while (again);
    } finally {
        inFlight = false;
    }
}

// A failure keeps the last figure.
async function fetchUsage(): Promise<void> {
    try {
        const response = await fetch(USAGE_API);
        throwIfUnauthorized(response);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (typeof data?.percentUsed !== 'number') {
            throw new Error('malformed usage response');
        }
        publish({
            percentUsed: data.percentUsed,
            windowHours:
                typeof data.windowHours === 'number' ? data.windowHours : null,
            availableAt: parseDate(data.availableAt),
        });
    } catch (err) {
        console.warn('[chat-sidebar] usage refresh failed', err);
    }
}

// Visible again is when the figure is likeliest to be stale: another tab may
// have used some, or old usage may have aged out of the window.
export function startUsageSync(): () => void {
    void refreshUsage();
    const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') void refreshUsage();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () =>
        document.removeEventListener('visibilitychange', onVisibilityChange);
}

const availableAtFormat = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
});

// In the user's own time zone.
export function formatAvailableAt(availableAt: Date): string {
    return availableAtFormat.format(availableAt);
}

// Raised wherever the server refuses a request because the user is at their
// limit. The message is meant for the user.
export class UsageLimitError extends Error {
    constructor(readonly availableAt: Date) {
        super(
            `You've reached your chat usage limit. You can chat again after ${formatAvailableAt(
                availableAt
            )}.`
        );
    }
}

// The refusal says everything the figure needs, so there is nothing to fetch.
// Any other 429 is left to the caller's usual error handling.
export async function throwIfLimitReached(response: Response): Promise<void> {
    if (response.status !== 429) return;
    let availableAt: Date | null = null;
    try {
        const body = await response.clone().json();
        if (body?.code === 'limit_reached') {
            availableAt = parseDate(body.availableAt);
        }
    } catch {
        return;
    }
    if (!availableAt) return;
    publish({
        percentUsed: Math.max(state?.percentUsed ?? 100, 100),
        windowHours: state?.windowHours ?? null,
        availableAt,
    });
    throw new UsageLimitError(availableAt);
}
