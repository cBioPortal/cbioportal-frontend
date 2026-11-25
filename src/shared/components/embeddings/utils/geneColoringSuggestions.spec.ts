import { assert } from 'chai';
import {
    formatAlteredFraction,
    genesAlteredInPatient,
    mostFrequentlyAlteredGenes,
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

    describe('mostFrequentlyAlteredGenes', () => {
        const none = { mutations: [], cnas: [], structuralVariants: [] };
        const cna = (
            entrezGeneId: number,
            hugoGeneSymbol: string,
            alteration: number,
            altered: number
        ) => ({ ...row(entrezGeneId, hugoGeneSymbol, altered), alteration });

        it('ranks by cases, not by share of profiled cases', () => {
            const suggestions = mostFrequentlyAlteredGenes({
                ...none,
                mutations: [
                    row(1, 'RARE_PANEL', 3, 5),
                    row(7157, 'TP53', 380, 1000),
                    row(3845, 'KRAS', 140, 1000),
                ],
            });
            assert.deepEqual(
                suggestions.map(s => s.hugoGeneSymbol),
                ['TP53', 'KRAS', 'RARE_PANEL'],
                'a gene profiled in five cases must not outrank TP53'
            );
            assert.equal(suggestions[0].detail, 'Mut 38%');
            assert.equal(suggestions[2].detail, 'Mut 60%');
        });

        it('ranks copy-number and structural-variant genes with mutated ones', () => {
            const suggestions = mostFrequentlyAlteredGenes({
                mutations: [row(7157, 'TP53', 45)],
                cnas: [cna(1029, 'CDKN2A', -2, 12), cna(4609, 'MYC', 1, 30)],
                structuralVariants: [row(238, 'ALK', 5)],
            });
            assert.deepEqual(
                suggestions,
                [
                    {
                        entrezGeneId: 7157,
                        hugoGeneSymbol: 'TP53',
                        detail: 'Mut 45%',
                    },
                    {
                        entrezGeneId: 1029,
                        hugoGeneSymbol: 'CDKN2A',
                        detail: 'Del 12%',
                    },
                    {
                        entrezGeneId: 238,
                        hugoGeneSymbol: 'ALK',
                        detail: 'SV 5%',
                    },
                ],
                'a gain short of amplification is not suggested'
            );
        });

        it('notes up to two kinds per gene, largest first, without adding them', () => {
            const [erbb2] = mostFrequentlyAlteredGenes({
                mutations: [row(2064, 'ERBB2', 3)],
                cnas: [cna(2064, 'ERBB2', 2, 8)],
                structuralVariants: [row(2064, 'ERBB2', 1)],
            });
            assert.equal(erbb2.detail, 'Amp 8% · Mut 3%');
        });

        it('leaves out a kind that is a small fraction of the main one', () => {
            const [tp53] = mostFrequentlyAlteredGenes({
                mutations: [row(7157, 'TP53', 45)],
                cnas: [cna(7157, 'TP53', -2, 1)],
                structuralVariants: [],
            });
            assert.equal(tp53.detail, 'Mut 45%');
        });

        it('ranks a gene by its most frequent kind, not their sum', () => {
            const suggestions = mostFrequentlyAlteredGenes({
                mutations: [row(1, 'SPLIT', 6), row(2, 'SINGLE', 10)],
                cnas: [cna(1, 'SPLIT', 2, 6)],
                structuralVariants: [],
            });
            assert.deepEqual(
                suggestions.map(s => s.hugoGeneSymbol),
                ['SINGLE', 'SPLIT']
            );
        });

        it('keeps the top ones, breaking ties alphabetically', () => {
            const suggestions = mostFrequentlyAlteredGenes(
                {
                    ...none,
                    mutations: [row(2, 'B', 5), row(1, 'A', 5), row(3, 'C', 9)],
                },
                2
            );
            assert.deepEqual(
                suggestions.map(s => s.hugoGeneSymbol),
                ['C', 'A']
            );
        });

        it('leaves out genes with no altered cases', () => {
            assert.deepEqual(
                mostFrequentlyAlteredGenes({
                    ...none,
                    mutations: [row(1, 'A', 0)],
                }),
                []
            );
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
