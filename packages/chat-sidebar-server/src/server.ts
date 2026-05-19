import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { fetchPaperForStudy, PaperContext } from './paper.js';

const PORT = Number(process.env.PORT || 4000);
const MODEL = 'claude-opus-4-7';

// Opus 4.7 prices per 1M tokens, USD. Cache write at 1.25x input (5-minute TTL)
// or 2x input (1-hour TTL); cache read at 0.1x input.
// Source: platform.claude.com pricing page.
const PRICE_INPUT = 5.0;
const PRICE_OUTPUT = 25.0;
const PRICE_CACHE_WRITE_5M = PRICE_INPUT * 1.25;
const PRICE_CACHE_WRITE_1H = PRICE_INPUT * 2.0;
const PRICE_CACHE_READ = PRICE_INPUT * 0.1;

function computeCost(usage: any) {
    const inputTok = usage?.input_tokens ?? 0;
    const cacheRead = usage?.cache_read_input_tokens ?? 0;
    const outputTok = usage?.output_tokens ?? 0;
    // Breakdown of cache writes by TTL (Anthropic reports both fields).
    const cacheWrite5m =
        usage?.cache_creation?.ephemeral_5m_input_tokens ?? 0;
    const cacheWrite1h =
        usage?.cache_creation?.ephemeral_1h_input_tokens ?? 0;
    const cacheWriteTotal =
        usage?.cache_creation_input_tokens ?? cacheWrite5m + cacheWrite1h;

    const inputCost = (inputTok * PRICE_INPUT) / 1_000_000;
    const cacheWriteCost =
        (cacheWrite5m * PRICE_CACHE_WRITE_5M +
            cacheWrite1h * PRICE_CACHE_WRITE_1H) /
        1_000_000;
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
            cacheWrite: cacheWriteTotal,
            cacheWrite5m,
            cacheWrite1h,
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

// Canonical alteration types we know how to anchor on the oncoprint legend.
// Keys map to the SVG legend_label text rendered by oncoprintjs/geneticrules.ts.
const ALTERATION_TYPES = [
    'amplification',
    'deep_deletion',
    'gain',
    'shallow_deletion',
    'missense',
    'truncating',
    'splice',
    'inframe',
    'structural_variant',
    'mrna_high',
    'mrna_low',
    'protein_high',
    'protein_low',
] as const;

// Results-view tab ids (from ResultsViewPageHelpers.tsx — match
// .tabAnchor_<id> class names on the rendered <a> elements).
const TAB_HINTS = [
    'oncoprint',
    'mutations',
    'cancerTypesSummary',
    'mutualExclusivity',
    'plots',
    'survival',
    'cnSegments',
    'coexpression',
    'comparison',
    'structuralVariants',
    'pathways',
] as const;

const HIGHLIGHT_SCHEMA = {
    type: 'object',
    properties: {
        highlights: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    type: {
                        type: 'string',
                        enum: ['alteration', 'gene', 'tab'],
                        description:
                            'alteration = beacon on an oncoprint legend label; gene = beacon on an oncoprint gene track title; tab = beacon on a results-view tab.',
                    },
                    alterationType: {
                        type: 'string',
                        enum: ALTERATION_TYPES as unknown as string[],
                        description:
                            'Required when type=alteration. Canonical oncoprint legend bucket.',
                    },
                    gene: {
                        type: 'string',
                        description:
                            'Required when type=gene. HUGO symbol, e.g. TP53.',
                    },
                    genes: {
                        type: 'array',
                        items: { type: 'string' },
                        description:
                            'Optional when type=alteration. Genes the paper ties to this alteration type.',
                    },
                    tabHint: {
                        type: 'string',
                        enum: TAB_HINTS as unknown as string[],
                        description:
                            'Required when type=tab. Which results-view tab the paper has pertinent content for.',
                    },
                    note: {
                        type: 'string',
                        description:
                            'One-sentence paper-grounded observation, <= 220 chars. No filler.',
                    },
                    quote: {
                        type: 'string',
                        description:
                            'Verbatim substring from the paper that grounds the note. <= 320 chars.',
                    },
                    importance: {
                        type: 'string',
                        enum: ['high', 'medium', 'low'],
                    },
                },
                required: ['type', 'note', 'quote', 'importance'],
                additionalProperties: false,
            },
        },
    },
    required: ['highlights'],
    additionalProperties: false,
} as const;

function buildHighlightSystemPrompt(paper: PaperContext): string {
    return [
        `You extract paper-grounded notes that should be surfaced as visual beacons on a cBioPortal results view.`,
        ``,
        `STUDY: ${paper.study.name} (${paper.study.studyId})`,
        `CITATION: ${paper.study.citation || '(none)'}`,
        `PAPER SOURCE: ${paper.source}${paper.paperUrl ? ` (${paper.paperUrl})` : ''}`,
        ``,
        paper.source === 'none'
            ? '(No paper text available.)'
            : `PAPER TEXT:\n${paper.text}`,
        ``,
        `THREE BEACON TYPES`,
        `- type="alteration": beacon on an oncoprint LEGEND label (Amplification, Missense Mutation, etc.). Use alterationType + optional genes.`,
        `- type="gene": beacon on an oncoprint GENE TRACK title (e.g. TP53). Use gene (single HUGO symbol).`,
        `- type="tab": beacon on a results-view TAB. Use tabHint. Tab options and what they show:`,
        `    oncoprint            — alteration map across samples`,
        `    mutations            — lollipop / detailed mutation viewer`,
        `    cancerTypesSummary   — alteration frequency by cancer type`,
        `    mutualExclusivity    — gene-pair co-occurrence / exclusivity`,
        `    plots                — scatter plots (gene vs gene, gene vs clinical)`,
        `    survival             — Kaplan-Meier curves stratified by alteration`,
        `    cnSegments           — copy-number segmentation viewer`,
        `    coexpression         — gene-gene expression correlation`,
        `    structuralVariants   — structural variant viewer`,
        `    pathways             — pathway visualization`,
        `    comparison           — cohort comparison features`,
        ``,
        `RULES`,
        `- Return at most 10 highlights total. Quality over quantity.`,
        `- Only emit a highlight if the paper discusses something specific and non-trivial about that beacon target.`,
        `- importance="high" only for findings the paper itself emphasizes (title, abstract, or key results section).`,
        `- "quote" MUST be a VERBATIM substring of the paper text — no paraphrasing, no ellipsis bridging.`,
        `- For type=tab, only beacon a tab if the paper has analyses or findings that meaningfully overlap with what that tab shows (e.g., survival tab only if the paper reports survival/prognosis analyses; mutualExclusivity only if the paper discusses co-occurrence or mutual exclusivity of alteration patterns).`,
        `- Diversity is good: prefer one beacon per (type, target) combination — don't stack three on the same gene.`,
        `- If nothing meaningfully fits, return {"highlights": []}.`,
    ].join('\n');
}

app.post('/highlights', async (req, res) => {
    const { studyId } = req.body ?? {};
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
        const response = await anthropic.messages.create({
            model: MODEL,
            max_tokens: 4096,
            output_config: {
                format: {
                    type: 'json_schema',
                    schema: HIGHLIGHT_SCHEMA,
                },
            },
            system: [
                {
                    type: 'text',
                    text: buildHighlightSystemPrompt(paper),
                    cache_control: { type: 'ephemeral', ttl: '1h' },
                },
            ],
            messages: [
                {
                    role: 'user',
                    content:
                        'List paper-grounded highlights, one per alteration type, ordered by importance.',
                },
            ],
        });
        const textBlock = response.content.find(
            (b): b is Anthropic.TextBlock => b.type === 'text'
        );
        let parsed: any = { highlights: [] };
        if (textBlock) {
            try {
                parsed = JSON.parse(textBlock.text);
            } catch {
                /* fall through with empty list */
            }
        }
        res.json({
            highlights: parsed.highlights ?? [],
            paper: {
                source: paper.source,
                pmid: paper.pmid,
                pmcid: paper.pmcid,
                paperUrl: paper.paperUrl,
                studyName: paper.study.name,
            },
            usage: response.usage,
            cost: computeCost(response.usage),
        });
    } catch (err: any) {
        console.error('highlights call failed:', err);
        res.status(500).json({
            error: err?.message ?? 'Claude call failed',
        });
    }
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
                    cache_control: { type: 'ephemeral', ttl: '1h' },
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
