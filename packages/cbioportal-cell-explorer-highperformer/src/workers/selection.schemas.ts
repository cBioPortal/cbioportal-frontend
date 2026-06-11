import { z } from 'zod';

const PointsInPolygonMsgSchema = z.object({
    type: z.literal('pointsInPolygon'),
    positions: z.custom<Float32Array>(v => v instanceof Float32Array),
    numPoints: z.number(),
    polygon: z.array(z.tuple([z.number(), z.number()])),
    selectionType: z.enum(['rectangle', 'lasso']),
    version: z.number(),
});

export const SelectionMessageSchema = PointsInPolygonMsgSchema;

export const SelectionResultSchema = z.object({
    type: z.literal('selectionResult'),
    indices: z.custom<Uint32Array>(v => v instanceof Uint32Array),
    version: z.number(),
});

export type SelectionMessage = z.infer<typeof SelectionMessageSchema>;
export type PointsInPolygonMsg = z.infer<typeof PointsInPolygonMsgSchema>;
export type SelectionResult = z.infer<typeof SelectionResultSchema>;
