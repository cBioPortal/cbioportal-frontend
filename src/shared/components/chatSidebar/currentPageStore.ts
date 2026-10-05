import { action, observable } from 'mobx';

// Store of whichever page is mounted, registered via PageLayout, read by
// ChatSidebar without prop-drilling through Container or the router.
// Observable so pageEvents.ts can react to pages mounting and unmounting;
// shallow, since the store itself is already observable where it matters.
const current = observable.box<unknown>(undefined, { deep: false });

export const setCurrentPageStore = action((store: unknown) => {
    current.set(store);
});

// Guards against an out-of-order unmount clobbering a newer registration.
export const clearCurrentPageStore = action((store: unknown) => {
    if (current.get() === store) {
        current.set(undefined);
    }
});

export function getCurrentPageStore(): unknown {
    return current.get();
}
