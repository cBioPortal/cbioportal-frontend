import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { fetchPaperForStudy, PaperContext } from './paper.js';

const PORT = Number(process.env.PORT || 4000);
const MODEL = 'claude-opus-4-7';

// Opus 4.7 prices per 1M tokens, USD. Cache write at 1.25x input (5-minute TTL),
// cache read at 0.1x input. Source: platform.claude.com pricing page.
const PRICE_INPUT = 5.0;
const PRICE_OUTPUT = 25.0;
const PRICE_CACHE_WRITE_5M = PRICE_INPUT * 1.25;
const PRICE_CACHE_READ = PRICE_INPUT * 0.1;

function computeCost(usage: any) {
    const inputTok = usage?.input_tokens ?? 0;
    const cacheWrite = usage?.cache_creation_input_tokens ?? 0;
    const cacheRead = usage?.cache_read_input_tokens ?? 0;
    const outputTok = usage?.output_tokens ?? 0;
    const inputCost = (inputTok * PRICE_INPUT) / 1_000_000;
    const cacheWriteCost = (cacheWrite * PRICE_CACHE_WRITE_5M) / 1_000_000;
    const cacheReadCost = (cacheRead * PRICE_CACHE_READ) / 1_000_000;
    const outputCost = (outputTok * PRICE_OUTPUT) / 1_000_000;
    return {
        total: inputCost + cacheWriteCost + cacheReadCost + outputCost,
        inputCost,
        cacheWriteCost,
        cacheReadCost,
        outputCost,
        tokens: {
            input: inputTok,
            cacheWrite,
            cacheRead,
            output: outputTok,
        },
        currency: 'USD',
        model: MODEL,
    };
}

if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set. Add it to .env.');
    process.exit(1);
}

const anthropic = new Anthropic();
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const paperCache = new Map<string, PaperContext>();

async function getPaperContext(studyId: string): Promise<PaperContext> {
    const cached = paperCache.get(studyId);
    if (cached) return cached;
    const ctx = await fetchPaperForStudy(studyId);
    paperCache.set(studyId, ctx);
    return ctx;
}

function buildSystemPrompt(paper: PaperContext): string {
    const { study, source, text, paperUrl } = paper;
    const header = [
        `You are an analyst embedded in cBioPortal helping a researcher understand the open study in context of its primary publication.`,
        ``,
        `STUDY METADATA`,
        `- studyId: ${study.studyId}`,
        `- name: ${study.name}`,
        `- citation: ${study.citation || '(none)'}`,
        `- description: ${study.description || '(none)'}`,
        ``,
        `PAPER SOURCE: ${source}${paperUrl ? ` (${paperUrl})` : ''}`,
    ].join('\n');

    const body =
        source === 'none'
            ? `\n\n(No paper text available for this study.)`
            : `\n\nPAPER TEXT (${source === 'pmc' ? 'full text from PMC' : 'PubMed abstract only'}):\n${text}`;

    const rules = `

GROUNDING RULES — read carefully:
- Every claim you make about the paper MUST be supported by a verbatim quote from the PAPER TEXT above.
- If the paper does not address what the user is looking at, say so explicitly: "The paper does not directly discuss <topic>." Do not speculate.
- Prefer specific, non-obvious observations over generic summaries.
- Keep responses to 2-4 sentences plus one short quoted snippet, max ~120 words.
- Format the quoted snippet on its own line, prefixed with "> ".`;

    return header + body + rules;
}

function buildUserPrompt(ctx: {
    studyId: string;
    gene?: string;
    tab?: string;
}): string {
    const lines = [`The user is currently viewing this study in cBioPortal.`];
    if (ctx.tab) lines.push(`- Results-view tab: ${ctx.tab}`);
    if (ctx.gene) lines.push(`- Focused gene: ${ctx.gene}`);
    lines.push(
        '',
        `Given what they're looking at, surface one concrete, non-obvious observation from the paper that pertains to this view. ` +
            `If nothing in the paper is directly relevant, say so plainly.`
    );
    return lines.join('\n');
}

app.get('/health', (_req, res) => {
    res.json({ ok: true, model: MODEL });
});

app.post('/suggest', async (req, res) => {
    const { studyId, gene, tab } = req.body ?? {};
    if (!studyId || typeof studyId !== 'string') {
        res.status(400).json({ error: 'studyId (string) required' });
        return;
    }

    let paper: PaperContext;
    try {
        paper = await getPaperContext(studyId);
    } catch (err: any) {
        res.status(502).json({
            error: `Could not fetch paper context: ${err?.message ?? err}`,
        });
        return;
    }

    try {
        const stream = anthropic.messages.stream({
            model: MODEL,
            max_tokens: 1024,
            system: [
                {
                    type: 'text',
                    text: buildSystemPrompt(paper),
                    cache_control: { type: 'ephemeral' },
                },
            ],
            messages: [
                {
                    role: 'user',
                    content: buildUserPrompt({ studyId, gene, tab }),
                },
            ],
        });
        const finalMessage = await stream.finalMessage();
        const textOut = finalMessage.content
            .filter((b): b is Anthropic.TextBlock => b.type === 'text')
            .map(b => b.text)
            .join('');
        res.json({
            suggestion: textOut,
            paper: {
                source: paper.source,
                pmid: paper.pmid,
                pmcid: paper.pmcid,
                paperUrl: paper.paperUrl,
                studyName: paper.study.name,
            },
            usage: finalMessage.usage,
            cost: computeCost(finalMessage.usage),
        });
    } catch (err: any) {
        console.error('Claude call failed:', err);
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
