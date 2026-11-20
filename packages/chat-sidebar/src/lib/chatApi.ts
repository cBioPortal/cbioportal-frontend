import { AuthErrorStatus, setAuthError } from './chatSession';

// Raised wherever the portal rejects a request — a lapsed session (401) or a
// user without chat access (403) — after the auth screen has been switched on.
export class ChatAuthError extends Error {
    constructor(readonly status: AuthErrorStatus) {
        super(`the portal rejected the chat request (${status})`);
    }
}

export class ChatApiError extends Error {
    constructor(readonly status: number, path: string) {
        super(`chat threads request ${path} failed (HTTP ${status})`);
    }
}

const THREADS_API = '/api/chat/threads';

export function throwIfUnauthorized(response: Response): void {
    if (response.status === 401 || response.status === 403) {
        setAuthError(response.status);
        throw new ChatAuthError(response.status);
    }
}

export function threadPath(threadId: string, ...rest: string[]): string {
    return ['', threadId, ...rest].map(encodeURIComponent).join('/');
}

// The server owns every chat, so these are the only reads and writes of
// history the client makes. Non-OK responses other than auth are the
// caller's to interpret, since a 404 is sometimes the expected answer.
export async function threadsRequest(
    path: string,
    init: { method?: string; body?: unknown } = {}
): Promise<Response> {
    const hasBody = init.body !== undefined;
    const response = await fetch(`${THREADS_API}${path}`, {
        method: init.method ?? 'GET',
        headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
        body: hasBody ? JSON.stringify(init.body) : undefined,
    });
    throwIfUnauthorized(response);
    return response;
}

export async function threadsJson<T>(
    path: string,
    init?: { method?: string; body?: unknown }
): Promise<T> {
    const response = await threadsRequest(path, init);
    if (!response.ok) throw new ChatApiError(response.status, path);
    return response.json();
}

// Already gone is fine — the runtime and this app can both ask.
export async function deleteStoredMessage(
    remoteId: string,
    messageId: string
): Promise<void> {
    const path = threadPath(remoteId, 'messages', messageId);
    const response = await threadsRequest(path, { method: 'DELETE' });
    if (!response.ok && response.status !== 404) {
        throw new ChatApiError(response.status, path);
    }
}

export async function threadsSend(
    path: string,
    init: { method: string; body?: unknown }
): Promise<void> {
    const response = await threadsRequest(path, init);
    if (!response.ok) throw new ChatApiError(response.status, path);
}
