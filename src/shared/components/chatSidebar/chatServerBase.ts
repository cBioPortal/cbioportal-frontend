// Where the chat sidebar's iframe/backend is served from per environment.
export function getChatServerBase(): string {
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    if (host.endsWith('cbioportal.org') || host.endsWith('.netlify.app')) {
        return 'https://cbioportal-frontend-sidebar.vercel.app';
    }
    if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:5174';
    }
    return 'https://vps-870e202d.tailf02841.ts.net:5174';
}
