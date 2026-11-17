import {
    generateText,
    jsonSchema,
    tool,
    JSONSchema7,
    LanguageModelUsage,
    ModelMessage,
    OnLanguageModelCallEndCallback,
    SystemModelMessage,
    ToolCallPart,
    ToolResultPart,
    ToolSet,
} from 'ai';
import { z } from 'zod';
import {
    Issue,
    OqlQuery,
    OqlQuerySchema,
    describeQuery,
    parseOql,
    genesInQuery,
    pruneQuery,
    unverifiedNumbers,
    schemaIssues,
    serializeChecked,
} from './dsl/index.js';
import { resolveOqlModel } from '../models.js';
import { resolveGenes } from './service/genes.js';
import {
    OutputMode,
    REJECT_TOOL,
    SUBMIT_TOOL,
    SYSTEM_PROMPTS,
} from './service/prompt.js';
import { USER_ERROR_CODES, validateQuery } from './service/validate.js';

export const DEFAULT_MODE: OutputMode =
    process.env.OQL_MODE === 'oql' ? 'oql' : 'dsl';
const MAX_SUBMITS = 4;

/** Thrown when no configured provider offers a Haiku model for OQL. */
export class NoOqlModelError extends Error {
    constructor() {
        super(
            'No OQL model configured: set BEDROCK_CHAT_MODEL or ANTHROPIC_API_KEY — see .env.example.'
        );
    }
}

/** The configured OQL model, for responses and logs; null when there is none. */
export function oqlModelId(): string | null {
    return resolveOqlModel()?.model.modelId ?? null;
}

/** JSON Schema for a zod type, in the shape the providers accept as a tool input schema. */
function toInputSchema(schema: z.ZodType): JSONSchema7 {
    const json = z.toJSONSchema(schema, {
        target: 'draft-2020-12',
        unrepresentable: 'any',
        reused: 'ref',
    }) as Record<string, unknown>;
    delete json.$schema;
    return JSON.parse(
        JSON.stringify(json).replaceAll('"oneOf"', '"anyOf"')
    ) as JSONSchema7;
}

// No `execute`: the loop below checks each submission and decides whether to send it back.
// jsonSchema() without a validator hands the input through as the model wrote it, so schema
// problems reach the validator and come back to the model as repairable errors.
const SUBMIT_TOOLS = {
    dsl: tool({
        description:
            'Submit the query in the DSL. The server validates it; on formatting errors, fix them and submit again.',
        inputSchema: jsonSchema(
            toInputSchema(z.object({ query: OqlQuerySchema }))
        ),
    }),
    oql: tool({
        description:
            "Submit the query as OQL text. The server parses it with cBioPortal's grammar and validates it; on formatting errors, fix them and submit again.",
        inputSchema: jsonSchema({
            type: 'object',
            properties: {
                oql: { type: 'string', description: 'OQL, one track per line' },
            },
            required: ['oql'],
            additionalProperties: false,
        }),
    }),
};

const REJECT = tool({
    description:
        'Decline a request that names no gene, gene family or pathway, or is not a query. The message is shown to the user.',
    inputSchema: jsonSchema({
        type: 'object',
        properties: {
            message: {
                type: 'string',
                description:
                    'One short sentence telling the user what is missing',
            },
        },
        required: ['message'],
        additionalProperties: false,
    }),
});

// Caches the tools and system prompt, which are the same on every request.
const CACHE_SYSTEM_PROMPT: SystemModelMessage['providerOptions'] = {
    anthropic: { cacheControl: { type: 'ephemeral' } },
    bedrock: { cachePoint: { type: 'default' } },
};

/** Added when the model first asked for a copy-number level OQL can't express (e.g. "more than 6 copies"). */
const COPY_COUNT_NOTE: Issue = {
    code: 'COPY_COUNT_APPROXIMATED',
    path: [],
    message:
        'OQL has no copy-number counts; the query uses the nearest level (AMP, GAIN, HETLOSS or HOMDEL)',
};

/** True when the request asks for a number of copies and the query has copy-number alterations. */
function asksForCopyCount(prompt: string, dsl: OqlQuery): boolean {
    if (
        !/\b\d+(?:\.\d+)?\s*(?:-\s*)?(?:fold|copies|copy)\b|\bcopy[- ]number (?:of|above|below|over|greater|less|>|<)\s*\d/i.test(
            prompt
        )
    )
        return false;
    const tracks = dsl.tracks.flatMap(t => (t.kind === 'gene' ? [t] : t.genes));
    return [
        ...(dsl.defaults ?? []),
        ...tracks.flatMap(t => t.alterations),
    ].some(a => a.type === 'cna');
}

/** Shown when the model ends without a query or a rejection of its own. */
const GENERIC_REJECTION =
    'Could not turn this into a query. Please name the genes and the alterations you want, e.g. "KRAS G12C or STK11 truncating mutations".';

export type TranslateInput = {
    prompt: string;
    studyIds?: string[];
    portal: string;
    mode?: OutputMode;
};

export type TraceEntry = {
    tool: string;
    input: unknown;
    ok: boolean;
    output?: unknown;
};
type Usage = {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    turns: number;
};

export type TranslateResult =
    | {
          kind: 'ok';
          oql: string;
          dsl: OqlQuery;
          explanation: string[];
          warnings: Issue[];
          trace: TraceEntry[];
          usage: Usage;
      }
    | { kind: 'rejected'; message: string; trace: TraceEntry[]; usage: Usage }
    | {
          kind: 'fail';
          reason: string;
          errors: Issue[];
          lastDsl?: unknown;
          trace: TraceEntry[];
          usage: Usage;
      };

type Checked =
    | { kind: 'valid'; dsl: OqlQuery; warnings: Issue[]; leftOut?: string[] }
    | { kind: 'repairable'; errors: Issue[]; dsl?: unknown }
    | { kind: 'request'; errors: Issue[]; dsl?: unknown };

/** True when the user wrote this gene or variant themselves (so a problem with it is theirs). */
function writtenByUser(term: string | undefined, prompt: string): boolean {
    if (!term) return true;
    const words = new Set(
        prompt
            .toUpperCase()
            .split(/[^A-Z0-9_*-]+/)
            .flatMap(w => [w, ...w.split('-')])
    );
    return words.has(term.toUpperCase()) && !NOT_GENES.has(term.toUpperCase());
}

const BARE_RESIDUE_RE = /^([GPAVLIMCFYWHKRQNEDST])(\d+)$/;

/** Reads a protein_change that is only a residue ("V600") as the position match it means. */
function residuesAsPositions(query: unknown): unknown {
    const visit = (alt: any) => {
        const m =
            alt?.type === 'mutation' &&
            alt.match?.by === 'protein_change' &&
            BARE_RESIDUE_RE.exec(String(alt.match.value));
        if (m)
            alt.match = {
                by: 'position',
                aminoAcid: m[1],
                position: Number(m[2]),
            };
    };
    const q = structuredClone(query) as any;
    for (const a of q?.defaults ?? []) visit(a);
    for (const t of q?.tracks ?? [])
        for (const g of t?.kind === 'merged' ? t.genes ?? [] : [t])
            for (const a of g?.alterations ?? []) visit(a);
    return q;
}

/** Turns a submission into a validated query, separating model mistakes from problems in the request. */
async function check(
    mode: OutputMode,
    args: any,
    input: TranslateInput
): Promise<Checked> {
    let candidate: unknown =
        mode === 'dsl' ? residuesAsPositions(args?.query) : args?.query;
    const warnings: Issue[] = [];
    if (mode === 'oql') {
        const parsed = parseOql(String(args?.oql ?? ''));
        if (!parsed.ok) return { kind: 'repairable', errors: parsed.errors };
        candidate = parsed.dsl;
        // In OQL mode an unrecognized mutation token is a formatting error, not a warning.
        const unrecognized = parsed.warnings.filter(
            w => w.code === 'UNRECOGNIZED_MUTATION'
        );
        if (unrecognized.length)
            return { kind: 'repairable', errors: unrecognized, dsl: candidate };
        warnings.push(...parsed.warnings);
        const s = schemaIssues(candidate);
        if (!s.ok)
            return { kind: 'repairable', errors: s.errors, dsl: candidate };
    }
    const v = await validateQuery(candidate, {
        portal: input.portal,
        studyIds: input.studyIds,
    });
    // A residue range past the protein's end is the model's mistake unless the user wrote that number.
    const implausible = v.warnings.filter(
        w => w.code === 'RANGE_PAST_END' && !writtenByUser(w.term, input.prompt)
    );
    if (v.valid && implausible.length)
        return { kind: 'repairable', errors: implausible, dsl: candidate };
    const requestErrors = v.errors.filter(
        e => USER_ERROR_CODES.has(e.code) && writtenByUser(e.term, input.prompt)
    );
    if (requestErrors.length) {
        // Keep the parts of the request that are fine and report what was left out.
        const pruned = v.dsl ? pruneQuery(v.dsl, requestErrors) : null;
        if (pruned) {
            const again = await validateQuery(pruned.dsl, {
                portal: input.portal,
                studyIds: input.studyIds,
            });
            if (again.valid && again.dsl) {
                return {
                    kind: 'valid',
                    dsl: again.dsl,
                    warnings: [
                        ...warnings,
                        ...pruned.warnings,
                        ...again.warnings,
                        ...unverifiedNumbers(again.dsl, input.prompt, [
                            ...v.lookedUp,
                            ...again.lookedUp,
                        ]),
                    ],
                    leftOut: pruned.leftOut,
                };
            }
        }
        return {
            kind: 'request',
            errors: requestErrors,
            dsl: v.dsl ?? candidate,
        };
    }
    if (!v.valid || !v.dsl)
        return { kind: 'repairable', errors: v.errors, dsl: candidate };
    return {
        kind: 'valid',
        dsl: v.dsl,
        warnings: [
            ...warnings,
            ...v.warnings,
            ...unverifiedNumbers(v.dsl, input.prompt, v.lookedUp),
        ],
    };
}

// Protein-change-like tokens in the prompt: reference residue + position, optional change.
const PROMPT_VARIANT_RE = /\b[A-Z]\d{1,4}(?:_[A-Z]\d{1,4})?(?:[A-Z*]|fs\*?\d*|del[A-Z]*|ins[A-Z]+|dup|delins[A-Z]+|_splice)?\b/g;

// Uppercase words that are not gene symbols in a request (OQL keywords and common acronyms).
const NOT_GENES = new Set([
    'AND',
    'OR',
    'NOT',
    'ALL',
    'ANY',
    'MUT',
    'EXP',
    'PROT',
    'CNA',
    'AMP',
    'GAIN',
    'HETLOSS',
    'HOMDEL',
    'FUSION',
    'DRIVER',
    'GERMLINE',
    'SOMATIC',
    'MISSENSE',
    'NONSENSE',
    'NONSTART',
    'NONSTOP',
    'FRAMESHIFT',
    'INFRAME',
    'SPLICE',
    'TRUNC',
    'PROMOTER',
    'DATATYPES',
    'DNA',
    'RNA',
    'MRNA',
    'RPPA',
    'SV',
    'SNV',
    'CNV',
    'TCGA',
    'MSK',
    'OQL',
    'HGVS',
    'ID',
]);
const GENE_TOKEN_RE = /\b[A-Z][A-Z0-9-]*[A-Z0-9](?:_P[STY]\d+)?\b/g;

/**
 * Warns when a gene-like word the user wrote is not in the final query: either it is not a gene
 * (the model may have corrected a typo) or it is a real gene the query left out.
 */
async function geneDriftWarnings(
    prompt: string,
    dsl: OqlQuery,
    portal: string,
    skip: Set<string> = new Set()
): Promise<Issue[]> {
    // Quoted text is a track label, not a gene list.
    const text = prompt.replace(/"[^"]*"|“[^”]*”/g, ' ');
    const candidates = (list: string[]) =>
        [...new Set(list)].filter(
            t => !NOT_GENES.has(t) && !PROMPT_VARIANT_RE_SINGLE.test(t)
        );
    let tokens = candidates([...text.matchAll(GENE_TOKEN_RE)].map(m => m[0]));
    if (!tokens.length) return [];
    let resolved = await resolveGenes(portal, tokens);
    // A hyphenated word that is not a gene is usually a pair ("BCR-ABL1"): check its parts instead.
    const split = resolved
        .filter(r => r.status === 'unknown' && r.input.includes('-'))
        .map(r => r.input);
    if (split.length) {
        const parts = candidates(
            split.flatMap(t => t.split('-')).filter(p => p.length > 1)
        );
        resolved = [
            ...resolved.filter(r => !split.includes(r.input)),
            ...(parts.length ? await resolveGenes(portal, parts) : []),
        ];
    }
    // A phosphosite symbol (AKT1_PS473) also covers its parent gene.
    const used = new Set(
        genesInQuery(dsl).flatMap(g => [g, g.replace(/_P[STY]\d+$/, '')])
    );
    const out: Issue[] = [];
    for (const r of resolved) {
        if (skip.has(r.input.toUpperCase())) continue;
        if (r.status === 'found' && !used.has(r.hugo)) {
            out.push({
                code: 'PROMPT_GENE_MISSING',
                path: [],
                message: `the request mentions ${r.input}, which is not in the query`,
            });
        } else if (r.status === 'unknown' && /\d/.test(r.input)) {
            out.push({
                code: 'PROMPT_GENE_UNKNOWN',
                path: [],
                message: `${
                    r.input
                } is not a gene symbol in cBioPortal; the query uses ${[
                    ...used,
                ].join(', ')}`,
            });
        }
    }
    return out;
}

const PROMPT_VARIANT_RE_SINGLE = /^[A-Z]\d{1,4}(?:_[A-Z]\d{1,4})?(?:[A-Z*]|fs\*?\d*|del[A-Z]*|ins[A-Z]+|dup|delins[A-Z]+|_splice)?$/;

/** Adds drift warnings, skipping terms already reported as left out of the query. */
async function withDriftWarnings(
    input: TranslateInput,
    oql: string,
    dsl: OqlQuery,
    warnings: Issue[],
    leftOut: string[] = []
): Promise<Issue[]> {
    const skip = new Set(leftOut.map(t => t.toUpperCase()));
    return [
        ...warnings,
        ...driftWarnings(input.prompt, oql, skip),
        ...(await geneDriftWarnings(
            input.prompt,
            dsl,
            input.portal,
            skip
        ).catch(() => [])),
    ];
}

/** Warns when a protein change the user wrote does not appear in the final OQL. */
function driftWarnings(
    prompt: string,
    oql: string,
    skip: Set<string> = new Set()
): Issue[] {
    const upper = oql.toUpperCase();
    const seen = new Set<string>();
    const out: Issue[] = [];
    for (const m of prompt.matchAll(PROMPT_VARIANT_RE)) {
        const token = m[0];
        if (seen.has(token) || skip.has(token.toUpperCase())) continue;
        seen.add(token);
        if (!upper.includes(token.toUpperCase())) {
            out.push({
                code: 'PROMPT_TERM_MISSING',
                path: [],
                message: `the request mentions ${token}, which is not in the query`,
            });
        }
    }
    return out;
}

export type TranslateOptions = {
    abortSignal?: AbortSignal;
    /** Called after every model call, e.g. to record its usage. */
    onCall?: OnLanguageModelCallEndCallback;
};

function addUsage(usage: Usage, call: LanguageModelUsage): void {
    const cacheRead = call.inputTokenDetails.cacheReadTokens ?? 0;
    const cacheWrite = call.inputTokenDetails.cacheWriteTokens ?? 0;
    usage.turns++;
    usage.inputTokens +=
        call.inputTokenDetails.noCacheTokens ??
        Math.max(0, (call.inputTokens ?? 0) - cacheRead - cacheWrite);
    usage.outputTokens += call.outputTokens ?? 0;
    usage.cacheReadTokens += cacheRead;
    usage.cacheWriteTokens += cacheWrite;
}

function toolResult(call: ToolCallPart, value: unknown): ToolResultPart {
    return {
        type: 'tool-result',
        toolCallId: call.toolCallId,
        toolName: call.toolName,
        output: { type: 'error-json', value: value as never },
    };
}

export async function translate(
    input: TranslateInput,
    options: TranslateOptions = {}
): Promise<TranslateResult> {
    const resolved = resolveOqlModel();
    if (!resolved) throw new NoOqlModelError();
    const mode: OutputMode = input.mode ?? DEFAULT_MODE;
    const toolName = SUBMIT_TOOL[mode];
    const tools: ToolSet = {
        [toolName]: SUBMIT_TOOLS[mode],
        [REJECT_TOOL]: REJECT,
    };
    // Studies are only used by the validator; the model translates the request as written.
    const messages: ModelMessage[] = [
        { role: 'user', content: `Request: ${input.prompt}` },
    ];
    const trace: TraceEntry[] = [];
    const usage: Usage = {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        turns: 0,
    };
    let lastErrors: Issue[] = [];
    let lastDsl: unknown;
    const fail = (reason: string): TranslateResult => ({
        kind: 'fail',
        reason,
        errors: lastErrors,
        lastDsl,
        trace,
        usage,
    });
    let copyCountApproximated = false;

    for (let submits = 0; submits < MAX_SUBMITS; submits++) {
        const response = await generateText({
            model: resolved.model,
            instructions: {
                role: 'system',
                content: SYSTEM_PROMPTS[mode],
                providerOptions: CACHE_SYSTEM_PROMPT,
            },
            messages,
            tools,
            toolChoice: 'auto',
            maxOutputTokens: 4096,
            // Deterministic decoding keeps benchmark runs comparable.
            temperature: 0,
            abortSignal: options.abortSignal,
            onLanguageModelCallEnd: options.onCall,
        });
        addUsage(usage, response.usage);

        const calls = response.toolCalls as ToolCallPart[];
        const reject = calls.find(c => c.toolName === REJECT_TOOL);
        if (reject) {
            const message =
                String((reject.input as any)?.message ?? '').trim() ||
                GENERIC_REJECTION;
            trace.push({ tool: REJECT_TOOL, input: reject.input, ok: true });
            return { kind: 'rejected', message, trace, usage };
        }
        const call = calls.find(c => c.toolName === toolName);
        if (response.finishReason !== 'tool-calls' || !call) {
            const said = response.text.trim().slice(0, 500);
            trace.push({
                tool: 'text',
                input: said,
                ok: false,
                output: { finishReason: response.finishReason },
            });
            if (response.finishReason === 'stop')
                return {
                    kind: 'rejected',
                    message: GENERIC_REJECTION,
                    trace,
                    usage,
                };
            return fail(
                `model stopped (${response.finishReason}) without submitting a query`
            );
        }
        messages.push(...response.response.messages);

        const checked = await check(mode, call.input, input);
        lastDsl = checked.dsl;
        if (checked.kind === 'request') {
            lastErrors = checked.errors;
            trace.push({
                tool: toolName,
                input: call.input,
                ok: false,
                output: { errors: checked.errors },
            });
            return fail("the request can't be run as written");
        }
        if (checked.kind === 'repairable') {
            if (checked.errors.some(e => e.code === 'CNA_IMPOSSIBLE'))
                copyCountApproximated = true;
            lastErrors = checked.errors;
            trace.push({
                tool: toolName,
                input: call.input,
                ok: false,
                output: { errors: checked.errors },
            });
            // Every tool call needs a result; only the first submission is checked.
            messages.push({
                role: 'tool',
                content: calls.map(c =>
                    toolResult(
                        c,
                        c === call
                            ? { valid: false, errors: checked.errors }
                            : {
                                  valid: false,
                                  errors: [
                                      {
                                          code: 'ONE_QUERY',
                                          path: [],
                                          message:
                                              'Submit one query at a time.',
                                      },
                                  ],
                              }
                    )
                ),
            });
            continue;
        }
        const rt = serializeChecked(checked.dsl);
        if (!rt.ok) {
            lastErrors = [
                {
                    code: 'ROUND_TRIP',
                    path: [],
                    message: `${rt.reason}: ${rt.oql}`,
                },
            ];
            trace.push({
                tool: toolName,
                input: call.input,
                ok: false,
                output: { errors: lastErrors },
            });
            return fail('serialized OQL did not round-trip');
        }
        trace.push({
            tool: toolName,
            input: call.input,
            ok: true,
            output: { oql: rt.oql },
        });
        return {
            kind: 'ok',
            oql: rt.oql,
            dsl: checked.dsl,
            explanation: describeQuery(checked.dsl),
            warnings: await withDriftWarnings(
                input,
                rt.oql,
                checked.dsl,
                copyCountApproximated ||
                    asksForCopyCount(input.prompt, checked.dsl)
                    ? [...checked.warnings, COPY_COUNT_NOTE]
                    : checked.warnings,
                checked.leftOut
            ),
            trace,
            usage,
        };
    }
    return fail(`no valid query after ${MAX_SUBMITS} submissions`);
}
