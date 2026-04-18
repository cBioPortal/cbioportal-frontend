declare module 'react-dom/client' {
    import { ReactNode } from 'react';

    export interface Root {
        render(children: ReactNode): void;
        unmount(): void;
    }

    export interface RootOptions {
        identifierPrefix?: string;
        onRecoverableError?: (error: unknown) => void;
    }

    export function createRoot(
        container: Element | DocumentFragment,
        options?: RootOptions
    ): Root;

    export interface HydrationOptions extends RootOptions {
        onHydrated?: (suspenseInstance: unknown) => void;
        onDeleted?: (suspenseInstance: unknown) => void;
    }

    export function hydrateRoot(
        container: Element | Document,
        initialChildren: ReactNode,
        options?: HydrationOptions
    ): Root;
}
