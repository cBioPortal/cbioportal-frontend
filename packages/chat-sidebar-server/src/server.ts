// Express dev server — wraps the shared logic in core.ts so that
// `pnpm dev` here mirrors what the Vercel functions in api/chat/* do.
import { config as loadEnv } from 'dotenv';
import express from 'express';
import cors from 'cors';
import { MODEL, runSuggest, runHighlights } from './core.js';
import { getShortlistedModels } from './pricing.js';

// Load .env then layer .env.local on top — VERCEL_OIDC_TOKEN lands in
// .env.local via `vercel env pull`, so the local order has to match what
// Vercel does in deployed envs.
loadEnv();
loadEnv({ path: '.env.local', override: true });

const PORT = Number(process.env.PORT || 4000);

if (!process.env.VERCEL_OIDC_TOKEN && !process.env.AI_GATEWAY_API_KEY) {
    console.error(
        'No AI Gateway credentials found. Run `vercel env pull .env.local --yes` to provision VERCEL_OIDC_TOKEN, or set AI_GATEWAY_API_KEY.'
    );
    process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));

app.get('/api/chat/health', (_req, res) => {
    res.json({ ok: true, model: MODEL });
});

app.get('/api/chat/models', async (_req, res) => {
    try {
        const models = await getShortlistedModels();
        res.json({ models });
    } catch (err: any) {
        console.error('models failed:', err);
        res.status(500).json({
            error: err?.message ?? 'Could not fetch model catalog',
        });
    }
});

app.post('/api/chat/suggest', async (req, res) => {
    const { studyId, genes, tab, preset, userPrompt, screenshot, model } =
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
            model,
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
    const { studyId, inventory, model } = req.body ?? {};
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
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(
        `chat-sidebar-server listening on http://127.0.0.1:${PORT} (model: ${MODEL})`
    );
});
