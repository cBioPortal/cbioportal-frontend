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

// Aborts when the client goes away — Stop, a closed tab — so the model call
// stops with it. Also fires once the response ends normally, when nothing is
// left to stop.
function abortOnClose(res: express.Response): AbortSignal {
    const controller = new AbortController();
    res.on('close', () => controller.abort());
    return controller.signal;
}

app.get('/api/chat/health', (_req, res) => {
    res.json({ ok: true, model: MODEL });
});

// Hosts whose links the sidebar rewrites to the portal it is embedded in —
// whatever host the MCP tools build their links on.
const portalLinkAliases = (
    process.env.PORTAL_LINK_ALIASES || 'www.cbioportal.org,cbioportal.org'
)
    .split(',')
    .map(host => host.trim().toLowerCase())
    .filter(Boolean);

app.get('/api/chat/config', (_req, res) => {
    res.json({ portalLinkAliases });
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
    const signal = abortOnClose(res);
    try {
        await runChat(messages, res, signal, model, pageHref);
    } catch (err) {
        if (signal.aborted) return;
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
    const signal = abortOnClose(res);
    try {
        for await (const chunk of runReport(messages, signal, model)) {
            if (!res.headersSent) {
                res.writeHead(200, {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'no-cache',
                    'X-Accel-Buffering': 'no',
                });
            }
            res.write(chunk);
        }
        res.end();
    } catch (err) {
        if (signal.aborted) return;
        console.error('report generation failed:', err);
        // Cut mid-stream so the client sees the report as incomplete.
        if (res.headersSent) {
            res.destroy();
            return;
        }
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
    const signal = abortOnClose(res);
    try {
        const title = await runTitle(text, signal, model);
        res.json({ title });
    } catch (err) {
        if (signal.aborted) return;
        console.error('title generation failed:', err);
        const message = err instanceof Error ? err.message : 'title failed';
        res.status(500).json({ error: message });
    }
});

// Streamed as NDJSON, one { title, prompt } per line, so each pill can show as
// soon as it is complete.
app.post('/api/chat/followups', async (req, res) => {
    const { question, answer, href, details, model } = req.body ?? {};
    if (typeof question !== 'string' || typeof answer !== 'string') {
        res.status(400).json({
            error: 'question and answer (strings) required',
        });
        return;
    }
    const signal = abortOnClose(res);
    try {
        const followups = runFollowups(
            {
                question,
                answer,
                href: typeof href === 'string' ? href : '',
                details: details ?? { available: false },
            },
            signal,
            typeof model === 'string' ? model : undefined
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
        if (signal.aborted) return;
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
