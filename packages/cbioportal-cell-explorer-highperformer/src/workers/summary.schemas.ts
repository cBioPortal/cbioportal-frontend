import { z } from 'zod';

// --- Incoming worker messages ---

const SummarizeCategoryMsgSchema = z.object({
    type: z.literal('summarizeCategory'),
    codes: z.custom<Uint8Array>(v => v instanceof Uint8Array),
    indices: z.custom<Uint32Array>(v => v instanceof Uint32Array),
    numCategories: z.number(),
    version: z.number(),
});

const SummarizeExpressionMsgSchema = z.object({
    type: z.literal('summarizeExpression'),
    expression: z.custom<Float32Array>(v => v instanceof Float32Array),
    indices: z.custom<Uint32Array>(v => v instanceof Uint32Array),
    numBins: z.number(),
    clipMin: z.number().optional(),
    version: z.number(),
});

const SummarizeExpressionByCategoryMsgSchema = z.object({
    type: z.literal('summarizeExpressionByCategory'),
    expression: z.custom<Float32Array>(v => v instanceof Float32Array),
    codes: z.custom<Uint8Array>(v => v instanceof Uint8Array),
    numCategories: z.number(),
    indices: z.custom<Uint32Array>(v => v instanceof Uint32Array),
    version: z.number(),
});

export const SummaryMessageSchema = z.union([
    SummarizeCategoryMsgSchema,
    SummarizeExpressionMsgSchema,
    SummarizeExpressionByCategoryMsgSchema,
]);

// --- Outgoing worker responses ---

export const CategorySummaryResponseSchema = z.object({
    type: z.literal('categorySummary'),
    counts: z.custom<Uint32Array>(v => v instanceof Uint32Array),
    version: z.number(),
});

export const ExpressionSummaryResponseSchema = z.object({
    type: z.literal('expressionSummary'),
    mean: z.number(),
    median: z.number(),
    std: z.number(),
    min: z.number(),
    max: z.number(),
    q1: z.number(),
    q3: z.number(),
    whiskerLow: z.number(),
    whiskerHigh: z.number(),
    bins: z.custom<Uint32Array>(v => v instanceof Uint32Array),
    binEdges: z.custom<Float32Array>(v => v instanceof Float32Array),
    kdeX: z.custom<Float32Array>(v => v instanceof Float32Array),
    kdeDensity: z.custom<Float32Array>(v => v instanceof Float32Array),
    clippedCount: z.number().optional(),
    version: z.number(),
});

export const ExpressionByCategorySummaryResponseSchema = z.object({
    type: z.literal('expressionByCategorySummary'),
    meanExpression: z.custom<Float32Array>(v => v instanceof Float32Array),
    fractionExpressing: z.custom<Float32Array>(v => v instanceof Float32Array),
    version: z.number(),
});

// --- Inferred types ---

export type SummaryMessage = z.infer<typeof SummaryMessageSchema>;
export type SummarizeCategoryMsg = z.infer<typeof SummarizeCategoryMsgSchema>;
export type SummarizeExpressionMsg = z.infer<
    typeof SummarizeExpressionMsgSchema
>;
export type SummarizeExpressionByCategoryMsg = z.infer<
    typeof SummarizeExpressionByCategoryMsgSchema
>;
export type CategorySummaryResponse = z.infer<
    typeof CategorySummaryResponseSchema
>;
export type ExpressionSummaryResponse = z.infer<
    typeof ExpressionSummaryResponseSchema
>;
export type ExpressionByCategorySummaryResponse = z.infer<
    typeof ExpressionByCategorySummaryResponseSchema
>;
export type SummaryResponse =
    | CategorySummaryResponse
    | ExpressionSummaryResponse
    | ExpressionByCategorySummaryResponse;
