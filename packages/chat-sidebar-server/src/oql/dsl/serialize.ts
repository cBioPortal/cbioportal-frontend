import {
    Alteration,
    FusionModifier,
    GeneTrack,
    MutationModifier,
    OqlQuery,
    Track,
} from './schema.js';

function mutationModifier(m: MutationModifier): string {
    if (m.type === 'EXON')
        throw new Error(
            `exon ${m.exon} must be resolved to a residue range before serializing`
        );
    if (m.type !== 'RANGE') return m.type;
    return `(${m.start ?? ''}-${m.end ?? ''}${
        m.completeOverlapOnly ? '*' : ''
    })`;
}

function withModifiers(
    base: string,
    mods: { type: string }[] | undefined,
    fmt: (m: any) => string
) {
    return mods && mods.length ? `${base}_${mods.map(fmt).join('_')}` : base;
}

export function serializeAlteration(a: Alteration): string {
    switch (a.type) {
        case 'mutation': {
            const rel = a.negate ? '!=' : '=';
            let base: string;
            if (!a.match) base = 'MUT';
            else if (a.match.by === 'class')
                base = a.negate ? `MUT!=${a.match.value}` : a.match.value;
            else if (a.match.by === 'position')
                base = `MUT${rel}${a.match.aminoAcid}${a.match.position}`;
            else base = `MUT${rel}${a.match.value}`;
            return withModifiers(base, a.modifiers, mutationModifier);
        }
        case 'cna': {
            if (a.level === undefined) return 'CNA_DRIVER';
            const op = a.op ?? '=';
            const base = op === '=' ? a.level : `CNA${op}${a.level}`;
            return a.driver ? `${base}_DRIVER` : base;
        }
        case 'expression':
            return `EXP${a.op}${a.zScore}`;
        case 'protein':
            return `PROT${a.op}${a.zScore}`;
        case 'fusion': {
            const fmt = (m: FusionModifier) => m.type;
            if (!a.partner) return withModifiers('FUSION', a.modifiers, fmt);
            const partner =
                a.partner.kind === 'gene'
                    ? a.partner.gene
                    : a.partner.kind === 'none'
                    ? '-'
                    : '';
            const base =
                a.partner.side === 'downstream'
                    ? `FUSION::${partner}`
                    : `${partner}::FUSION`;
            return withModifiers(base, a.modifiers, fmt);
        }
        case 'driver_any':
            return 'DRIVER';
    }
}

function geneLine(t: GeneTrack): string {
    if (t.alterations.length === 0) return t.gene;
    return `${t.gene}: ${t.alterations.map(serializeAlteration).join(' ')};`;
}

function trackLine(t: Track): string {
    if (t.kind === 'gene') return geneLine(t);
    const label = t.label !== undefined ? `"${t.label}" ` : '';
    return `[${label}${t.genes.map(geneLine).join(' ')}]`;
}

/** Writes the canonical OQL for a DSL query: one track per line. */
export function serialize(q: OqlQuery): string {
    const lines: string[] = [];
    if (q.defaults && q.defaults.length) {
        lines.push(
            `DATATYPES: ${q.defaults.map(serializeAlteration).join(' ')};`
        );
    }
    lines.push(...q.tracks.map(trackLine));
    return lines.join('\n');
}
