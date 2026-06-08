// Shared chat-sidebar logic. Both the Express server (src/server.ts) and the
// Vercel serverless functions (api/chat/*.ts) call into runSuggest() and
// runHighlights() here so the two stacks never drift.
//
// LLM calls route through the Vercel AI Gateway via `ai@^6` (plain
// "provider/model" slugs auto-route). Auth is the VERCEL_OIDC_TOKEN env var
// locally (refresh with `vercel env pull .env.local --yes`) and the
// platform-injected OIDC token on deploy.

import {
    generateText,
    generateObject,
    type ModelMessage,
    type UserContent,
} from 'ai';
import { z } from 'zod';
import { fetchPaperForStudy, PaperContext } from './paper.js';
import {
    computeCostFromUsage,
    type CostBreakdown,
} from './pricing.js';

// Default Gateway slugs (dots, not hyphens — verified against
// gateway.getAvailableModels()). Callers may override the model per request.
export const SUGGEST_MODEL = 'anthropic/claude-opus-4.7';
export const HIGHLIGHTS_MODEL = 'anthropic/claude-sonnet-4.6';
// Kept for the /health endpoint and the iframe banner.
export const MODEL = SUGGEST_MODEL;

// Per-process paper cache. Persistent on the Express server; per-warm-Lambda
// on Vercel (each warm function reuses; cold starts fetch fresh from PMC).
//
// Two subtleties this structure handles, both of which caused
// coadread_tcga_pub (and any cold study) to get frozen as "abstract only":
//   1. In-flight coalescing. The sidebar fires /paper-status, /highlights, and
//      /suggest for the same study at mount. Without dedup, all three race into
//      fetchPaperForStudy at once — a self-inflicted burst of NCBI elink calls
//      that trips NCBI's 3-req/s/IP limit, so elink 429s and the PMC hop is
//      lost. Sharing one Promise per study collapses the burst to a single
//      fetch.
//   2. Don't freeze degraded results. A 'pmc' result is the real full text and
//      is cached for good. An 'abstract'/'none' result is usually a transient
//      upstream miss, so we keep it only briefly and let the next call retry,
//      instead of pinning the study to degraded grounding for the life of the
//      warm Lambda.
interface PaperCacheEntry {
    ctx: PaperContext;
    // 0 = never expires (successful full text); otherwise epoch ms.
    expiresAt: number;
}
const paperCache = new Map<string, PaperCacheEntry>();
const inFlightPaper = new Map<string, Promise<PaperContext>>();

// How long to hold a degraded (abstract/none) result before retrying. Long
// enough to absorb a render's worth of concurrent calls, short enough that a
// transient NCBI failure self-heals within a few minutes.
const DEGRADED_TTL_MS = 5 * 60_000;

export async function getPaperContext(
    studyId: string
): Promise<PaperContext> {
    const entry = paperCache.get(studyId);
    if (entry && (entry.expiresAt === 0 || entry.expiresAt > Date.now())) {
        return entry.ctx;
    }

    const pending = inFlightPaper.get(studyId);
    if (pending) return pending;

    const p = (async () => {
        try {
            const ctx = await fetchPaperForStudy(studyId);
            paperCache.set(studyId, {
                ctx,
                expiresAt:
                    ctx.source === 'pmc' ? 0 : Date.now() + DEGRADED_TTL_MS,
            });
            return ctx;
        } finally {
            inFlightPaper.delete(studyId);
        }
    })();
    inFlightPaper.set(studyId, p);
    return p;
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

// Build the user-message content for runSuggest. When a screenshot is
// provided we send a multi-part content array (image + text); otherwise a
// plain string keeps the wire format minimal. The AI SDK accepts a data URL
// directly as the image source — mediaType is parsed from the URL.
function buildSuggestUserContent(ctx: SuggestInput): UserContent {
    const text = buildSuggestUserText(ctx);
    const shot = ctx.screenshot;
    if (!shot) return text;
    if (!/^data:image\/(?:png|jpeg|webp|gif);base64,/.test(shot)) return text;
    return [
        { type: 'image', image: shot },
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

const HighlightSchema = z.object({
    type: z
        .enum(['alteration', 'gene', 'tab'])
        .describe(
            'alteration = beacon on an oncoprint legend label; gene = beacon on an oncoprint gene track title; tab = beacon on a results-view tab.'
        ),
    alterationType: z
        .enum(ALTERATION_TYPES)
        .optional()
        .describe(
            'Required when type=alteration. Canonical oncoprint legend bucket.'
        ),
    gene: z
        .string()
        .optional()
        .describe('Required when type=gene. HUGO symbol, e.g. TP53.'),
    genes: z
        .array(z.string())
        .optional()
        .describe(
            'Optional when type=alteration. Genes the paper ties to this alteration type.'
        ),
    tabHint: z
        .enum(TAB_HINTS)
        .optional()
        .describe(
            'Required when type=tab. Which results-view tab the paper has pertinent content for.'
        ),
    note: z
        .string()
        .describe(
            'One-sentence paper-grounded observation, <= 220 chars. No filler.'
        ),
    quote: z
        .string()
        .describe(
            'Verbatim substring from the paper that grounds the note. <= 320 chars.'
        ),
    importance: z.enum(['high', 'medium', 'low']),
});

const HighlightsResponseSchema = z.object({
    highlights: z.array(HighlightSchema),
});

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

function buildHighlightsUserText(
    inventory?: HighlightsInput['inventory']
): string {
    if (!inventory) {
        return 'List paper-grounded highlights, ordered by importance.';
    }
    const lines: string[] = [
        `The user has the following items present on their cBioPortal results view right now:`,
        ``,
    ];
    if (inventory.genes && inventory.genes.length > 0) {
        lines.push(`Queried genes (oncoprint gene tracks):`);
        lines.push(`  ${inventory.genes.join(', ')}`);
    }
    if (inventory.alterations && inventory.alterations.length > 0) {
        lines.push(`Alteration buckets visible in the oncoprint legend:`);
        lines.push(`  ${inventory.alterations.join(', ')}`);
    }
    if (inventory.tabs && inventory.tabs.length > 0) {
        lines.push(`Available results-view tabs:`);
        lines.push(`  ${inventory.tabs.join(', ')}`);
    }
    lines.push(
        ``,
        `For EACH item above where the paper has something concrete and non-trivial to say, emit one highlight. ` +
            `Skip items where the paper says nothing meaningful — do NOT pad. Highlights for items NOT in the lists above will be silently dropped, so don't waste budget on them.`,
        ``,
        `Order by importance (high → low). Cap at 10 total. ` +
            `For type=alteration, alterationType MUST be one of the listed alteration buckets. ` +
            `For type=gene, gene MUST be one of the listed queried genes. ` +
            `For type=tab, tabHint MUST be one of the listed tabs, and only emit it when the paper's analyses meaningfully overlap with what that tab shows (e.g., mutualExclusivity only if the paper actually discusses co-occurrence or exclusivity of the queried genes).`
    );
    return lines.join('\n');
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

// Build the `messages` array with the big paper-grounded system prompt
// marked as an Anthropic 1h cache breakpoint. Putting the system message in
// the messages array (rather than as a top-level `system:` option) is what
// lets us attach providerOptions.anthropic.cacheControl to it.
function buildMessages(
    systemText: string,
    userContent: UserContent
): ModelMessage[] {
    return [
        {
            role: 'system',
            content: systemText,
            providerOptions: {
                anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } },
            },
        },
        { role: 'user', content: userContent },
    ];
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
    // Optional Gateway slug override (e.g. "openai/gpt-5.4"). Falls back to
    // SUGGEST_MODEL when absent.
    model?: string;
}

export interface SuggestResult {
    suggestion: string;
    paper: PaperInfo;
    usage: any;
    cost: CostBreakdown;
}

export async function runSuggest(
    input: SuggestInput
): Promise<SuggestResult> {
    const paper = await getPaperContext(input.studyId);
    const model = input.model ?? SUGGEST_MODEL;
    const result = await generateText({
        model,
        // Larger than the 120-word target answer would need on its own, so
        // reasoning models (DeepSeek V4 Pro, o3-mini, etc.) have headroom
        // for internal thinking tokens before they get to the actual text.
        maxOutputTokens: 4096,
        // The system role lives inside messages so we can attach a
        // providerOptions.anthropic.cacheControl breakpoint to it — the
        // top-level `system` option doesn't accept per-message options.
        // Our system content is internally constructed (never user-derived),
        // so the SDK's prompt-injection warning is not a real concern here.
        // The Anthropic-namespaced providerOptions are silently ignored by
        // non-Anthropic providers, so this is safe to send unconditionally.
        allowSystemInMessages: true,
        messages: buildMessages(
            buildSuggestSystemPrompt(paper),
            buildSuggestUserContent(input)
        ),
    });
    return {
        suggestion: result.text,
        paper: paperInfo(paper),
        usage: result.usage,
        cost: await computeCostFromUsage(result.usage, model),
    };
}

export interface HighlightsInput {
    studyId: string;
    // What's actually present on the user's page right now. The model is
    // told to return highlights only for items in here; anything outside
    // the inventory has no DOM target and would be silently dropped, so
    // there's no point spending output budget on it.
    inventory?: {
        alterations?: string[];
        genes?: string[];
        tabs?: string[];
    };
    // Optional Gateway slug override; falls back to HIGHLIGHTS_MODEL.
    model?: string;
}

export interface HighlightsResult {
    highlights: any[];
    paper: PaperInfo;
    usage: any;
    cost: CostBreakdown;
}

export async function runHighlights(
    input: HighlightsInput
): Promise<HighlightsResult> {
    const paper = await getPaperContext(input.studyId);
    const model = input.model ?? HIGHLIGHTS_MODEL;
    const result = await generateObject({
        model,
        // Highlights JSON is at most ~10 entries (~2-3k output tokens). The
        // headroom above that is for reasoning models, which spend most of
        // the budget on internal thinking before emitting the schema. With
        // a 4k cap, deepseek-v4-pro consistently truncated mid-thought and
        // generateObject threw NoObjectGenerated.
        maxOutputTokens: 16384,
        schema: HighlightsResponseSchema,
        allowSystemInMessages: true,
        messages: buildMessages(
            buildHighlightSystemPrompt(paper),
            buildHighlightsUserText(input.inventory)
        ),
    });
    return {
        highlights: result.object.highlights,
        paper: paperInfo(paper),
        usage: result.usage,
        cost: await computeCostFromUsage(result.usage, model),
    };
}
