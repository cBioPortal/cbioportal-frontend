// State shared between App and the per-thread runtime hook. It cannot be a
// React context: the runtime hook runs inside a tap resource, where React's
// dispatcher is swapped and useContext resolves against tap's own map, falling
// back to createContext's default — a provider in App would never be seen.

export type AuthErrorStatus = 401 | 403;

// As /api/chat/models lists them; the shape of the model selector's options.
export interface ModelInfo {
    id: string;
    name: string;
    description?: string;
}

const MODEL_STORAGE_KEY = 'chat-sidebar:selectedModel';

function readStoredModel(): string | null {
    try {
        return localStorage.getItem(MODEL_STORAGE_KEY);
    } catch {
        return null;
    }
}

let authError: AuthErrorStatus | null = null;
let models: readonly ModelInfo[] = [];
// Kept here rather than in the selector: it has to survive reloads and chat
// switches (which remount the composer), and the title and follow-up requests
// read it from outside the React tree.
let selectedModel: string | null = readStoredModel();

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

export function getAuthError(): AuthErrorStatus | null {
    return authError;
}

// Set from two places: the config fetch on load, and any thread's transport
// once the portal starts rejecting it.
export function setAuthError(status: AuthErrorStatus | null): void {
    if (status === authError) return;
    authError = status;
    emit();
}

export function getModels(): readonly ModelInfo[] {
    return models;
}

// A stored selection the server no longer offers falls back to its default,
// the first model listed.
export function setModels(next: readonly ModelInfo[]): void {
    models = next;
    if (!selectedModel || !next.some(m => m.id === selectedModel)) {
        setSelectedModel(next[0]?.id ?? null);
    }
    emit();
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
