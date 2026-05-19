import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runSuggest } from '../../src/core.js';
import { applyCors } from '../../src/cors.js';

export const config = {
    maxDuration: 60, // Pro tier cap; first call on a fresh paper can take 15-30s.
};

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (applyCors(req, res)) return;
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const { studyId, genes, tab, preset, userPrompt, screenshot } = (req.body ??
        {}) as any;
    if (!studyId || typeof studyId !== 'string') {
        res.status(400).json({ error: 'studyId (string) required' });
        return;
    }
    try {
        const result = await runSuggest({
            studyId,
            genes,
            tab,
            preset,
            userPrompt,
            screenshot,
        });
        res.json(result);
    } catch (err: any) {
        console.error('suggest failed:', err);
        res.status(500).json({
            error: err?.message ?? 'Claude call failed',
        });
    }
}
