import './env.js'; // must be first — see env.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import {
    NoSuchModelError,
    OnLanguageModelCallEndCallback,
    UIMessage,
} from 'ai';
import {
    DEFAULT_MODEL,
    AVAILABLE_MODELS,
    fallbackTitle,
    runChat,
    runFollowups,
    runReport,
    runTitle,
} from './core.js';
import {
    deleteMessage,
    deleteThread,
    ensureThread,
    getThread,
    listMessages,
    listThreads,
    loadBranch,
    ThreadNotFoundError,
    ThreadStatus,
    updateThread,
    upsertMessage,
} from './store.js';
import {
    getUsage,
    recordCall,
    requireAllowance,
    UsageLimitError,
} from './usage.js';
import { rejectCrossSite, requireUser, userOf } from './user.js';

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

// Counts each model call a request makes against the user's allowance.
function recordFor(userId: string): OnLanguageModelCallEndCallback {
    return event => recordCall(userId, event);
}

// A model id the registry doesn't have is the client's mistake, not ours.
function errorStatus(err: unknown): number {
    return NoSuchModelError.isInstance(err) ? 400 : 500;
}

app.get('/api/chat/health', (_req, res) => {
    res.json({ ok: true, model: DEFAULT_MODEL ?? null });
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

// Everything that reads or writes a user's chats, or calls a model and so
// counts against their allowance. The rest — config, models — works from what
// the request carries.
app.use(
    [
        '/api/chat/threads',
        '/api/chat/message',
        '/api/chat/report',
        '/api/chat/followups',
        '/api/chat/usage',
    ],
    rejectCrossSite,
    requireUser
);

// The time is in UTC, as the server doesn't know the user's time zone; the
// client can show `availableAt` in theirs.
function limitMessage(availableAt: Date): string {
    const at = availableAt
        .toISOString()
        .slice(0, 16)
        .replace('T', ' ');
    return `You've reached your chat usage limit. You can chat again after ${at} UTC.`;
}

// Express 4 doesn't catch a rejected async handler, so each one goes through
// here. A thread that is missing or someone else's is a 404 either way.
function route(
    handler: (req: Request, res: Response) => Promise<void>
): express.RequestHandler {
    return (req, res) => {
        handler(req, res).catch(err => {
            if (err instanceof ThreadNotFoundError) {
                res.status(404).json({ error: err.message });
                return;
            }
            if (err instanceof UsageLimitError) {
                res.status(429).json({
                    error: limitMessage(err.availableAt),
                    code: 'limit_reached',
                    availableAt: err.availableAt,
                });
                return;
            }
            console.error(`${req.method} ${req.path} failed:`, err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'internal error' });
            }
        });
    };
}

const MAX_ID_LENGTH = 200;
const MAX_TITLE_LENGTH = 200;

function isId(value: unknown): value is string {
    return (
        typeof value === 'string' &&
        value.length > 0 &&
        value.length <= MAX_ID_LENGTH
    );
}

function isUIMessage(value: unknown): value is UIMessage {
    const message = value as UIMessage | null;
    return (
        typeof message === 'object' &&
        message !== null &&
        isId(message.id) &&
        (message.role === 'user' || message.role === 'assistant') &&
        Array.isArray(message.parts)
    );
}

app.get(
    '/api/chat/usage',
    route(async (_req, res) => {
        res.json(await getUsage(userOf(res)));
    })
);

app.get(
    '/api/chat/threads',
    route(async (_req, res) => {
        res.json({ threads: await listThreads(userOf(res)) });
    })
);

app.post(
    '/api/chat/threads',
    route(async (req, res) => {
        const { id } = req.body ?? {};
        if (!isId(id)) {
            res.status(400).json({ error: 'id (string) required' });
            return;
        }
        await ensureThread(userOf(res), id);
        res.json({ remoteId: id });
    })
);

app.get(
    '/api/chat/threads/:id',
    route(async (req, res) => {
        const thread = await getThread(userOf(res), req.params.id);
        if (!thread) throw new ThreadNotFoundError(req.params.id);
        res.json(thread);
    })
);

app.patch(
    '/api/chat/threads/:id',
    route(async (req, res) => {
        const { title, status } = req.body ?? {};
        const changes: { title?: string; status?: ThreadStatus } = {};
        if (typeof title === 'string') {
            changes.title = title.trim().slice(0, MAX_TITLE_LENGTH);
        }
        if (status === 'regular' || status === 'archived') {
            changes.status = status;
        }
        if (!Object.keys(changes).length) {
            res.status(400).json({
                error: 'title (string) or status (regular|archived) required',
            });
            return;
        }
        if (!(await updateThread(userOf(res), req.params.id, changes))) {
            throw new ThreadNotFoundError(req.params.id);
        }
        res.status(204).end();
    })
);

app.delete(
    '/api/chat/threads/:id',
    route(async (req, res) => {
        if (!(await deleteThread(userOf(res), req.params.id))) {
            throw new ThreadNotFoundError(req.params.id);
        }
        res.status(204).end();
    })
);

app.get(
    '/api/chat/threads/:id/messages',
    route(async (req, res) => {
        const messages = await listMessages(userOf(res), req.params.id);
        if (!messages) throw new ThreadNotFoundError(req.params.id);
        res.json({ messages });
    })
);

// Called by the client's history when a run is stopped before any reply. The
// chat endpoint has normally removed the prompt already.
app.delete(
    '/api/chat/threads/:id/messages/:messageId',
    route(async (req, res) => {
        const { id, messageId } = req.params;
        if (!(await deleteMessage(userOf(res), id, messageId))) {
            res.status(404).json({ error: `message ${messageId} not found` });
            return;
        }
        res.status(204).end();
    })
);

// Generates the title and saves it, since the client's thread list only shows
// what it is handed back. A user at their allowance still gets a title: the
// start of their opening question.
app.post(
    '/api/chat/threads/:id/title',
    route(async (req, res) => {
        const { text, model } = req.body ?? {};
        if (typeof text !== 'string' || !text.trim()) {
            res.status(400).json({ error: 'text (string) required' });
            return;
        }
        const userId = userOf(res);
        if (!(await getThread(userId, req.params.id))) {
            throw new ThreadNotFoundError(req.params.id);
        }
        const signal = abortOnClose(res);
        let title: string;
        try {
            await requireAllowance(userId);
            title =
                (await runTitle(text, signal, recordFor(userId), model)) ||
                fallbackTitle(text);
        } catch (err) {
            if (!signal.aborted && !(err instanceof UsageLimitError)) {
                console.error('title generation failed:', err);
            }
            title = fallbackTitle(text);
        }
        await updateThread(userId, req.params.id, { title });
        res.json({ title });
    })
);

// The client sends only the new message — the user's prompt, or after a
// client-side tool call the assistant message carrying its output — and its
// parent. The server owns the history: the message is saved before the model
// runs, the conversation is read back from the database, and the reply is
// saved when it ends, stopped or not.
app.post(
    '/api/chat/message',
    route(async (req, res) => {
        const { id, message, parentId, model, pageHref } = req.body ?? {};
        if (
            !isId(id) ||
            !isUIMessage(message) ||
            (parentId != null && !isId(parentId)) ||
            parentId === message.id
        ) {
            res.status(400).json({
                error:
                    'id, message and an optional parentId other than the message id required',
            });
            return;
        }
        // Before anything is awaited, so a client that leaves while the
        // history loads still stops the model.
        const signal = abortOnClose(res);
        const userId = userOf(res);
        const parent: string | null = parentId ?? null;
        // Before the prompt is saved, so a refused one never enters the
        // history.
        await requireAllowance(userId);
        await ensureThread(userId, id);
        await upsertMessage(id, message, parent);
        const branch = await loadBranch(id, message.id);

        // A prompt stopped before the client saw a reply begin goes back into
        // the composer, so it is taken out of the history. A continuation
        // keeps the tool output it carried.
        const onEnd = async (
            reply: UIMessage | null,
            isContinuation: boolean
        ) => {
            try {
                if (reply) {
                    await upsertMessage(
                        id,
                        reply,
                        isContinuation ? parent : message.id
                    );
                } else if (!isContinuation) {
                    await deleteMessage(userId, id, message.id);
                }
            } catch (err) {
                console.error('saving the reply failed:', err);
            }
        };
        try {
            await runChat(
                branch,
                res,
                signal,
                onEnd,
                recordFor(userId),
                model,
                pageHref
            );
        } catch (err) {
            if (signal.aborted) return;
            console.error('chat message failed:', err);
            if (!res.headersSent) {
                const text = err instanceof Error ? err.message : 'chat failed';
                res.status(errorStatus(err)).json({ error: text });
            }
        }
    })
);

app.post(
    '/api/chat/report',
    route(async (req, res) => {
        const { messages, model } = req.body ?? {};
        if (!Array.isArray(messages)) {
            res.status(400).json({ error: 'messages (array) required' });
            return;
        }
        const signal = abortOnClose(res);
        const userId = userOf(res);
        await requireAllowance(userId);
        try {
            const report = await runReport(
                messages,
                signal,
                recordFor(userId),
                model
            );
            res.json({ report });
        } catch (err) {
            if (signal.aborted) return;
            console.error('report generation failed:', err);
            const message =
                err instanceof Error ? err.message : 'report failed';
            res.status(errorStatus(err)).json({ error: message });
        }
    })
);

// Streamed as NDJSON, one { title, prompt } per line, so each pill can show as
// soon as it is complete.
app.post(
    '/api/chat/followups',
    route(async (req, res) => {
        const { question, answer, href, details, model } = req.body ?? {};
        if (typeof question !== 'string' || typeof answer !== 'string') {
            res.status(400).json({
                error: 'question and answer (strings) required',
            });
            return;
        }
        const signal = abortOnClose(res);
        const userId = userOf(res);
        await requireAllowance(userId);
        try {
            const followups = runFollowups(
                {
                    question,
                    answer,
                    href: typeof href === 'string' ? href : '',
                    details: details ?? { available: false },
                },
                signal,
                recordFor(userId),
                model
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
            res.status(errorStatus(err)).json({ error: message });
        }
    })
);

app.use('/chat-sidebar', express.static(SIDEBAR_DIST));

app.listen(PORT, HOST, () => {
    console.log(
        `chat-sidebar-server listening on http://${HOST}:${PORT} (default model: ${DEFAULT_MODEL ??
            'none configured'})`
    );
});
