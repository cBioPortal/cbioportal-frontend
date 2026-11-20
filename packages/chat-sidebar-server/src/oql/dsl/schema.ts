import { z } from 'zod';

// Matches the grammar's `String` token, restricted to uppercase symbols.
export const GENE_SYMBOL_RE = /^[-_.@/A-Z0-9]+$/;

// A protein change in HGVS-p short form: reference residue (or X for a splice site), position,
// then a non-digit (alternate residue, del/ins/dup/fs, stop "*", "_splice", or a second "_A123"
// coordinate) and anything else from the grammar's MutationProteinChangeCodeChar set. A bare
// residue such as "V600" is a position match, not a protein change.
export const PROTEIN_CHANGE_RE = /^[GPAVLIMCFYWHKRQNEDSTX][0-9]+[-_./A-Za-z*][-_./A-Za-z0-9*]*$/;

export const AMINO_ACIDS = [
    'G',
    'P',
    'A',
    'V',
    'L',
    'I',
    'M',
    'C',
    'F',
    'Y',
    'W',
    'H',
    'K',
    'R',
    'Q',
    'N',
    'E',
    'D',
    'S',
    'T',
] as const;

export const MUTATION_CLASSES = [
    'MISSENSE',
    'NONSENSE',
    'NONSTART',
    'NONSTOP',
    'FRAMESHIFT',
    'INFRAME',
    'SPLICE',
    'TRUNC',
    'PROMOTER',
] as const;

export const CNA_LEVELS = ['AMP', 'GAIN', 'HETLOSS', 'HOMDEL'] as const;

const GeneSymbol = z
    .string()
    .regex(GENE_SYMBOL_RE, 'must be an uppercase HUGO gene symbol')
    .refine(s => s !== 'DATATYPES', 'DATATYPES is reserved');

const Comparison = z.enum(['>', '>=', '<', '<=']);

const ZScore = z
    .number()
    .min(-10)
    .max(10)
    .refine(n => Math.round(n * 1000) / 1000 === n, 'at most 3 decimal places');

const FlagModifier = (t: 'GERMLINE' | 'SOMATIC' | 'DRIVER') =>
    z.object({ type: z.literal(t) }).strict();

// Longer than any human protein (titin is ~35,000 residues).
const MAX_RESIDUE = 40000;

const RangeModifier = z
    .object({
        type: z.literal('RANGE'),
        start: z
            .number()
            .int()
            .positive()
            .max(MAX_RESIDUE)
            .optional(),
        end: z
            .number()
            .int()
            .positive()
            .max(MAX_RESIDUE)
            .optional(),
        completeOverlapOnly: z.boolean().optional(),
    })
    .strict()
    .refine(
        r => r.start !== undefined || r.end !== undefined,
        'RANGE needs start or end'
    )
    .refine(
        r => r.start === undefined || r.end === undefined || r.start <= r.end,
        'RANGE start must be <= end'
    );

/**
 * Mutations within one exon of the gene's canonical transcript. OQL has no exon syntax: the
 * service replaces this with the exon's residue RANGE before serializing.
 */
const ExonModifier = z
    .object({
        type: z.literal('EXON'),
        exon: z
            .number()
            .int()
            .positive()
            .max(400),
    })
    .strict();

export const MutationModifierSchema = z.union([
    FlagModifier('GERMLINE'),
    FlagModifier('SOMATIC'),
    FlagModifier('DRIVER'),
    RangeModifier,
    ExonModifier,
]);

export const FusionModifierSchema = z.union([
    FlagModifier('GERMLINE'),
    FlagModifier('SOMATIC'),
    FlagModifier('DRIVER'),
]);

export const MutationMatchSchema = z.discriminatedUnion('by', [
    z
        .object({ by: z.literal('class'), value: z.enum(MUTATION_CLASSES) })
        .strict(),
    z
        .object({
            by: z.literal('protein_change'),
            value: z
                .string()
                .regex(
                    PROTEIN_CHANGE_RE,
                    'must be an HGVS-p short form like V600E; for any change at a residue use { by: "position" }'
                ),
        })
        .strict(),
    z
        .object({
            by: z.literal('position'),
            aminoAcid: z.enum(AMINO_ACIDS),
            position: z
                .number()
                .int()
                .positive(),
        })
        .strict(),
]);

const noGermlineAndSomatic = (mods: { type: string }[] | undefined) =>
    !(
        mods?.some(m => m.type === 'GERMLINE') &&
        mods?.some(m => m.type === 'SOMATIC')
    );

const noDuplicateFlags = (mods: { type: string }[] | undefined) => {
    const flags = (mods ?? []).map(m => m.type).filter(t => t !== 'RANGE');
    return new Set(flags).size === flags.length;
};

export const MutationSchema = z
    .object({
        type: z.literal('mutation'),
        negate: z.boolean().optional(),
        match: MutationMatchSchema.optional(),
        modifiers: z.array(MutationModifierSchema).optional(),
    })
    .strict()
    .refine(m => !m.negate || m.match !== undefined, 'negate needs a match')
    .refine(
        m => noGermlineAndSomatic(m.modifiers),
        'GERMLINE and SOMATIC are exclusive'
    )
    .refine(m => noDuplicateFlags(m.modifiers), 'duplicate modifier')
    .refine(
        m =>
            !(
                m.modifiers?.some(x => x.type === 'EXON') &&
                m.modifiers?.some(x => x.type === 'RANGE')
            ),
        'EXON and RANGE cannot be combined; use one alteration per exon or range'
    );

export const CnaSchema = z
    .object({
        type: z.literal('cna'),
        op: z.enum(['=', '>', '>=', '<', '<=']).optional(),
        level: z.enum(CNA_LEVELS).optional(),
        driver: z.boolean().optional(),
    })
    .strict()
    .refine(
        c => c.level !== undefined || c.driver === true,
        'cna needs a level, or driver: true'
    )
    .refine(
        c => c.level !== undefined || c.op === undefined,
        'op needs a level'
    )
    .refine(
        c => !c.driver || c.op === undefined || c.op === '=',
        'driver can only be combined with an exact level'
    );

export const ExpressionSchema = z
    .object({ type: z.literal('expression'), op: Comparison, zScore: ZScore })
    .strict();

export const ProteinSchema = z
    .object({ type: z.literal('protein'), op: Comparison, zScore: ZScore })
    .strict();

export const FusionPartnerSchema = z.discriminatedUnion('kind', [
    z
        .object({
            kind: z.literal('gene'),
            gene: GeneSymbol,
            side: z.enum(['upstream', 'downstream']),
        })
        .strict(),
    z
        .object({
            kind: z.literal('any'),
            side: z.enum(['upstream', 'downstream']),
        })
        .strict(),
    z
        .object({
            kind: z.literal('none'),
            side: z.enum(['upstream', 'downstream']),
        })
        .strict(),
]);

export const FusionSchema = z
    .object({
        type: z.literal('fusion'),
        partner: FusionPartnerSchema.optional(),
        modifiers: z.array(FusionModifierSchema).optional(),
    })
    .strict()
    .refine(
        f => noGermlineAndSomatic(f.modifiers),
        'GERMLINE and SOMATIC are exclusive'
    )
    .refine(f => noDuplicateFlags(f.modifiers), 'duplicate modifier')
    // The grammar allows one modifier on a plain FUSION and two on a partnered fusion.
    .refine(
        f => (f.modifiers?.length ?? 0) <= (f.partner ? 2 : 1),
        'too many modifiers: FUSION takes 1, a partnered fusion takes 2'
    )
    .refine(
        f => f.partner?.kind !== 'gene' || /^[A-Z0-9]+$/.test(f.partner.gene),
        'fusion partner symbols must be alphanumeric in OQL'
    );

export const DriverAnySchema = z
    .object({ type: z.literal('driver_any') })
    .strict();

export const AlterationSchema = z.union([
    MutationSchema,
    CnaSchema,
    ExpressionSchema,
    ProteinSchema,
    FusionSchema,
    DriverAnySchema,
]);

export const GeneTrackSchema = z
    .object({
        kind: z.literal('gene'),
        gene: GeneSymbol,
        alterations: z.array(AlterationSchema),
    })
    .strict();

export const MergedTrackSchema = z
    .object({
        kind: z.literal('merged'),
        label: z
            .string()
            .min(1)
            .refine(
                s => !s.includes('"'),
                'label cannot contain a double quote'
            )
            .optional(),
        genes: z.array(GeneTrackSchema).min(2),
    })
    .strict();

export const TrackSchema = z.discriminatedUnion('kind', [
    GeneTrackSchema,
    MergedTrackSchema,
]);

export const OqlQuerySchema = z
    .object({
        defaults: z
            .array(AlterationSchema)
            .min(1)
            .optional(),
        tracks: z.array(TrackSchema).min(1),
    })
    .strict();

export type MutationModifier = z.infer<typeof MutationModifierSchema>;
export type FusionModifier = z.infer<typeof FusionModifierSchema>;
export type MutationMatch = z.infer<typeof MutationMatchSchema>;
export type Mutation = z.infer<typeof MutationSchema>;
export type Cna = z.infer<typeof CnaSchema>;
export type Expression = z.infer<typeof ExpressionSchema>;
export type Protein = z.infer<typeof ProteinSchema>;
export type Fusion = z.infer<typeof FusionSchema>;
export type FusionPartner = z.infer<typeof FusionPartnerSchema>;
export type Alteration = z.infer<typeof AlterationSchema>;
export type GeneTrack = z.infer<typeof GeneTrackSchema>;
export type MergedTrack = z.infer<typeof MergedTrackSchema>;
export type Track = z.infer<typeof TrackSchema>;
export type OqlQuery = z.infer<typeof OqlQuerySchema>;

export type Issue = {
    code: string;
    path: (string | number)[];
    message: string;
    suggestion?: string;
    /** The gene or variant the issue is about, as written in the query. */
    term?: string;
};

export function schemaIssues(
    input: unknown
): { ok: true; value: OqlQuery } | { ok: false; errors: Issue[] } {
    const r = OqlQuerySchema.safeParse(input);
    if (r.success) return { ok: true, value: r.data };
    return {
        ok: false,
        errors: r.error.issues.map(i => ({
            code: 'SCHEMA',
            path: i.path.map(p => (typeof p === 'symbol' ? String(p) : p)),
            message: i.message,
        })),
    };
}

/** All gene symbols referenced by a query, including fusion partners. */
export function genesInQuery(q: OqlQuery): string[] {
    const out = new Set<string>();
    const visit = (t: GeneTrack) => {
        out.add(t.gene);
        for (const a of t.alterations) {
            if (a.type === 'fusion' && a.partner?.kind === 'gene')
                out.add(a.partner.gene);
        }
    };
    for (const t of q.tracks) {
        if (t.kind === 'gene') visit(t);
        else t.genes.forEach(visit);
    }
    for (const a of q.defaults ?? []) {
        if (a.type === 'fusion' && a.partner?.kind === 'gene')
            out.add(a.partner.gene);
    }
    return [...out];
}
