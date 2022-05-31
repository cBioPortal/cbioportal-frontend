import {
    parseSearchQuery,
    performSearchSingle,
    searchFilters,
    SearchClause,
    SearchClauseType,
    defaultNodeFields,
} from 'shared/lib/textQueryUtils';
import { CancerTreeNode } from 'shared/components/query/CancerStudyTreeData';

const referenceGenomeFields = searchFilters.find(
    f => f.phrasePrefix === 'reference-genome'
)!.nodeFields;

describe('textQueryUtils', () => {
    describe('parseSearchQuery', () => {
        it('creates clause from search query string', () => {
            const expected: SearchClause[] = [
                {
                    type: SearchClauseType.AND,
                    data: [
                        {
                            phrase: 'part1',
                            fields: defaultNodeFields,
                            textRepresentation: 'part1',
                        },
                    ],
                },
            ];
            const result = parseSearchQuery('part1');
            expect(result).toEqual(expected);
        });

        it('creates separate clauses from search query string with OR', () => {
            const expected: SearchClause[] = [
                {
                    type: SearchClauseType.AND,
                    data: [
                        {
                            phrase: 'part1',
                            fields: defaultNodeFields,
                            textRepresentation: 'part1',
                        },
                    ],
                },
                {
                    type: SearchClauseType.AND,
                    data: [
                        {
                            phrase: 'part2',
                            fields: defaultNodeFields,
                            textRepresentation: 'part2',
                        },
                    ],
                },
            ];
            const result = parseSearchQuery('part1 or part2');
            expect(result).toEqual(expected);
        });

        it('converts dash to negative clause', () => {
            const expected: SearchClause[] = [
                {
                    type: SearchClauseType.NOT,
                    data: 'part2',
                    fields: defaultNodeFields,
                    textRepresentation: '- part2',
                },
            ];
            const result = parseSearchQuery('- part2');
            expect(result).toEqual(expected);
        });

        it('only uses first phrase after dash in negative clause', () => {
            const expected: SearchClause[] = [
                {
                    type: SearchClauseType.NOT,
                    data: 'part2',
                    fields: defaultNodeFields,
                    textRepresentation: '- part2',
                },
                {
                    type: SearchClauseType.AND,
                    data: [
                        {
                            phrase: 'part3',
                            fields: defaultNodeFields,
                            textRepresentation: 'part3',
                        },
                    ],
                },
            ];
            const result = parseSearchQuery('- part2 part3');
            expect(result).toEqual(expected);
        });

        it('creates single negative phrase when enclosed with quotes', () => {
            const expected: SearchClause[] = [
                {
                    type: SearchClauseType.NOT,
                    data: 'part2a part2b',
                    fields: defaultNodeFields,
                    textRepresentation: '- "part2a part2b"',
                },
            ];
            const result = parseSearchQuery('- "part2a part2b"');
            expect(result).toEqual(expected);
        });

        it('bundles all consecutive positive phrases in single conjunctive clause', () => {
            const expected: SearchClause[] = [
                {
                    type: SearchClauseType.AND,
                    data: [
                        {
                            phrase: 'part1',
                            fields: defaultNodeFields,
                            textRepresentation: 'part1',
                        },
                        {
                            phrase: 'part2',
                            fields: defaultNodeFields,
                            textRepresentation: 'part2',
                        },
                        {
                            phrase: 'part3',
                            fields: defaultNodeFields,
                            textRepresentation: 'part3',
                        },
                    ],
                },
            ];
            const result = parseSearchQuery('part1 part2 part3');
            expect(result).toEqual(expected);
        });

        it('creates reference genome clause', () => {
            const expected: SearchClause[] = [
                {
                    type: SearchClauseType.AND,
                    data: [
                        {
                            phrase: 'hg42',
                            fields: referenceGenomeFields,
                            textRepresentation: 'reference-genome:hg42',
                        },
                    ],
                },
            ];
            const result = parseSearchQuery('reference-genome:hg42');
            expect(result).toEqual(expected);
        });

        it('handles mix of conjunctive, negative and reference genome clauses', () => {
            const expected: SearchClause[] = [
                {
                    type: SearchClauseType.AND,
                    data: [
                        {
                            phrase: 'part1',
                            fields: defaultNodeFields,
                            textRepresentation: 'part1',
                        },
                        {
                            phrase: 'hg2000',
                            fields: referenceGenomeFields,
                            textRepresentation: 'reference-genome:hg2000',
                        },
                    ],
                },
                {
                    type: SearchClauseType.NOT,
                    data: 'part4',
                    fields: defaultNodeFields,
                    textRepresentation: '- part4',
                },
                {
                    type: SearchClauseType.AND,
                    data: [
                        {
                            phrase: 'part5a part5b',
                            fields: defaultNodeFields,
                            textRepresentation: '"part5a part5b"',
                        },
                        {
                            phrase: 'part6',
                            fields: defaultNodeFields,
                            textRepresentation: 'part6',
                        },
                    ],
                },
            ];
            const result = parseSearchQuery(
                'part1 reference-genome:hg2000 - part4 "part5a part5b" part6'
            );
            expect(result).toEqual(expected);
        });
    });

    describe('performSearchSingle', () => {
        it('matches study by single conjunctive clause', () => {
            const expected = { match: true, forced: false };
            const clauses: SearchClause[] = [
                {
                    type: SearchClauseType.AND,
                    data: [
                        {
                            phrase: 'match',
                            fields: defaultNodeFields,
                            textRepresentation: 'match',
                        },
                    ],
                },
            ];
            const studyNode = { name: 'match' } as CancerTreeNode;
            const result = performSearchSingle(clauses, studyNode);
            expect(result).toEqual(expected);
        });

        it('matches study by single negative clause', () => {
            const expected = { match: true, forced: false };
            const clauses: SearchClause[] = [
                {
                    type: SearchClauseType.NOT,
                    data: 'no-match',
                    fields: defaultNodeFields,
                    textRepresentation: '- no-match',
                },
            ];
            const studyNode = { name: 'match' } as CancerTreeNode;
            const result = performSearchSingle(clauses, studyNode);
            expect(result).toEqual(expected);
        });

        it('does not match study when conjunctive clause does not match', () => {
            const expected = { match: false, forced: false };
            const clauses: SearchClause[] = [
                {
                    type: SearchClauseType.AND,
                    data: [
                        {
                            phrase: 'no-match',
                            fields: defaultNodeFields,
                            textRepresentation: 'no-match',
                        },
                    ],
                },
            ];
            const studyNode = {
                description: 'foo match bar',
            } as CancerTreeNode;
            const result = performSearchSingle(clauses, studyNode);
            expect(result).toEqual(expected);
        });

        it('does not match study when negative clause matches (forced match)', () => {
            const expected = { match: false, forced: true };
            const clauses: SearchClause[] = [
                {
                    type: SearchClauseType.NOT,
                    data: 'match',
                    fields: defaultNodeFields,
                    textRepresentation: '- match',
                },
            ];
            const studyNode = { studyId: 'match' } as CancerTreeNode;
            const result = performSearchSingle(clauses, studyNode);
            expect(result).toEqual(expected);
        });

        it('matches study by reference genome clause', () => {
            const expected = { match: true, forced: false };
            const clauses: SearchClause[] = [
                {
                    type: SearchClauseType.AND,
                    data: [
                        {
                            phrase: 'hg2000',
                            fields: referenceGenomeFields,
                            textRepresentation: 'reference-genome:hg2000',
                        },
                    ],
                },
            ];

            const studyNode = { referenceGenome: 'hg2000' } as CancerTreeNode;
            const result = performSearchSingle(clauses, studyNode);
            expect(result).toEqual(expected);
        });

        it('does not match study when reference genome clause differs', () => {
            const expected = { match: false, forced: false };
            const clauses: SearchClause[] = [
                {
                    type: SearchClauseType.AND,
                    data: [
                        {
                            phrase: 'hg2000',
                            fields: referenceGenomeFields,
                            textRepresentation: 'reference-genome:hg2000',
                        },
                    ],
                },
            ];
            const studyNode = { referenceGenome: 'hg42' } as CancerTreeNode;
            const result = performSearchSingle(clauses, studyNode);
            expect(result).toEqual(expected);
        });

        it('does not match study when negative reference-genome clause matches (forced match)', () => {
            const expected = { match: false, forced: true };
            const clauses: SearchClause[] = [
                {
                    type: SearchClauseType.NOT,
                    data: 'hg2000',
                    fields: referenceGenomeFields,
                    textRepresentation: '- reference-genome:hg2000',
                },
            ];
            const studyNode = { referenceGenome: 'hg2000' } as CancerTreeNode;
            const result = performSearchSingle(clauses, studyNode);
            expect(result).toEqual(expected);
        });

        it('matches with mix of negative, conjunctive and reference genome clauses', () => {
            const expected = { match: true, forced: false };
            const clauses: SearchClause[] = [
                {
                    type: SearchClauseType.AND,
                    data: [
                        {
                            phrase: 'match1',
                            fields: defaultNodeFields,
                            textRepresentation: 'match1',
                        },
                        {
                            phrase: 'hg2000',
                            fields: referenceGenomeFields,
                            textRepresentation: 'reference-genome:hg2000',
                        },
                    ],
                },
                {
                    type: SearchClauseType.NOT,
                    data: 'no-match-4',
                    fields: defaultNodeFields,
                    textRepresentation: '- no-match-4',
                },
                {
                    type: SearchClauseType.AND,
                    data: [
                        {
                            phrase: 'part5a part5b',
                            fields: defaultNodeFields,
                            textRepresentation: '"part5a part5b"',
                        },
                        {
                            phrase: 'part6',
                            fields: defaultNodeFields,
                            textRepresentation: 'part6',
                        },
                    ],
                },
            ];
            const studyNode = {
                name: 'match1',
                description: 'match5a match5b',
                studyId: 'match6',
                referenceGenome: 'hg2000',
            } as CancerTreeNode;
            const result = performSearchSingle(clauses, studyNode);
            expect(result).toEqual(expected);
        });
    });
});
