import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getShortlistedModels } from '../../src/pricing.js';
import { applyCors } from '../../src/cors.js';

export const config = {
    maxDuration: 30,
};

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (applyCors(req, res)) return;
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    try {
        const models = await getShortlistedModels();
        res.json({ models });
    } catch (err: any) {
        console.error('models failed:', err);
        res.status(500).json({
            error: err?.message ?? 'Could not fetch model catalog',
        });
    }
}
