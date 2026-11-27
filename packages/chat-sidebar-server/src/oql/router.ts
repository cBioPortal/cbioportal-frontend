// The natural-language-to-OQL API. Open to everyone: no login, no allowance.
// Every model call is recorded and traced under one fixed id, whoever is
// logged in.

import express, { Request, Response } from 'express';
import { propagateAttributes } from '@langfuse/tracing';
import { recordCall } from '../usage.js';
import {
    describeQuery,
    parseOql,
    schemaIssues,
    serializeChecked,
} from './dsl/index.js';
import { DEFAULT_PORTAL } from './service/upstream.js';
import { validateQuery } from './service/validate.js';
import {
    DEFAULT_MODE,
    NoOqlModelError,
    oqlModelId,
    translate,
} from './translate.js';

export const OQL_USER_ID = 'anonymous-oql';

const MAX_PROMPT = 2000;

type Body = Record<string, unknown>;

function bodyOf(req: Request, res: Response): Body | undefined {
    const body = req.body;
    if (body && typeof body === 'object' && !Array.isArray(body))
        return body as Body;
    res.status(400).json({ error: 'body must be a JSON object' });
    return undefined;
}

function portalFrom(body: Body): string {
    const p =
        typeof body.portalUrl === 'string' && body.portalUrl
            ? body.portalUrl
            : DEFAULT_PORTAL;
    return p.replace(/\/+$/, '');
}

/** Selected studies from `studyIds` (array) and/or a single `studyId`, de-duplicated. */
function studiesFrom(body: Body): string[] {
    const list = Array.isArray(body.studyIds) ? body.studyIds : [];
    const ids = [...list, body.studyId]
        .filter((s): s is string => typeof s === 'string')
        .map(s => s.trim());
    return [...new Set(ids.filter(Boolean))];
}

function resultsUrl(portal: string, studyIds: string[], oql: string): string {
    const params = new URLSearchParams({
        cancer_study_list: studyIds.join(','),
        case_set_id: studyIds.length === 1 ? `${studyIds[0]}_all` : 'all',
        gene_list: oql,
    });
    return `${portal}/results/oncoprint?${params}`;
}

// Aborts when the client goes away, so the model call stops with it.
function abortOnClose(res: Response): AbortSignal {
    const controller = new AbortController();
    res.on('close', () => controller.abort());
    return controller.signal;
}

export const oqlRouter = express.Router();

oqlRouter.get('/health', (_req, res) => {
    res.json({ ok: true, model: oqlModelId() });
});

oqlRouter.post('/translate', async (req, res) => {
    const body = bodyOf(req, res);
    if (!body) return;
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt) {
        res.status(400).json({ error: 'prompt is required' });
        return;
    }
    if (prompt.length > MAX_PROMPT) {
        res.status(400).json({
            error: `prompt is longer than ${MAX_PROMPT} characters`,
        });
        return;
    }
    if (body.mode !== undefined && body.mode !== 'dsl' && body.mode !== 'oql') {
        res.status(400).json({ error: 'mode must be "dsl" or "oql"' });
        return;
    }
    const mode = body.mode ?? DEFAULT_MODE;
    const portal = portalFrom(body);
    const studyIds = studiesFrom(body);
    const debug = req.query.debug === '1';
    const signal = abortOnClose(res);
    const started = Date.now();
    try {
        const r = await propagateAttributes(
            {
                traceName: 'oql-translate',
                userId: OQL_USER_ID,
                metadata: { mode },
            },
            () =>
                translate(
                    { prompt, studyIds, portal, mode },
                    {
                        abortSignal: signal,
                        onCall: event => recordCall(OQL_USER_ID, event),
                    }
                )
        );
        const meta = {
            model: oqlModelId(),
            mode,
            ms: Date.now() - started,
            usage: r.usage,
            ...(debug ? { trace: r.trace } : {}),
        };
        console.log(
            JSON.stringify({
                event: 'oql-translate',
                prompt,
                studyIds,
                kind: r.kind,
                ...meta,
                oql: r.kind === 'ok' ? r.oql : undefined,
            })
        );
        if (r.kind === 'ok') {
            res.json({
                oql: r.oql,
                dsl: r.dsl,
                explanation: r.explanation,
                warnings: r.warnings,
                checkedStudies: studyIds,
                ...(studyIds.length
                    ? { resultsUrl: resultsUrl(portal, studyIds, r.oql) }
                    : {}),
                meta,
            });
        } else if (r.kind === 'rejected') {
            res.status(422).json({ rejected: true, error: r.message, meta });
        } else {
            res.status(422).json({
                error: r.reason,
                errors: r.errors,
                lastDsl: r.lastDsl,
                meta,
            });
        }
    } catch (e) {
        if (signal.aborted) return;
        console.error('oql translate failed:', e);
        if (!res.headersSent) {
            res.status(e instanceof NoOqlModelError ? 503 : 502).json({
                error: e instanceof Error ? e.message : String(e),
            });
        }
    }
});

oqlRouter.post('/validate', async (req, res) => {
    const body = bodyOf(req, res);
    if (!body) return;
    try {
        const v = await validateQuery(body.dsl, {
            portal: portalFrom(body),
            studyIds: studiesFrom(body),
        });
        const oql = v.valid && v.dsl ? serializeChecked(v.dsl) : undefined;
        res.json({ ...v, ...(oql?.ok ? { oql: oql.oql } : {}) });
    } catch (e) {
        res.status(502).json({
            error: e instanceof Error ? e.message : String(e),
        });
    }
});

oqlRouter.post('/serialize', (req, res) => {
    const body = bodyOf(req, res);
    if (!body) return;
    const s = schemaIssues(body.dsl);
    if (!s.ok) {
        res.status(400).json({ errors: s.errors });
        return;
    }
    const rt = serializeChecked(s.value);
    if (!rt.ok) {
        res.status(500).json({
            error: rt.reason,
            oql: rt.oql,
            reparsed: rt.reparsed,
        });
        return;
    }
    res.json({ oql: rt.oql });
});

oqlRouter.post('/parse', (req, res) => {
    const body = bodyOf(req, res);
    if (!body) return;
    if (typeof body.oql !== 'string') {
        res.status(400).json({ error: 'oql is required' });
        return;
    }
    const p = parseOql(body.oql);
    if (!p.ok) {
        res.status(400).json({ errors: p.errors });
        return;
    }
    const s = schemaIssues(p.dsl);
    res.json({
        dsl: p.dsl,
        warnings: p.warnings,
        schemaErrors: s.ok ? [] : s.errors,
        explanation: s.ok ? describeQuery(s.value) : [],
    });
});
