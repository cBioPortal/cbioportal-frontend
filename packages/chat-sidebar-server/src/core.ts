// Shared chat-sidebar logic. Both the Express server (src/server.ts) and the
// Vercel serverless functions (api/chat/*.ts) call into runSuggest() and
// runHighlights() here so the two stacks never drift.

import Anthropic from '@anthropic-ai/sdk';
import { fetchPaperForStudy, PaperContext } from './paper.js';

export const SUGGEST_MODEL = 'claude-opus-4-7';
export const HIGHLIGHTS_MODEL = 'claude-sonnet-4-6';
// Kept for the /health endpoint and the iframe banner.
export const MODEL = SUGGEST_MODEL;

// Per-1M-token base prices in USD. Cache write is 1.25x input (5-min TTL) or
// 2x (1-hour TTL); cache read is 0.1x input — same multipliers across models.
const PRICES: Record<string, { input: number; output: number }> = {
    'claude-opus-4-7': { input: 5.0, output: 25.0 },
    'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
};

export function computeCost(usage: any, model: string = SUGGEST_MODEL) {
    const price = PRICES[model] ?? PRICES[SUGGEST_MODEL];
    const inputTok = usage?.input_tokens ?? 0;
    const cacheRead = usage?.cache_read_input_tokens ?? 0;
    const outputTok = usage?.output_tokens ?? 0;
    const cacheWrite5m =
        usage?.cache_creation?.ephemeral_5m_input_tokens ?? 0;
    const cacheWrite1h =
        usage?.cache_creation?.ephemeral_1h_input_tokens ?? 0;
    const cacheWriteTotal =
        usage?.cache_creation_input_tokens ?? cacheWrite5m + cacheWrite1h;

    const inputCost = (inputTok * price.input) / 1_000_000;
    const cacheWriteCost =
        (cacheWrite5m * price.input * 1.25 + cacheWrite1h * price.input * 2.0) /
        1_000_000;
    const cacheReadCost = (cacheRead * price.input * 0.1) / 1_000_000;
    const outputCost = (outputTok * price.output) / 1_000_000;
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
        model,
    };
}

// Anthropic client is lazy so we don't crash at import time on Vercel cold
// starts when ANTHROPIC_API_KEY hasn't been resolved yet.
let _anthropic: Anthropic | null = null;
function client(): Anthropic {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not set');
    }
    if (!_anthropic) _anthropic = new Anthropic();
    return _anthropic;
}

// Per-process paper cache. Persistent on the Express server; per-warm-Lambda
// on Vercel (each warm function reuses; cold starts fetch fresh from PMC).
const paperCache = new Map<string, PaperContext>();

export async function getPaperContext(
    studyId: string
): Promise<PaperContext> {
    const cached = paperCache.get(studyId);
    if (cached) return cached;
    const ctx = await fetchPaperForStudy(studyId);
    paperCache.set(studyId, ctx);
    return ctx;
}

function buildSuggestSystemPrompt(paper: PaperContext): string {
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

export const SUGGEST_PRESETS = {
    keyFinding:
        `Surface one concrete, non-obvious finding from the paper that pertains specifically to what the user is looking at — ` +
        `the genes and/or tab listed above. Prefer findings that touch the listed genes or the analysis the listed tab shows. ` +
        `If the paper does not address this view, say so plainly instead of giving a generic summary.`,
    cohort:
        `Describe the patient cohort: how samples were collected, the cohort size, and any selection criteria. ` +
        `Lean toward cohort details that matter for interpreting what the user is looking at (e.g. sample counts for the listed genes, ` +
        `or subgroups relevant to the listed tab). Quote the paper for sample size and inclusion/exclusion language.`,
    limitations:
        `What limitations or caveats does the paper itself acknowledge that are most relevant to interpreting what the user is looking at? ` +
        `Prefer caveats the authors raise about the listed genes, the analysis shown in the listed tab, or the cohort makeup. ` +
        `Stick to limitations the authors explicitly name; do not invent your own.`,
} as const;

export type SuggestPreset = keyof typeof SUGGEST_PRESETS;

function buildSuggestUserText(ctx: {
    studyId: string;
    genes?: string[];
    tab?: string;
    preset?: SuggestPreset;
    userPrompt?: string;
    screenshot?: string;
}): string {
    const lines = [`The user is currently viewing this study in cBioPortal.`];
    if (ctx.tab) lines.push(`- Results-view tab: ${ctx.tab}`);
    if (ctx.genes && ctx.genes.length > 0) {
        lines.push(
            `- Queried gene${ctx.genes.length === 1 ? '' : 's'}: ${ctx.genes.join(', ')}`
        );
    }
    if (ctx.screenshot) {
        lines.push(
            `- A screenshot of what they're currently seeing in the browser is attached. Reference it concretely when relevant (specific genes/tracks/legend buckets visible, patterns in the plot, etc.).`
        );
    }
    const userPrompt = ctx.userPrompt?.trim();
    const directive = userPrompt
        ? `The user asks: ${userPrompt}\n\nAnswer their question grounded in the paper. ` +
          `Stay relevant to the genes/tab they're looking at when applicable. ` +
          `If the paper does not address it, say so plainly.`
        : (SUGGEST_PRESETS[ctx.preset ?? 'keyFinding'] ??
          SUGGEST_PRESETS.keyFinding);
    lines.push('', directive);
    return lines.join('\n');
}

function buildSuggestUserMessage(
    ctx: SuggestInput
): Anthropic.MessageParam['content'] {
    const text = buildSuggestUserText(ctx);
    const shot = ctx.screenshot;
    if (!shot) return text;
    // Strip "data:image/png;base64," prefix; Anthropic wants the raw base64.
    const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/.exec(shot);
    if (!match) return text;
    const [, mediaType, data] = match;
    return [
        {
            type: 'image',
            source: {
                type: 'base64',
                media_type: mediaType as
                    | 'image/png'
                    | 'image/jpeg'
                    | 'image/webp'
                    | 'image/gif',
                data,
            },
        },
        { type: 'text', text },
    ];
}

// Canonical alteration types we know how to anchor on the oncoprint legend.
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

interface PaperInfo {
    source: string;
    pmid: string | null;
    pmcid: string | null;
    paperUrl: string | null;
    studyName: string;
}

function paperInfo(paper: PaperContext): PaperInfo {
    return {
        source: paper.source,
        pmid: paper.pmid,
        pmcid: paper.pmcid,
        paperUrl: paper.paperUrl,
        studyName: paper.study.name,
    };
}

export interface SuggestInput {
    studyId: string;
    genes?: string[];
    tab?: string;
    preset?: SuggestPreset;
    // Free-form user prompt. When present, overrides the preset directive.
    userPrompt?: string;
    // base64 PNG data URL of the current viewport, captured client-side.
    screenshot?: string;
}

export interface SuggestResult {
    suggestion: string;
    paper: PaperInfo;
    usage: any;
    cost: ReturnType<typeof computeCost>;
}

export async function runSuggest(
    input: SuggestInput
): Promise<SuggestResult> {
    const paper = await getPaperContext(input.studyId);
    const stream = client().messages.stream({
        model: SUGGEST_MODEL,
        max_tokens: 1024,
        system: [
            {
                type: 'text',
                text: buildSuggestSystemPrompt(paper),
                cache_control: { type: 'ephemeral', ttl: '1h' },
            },
        ],
        messages: [
            {
                role: 'user',
                content: buildSuggestUserMessage(input),
            },
        ],
    });
    const finalMessage = await stream.finalMessage();
    const suggestion = finalMessage.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map(b => b.text)
        .join('');
    return {
        suggestion,
        paper: paperInfo(paper),
        usage: finalMessage.usage,
        cost: computeCost(finalMessage.usage, SUGGEST_MODEL),
    };
}

export interface HighlightsInput {
    studyId: string;
}

export interface HighlightsResult {
    highlights: any[];
    paper: PaperInfo;
    usage: any;
    cost: ReturnType<typeof computeCost>;
}

export async function runHighlights(
    input: HighlightsInput
): Promise<HighlightsResult> {
    const paper = await getPaperContext(input.studyId);
    const response = await client().messages.create({
        model: HIGHLIGHTS_MODEL,
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
                    'List paper-grounded highlights, ordered by importance.',
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
    return {
        highlights: parsed.highlights ?? [],
        paper: paperInfo(paper),
        usage: response.usage,
        cost: computeCost(response.usage, HIGHLIGHTS_MODEL),
    };
}
