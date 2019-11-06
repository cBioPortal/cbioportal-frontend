// This is a temporary workaround until https://github.com/facebook/react/issues/14856 is fixed
export function handleTouchAndWheelEventsForChromeBug(document: any) {
    const EVENTS_TO_MODIFY = ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'wheel'];

    const originalAddEventListener = document.addEventListener.bind();
    document.addEventListener = (type: string, listener: any, options: any, wantsUntrusted: any) => {
    let modOptions = options;
    if (EVENTS_TO_MODIFY.includes(type)) {
        if (typeof options === 'boolean') {
        modOptions = {
            capture: options,
            passive: false,
        };
        } else if (typeof options === 'object') {
        modOptions = {
            passive: false,
            ...options,
        };
        }
    }

    return originalAddEventListener(type, listener, modOptions, wantsUntrusted);
    };

    const originalRemoveEventListener = document.removeEventListener.bind();
    document.removeEventListener = (type: string, listener: any, options: any) => {
    let modOptions = options;
    if (EVENTS_TO_MODIFY.includes(type)) {
        if (typeof options === 'boolean') {
        modOptions = {
            capture: options,
            passive: false,
        };
        } else if (typeof options === 'object') {
        modOptions = {
            passive: false,
            ...options,
        };
        }
    }
    return originalRemoveEventListener(type, listener, modOptions);
    };
}