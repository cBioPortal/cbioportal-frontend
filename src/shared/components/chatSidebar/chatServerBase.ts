// The chat sidebar's iframe and the beacons code both need to reach the
// chat-sidebar-server (Vercel deployment in prod, local Vite/Express in dev).
// On cbioportal.org and Netlify deploy previews we point at the deployed
// Vercel app; everywhere else (localhost dev) we point at the developer's
// tailnet host.
export function getChatServerBase(): string {
    const host =
        typeof window !== 'undefined' ? window.location.hostname : '';
    if (host.endsWith('cbioportal.org') || host.endsWith('.netlify.app')) {
        return 'https://cbioportal-frontend-sidebar.vercel.app';
    }
    return 'https://vps-870e202d.tailf02841.ts.net:5174';
}
