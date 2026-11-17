import { describe, expect, it } from 'vitest';
import { OqlQuery, unverifiedNumbers } from './index.js';

const gene = (g: string, alterations: any[]): OqlQuery => ({
    tracks: [{ kind: 'gene', gene: g, alterations }],
});
const range = (start?: number, end?: number) => ({
    type: 'mutation',
    modifiers: [
        { type: 'RANGE', ...(start ? { start } : {}), ...(end ? { end } : {}) },
    ],
});

describe('unverifiedNumbers', () => {
    it('flags a residue range the user never wrote', () => {
        const w = unverifiedNumbers(
            gene('PIK3CA', [range(1, 350)]),
            'PIK3CA helical domain mutations'
        );
        expect(w).toHaveLength(1);
        expect(w[0].message).toContain(
            'PIK3CA: residues 1, 350 chosen by the model'
        );
    });
    it('accepts numbers the user wrote, including inside tokens and one off', () => {
        expect(
            unverifiedNumbers(
                gene('EGFR', [range(718, 854)]),
                'EGFR mutations at positions 718-854'
            )
        ).toEqual([]);
        expect(
            unverifiedNumbers(
                gene('NOTCH1', [range(1501)]),
                'NOTCH1 mutations after position 1500'
            )
        ).toEqual([]);
        expect(
            unverifiedNumbers(
                gene('KRAS', [
                    {
                        type: 'mutation',
                        match: { by: 'position', aminoAcid: 'G', position: 12 },
                    },
                ]),
                'KRAS G12 mutations'
            )
        ).toEqual([]);
    });
    it('accepts numbers produced by a lookup', () => {
        expect(
            unverifiedNumbers(gene('EGFR', [range(729, 761)]), 'egfr exon 19', [
                729,
                761,
            ])
        ).toEqual([]);
    });
    it('flags codons the model picked for a concept', () => {
        const q = gene('IDH2', [
            {
                type: 'mutation',
                match: { by: 'position', aminoAcid: 'R', position: 172 },
            },
        ]);
        expect(unverifiedNumbers(q, 'IDH2 hotspots')[0].message).toContain(
            'IDH2: residue 172'
        );
    });
    it('flags protein changes the user did not name', () => {
        const q = gene('BRAF', [
            {
                type: 'mutation',
                match: { by: 'protein_change', value: 'V600E' },
            },
        ]);
        expect(unverifiedNumbers(q, 'BRAF hotspot')).toHaveLength(1);
        expect(unverifiedNumbers(q, 'BRAF V600E')).toEqual([]);
    });
    it("treats the default z-score of 2 as a rule, and other thresholds as the user's or the model's", () => {
        const exp = (z: number) =>
            gene('MYC', [{ type: 'expression', op: '>', zScore: z }]);
        expect(unverifiedNumbers(exp(2), 'high MYC expression')).toEqual([]);
        expect(unverifiedNumbers(exp(1.5), 'MYC expression above 1.5')).toEqual(
            []
        );
        expect(unverifiedNumbers(exp(-1), 'CDKN2A z-score below -1')).toEqual(
            []
        );
        expect(
            unverifiedNumbers(exp(3), 'very high MYC expression')[0].message
        ).toContain('z-score threshold 3');
    });
});
