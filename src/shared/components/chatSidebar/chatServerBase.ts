// Where the chat sidebar's iframe and backend are served from per environment.
//
// Deployed, both come from the portal's own origin because of backend proxy.
//
// Locally the iframe is the Vite dev server, which proxies to the chat server on
// port 4000. Nothing is authenticated in that setup.
export function getChatServerBase(): string {
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:5174';
    }
    return '/chat-sidebar';
}

// The origin to address the iframe by, and the only origin to accept messages
// from. Same-origin deployed; the dev server otherwise.
export function getChatOrigin(): string {
    const base = getChatServerBase();
    return base.startsWith('http')
        ? new URL(base).origin
        : window.location.origin;
}
