// Express dev server — wraps the shared logic in core.ts so that
// `pnpm dev` here mirrors what the Vercel functions in api/chat/* do.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { MODEL, runSuggest, runHighlights } from './core.js';

const PORT = Number(process.env.PORT || 4000);

if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set. Add it to .env.');
    process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));

app.get('/api/chat/health', (_req, res) => {
    res.json({ ok: true, model: MODEL });
});

app.post('/api/chat/suggest', async (req, res) => {
    const { studyId, genes, tab, preset, userPrompt, screenshot } =
        req.body ?? {};
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
});

app.post('/api/chat/highlights', async (req, res) => {
    const { studyId } = req.body ?? {};
    if (!studyId || typeof studyId !== 'string') {
        res.status(400).json({ error: 'studyId (string) required' });
        return;
    }
    try {
        const result = await runHighlights({ studyId });
        res.json(result);
    } catch (err: any) {
        console.error('highlights failed:', err);
        res.status(500).json({
            error: err?.message ?? 'Claude call failed',
        });
    }
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(
        `chat-sidebar-server listening on http://127.0.0.1:${PORT} (model: ${MODEL})`
    );
});
