import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MODEL } from '../../src/core.js';
import { applyCors } from '../../src/cors.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
    if (applyCors(req, res)) return;
    res.json({ ok: true, model: MODEL });
}
