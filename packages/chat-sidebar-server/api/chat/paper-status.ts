import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPaperContext } from '../../src/core.js';
import { applyCors } from '../../src/cors.js';

export const config = {
    // First call per study still has to fetch PMC; subsequent ones hit the
    // in-memory cache and return immediately.
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
    const studyId = req.query.studyId;
    if (!studyId || typeof studyId !== 'string') {
        res.status(400).json({ error: 'studyId (string) required' });
        return;
    }
    try {
        const paper = await getPaperContext(studyId);
        res.json({
            studyId,
            source: paper.source,
            paperUrl: paper.paperUrl,
            studyName: paper.study.name,
        });
    } catch (err: any) {
        console.error('paper-status failed:', err);
        res.status(500).json({
            error: err?.message ?? 'paper status failed',
        });
    }
}
