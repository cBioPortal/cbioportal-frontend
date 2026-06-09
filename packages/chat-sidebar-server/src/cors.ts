import type { VercelRequest, VercelResponse } from '@vercel/node';

// The highlights and suggest endpoints are invoked cross-origin from the
// cBioPortal host page (e.g. cbioportal.org) as well as same-origin from the
// iframe. Echo the Origin header for any caller — these endpoints take only
// a studyId, so there's nothing user-specific to leak; the ANTHROPIC_API_KEY
// stays server-side.
export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
    const origin = (req.headers.origin as string) || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return true;
    }
    return false;
}
