import { Issue, OqlQuery, pruneQuery, serialize } from './index.js';

const err = (path: (string | number)[], term?: string): Issue => ({
    code: 'X',
    path,
    message: 'bad',
    ...(term ? { term } : {}),
});
const mut = (value: string) => ({
    type: 'mutation' as const,
    match: { by: 'protein_change' as const, value },
});

describe('pruneQuery', () => {
    it('drops one bad alteration and keeps the rest of the gene', () => {
        const q: OqlQuery = {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'BRAF',
                    alterations: [mut('V600E'), mut('V601E')],
                },
            ],
        };
        const r = pruneQuery(q, [
            err(['tracks', 0, 'alterations', 1, 'match'], 'V601E'),
        ])!;
        expect(serialize(r.dsl)).toBe('BRAF: MUT=V600E;');
        expect(r.warnings[0].message).toContain('Left out BRAF: MUT=V601E');
        expect(r.warnings[0].term).toBe('V601E');
    });

    it('drops a gene whose only alteration is bad instead of leaving it bare', () => {
        const q: OqlQuery = {
            tracks: [
                { kind: 'gene', gene: 'TP53', alterations: [mut('R175H')] },
                { kind: 'gene', gene: 'BRAF', alterations: [mut('V601E')] },
            ],
        };
        const r = pruneQuery(q, [
            err(['tracks', 1, 'alterations', 0, 'match'], 'V601E'),
        ])!;
        expect(serialize(r.dsl)).toBe('TP53: MUT=R175H;');
        expect(r.leftOut.sort()).toEqual(['BRAF', 'V601E']);
    });

    it('drops an unknown gene track', () => {
        const q: OqlQuery = {
            tracks: [
                { kind: 'gene', gene: 'FOOBAR1', alterations: [] },
                {
                    kind: 'gene',
                    gene: 'KRAS',
                    alterations: [{ type: 'mutation' }],
                },
            ],
        };
        expect(
            serialize(pruneQuery(q, [err(['tracks', 0, 'gene'])])!.dsl)
        ).toBe('KRAS: MUT;');
    });

    it('turns a merged track left with one gene into a gene track', () => {
        const q: OqlQuery = {
            tracks: [
                {
                    kind: 'merged',
                    label: 'X',
                    genes: [
                        { kind: 'gene', gene: 'MDM2', alterations: [] },
                        { kind: 'gene', gene: 'FOOBAR1', alterations: [] },
                    ],
                },
            ],
        };
        expect(
            serialize(
                pruneQuery(q, [err(['tracks', 0, 'genes', 1, 'gene'])])!.dsl
            )
        ).toBe('MDM2');
    });

    it('drops a fusion whose partner is unknown', () => {
        const q: OqlQuery = {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'ALK',
                    alterations: [
                        {
                            type: 'fusion',
                            partner: {
                                kind: 'gene',
                                gene: 'FOO',
                                side: 'upstream',
                            },
                        },
                        { type: 'cna', level: 'AMP' },
                    ],
                },
            ],
        };
        expect(
            serialize(
                pruneQuery(q, [
                    err(['tracks', 0, 'alterations', 0, 'partner', 'gene']),
                ])!.dsl
            )
        ).toBe('ALK: AMP;');
    });

    it('labels an unresolved exon in plain words', () => {
        const q: OqlQuery = {
            tracks: [
                {
                    kind: 'gene',
                    gene: 'EGFR',
                    alterations: [
                        mut('L858R'),
                        {
                            type: 'mutation',
                            modifiers: [{ type: 'EXON', exon: 40 }],
                        },
                    ],
                },
            ],
        };
        const r = pruneQuery(q, [err(['tracks', 0, 'alterations', 1], '40')])!;
        expect(serialize(r.dsl)).toBe('EGFR: MUT=L858R;');
        expect(r.warnings[0].message).toContain(
            'Left out EGFR mutations in exon 40'
        );
    });

    it('gives up when nothing would remain', () => {
        const q: OqlQuery = {
            tracks: [
                { kind: 'gene', gene: 'KRAS', alterations: [mut('G300V')] },
            ],
        };
        expect(
            pruneQuery(q, [err(['tracks', 0, 'alterations', 0, 'match'])])
        ).toBeNull();
    });

    it('gives up when a DATATYPES line would become empty', () => {
        const q: OqlQuery = {
            defaults: [{ type: 'expression', op: '>', zScore: 2 }],
            tracks: [
                { kind: 'gene', gene: 'MYC', alterations: [] },
                { kind: 'gene', gene: 'CCND1', alterations: [] },
            ],
        };
        expect(pruneQuery(q, [err(['defaults', 0])])).toBeNull();
    });

    it('keeps the rest of a DATATYPES line', () => {
        const q: OqlQuery = {
            defaults: [
                { type: 'cna', level: 'AMP' },
                { type: 'expression', op: '>', zScore: 2 },
            ],
            tracks: [{ kind: 'gene', gene: 'MYC', alterations: [] }],
        };
        expect(serialize(pruneQuery(q, [err(['defaults', 1])])!.dsl)).toBe(
            'DATATYPES: AMP;\nMYC'
        );
    });

    it('gives up on errors not tied to a part of the query', () => {
        const q: OqlQuery = {
            tracks: [{ kind: 'gene', gene: 'KRAS', alterations: [] }],
        };
        expect(pruneQuery(q, [err([])])).toBeNull();
    });
});
