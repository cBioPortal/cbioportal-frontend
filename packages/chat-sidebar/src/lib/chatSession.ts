// State shared between App and the per-thread runtime hook. It cannot be a
// React context: the runtime hook runs inside a tap resource, where React's
// dispatcher is swapped and useContext resolves against tap's own map, falling
// back to createContext's default — a provider in App would never be seen.

export type AuthErrorStatus = 401 | 403;

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
