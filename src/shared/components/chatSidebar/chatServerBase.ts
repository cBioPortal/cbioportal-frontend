// The chat sidebar's iframe and the beacons code both need to reach the
// chat-sidebar-server (Vercel deployment in prod, local Vite/Express in dev).
// On cbioportal.org we point at the deployed Vercel app; everywhere else
// (localhost dev, any preview) we point at the developer's tailnet host.
export function getChatServerBase(): string {
    const host =
        typeof window !== 'undefined' ? window.location.hostname : '';
    if (host.endsWith('cbioportal.org')) {
        return 'https://cbioportal-frontend-sidebar.vercel.app';
    }
    return 'https://vps-870e202d.tailf02841.ts.net:5174';
}
