import { z } from 'zod';

// --- Incoming worker messages ---

const BuildDefaultMsgSchema = z.object({
    type: z.literal('buildDefault'),
    numPoints: z.number(),
    rgb: z.tuple([z.number(), z.number(), z.number()]),
    alpha: z.number(),
    version: z.number(),
});

const BuildFromExpressionMsgSchema = z.object({
    type: z.literal('buildFromExpression'),
    numPoints: z.number(),
    expression: z.custom<Float32Array>(v => v instanceof Float32Array),
    min: z.number(),
    max: z.number(),
    alpha: z.number(),
    scaleName: z.string(),
    version: z.number(),
});

const BuildFromCategoriesMsgSchema = z.object({
    type: z.literal('buildFromCategories'),
    numPoints: z.number(),
    categories: z.custom<Uint8Array>(v => v instanceof Uint8Array),
    alpha: z.number(),
    highlightedCodes: z.array(z.number()).nullable(),
    version: z.number(),
});

export const WorkerMessageSchema = z.union([
    BuildDefaultMsgSchema,
    BuildFromExpressionMsgSchema,
    BuildFromCategoriesMsgSchema,
]);

// --- Outgoing worker response ---

export const ColorBufferResponseSchema = z.object({
    type: z.literal('colorBuffer'),
    buffer: z.custom<Uint8Array>(v => v instanceof Uint8Array),
    radiusBuffer: z
        .custom<Float32Array>(v => v instanceof Float32Array)
        .nullable(),
    version: z.number(),
});

// --- Inferred types ---

export type WorkerMessage = z.infer<typeof WorkerMessageSchema>;
export type BuildDefaultMsg = z.infer<typeof BuildDefaultMsgSchema>;
export type BuildFromExpressionMsg = z.infer<
    typeof BuildFromExpressionMsgSchema
>;
export type BuildFromCategoriesMsg = z.infer<
    typeof BuildFromCategoriesMsgSchema
>;
export type ColorBufferResponse = z.infer<typeof ColorBufferResponseSchema>;
