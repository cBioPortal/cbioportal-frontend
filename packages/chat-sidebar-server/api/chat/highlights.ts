import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runHighlights } from '../../src/core.js';
import { applyCors } from '../../src/cors.js';

export const config = {
    maxDuration: 60,
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
    const { studyId, inventory, model } = (req.body ?? {}) as any;
    if (!studyId || typeof studyId !== 'string') {
        res.status(400).json({ error: 'studyId (string) required' });
        return;
    }
    try {
        const result = await runHighlights({ studyId, inventory, model });
        res.json(result);
    } catch (err: any) {
        console.error('highlights failed:', err);
        res.status(500).json({
            error: err?.message ?? 'Claude call failed',
        });
    }
}
