import { AsyncStorageLike } from '@assistant-ui/core/react';

// v2 marks the break from the single-chat `chat-sidebar:messages` key, and
// keeps the chat keys in their own namespace so a prefix scan can never reach
// `chat-sidebar:selectedModel`, which has a different lifecycle.
export const PREFIX = 'chat-sidebar:v2:';
export const THREADS_KEY = `${PREFIX}threads`;
export const LAST_THREAD_KEY = `${PREFIX}lastThreadId`;
const LEGACY_MESSAGES_KEY = 'chat-sidebar:messages';

export function messagesKey(remoteId: string): string {
    return `${PREFIX}messages:${remoteId}`;
}

// Screenshots ride along as data-URL image parts, so filling the origin quota
// is the expected steady state rather than an edge case. Rather than let a
// chat silently stop persisting, make room by dropping the oldest chats —
// except the one the user is in, which is never a fair thing to delete.
export type StorageNotice = 'pruned' | 'full';

let notice: StorageNotice | null = null;
let protectedThreadId: string | null = null;
const noticeListeners = new Set<() => void>();

export function getStorageNotice(): StorageNotice | null {
    return notice;
}

export function subscribeToStorageNotice(listener: () => void): () => void {
    noticeListeners.add(listener);
    return () => {
        noticeListeners.delete(listener);
    };
}

function setNotice(next: StorageNotice): void {
    // 'full' outranks 'pruned' — it is the state the user has to act on.
    if (notice === next || notice === 'full') return;
    notice = next;
    for (const listener of noticeListeners) listener();
}

export function setProtectedThreadId(remoteId: string | null): void {
    protectedThreadId = remoteId;
}

function isQuotaError(err: unknown): boolean {
    return (
        err instanceof DOMException &&
        (err.name === 'QuotaExceededError' ||
            // Firefox's legacy name for the same condition.
            err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    );
}

type StoredThread = { remoteId?: unknown };

function parseThreads(raw: string | null): StoredThread[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

// The metadata array is newest-first (the library's `initialize` unshifts), so
// the oldest prunable chat is the last one that isn't open. Returns the value
// the caller should retry with: pruning the threads array while that same array
// is the pending write has to happen in the pending value, or the retry would
// put the pruned entry straight back.
function pruneOldestThread(key: string, pendingValue: string): string | null {
    const writingThreads = key === THREADS_KEY;
    const threads = parseThreads(
        writingThreads ? pendingValue : localStorage.getItem(THREADS_KEY)
    );

    for (let i = threads.length - 1; i >= 0; i--) {
        const remoteId = threads[i].remoteId;
        if (typeof remoteId !== 'string' || remoteId === protectedThreadId) {
            continue;
        }
        const remaining = threads.filter((_, index) => index !== i);
        try {
            localStorage.removeItem(messagesKey(remoteId));
            if (!writingThreads) {
                localStorage.setItem(THREADS_KEY, JSON.stringify(remaining));
            }
        } catch {
            return null;
        }
        console.warn(
            `[chat-sidebar] storage full — removed the oldest chat (${remoteId}) to make room`
        );
        setNotice('pruned');
        return writingThreads ? JSON.stringify(remaining) : pendingValue;
    }

    return null;
}

// Never rejects: the library logs a failed write and retries the message on the
// next run end, so degrading to an in-memory chat is better than surfacing an
// error the user cannot act on. The notice is what tells them to delete a chat.
async function setItem(key: string, value: string): Promise<void> {
    let pending = value;
    for (;;) {
        try {
            localStorage.setItem(key, pending);
            return;
        } catch (err) {
            if (!isQuotaError(err)) {
                console.warn('[chat-sidebar] could not write to storage', err);
                return;
            }
            const retryValue = pruneOldestThread(key, pending);
            if (retryValue === null) {
                setNotice('full');
                return;
            }
            pending = retryValue;
        }
    }
}

export const storage: AsyncStorageLike = {
    async getItem(key: string) {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    },
    setItem,
    async removeItem(key: string) {
        try {
            localStorage.removeItem(key);
        } catch {
            /* nothing to do — the entry is unreachable either way */
        }
    },
};

// The single-chat key this replaced. Its contents are not migrated: the format
// differs and the sidebar is still experimental.
export function removeLegacyChatStorage(): void {
    try {
        localStorage.removeItem(LEGACY_MESSAGES_KEY);
    } catch {
        /* ignore */
    }
}

export function readLastThreadId(): string | undefined {
    try {
        return localStorage.getItem(LAST_THREAD_KEY) ?? undefined;
    } catch {
        return undefined;
    }
}

export function saveLastThreadId(remoteId: string | undefined): void {
    setProtectedThreadId(remoteId ?? null);
    try {
        if (remoteId) localStorage.setItem(LAST_THREAD_KEY, remoteId);
        else localStorage.removeItem(LAST_THREAD_KEY);
    } catch {
        /* the open chat just won't be restored next load */
    }
}
