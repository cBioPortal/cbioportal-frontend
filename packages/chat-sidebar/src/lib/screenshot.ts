import { isFromParent, parentOrigin } from './parent-origin';

// Bridges to the host page via postMessage since this iframe can't capture
// its DOM/canvases directly; 30s covers the host's own worst-case budget.
export function requestScreenshot(timeoutMs = 30000): Promise<string | null> {
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
                e.data?.type !== 'chat-sidebar:screenshot' ||
                e.data.requestId !== requestId
            ) {
                return;
            }
            clearTimeout(timer);
            window.removeEventListener('message', onMessage);
            resolve(e.data.dataUrl ?? null);
        }
        window.addEventListener('message', onMessage);
        window.parent.postMessage(
            { type: 'chat-sidebar:requestScreenshot', requestId },
            parentOrigin()
        );
    });
}
