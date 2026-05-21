// Per-token pricing for any model the Vercel AI Gateway routes us to.
//
// We pull the pricing table from gateway.getAvailableModels() once on first
// use rather than hand-maintaining a PRICES record — that catalog is the
// authoritative source and updates automatically when providers reprice.
//
// One caveat for Anthropic 1h-TTL caches: the Gateway lists a single
// `cacheCreationInputTokens` rate which is Anthropic's 5m-TTL price (1.25x
// input). The 1h-TTL write is actually 2x input, so first-call cache-write
// cost on a long paper is under-reported by ~30%. Subsequent cache reads
// (the common case) are correct. Acceptable for an MVP cost display.
//
// We also accept the curated shortlist that the iframe surfaces in its
// model dropdown — see MODEL_SHORTLIST below. The list controls what the
// user can pick; the pricing comes from the Gateway.

import { gateway } from 'ai';

export interface ModelPricing {
    // Per-token, in USD. Strings in the Gateway response; we parse to Number.
    input: number;
    output: number;
    cachedInput: number;
    cacheCreation: number;
}

export interface ModelInfo {
    id: string;
    name: string;
    description: string;
    pricing: ModelPricing;
}

// Curated subset of `provider/model` slugs that we expose in the sidebar
// dropdown. Pulled from the user's selections during this branch's setup.
// Order here is the display order in the dropdown.
export const MODEL_SHORTLIST: readonly string[] = [
    'anthropic/claude-opus-4.7',
    'anthropic/claude-sonnet-4.6',
    'anthropic/claude-haiku-4.5',
    'openai/gpt-5.4',
    'openai/gpt-5.4-mini',
    'google/gemini-3-pro-preview',
    'xai/grok-4.1-fast-reasoning',
    'deepseek/deepseek-v4-pro',
];

let modelCache: Map<string, ModelInfo> | null = null;
let modelCachePromise: Promise<Map<string, ModelInfo>> | null = null;

async function loadModels(): Promise<Map<string, ModelInfo>> {
    if (modelCache) return modelCache;
    if (!modelCachePromise) {
        modelCachePromise = (async () => {
            const { models } = await gateway.getAvailableModels();
            const m = new Map<string, ModelInfo>();
            for (const x of models as any[]) {
                if (!x.pricing) continue;
                m.set(x.id, {
                    id: x.id,
                    name: x.name ?? x.id,
                    description: x.description ?? '',
                    pricing: {
                        input: Number(x.pricing.input),
                        output: Number(x.pricing.output),
                        cachedInput: Number(x.pricing.cachedInputTokens ?? 0),
                        cacheCreation: Number(
                            x.pricing.cacheCreationInputTokens ?? 0
                        ),
                    },
                });
            }
            modelCache = m;
            return m;
        })();
    }
    return modelCachePromise;
}

export async function getPricing(
    modelId: string
): Promise<ModelPricing | null> {
    const m = await loadModels();
    return m.get(modelId)?.pricing ?? null;
}

// Return the shortlist with name + pricing populated, for the iframe to
// render in its dropdown. Drops any entries the Gateway doesn't know about
// (e.g. a slug got renamed between releases) so the UI never shows a model
// the backend can't actually route to.
export async function getShortlistedModels(): Promise<ModelInfo[]> {
    const m = await loadModels();
    return MODEL_SHORTLIST.map(id => m.get(id)).filter(
        (x): x is ModelInfo => x !== undefined
    );
}

export interface CostBreakdown {
    total: number;
    inputCost: number;
    cacheWriteCost: number;
    cacheReadCost: number;
    outputCost: number;
    tokens: {
        input: number;
        cacheWrite: number;
        cacheRead: number;
        output: number;
    };
    currency: 'USD';
    model: string;
}

// AI-SDK-normalized usage shape (result.usage from generateText/Object).
// We accept `any` to stay tolerant of shape drift across providers.
export async function computeCostFromUsage(
    usage: any,
    modelId: string
): Promise<CostBreakdown> {
    const pricing = (await getPricing(modelId)) ?? {
        input: 0,
        output: 0,
        cachedInput: 0,
        cacheCreation: 0,
    };

    // result.usage shape from AI SDK v6:
    //   inputTokens: total input incl. cached
    //   outputTokens: total output
    //   cachedInputTokens: subset of inputTokens that hit the cache
    //   inputTokenDetails: { noCacheTokens, cacheReadTokens, cacheWriteTokens }
    const totalInput = usage?.inputTokens ?? 0;
    const cacheRead =
        usage?.inputTokenDetails?.cacheReadTokens ??
        usage?.cachedInputTokens ??
        0;
    const cacheWrite = usage?.inputTokenDetails?.cacheWriteTokens ?? 0;
    const uncachedInput = Math.max(0, totalInput - cacheRead - cacheWrite);
    const outputTok = usage?.outputTokens ?? 0;

    const inputCost = uncachedInput * pricing.input;
    const cacheReadCost = cacheRead * pricing.cachedInput;
    const cacheWriteCost = cacheWrite * pricing.cacheCreation;
    const outputCost = outputTok * pricing.output;

    return {
        total: inputCost + cacheReadCost + cacheWriteCost + outputCost,
        inputCost,
        cacheWriteCost,
        cacheReadCost,
        outputCost,
        tokens: {
            input: uncachedInput,
            cacheWrite,
            cacheRead,
            output: outputTok,
        },
        currency: 'USD',
        model: modelId,
    };
}
