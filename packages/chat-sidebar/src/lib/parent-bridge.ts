import { isFromParent, parentOrigin } from './parent-origin';

// This iframe has no access to the host URL otherwise; null if standalone
// or no reply in time.
export function requestPageHref(timeoutMs = 500): Promise<string | null> {
    return new Promise(resolve => {
        if (!window.parent || window.parent === window) {
            resolve(null);
            return;
        }
        const requestId = Math.random()
            .toString(36)
            .slice(2);
        const timer = setTimeout(() => {
            window.removeEventListener('message', onMessage);
            resolve(null);
        }, timeoutMs);
        function onMessage(e: MessageEvent) {
            if (
                !isFromParent(e) ||
                e.data?.type !== 'chat-sidebar:pageInfo' ||
                e.data.requestId !== requestId
            ) {
                return;
            }
            clearTimeout(timer);
            window.removeEventListener('message', onMessage);
            resolve(e.data.href ?? null);
        }
        window.addEventListener('message', onMessage);
        window.parent.postMessage(
            { type: 'chat-sidebar:requestPageInfo', requestId },
            parentOrigin()
        );
    });
}

// This iframe has no access to the live app store otherwise.
export function requestPageDetails(timeoutMs = 2000): Promise<unknown> {
    return new Promise(resolve => {
        if (!window.parent || window.parent === window) {
            resolve({ available: false });
            return;
        }
        const requestId = Math.random()
            .toString(36)
            .slice(2);
        const timer = setTimeout(() => {
            window.removeEventListener('message', onMessage);
            resolve({ available: false });
        }, timeoutMs);
        function onMessage(e: MessageEvent) {
            if (
                !isFromParent(e) ||
                e.data?.type !== 'chat-sidebar:pageDetails' ||
                e.data.requestId !== requestId
            ) {
                return;
            }
            clearTimeout(timer);
            window.removeEventListener('message', onMessage);
            resolve(e.data.details ?? { available: false });
        }
        window.addEventListener('message', onMessage);
        window.parent.postMessage(
            { type: 'chat-sidebar:requestPageDetails', requestId },
            parentOrigin()
        );
    });
}
