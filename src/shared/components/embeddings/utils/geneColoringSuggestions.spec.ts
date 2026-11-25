import { assert } from 'chai';
import {
    formatAlteredFraction,
    genesAlteredInPatient,
    mostFrequentlyMutatedGenes,
} from './geneColoringSuggestions';

const row = (
    entrezGeneId: number,
    hugoGeneSymbol: string,
    numberOfAlteredCases: number,
    numberOfProfiledCases: number = 100
) => ({
    entrezGeneId,
    hugoGeneSymbol,
    numberOfAlteredCases,
    numberOfProfiledCases,
});

const gene = (entrezGeneId: number, hugoGeneSymbol: string) => ({
    entrezGeneId,
    hugoGeneSymbol,
});

describe('geneColoringSuggestions', () => {
    describe('formatAlteredFraction', () => {
        it('rounds to a whole percent', () => {
            assert.equal(formatAlteredFraction(38, 100), '38%');
            assert.equal(formatAlteredFraction(2, 3), '67%');
        });

        it('shows a rare but present alteration as under one percent', () => {
            assert.equal(formatAlteredFraction(1, 500), '<1%');
        });

        it('shows nothing profiled as zero rather than dividing by it', () => {
            assert.equal(formatAlteredFraction(3, 0), '0%');
        });
    });

    describe('mostFrequentlyMutatedGenes', () => {
        it('ranks by mutated cases, not by share of profiled cases', () => {
            const suggestions = mostFrequentlyMutatedGenes([
                row(1, 'RARE_PANEL', 3, 5),
                row(7157, 'TP53', 380, 1000),
                row(3845, 'KRAS', 140, 1000),
            ]);
            assert.deepEqual(
                suggestions.map(s => s.hugoGeneSymbol),
                ['TP53', 'KRAS', 'RARE_PANEL'],
                'a gene profiled in five cases must not outrank TP53'
            );
            assert.equal(suggestions[0].detail, '38%');
            assert.equal(suggestions[2].detail, '60%');
        });

        it('keeps the top ones, breaking ties alphabetically', () => {
            const suggestions = mostFrequentlyMutatedGenes(
                [row(2, 'B', 5), row(1, 'A', 5), row(3, 'C', 9)],
                2
            );
            assert.deepEqual(
                suggestions.map(s => s.hugoGeneSymbol),
                ['C', 'A']
            );
        });

        it('leaves out genes with no mutated cases', () => {
            assert.deepEqual(mostFrequentlyMutatedGenes([row(1, 'A', 0)]), []);
        });
    });

    describe('genesAlteredInPatient', () => {
        const none = { mutations: [], cnas: [], structuralVariants: [] };

        it('lists each altered gene once, with its kinds of alteration', () => {
            const suggestions = genesAlteredInPatient(
                {
                    mutations: [
                        { gene: gene(1956, 'EGFR') },
                        { gene: gene(1956, 'EGFR') },
                    ],
                    cnas: [{ gene: gene(1956, 'EGFR'), alteration: 2 }],
                    structuralVariants: [
                        {
                            site1EntrezGeneId: 238,
                            site1HugoSymbol: 'ALK',
                            site2EntrezGeneId: 27436,
                            site2HugoSymbol: 'EML4',
                        },
                    ],
                },
                new Set()
            );
            assert.deepEqual(suggestions, [
                {
                    entrezGeneId: 1956,
                    hugoGeneSymbol: 'EGFR',
                    detail: 'Mut · Amp',
                },
                { entrezGeneId: 238, hugoGeneSymbol: 'ALK', detail: 'SV' },
                { entrezGeneId: 27436, hugoGeneSymbol: 'EML4', detail: 'SV' },
            ]);
        });

        it('puts cancer genes ahead of passengers', () => {
            const suggestions = genesAlteredInPatient(
                {
                    ...none,
                    mutations: [
                        { gene: gene(1, 'AAA_PASSENGER') },
                        { gene: gene(7157, 'TP53') },
                    ],
                },
                new Set([7157])
            );
            assert.deepEqual(
                suggestions.map(s => s.hugoGeneSymbol),
                ['TP53', 'AAA_PASSENGER']
            );
        });

        it('leaves out germline mutations and shallow copy-number changes', () => {
            const suggestions = genesAlteredInPatient(
                {
                    mutations: [
                        {
                            gene: gene(672, 'BRCA1'),
                            mutationStatus: 'Germline',
                        },
                    ],
                    cnas: [
                        { gene: gene(4609, 'MYC'), alteration: 1 },
                        { gene: gene(1029, 'CDKN2A'), alteration: -2 },
                    ],
                    structuralVariants: [],
                },
                new Set()
            );
            assert.deepEqual(suggestions, [
                { entrezGeneId: 1029, hugoGeneSymbol: 'CDKN2A', detail: 'Del' },
            ]);
        });

        it('caps the list', () => {
            const mutations = Array.from({ length: 25 }, (_, i) => ({
                gene: gene(i + 1, `G${String(i).padStart(2, '0')}`),
            }));
            assert.lengthOf(
                genesAlteredInPatient({ ...none, mutations }, new Set()),
                10
            );
        });
    });
});
