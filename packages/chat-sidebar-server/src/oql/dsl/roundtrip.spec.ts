import { describe, expect, it } from 'vitest';
import fixtures from './frontend-fixtures.json';
import {
    OqlQuery,
    describeQuery,
    parseOql,
    parseOqlAst,
    schemaIssues,
    serialize,
    serializeChecked,
} from './index.js';

// Strips parser bookkeeping that carries no query meaning: the `unrecognized` flag, and the
// `constr_rel` that "MUT=DRIVER" leaves on a mutation with no constraint.
function meaning(ast: unknown): unknown {
    return JSON.parse(
        JSON.stringify(ast, function(this: any, k, v) {
            if (k === 'unrecognized') return undefined;
            if (
                k === 'constr_rel' &&
                this.alteration_type === 'mut' &&
                this.constr_type === undefined
            )
                return undefined;
            return v;
        })
    );
}

describe('frontend parser fixtures', () => {
    for (const q of fixtures as string[]) {
        it(JSON.stringify(q), () => {
            const parsed = parseOql(q);
            expect(parsed.ok).toBe(true);
            if (!parsed.ok) return;
            const schema = schemaIssues(parsed.dsl);
            // Fixtures that our stricter schema rejects (lowercase genes, lenient forms) are skipped.
            if (!schema.ok) return;
            const rt = serializeChecked(schema.value);
            expect(rt.ok, rt.ok ? '' : `${rt.reason}\n${rt.oql}`).toBe(true);
            expect(meaning(parseOqlAst(rt.oql))).toEqual(
                meaning(parseOqlAst(q))
            );
        });
    }
});

const cases: [string, OqlQuery, string][] = [
    [
        'class + driver',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'KRAS',
                    alterations: [
                        {
                            type: 'mutation',
                            match: { by: 'class', value: 'MISSENSE' },
                            modifiers: [{ type: 'DRIVER' }],
                        },
                    ],
                },
            ],
        },
        'KRAS: MISSENSE_DRIVER;',
    ],
    [
        'protein change',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'BRAF',
                    alterations: [
                        {
                            type: 'mutation',
                            match: { by: 'protein_change', value: 'V600E' },
                        },
                    ],
                },
            ],
        },
        'BRAF: MUT=V600E;',
    ],
    [
        'in-frame deletion range',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'EGFR',
                    alterations: [
                        {
                            type: 'mutation',
                            match: {
                                by: 'protein_change',
                                value: 'E746_A750del',
                            },
                        },
                    ],
                },
            ],
        },
        'EGFR: MUT=E746_A750del;',
    ],
    [
        'positions with driver',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'KRAS',
                    alterations: [
                        {
                            type: 'mutation',
                            match: {
                                by: 'position',
                                aminoAcid: 'G',
                                position: 12,
                            },
                            modifiers: [{ type: 'DRIVER' }],
                        },
                        {
                            type: 'mutation',
                            match: {
                                by: 'position',
                                aminoAcid: 'Q',
                                position: 61,
                            },
                        },
                    ],
                },
            ],
        },
        'KRAS: MUT=G12_DRIVER MUT=Q61;',
    ],
    [
        'negated protein change',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'BRAF',
                    alterations: [
                        {
                            type: 'mutation',
                            negate: true,
                            match: { by: 'protein_change', value: 'V600E' },
                        },
                    ],
                },
            ],
        },
        'BRAF: MUT!=V600E;',
    ],
    [
        'cna + expression',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'ERBB2',
                    alterations: [
                        { type: 'cna', level: 'AMP' },
                        { type: 'expression', op: '>=', zScore: 2 },
                    ],
                },
            ],
        },
        'ERBB2: AMP EXP>=2;',
    ],
    [
        'cna comparison and protein',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'PTEN',
                    alterations: [
                        { type: 'cna', op: '<=', level: 'HETLOSS' },
                        { type: 'protein', op: '<', zScore: -1.5 },
                    ],
                },
            ],
        },
        'PTEN: CNA<=HETLOSS PROT<-1.5;',
    ],
    [
        'driver cna',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'MYC',
                    alterations: [
                        { type: 'cna', level: 'AMP', driver: true },
                        { type: 'cna', driver: true },
                    ],
                },
            ],
        },
        'MYC: AMP_DRIVER CNA_DRIVER;',
    ],
    [
        'fusion partner',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'EML4',
                    alterations: [
                        {
                            type: 'fusion',
                            partner: {
                                kind: 'gene',
                                gene: 'ALK',
                                side: 'downstream',
                            },
                        },
                    ],
                },
            ],
        },
        'EML4: FUSION::ALK;',
    ],
    [
        'fusion any upstream with driver',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'ALK',
                    alterations: [
                        {
                            type: 'fusion',
                            partner: { kind: 'any', side: 'upstream' },
                            modifiers: [{ type: 'DRIVER' }],
                        },
                    ],
                },
            ],
        },
        'ALK: ::FUSION_DRIVER;',
    ],
    [
        'plain fusion, germline mutation, range',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'BRCA2',
                    alterations: [
                        { type: 'fusion' },
                        { type: 'mutation', modifiers: [{ type: 'GERMLINE' }] },
                        {
                            type: 'mutation',
                            modifiers: [
                                {
                                    type: 'RANGE',
                                    start: 100,
                                    end: 200,
                                    completeOverlapOnly: true,
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        'BRCA2: FUSION MUT_GERMLINE MUT_(100-200*);',
    ],
    [
        'merged track + defaults',
        {
            defaults: [{ type: 'cna', level: 'AMP' }, { type: 'mutation' }],
            tracks: [
                {
                    kind: 'merged',
                    label: 'RAS',
                    genes: [
                        { kind: 'gene', gene: 'KRAS', alterations: [] },
                        {
                            kind: 'gene',
                            gene: 'NRAS',
                            alterations: [{ type: 'mutation' }],
                        },
                    ],
                },
                { kind: 'gene', gene: 'TP53', alterations: [] },
            ],
        },
        'DATATYPES: AMP MUT;\n["RAS" KRAS NRAS: MUT;]\nTP53',
    ],
    [
        'any driver',
        {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'TP53',
                    alterations: [{ type: 'driver_any' }],
                },
            ],
        },
        'TP53: DRIVER;',
    ],
];

describe('serializer', () => {
    for (const [name, dsl, oql] of cases) {
        it(name, () => {
            expect(schemaIssues(dsl).ok).toBe(true);
            expect(serialize(dsl)).toBe(oql);
            const rt = serializeChecked(dsl);
            expect(rt.ok, rt.ok ? '' : rt.reason).toBe(true);
            expect(describeQuery(dsl).length).toBeGreaterThan(0);
        });
    }
});

describe('schema', () => {
    const bad = (alt: unknown) =>
        schemaIssues({
            tracks: [{ kind: 'gene', gene: 'TP53', alterations: [alt] }],
        }).ok;
    it('rejects free-text mutations', () => {
        expect(
            bad({
                type: 'mutation',
                match: { by: 'protein_change', value: 'deleted' },
            })
        ).toBe(false);
    });
    it('rejects a bare residue as a protein change', () => {
        expect(
            bad({
                type: 'mutation',
                match: { by: 'protein_change', value: 'V600' },
            })
        ).toBe(false);
        expect(
            bad({
                type: 'mutation',
                match: { by: 'protein_change', value: 'Q61*' },
            })
        ).toBe(true);
        expect(
            bad({
                type: 'mutation',
                match: { by: 'protein_change', value: 'X125_splice' },
            })
        ).toBe(true);
    });
    it('rejects germline + somatic', () => {
        expect(
            bad({
                type: 'mutation',
                modifiers: [{ type: 'GERMLINE' }, { type: 'SOMATIC' }],
            })
        ).toBe(false);
    });
    it('rejects lowercase genes', () => {
        expect(
            schemaIssues({
                tracks: [{ kind: 'gene', gene: 'tp53', alterations: [] }],
            }).ok
        ).toBe(false);
    });
    it('rejects single-gene merged tracks', () => {
        expect(
            schemaIssues({
                tracks: [
                    {
                        kind: 'merged',
                        genes: [
                            { kind: 'gene', gene: 'TP53', alterations: [] },
                        ],
                    },
                ],
            }).ok
        ).toBe(false);
    });
    it('flags unrecognized mutations when parsing OQL', () => {
        const r = parseOql('TP53: deleted');
        expect(r.ok && r.warnings.length).toBeTruthy();
    });
});

describe('exons and range limits', () => {
    const one = (alt: unknown) =>
        schemaIssues({
            tracks: [{ kind: 'gene', gene: 'EGFR', alterations: [alt] }],
        });
    it('accepts an EXON modifier', () => {
        expect(
            one({ type: 'mutation', modifiers: [{ type: 'EXON', exon: 19 }] })
                .ok
        ).toBe(true);
    });
    it('rejects EXON combined with RANGE', () => {
        expect(
            one({
                type: 'mutation',
                modifiers: [
                    { type: 'EXON', exon: 19 },
                    { type: 'RANGE', start: 1, end: 5 },
                ],
            }).ok
        ).toBe(false);
    });
    it('rejects residue ranges longer than any protein', () => {
        expect(
            one({
                type: 'mutation',
                modifiers: [{ type: 'RANGE', start: 1, end: 9007199254740991 }],
            }).ok
        ).toBe(false);
    });
    it('refuses to serialize an unresolved exon', () => {
        const r = serializeChecked({
            tracks: [
                {
                    kind: 'gene',
                    gene: 'EGFR',
                    alterations: [
                        {
                            type: 'mutation',
                            modifiers: [{ type: 'EXON', exon: 19 }],
                        },
                    ],
                },
            ],
        });
        expect(r.ok).toBe(false);
    });
});
