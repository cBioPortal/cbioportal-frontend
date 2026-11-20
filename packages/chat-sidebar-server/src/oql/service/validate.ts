import {
    Alteration,
    GeneTrack,
    Issue,
    OqlQuery,
    schemaIssues,
} from '../dsl/index.js';
import { resolveGenes } from './genes.js';
import { studyDataTypes } from './studies.js';
import {
    canonicalExons,
    canonicalProtein,
    checkProteinChange,
} from './variants.js';

export type ValidationResult = {
    valid: boolean;
    /** The query after safe automatic fixes (unique alias → HUGO symbol). Present when schema-valid. */
    dsl?: OqlQuery;
    errors: Issue[];
    warnings: Issue[];
    /** Residue numbers produced by lookups (exon ranges), as opposed to written by the model. */
    lookedUp: number[];
};

/** Problems with what the request names (not with how the model wrote it): never sent back for repair. */
export const USER_ERROR_CODES = new Set([
    'GENE_UNKNOWN',
    'GENE_AMBIGUOUS',
    'VARIANT_REF_MISMATCH',
    'POSITION_OUT_OF_RANGE',
    'NO_PROTEIN',
    'PROFILE_MISSING',
    'CROSS_STUDY_UNSUPPORTED',
    'EXON_UNKNOWN',
    'EXON_NONCODING',
    'STUDY_UNKNOWN',
]);

type Path = (string | number)[];
type GeneRef = { gene: string; path: Path; set: (hugo: string) => void };
type AltRef = { alt: Alteration; path: Path; track?: GeneTrack };

function walk(q: OqlQuery) {
    const genes: GeneRef[] = [];
    const alts: AltRef[] = [];
    const visitAlt = (alt: Alteration, path: Path, track?: GeneTrack) => {
        alts.push({ alt, path, track });
        if (alt.type === 'fusion' && alt.partner?.kind === 'gene') {
            const partner = alt.partner;
            genes.push({
                gene: partner.gene,
                path: [...path, 'partner', 'gene'],
                set: h => (partner.gene = h),
            });
        }
    };
    const visitTrack = (t: GeneTrack, path: Path) => {
        genes.push({
            gene: t.gene,
            path: [...path, 'gene'],
            set: h => (t.gene = h),
        });
        t.alterations.forEach((a, i) =>
            visitAlt(a, [...path, 'alterations', i], t)
        );
    };
    (q.defaults ?? []).forEach((a, i) => visitAlt(a, ['defaults', i]));
    q.tracks.forEach((t, i) => {
        if (t.kind === 'gene') visitTrack(t, ['tracks', i]);
        else
            t.genes.forEach((g, j) => visitTrack(g, ['tracks', i, 'genes', j]));
    });
    return { genes, alts };
}

const PROFILE_NEEDED: Partial<Record<
    Alteration['type'],
    {
        key: 'mutation' | 'cna' | 'mrna' | 'protein' | 'structuralVariant';
        label: string;
    }
>> = {
    mutation: { key: 'mutation', label: 'mutation' },
    cna: { key: 'cna', label: 'discrete copy-number' },
    expression: { key: 'mrna', label: 'mRNA z-score' },
    protein: { key: 'protein', label: 'protein (RPPA) z-score' },
    fusion: { key: 'structuralVariant', label: 'structural variant' },
};

/**
 * Validates a DSL query in layers: schema, then real genes and variants, then (with studyIds)
 * whether the study has the data each alteration needs.
 */
export async function validateQuery(
    input: unknown,
    opts: { portal: string; studyIds?: string[] }
): Promise<ValidationResult> {
    const schema = schemaIssues(input);
    if (!schema.ok)
        return {
            valid: false,
            errors: schema.errors,
            warnings: [],
            lookedUp: [],
        };

    const dsl: OqlQuery = structuredClone(schema.value);
    const errors: Issue[] = [];
    const warnings: Issue[] = [];
    const lookedUp: number[] = [];
    const { genes, alts } = walk(dsl);

    // Genes
    const resolutions = new Map(
        (
            await resolveGenes(
                opts.portal,
                genes.map(g => g.gene)
            )
        ).map(r => [r.input, r])
    );
    const badGenes = new Set<string>();
    for (const ref of genes) {
        const r = resolutions.get(ref.gene)!;
        if (r.status === 'found') {
            if (r.hugo !== ref.gene) ref.set(r.hugo);
        } else if (r.status === 'alias') {
            warnings.push({
                code: 'GENE_ALIAS',
                path: ref.path,
                message: `${ref.gene} is an alias of ${r.hugo}; replaced`,
                suggestion: r.hugo,
            });
            ref.set(r.hugo);
        } else if (r.status === 'ambiguous') {
            badGenes.add(ref.gene);
            errors.push({
                code: 'GENE_AMBIGUOUS',
                term: ref.gene,
                path: ref.path,
                message: `${
                    ref.gene
                } is an alias of several genes: ${r.candidates.join(', ')}`,
                suggestion: r.candidates.join(' | '),
            });
        } else {
            badGenes.add(ref.gene);
            errors.push({
                code: 'GENE_UNKNOWN',
                term: ref.gene,
                path: ref.path,
                message: `${ref.gene} is not a gene symbol or alias in cBioPortal`,
                ...(r.suggestions.length
                    ? { suggestion: r.suggestions.join(' | ') }
                    : {}),
            });
        }
    }

    // Copy-number comparisons past either end of the scale (HOMDEL < HETLOSS < diploid < GAIN < AMP)
    // can never match a sample.
    for (const { alt, path } of alts) {
        if (alt.type !== 'cna' || !alt.level) continue;
        if (
            (alt.op === '>' && alt.level === 'AMP') ||
            (alt.op === '<' && alt.level === 'HOMDEL')
        ) {
            errors.push({
                code: 'CNA_IMPOSSIBLE',
                path,
                message: `CNA${alt.op}${alt.level} can never match: ${
                    alt.level
                } is the ${
                    alt.level === 'AMP' ? 'highest' : 'lowest'
                } copy-number level. OQL has no copy counts; use ${
                    alt.level
                } itself`,
            });
        }
    }

    // Exons: OQL has no exon syntax, so each EXON modifier becomes that exon's residue range on
    // the gene's canonical transcript, and the mapping is reported back.
    await Promise.all(
        alts.map(async ({ alt, path, track }) => {
            if (
                alt.type !== 'mutation' ||
                !alt.modifiers?.some(m => m.type === 'EXON')
            )
                return;
            if (!track) {
                errors.push({
                    code: 'EXON_NEEDS_GENE',
                    path,
                    message:
                        'an exon only makes sense on a gene track, not in DATATYPES',
                });
                return;
            }
            if (badGenes.has(track.gene)) return;
            const table = await canonicalExons(track.gene);
            const mods: typeof alt.modifiers = [];
            for (const m of alt.modifiers) {
                if (m.type !== 'EXON') {
                    mods.push(m);
                    continue;
                }
                const term = String(m.exon);
                if (!table) {
                    errors.push({
                        code: 'NO_PROTEIN',
                        term: track.gene,
                        path,
                        message: `no exon structure available for ${track.gene}`,
                    });
                    return;
                }
                const r = table.residues.get(m.exon);
                if (r === undefined) {
                    errors.push({
                        code: 'EXON_UNKNOWN',
                        term,
                        path,
                        message: `${track.gene} has ${table.exonCount} exons on ${table.transcriptId}; there is no exon ${m.exon}`,
                    });
                    return;
                }
                if (r === null) {
                    errors.push({
                        code: 'EXON_NONCODING',
                        term,
                        path,
                        message: `${track.gene} exon ${m.exon} does not code for protein on ${table.transcriptId}`,
                    });
                    return;
                }
                mods.push({ type: 'RANGE', start: r.start, end: r.end });
                lookedUp.push(r.start, r.end);
                warnings.push({
                    code: 'EXON_MAPPED',
                    path,
                    message: `${track.gene} exon ${m.exon} = residues ${r.start}-${r.end} (${table.transcriptId})`,
                });
            }
            alt.modifiers = mods;
        })
    );

    // Variants and residue ranges, checked against the (resolved) track gene's canonical protein
    const variantChecks = alts.map(async ({ alt, path, track }) => {
        if (alt.type !== 'mutation' || !track || badGenes.has(track.gene))
            return;
        if (alt.match && alt.match.by !== 'class') {
            const change =
                alt.match.by === 'position'
                    ? `${alt.match.aminoAcid}${alt.match.position}`
                    : alt.match.value;
            const res = await checkProteinChange(track.gene, change);
            if (!res.ok) {
                errors.push({
                    code: res.code,
                    term: change,
                    path: [...path, 'match'],
                    message: res.message,
                    ...(res.suggestion ? { suggestion: res.suggestion } : {}),
                });
                return;
            }
        }
        const ranges = (alt.modifiers ?? []).filter(m => m.type === 'RANGE');
        if (!ranges.length) return;
        const protein = await canonicalProtein(track.gene);
        if (!protein) return;
        for (const m of ranges) {
            const past = Math.max(
                m.type === 'RANGE' ? m.start ?? 0 : 0,
                m.type === 'RANGE' ? m.end ?? 0 : 0
            );
            if (past > protein.length) {
                warnings.push({
                    code: 'RANGE_PAST_END',
                    term: String(past),
                    path: [...path, 'modifiers'],
                    message: `${track.gene} is ${protein.length} aa; the range goes to ${past}`,
                });
            }
        }
    });

    // Study data types: an alteration no selected study can answer is an error; one only some
    // studies can answer is a warning, since the other studies still contribute samples.
    const studyCheck = (async () => {
        if (!opts.studyIds?.length) return;
        const types = await studyDataTypes(opts.portal, opts.studyIds);
        const known = opts.studyIds.filter(id => types.get(id));
        for (const id of opts.studyIds.filter(id => !types.get(id))) {
            errors.push({
                code: 'STUDY_UNKNOWN',
                path: [],
                message: `study ${id} not found on ${opts.portal}`,
            });
        }
        if (!known.length) return;
        for (const { alt, path } of alts) {
            const need = PROFILE_NEEDED[alt.type];
            if (!need) continue;
            // cBioPortal rejects EXP and PROT in a query across more than one study.
            if (
                known.length > 1 &&
                (alt.type === 'expression' || alt.type === 'protein')
            ) {
                errors.push({
                    code: 'CROSS_STUDY_UNSUPPORTED',
                    path,
                    message: `${
                        alt.type === 'expression'
                            ? 'Expression (EXP)'
                            : 'Protein level (PROT)'
                    } filtering is not supported when querying more than one study`,
                });
                continue;
            }
            const lacking = known.filter(id => !types.get(id)![need.key]);
            if (lacking.length === known.length) {
                errors.push({
                    code: 'PROFILE_MISSING',
                    path,
                    message:
                        known.length === 1
                            ? `${known[0]} has no ${need.label} data`
                            : `none of the ${known.length} selected studies has ${need.label} data`,
                });
            } else if (lacking.length) {
                warnings.push({
                    code: 'PROFILE_PARTIAL',
                    path,
                    message: `${lacking.length} of ${
                        known.length
                    } selected studies have no ${
                        need.label
                    } data (${lacking.slice(0, 5).join(', ')}${
                        lacking.length > 5 ? ', …' : ''
                    })`,
                });
            }
        }
    })();

    await Promise.all([...variantChecks, studyCheck]);
    return { valid: errors.length === 0, dsl, errors, warnings, lookedUp };
}
