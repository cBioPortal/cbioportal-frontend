import { parse as pegParse } from './grammar/oql-parser.js';
import { Alteration, GeneTrack, Issue, OqlQuery, Track } from './schema.js';

// Shapes produced by oql-parser.pegjs (see cbioportal-frontend oql-parser.d.ts).
type AstModifier = {
    type: string;
    start?: number;
    end?: number;
    completeOverlapOnly?: boolean;
};
type AstAlteration = {
    alteration_type: string;
    constr_rel?: string;
    constr_type?: 'class' | 'name' | 'position';
    constr_val?: string | number;
    info?: { amino_acid?: string; unrecognized?: boolean };
    gene?: string;
    modifiers?: AstModifier[];
};
type AstGeneLine = { gene: string; alterations: AstAlteration[] | false };
type AstMerged = { label?: string; list: AstGeneLine[] };
type AstLine = AstGeneLine | AstMerged;

export type ParseResult =
    | { ok: true; dsl: OqlQuery; warnings: Issue[] }
    | { ok: false; errors: Issue[] };

export function parseOqlAst(oql: string): AstLine[] {
    const r = pegParse(oql);
    return r === false || r === undefined ? [] : (r as AstLine[]);
}

function mapModifier(m: AstModifier): any {
    if (m.type === 'RANGE') {
        const out: any = { type: 'RANGE' };
        if (m.start !== undefined) out.start = m.start;
        if (m.end !== undefined) out.end = m.end;
        if (m.completeOverlapOnly) out.completeOverlapOnly = true;
        return out;
    }
    return { type: m.type };
}

function mapAlteration(
    a: AstAlteration,
    path: (string | number)[],
    warnings: Issue[]
): Alteration {
    const mods = (a.modifiers ?? []).map(mapModifier);
    const withMods = <T extends object>(o: T) =>
        mods.length ? { ...o, modifiers: mods } : o;
    switch (a.alteration_type) {
        case 'mut': {
            const out: any = { type: 'mutation' };
            if (a.constr_rel === '!=') out.negate = true;
            if (a.constr_type === 'class')
                out.match = { by: 'class', value: a.constr_val };
            else if (a.constr_type === 'position')
                out.match = {
                    by: 'position',
                    aminoAcid: a.info?.amino_acid,
                    position: a.constr_val,
                };
            else if (a.constr_type === 'name') {
                out.match = { by: 'protein_change', value: a.constr_val };
                if (a.info?.unrecognized) {
                    warnings.push({
                        code: 'UNRECOGNIZED_MUTATION',
                        path,
                        message: `"${a.constr_val}" is not a known mutation keyword or protein change`,
                    });
                }
            }
            return withMods(out);
        }
        case 'cna': {
            const out: any = { type: 'cna' };
            if (a.constr_val !== undefined) {
                out.level = a.constr_val;
                if (a.constr_rel && a.constr_rel !== '=') out.op = a.constr_rel;
            }
            if (mods.some(m => m.type === 'DRIVER')) out.driver = true;
            return out;
        }
        case 'exp':
        case 'prot':
            return {
                type: a.alteration_type === 'exp' ? 'expression' : 'protein',
                op: a.constr_rel as any,
                zScore: Number(a.constr_val),
            };
        case 'fusion':
            return withMods({ type: 'fusion' } as any);
        case 'downstream_fusion':
        case 'upstream_fusion': {
            const side =
                a.alteration_type === 'downstream_fusion'
                    ? 'downstream'
                    : 'upstream';
            const partner =
                a.gene === '*' || a.gene === undefined
                    ? { kind: 'any', side }
                    : a.gene === '-'
                    ? { kind: 'none', side }
                    : { kind: 'gene', gene: a.gene, side };
            return withMods({ type: 'fusion', partner } as any);
        }
        case 'any':
            return { type: 'driver_any' };
        default:
            throw new Error(`unknown alteration_type ${a.alteration_type}`);
    }
}

function mapGeneLine(
    l: AstGeneLine,
    path: (string | number)[],
    warnings: Issue[]
): GeneTrack {
    const alterations = l.alterations
        ? l.alterations.map((a, i) =>
              mapAlteration(a, [...path, 'alterations', i], warnings)
          )
        : [];
    return { kind: 'gene', gene: l.gene, alterations };
}

/**
 * Parses OQL with cBioPortal's grammar and maps the AST to the DSL. The result is not
 * schema-checked here; run `schemaIssues` on it for that.
 */
export function parseOql(oql: string): ParseResult {
    let ast: AstLine[];
    try {
        ast = parseOqlAst(oql);
    } catch (caught) {
        const e = caught as any;
        const loc = e?.location?.start;
        return {
            ok: false,
            errors: [
                {
                    code: 'OQL_SYNTAX',
                    path: [],
                    message: loc
                        ? `line ${loc.line}, column ${loc.column}: ${e.message}`
                        : String(e?.message ?? e),
                },
            ],
        };
    }
    const warnings: Issue[] = [];
    const tracks: Track[] = [];
    let defaults: Alteration[] | undefined;
    for (const line of ast) {
        if ('list' in line) {
            const path = ['tracks', tracks.length];
            const merged: any = {
                kind: 'merged',
                genes: line.list.map((g, i) =>
                    mapGeneLine(g, [...path, 'genes', i], warnings)
                ),
            };
            if (line.label !== undefined) merged.label = line.label;
            tracks.push(merged);
        } else if (line.gene.toUpperCase() === 'DATATYPES') {
            if (tracks.length > 0 || defaults) {
                warnings.push({
                    code: 'DATATYPES_POSITION',
                    path: ['defaults'],
                    message:
                        'only a single DATATYPES line before all tracks is supported; later ones were merged',
                });
            }
            const alts = line.alterations
                ? line.alterations.map((a, i) =>
                      mapAlteration(a, ['defaults', i], warnings)
                  )
                : [];
            defaults = [...(defaults ?? []), ...alts];
        } else {
            tracks.push(mapGeneLine(line, ['tracks', tracks.length], warnings));
        }
    }
    const dsl: OqlQuery = defaults ? { defaults, tracks } : { tracks };
    return { ok: true, dsl, warnings };
}
