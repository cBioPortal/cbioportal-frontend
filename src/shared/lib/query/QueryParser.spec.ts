import {
    defaultNodeFields,
    toQueryString,
} from 'shared/lib/query/textQueryUtils';
import {
    AndSearchClause,
    ISearchClause,
    NotSearchClause,
} from 'shared/components/query/filteredSearch/SearchClause';
import { QueryParser } from 'shared/lib/query/QueryParser';
import { DefaultPhrase } from 'shared/components/query/filteredSearch/Phrase';

describe('QueryParser', () => {
    const parser = new QueryParser();
    const referenceGenomeFields = parser.searchFilters.find(
        f => f.phrasePrefix === 'reference-genome'
    )!.nodeFields;

    describe('parseSearchQuery', () => {
        const part1 = new DefaultPhrase('part1', 'part1', defaultNodeFields);
        const part2 = new DefaultPhrase('part2', 'part2', defaultNodeFields);
        const part3 = new DefaultPhrase('part3', 'part3', defaultNodeFields);
        const hg42 = new DefaultPhrase(
            'hg42',
            'reference-genome:hg42',
            referenceGenomeFields
        );

        it('creates clause from search query string', () => {
            const query = 'part1';
            const expected: ISearchClause[] = [new AndSearchClause([part1])];
            const result = parser.parseSearchQuery(query);
            expect(result).toEqual(expected);
        });

        it('creates separate clauses from search query string with OR', () => {
            const expected: ISearchClause[] = [
                new AndSearchClause([part1]),
                new AndSearchClause([part2]),
            ];
            const result = parser.parseSearchQuery('part1 or part2');
            expect(result).toEqual(expected);
        });

        it('converts dash to negative clause', () => {
            const query = '- part2';
            const expected: ISearchClause[] = [new NotSearchClause(part2)];
            const result = parser.parseSearchQuery(query);
            expect(result).toEqual(expected);
        });

        it('only uses first phrase after dash in negative clause', () => {
            const query = '- part2 part3';
            const expected: ISearchClause[] = [
                new NotSearchClause(part2),
                new AndSearchClause([part3]),
            ];
            const result = parser.parseSearchQuery(query);
            expect(result).toEqual(expected);
        });

        it('creates single negative phrase when enclosed with quotes', () => {
            const query = '- "part2a part2b"';
            const expected: ISearchClause[] = [
                new NotSearchClause(
                    new DefaultPhrase(
                        'part2a part2b',
                        '"part2a part2b"',
                        defaultNodeFields
                    )
                ),
            ];
            const result = parser.parseSearchQuery(query);
            expect(result).toEqual(expected);
        });

        it('bundles all consecutive positive phrases in single conjunctive clause', () => {
            let query = 'part1 part2 part3';
            const expected: ISearchClause[] = [
                new AndSearchClause([part1, part2, part3]),
            ];
            const result = parser.parseSearchQuery(query);
            expect(result).toEqual(expected);
        });

        it('creates reference genome clause', () => {
            let query = 'reference-genome:hg42';
            const expected: ISearchClause[] = [new AndSearchClause([hg42])];
            const result = parser.parseSearchQuery(query);
            expect(toQueryString(result)).toEqual(toQueryString(expected));
        });

        it('handles mix of conjunctive, negative and reference genome clauses', () => {
            const expectedQuery =
                'part1 reference-genome:hg42 - part4 "part5a part5b" part6';
            const expected: ISearchClause[] = [
                new AndSearchClause([part1, hg42]),
                new NotSearchClause(
                    new DefaultPhrase('part4', 'part4', defaultNodeFields)
                ),
                new AndSearchClause([
                    new DefaultPhrase(
                        'part5a part5b',
                        '"part5a part5b"',
                        defaultNodeFields
                    ),
                    new DefaultPhrase('part6', 'part6', defaultNodeFields),
                ]),
            ];
            const result = parser.parseSearchQuery(expectedQuery);
            expect(toQueryString(result)).toEqual(toQueryString(expected));
            expect(toQueryString(result)).toEqual(expectedQuery);
        });
    });
});
