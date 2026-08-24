import './env.js'; // must be first — see env.ts
import express from 'express';
import cors from 'cors';
import { MODEL, AVAILABLE_MODELS, runChat } from './core.js';

const PORT = Number(process.env.PORT || 4000);

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));

app.get('/api/chat/health', (_req, res) => {
    res.json({ ok: true, model: MODEL });
});

app.get('/api/chat/models', (_req, res) => {
    res.json({ models: AVAILABLE_MODELS });
});

app.post('/api/chat/message', async (req, res) => {
    const { messages, model } = req.body ?? {};
    if (!Array.isArray(messages)) {
        res.status(400).json({ error: 'messages (array) required' });
        return;
    }
    try {
        await runChat(messages, res, model);
    } catch (err) {
        console.error('chat message failed:', err);
        if (!res.headersSent) {
            const message = err instanceof Error ? err.message : 'chat failed';
            res.status(500).json({ error: message });
        }
    }
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(
        `chat-sidebar-server listening on http://127.0.0.1:${PORT} (model: ${MODEL})`
    );
});
