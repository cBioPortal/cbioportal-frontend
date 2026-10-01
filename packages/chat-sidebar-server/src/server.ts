import './env.js'; // must be first — see env.ts
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import {
    MODEL,
    AVAILABLE_MODELS,
    runChat,
    runFollowups,
    runReport,
    runStarters,
    runTitle,
} from './core.js';

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || '127.0.0.1';
const SIDEBAR_DIST = fileURLToPath(new URL('../public', import.meta.url));

// Deployed, the portal backend proxies this service, so requests are same-origin
// and CORS never applies. It only matters for local dev against the Vite server.
const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

const app = express();
app.use(cors(corsOrigins.length ? { origin: corsOrigins } : {}));
app.use(express.json({ limit: '8mb' }));

app.get('/api/chat/health', (_req, res) => {
    res.json({ ok: true, model: MODEL });
});

app.get('/api/chat/models', (_req, res) => {
    res.json({ models: AVAILABLE_MODELS });
});

app.post('/api/chat/message', async (req, res) => {
    const { messages, model, pageHref } = req.body ?? {};
    if (!Array.isArray(messages)) {
        res.status(400).json({ error: 'messages (array) required' });
        return;
    }
    try {
        await runChat(messages, res, model, pageHref);
    } catch (err) {
        console.error('chat message failed:', err);
        if (!res.headersSent) {
            const message = err instanceof Error ? err.message : 'chat failed';
            res.status(500).json({ error: message });
        }
    }
});

app.post('/api/chat/report', async (req, res) => {
    const { messages, model } = req.body ?? {};
    if (!Array.isArray(messages)) {
        res.status(400).json({ error: 'messages (array) required' });
        return;
    }
    try {
        const report = await runReport(messages, model);
        res.json({ report });
    } catch (err) {
        console.error('report generation failed:', err);
        const message = err instanceof Error ? err.message : 'report failed';
        res.status(500).json({ error: message });
    }
});

app.post('/api/chat/title', async (req, res) => {
    const { text, model } = req.body ?? {};
    if (typeof text !== 'string' || !text.trim()) {
        res.status(400).json({ error: 'text (string) required' });
        return;
    }
    try {
        const title = await runTitle(text, model);
        res.json({ title });
    } catch (err) {
        console.error('title generation failed:', err);
        const message = err instanceof Error ? err.message : 'title failed';
        res.status(500).json({ error: message });
    }
});

app.post('/api/chat/starters', async (req, res) => {
    const { href, details } = req.body ?? {};
    if (typeof href !== 'string' || !href.trim()) {
        res.status(400).json({ error: 'href (string) required' });
        return;
    }
    try {
        const result = await runStarters(href, details ?? { available: false });
        res.json(result);
    } catch (err) {
        console.error('starters generation failed:', err);
        const message = err instanceof Error ? err.message : 'starters failed';
        res.status(500).json({ error: message });
    }
});

// Streamed as NDJSON, one { title, prompt } per line, so each pill can show as
// soon as it is complete.
app.post('/api/chat/followups', async (req, res) => {
    const { question, answer, href, details } = req.body ?? {};
    if (typeof question !== 'string' || typeof answer !== 'string') {
        res.status(400).json({
            error: 'question and answer (strings) required',
        });
        return;
    }
    // Also fires once the response ends normally, when nothing is left to stop.
    const controller = new AbortController();
    res.on('close', () => controller.abort());
    try {
        const followups = runFollowups(
            {
                question,
                answer,
                href: typeof href === 'string' ? href : '',
                details: details ?? { available: false },
            },
            controller.signal
        );
        for await (const followup of followups) {
            if (!res.headersSent) {
                res.writeHead(200, {
                    'Content-Type': 'application/x-ndjson',
                    'Cache-Control': 'no-cache',
                    'X-Accel-Buffering': 'no',
                });
            }
            res.write(`${JSON.stringify(followup)}\n`);
        }
        res.end();
    } catch (err) {
        if (controller.signal.aborted) return;
        console.error('follow-ups generation failed:', err);
        if (res.headersSent) {
            res.end();
            return;
        }
        const message =
            err instanceof Error ? err.message : 'follow-ups failed';
        res.status(500).json({ error: message });
    }
});

app.use('/chat-sidebar', express.static(SIDEBAR_DIST));

app.listen(PORT, HOST, () => {
    console.log(
        `chat-sidebar-server listening on http://${HOST}:${PORT} (model: ${MODEL})`
    );
});
