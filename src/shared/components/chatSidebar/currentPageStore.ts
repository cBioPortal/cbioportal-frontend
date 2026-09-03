// Store of whichever page is mounted, registered via PageLayout, read by
// ChatSidebar without prop-drilling through Container or the router.
let current: unknown;

export function setCurrentPageStore(store: unknown) {
    current = store;
}

// Guards against an out-of-order unmount clobbering a newer registration.
export function clearCurrentPageStore(store: unknown) {
    if (current === store) {
        current = undefined;
    }
}

export function getCurrentPageStore(): unknown {
    return current;
}
