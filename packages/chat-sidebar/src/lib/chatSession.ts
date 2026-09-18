// State shared between App and the per-thread runtime hook. It cannot be a
// React context: the runtime hook runs inside a tap resource, where React's
// dispatcher is swapped and useContext resolves against tap's own map, falling
// back to createContext's default — a provider in App would never be seen.

export type AuthErrorStatus = 401 | 403;

export interface ModelInfo {
    id: string;
    name: string;
}

const MODEL_STORAGE_KEY = 'chat-sidebar:selectedModel';

function readStoredModel(): string | null {
    try {
        return localStorage.getItem(MODEL_STORAGE_KEY);
    } catch {
        return null;
    }
}

let selectedModel: string | null = readStoredModel();
let authError: AuthErrorStatus | null = null;

const listeners = new Set<() => void>();

function emit(): void {
    for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function getSelectedModel(): string | null {
    return selectedModel;
}

export function setSelectedModel(id: string | null): void {
    if (id === selectedModel) return;
    selectedModel = id;
    try {
        if (id) localStorage.setItem(MODEL_STORAGE_KEY, id);
        else localStorage.removeItem(MODEL_STORAGE_KEY);
    } catch {
        /* private mode etc — the selection just doesn't persist */
    }
    emit();
}

export function getAuthError(): AuthErrorStatus | null {
    return authError;
}

// Set from two places: the models fetch on load, and any thread's transport
// once the portal starts rejecting it.
export function setAuthError(status: AuthErrorStatus | null): void {
    if (status === authError) return;
    authError = status;
    emit();
}
