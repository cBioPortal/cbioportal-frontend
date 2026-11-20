import { embedded, parentOrigin } from './parent-origin';

// Mirrors the host ChatSidebar's modes. The host owns the mode: this side
// renders what it's told and asks for changes.
export type SidebarMode = 'expanded' | 'rail' | 'hidden';

export function isSidebarMode(v: unknown): v is SidebarMode {
    return v === 'expanded' || v === 'rail' || v === 'hidden';
}

// Null while embedded until the host's first message, so nothing is drawn in
// a layout that may be the wrong one (e.g. the full chat squeezed into the
// rail on a reload).
let mode: SidebarMode | null = embedded ? null : 'expanded';

const listeners = new Set<() => void>();

export function subscribeToSidebarMode(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function getSidebarMode(): SidebarMode | null {
    return mode;
}

export function setSidebarModeFromHost(next: SidebarMode): void {
    if (next === mode) return;
    mode = next;
    for (const listener of listeners) listener();
}

export function requestSidebarMode(next: 'expanded' | 'rail'): void {
    if (!embedded) return;
    window.parent.postMessage(
        { type: 'chat-sidebar:setMode', mode: next },
        parentOrigin()
    );
}
