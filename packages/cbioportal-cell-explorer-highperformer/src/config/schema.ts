import { z } from 'zod';

const FilterSchema = z.object({
    ids: z.array(z.string()),
    obsColumn: z.string(),
});

const RawConfigSchema = z.object({
    url: z.string(),
    embedding: z.string().optional(),
    colorBy: z.enum(['gene', 'category']).optional(),
    gene: z.string().optional(),
    category: z.string().optional(),
    geneLabelColumn: z.string().optional(),
    filter: FilterSchema.optional(),
    summaryObsColumns: z.array(z.string()).optional(),
    summaryGenes: z.array(z.string()).optional(),
    showHeader: z.boolean().default(true),
    showLeftSidebar: z.boolean().default(true),
    showRightSidebar: z.boolean().default(true),
    showDatasetDropdown: z.boolean().default(true),
});

export const AppConfigSchema = RawConfigSchema.transform(data => {
    // Strip colorBy if its companion field is missing
    if (data.colorBy === 'gene' && !data.gene) {
        console.warn(
            '[config] colorBy "gene" requires a "gene" field — ignoring colorBy'
        );
        const { colorBy, ...rest } = data;
        return rest;
    }
    if (data.colorBy === 'category' && !data.category) {
        console.warn(
            '[config] colorBy "category" requires a "category" field — ignoring colorBy'
        );
        const { colorBy, ...rest } = data;
        return rest;
    }
    return data;
});

export type AppConfig = z.output<typeof AppConfigSchema>;

export const MessageSchema = z.object({
    type: z.literal('applyConfig'),
    payload: AppConfigSchema,
});

export type AppMessage = z.output<typeof MessageSchema>;
