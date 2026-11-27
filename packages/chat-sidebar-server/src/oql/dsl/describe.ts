import {
    Alteration,
    GeneTrack,
    MutationModifier,
    OqlQuery,
    Track,
} from './schema.js';

const OPS: Record<string, string> = {
    '>': 'above',
    '>=': 'at or above',
    '<': 'below',
    '<=': 'at or below',
};
const CNA_WORDS: Record<string, string> = {
    AMP: 'amplification',
    GAIN: 'gain',
    HETLOSS: 'shallow deletion',
    HOMDEL: 'deep deletion',
};
const CLASS_WORDS: Record<string, string> = {
    MISSENSE: 'missense',
    NONSENSE: 'nonsense',
    NONSTART: 'nonstart',
    NONSTOP: 'nonstop',
    FRAMESHIFT: 'frameshift',
    INFRAME: 'in-frame',
    SPLICE: 'splice',
    TRUNC: 'truncating',
    PROMOTER: 'promoter',
};

function modifierWords(mods: MutationModifier[] | undefined) {
    const pre: string[] = [];
    const post: string[] = [];
    for (const m of mods ?? []) {
        if (m.type === 'DRIVER') pre.push('driver');
        else if (m.type === 'GERMLINE') pre.push('germline');
        else if (m.type === 'SOMATIC') pre.push('somatic');
        else if (m.type === 'EXON') post.push(`in exon ${m.exon}`);
        else if (m.type === 'RANGE') {
            const span =
                m.start !== undefined && m.end !== undefined
                    ? `residues ${m.start}-${m.end}`
                    : m.start !== undefined
                    ? `residue ${m.start} onward`
                    : `residues up to ${m.end}`;
            post.push(
                m.completeOverlapOnly
                    ? `entirely within ${span}`
                    : `overlapping ${span}`
            );
        }
    }
    return { pre, post };
}

export function describeAlteration(a: Alteration, gene: string): string {
    switch (a.type) {
        case 'mutation': {
            const { pre, post } = modifierWords(a.modifiers);
            let core: string;
            if (!a.match) core = 'mutations';
            else if (a.match.by === 'class')
                core = `${CLASS_WORDS[a.match.value]} mutations`;
            else if (a.match.by === 'position')
                core = `mutations at ${a.match.aminoAcid}${a.match.position}`;
            else core = `${a.match.value}`;
            const text = [...pre, core, ...post].join(' ');
            return a.negate ? `mutations other than ${text}` : text;
        }
        case 'cna': {
            if (a.level === undefined) return 'driver copy-number alterations';
            const level = CNA_WORDS[a.level];
            const op = a.op ?? '=';
            const base = op === '=' ? level : `copy number ${OPS[op]} ${level}`;
            return a.driver ? `driver ${base}` : base;
        }
        case 'expression':
            return `mRNA expression z-score ${OPS[a.op]} ${a.zScore}`;
        case 'protein':
            return `protein level z-score ${OPS[a.op]} ${a.zScore}`;
        case 'fusion': {
            const mods = (a.modifiers ?? []).map(m => m.type.toLowerCase());
            const pre = mods.length ? `${mods.join(' ')} ` : '';
            if (!a.partner) return `${pre}fusions`;
            const p = a.partner;
            const other =
                p.kind === 'gene'
                    ? p.gene
                    : p.kind === 'any'
                    ? 'any gene'
                    : 'no partner gene';
            return p.side === 'downstream'
                ? `${pre}fusions with ${gene} 5' and ${other} 3'`
                : `${pre}fusions with ${other} 5' and ${gene} 3'`;
        }
        case 'driver_any':
            return 'any driver alteration';
    }
}

function describeGene(t: GeneTrack): string {
    if (t.alterations.length === 0) return `${t.gene}: default alterations`;
    return `${t.gene}: ${t.alterations
        .map(a => describeAlteration(a, t.gene))
        .join(', or ')}`;
}

export function describeTrack(t: Track): string {
    if (t.kind === 'gene') return describeGene(t);
    const name = t.label ? `"${t.label}"` : 'Merged track';
    return `${name} (one row): ${t.genes.map(describeGene).join('; ')}`;
}

export function describeQuery(q: OqlQuery): string[] {
    const lines: string[] = [];
    if (q.defaults?.length) {
        lines.push(
            `Default for bare genes: ${q.defaults
                .map(a => describeAlteration(a, 'the gene'))
                .join(', or ')}`
        );
    }
    return [...lines, ...q.tracks.map(describeTrack)];
}
