import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MODEL } from '../../src/core.js';

export default function handler(_req: VercelRequest, res: VercelResponse) {
    res.json({ ok: true, model: MODEL });
}
