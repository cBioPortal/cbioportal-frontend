import {
    addClause,
    defaultNodeFields,
    performSearchSingle,
    removeClause,
    toQueryString,
} from 'shared/lib/query/textQueryUtils';
import { CancerTreeNode } from 'shared/components/query/CancerStudyTreeData';
import {
    AndSearchClause,
    ISearchClause,
    NotSearchClause,
} from 'shared/components/query/SearchClause';
import _ from 'lodash';
import { QueryParser } from 'shared/lib/query/QueryParser';

describe('QueryParser', () => {
    const parser = new QueryParser();
    const referenceGenomeFields = parser.searchFilters.find(
        f => f.phrasePrefix === 'reference-genome'
    )!.nodeFields;

    describe('parseSearchQuery', () => {
        it('creates clause from search query string', () => {
            const query = 'part1';
            const expected: ISearchClause[] = [
                new AndSearchClause([
                    {
                        textRepresentation: query,
                        phrase: 'part1',
                        fields: defaultNodeFields,
                    },
                ]),
            ];
            const result = parser.parseSearchQuery(query);
            expect(result).toEqual(expected);
        });

        it('creates separate clauses from search query string with OR', () => {
            const expected: ISearchClause[] = [
                new AndSearchClause([
                    {
                        textRepresentation: 'part1',
                        phrase: 'part1',
                        fields: defaultNodeFields,
                    },
                ]),
                new AndSearchClause([
                    {
                        textRepresentation: 'part2',
                        phrase: 'part2',
                        fields: defaultNodeFields,
                    },
                ]),
            ];
            const result = parser.parseSearchQuery('part1 or part2');
            expect(result).toEqual(expected);
        });

        it('converts dash to negative clause', () => {
            const query = '- part2';
            const expected: ISearchClause[] = [
                new NotSearchClause({
                    phrase: 'part2',
                    fields: defaultNodeFields,
                    textRepresentation: 'part2',
                }),
            ];
            const result = parser.parseSearchQuery(query);
            expect(result).toEqual(expected);
        });

        it('only uses first phrase after dash in negative clause', () => {
            const query = '- part2 part3';
            const expected: ISearchClause[] = [
                new NotSearchClause({
                    phrase: 'part2',
                    fields: defaultNodeFields,
                    textRepresentation: 'part2',
                }),
                new AndSearchClause([
                    {
                        textRepresentation: 'part3',
                        phrase: 'part3',
                        fields: defaultNodeFields,
                    },
                ]),
            ];
            const result = parser.parseSearchQuery(query);
            expect(result).toEqual(expected);
        });

        it('creates single negative phrase when enclosed with quotes', () => {
            const query = '- "part2a part2b"';
            const expected: ISearchClause[] = [
                new NotSearchClause({
                    phrase: 'part2a part2b',
                    fields: defaultNodeFields,
                    textRepresentation: '"part2a part2b"',
                }),
            ];
            const result = parser.parseSearchQuery(query);
            expect(result).toEqual(expected);
        });

        it('bundles all consecutive positive phrases in single conjunctive clause', () => {
            let query = 'part1 part2 part3';
            const expected: ISearchClause[] = [
                new AndSearchClause([
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
                ]),
            ];
            const result = parser.parseSearchQuery(query);
            expect(result).toEqual(expected);
        });

        it('creates reference genome clause', () => {
            let query = 'reference-genome:hg42';
            const expected: ISearchClause[] = [
                new AndSearchClause([
                    {
                        textRepresentation: query,
                        phrase: 'hg42',
                        fields: referenceGenomeFields,
                    },
                ]),
            ];
            const result = parser.parseSearchQuery(query);
            expect(result).toEqual(expected);
        });

        it('handles mix of conjunctive, negative and reference genome clauses', () => {
            const expected: ISearchClause[] = [
                new AndSearchClause([
                    {
                        textRepresentation: 'part1',
                        phrase: 'part1',
                        fields: defaultNodeFields,
                    },
                    {
                        phrase: 'hg2000',
                        fields: referenceGenomeFields,
                        textRepresentation: 'reference-genome:hg2000',
                    },
                ]),
                new NotSearchClause({
                    phrase: 'part4',
                    fields: defaultNodeFields,
                    textRepresentation: 'part4',
                }),
                new AndSearchClause([
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
                ]),
            ];
            const result = parser.parseSearchQuery(
                'part1 reference-genome:hg2000 - part4 "part5a part5b" part6'
            );
            expect(result).toEqual(expected);
        });
    });
});
