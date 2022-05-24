import {parseSearchQuery, SearchClause, SearchClauseType} from "shared/lib/textQueryUtils";

describe('textQueryUtils', () => {
    describe('parseSearchQuery', () => {

        it('creates clause from search query string', () => {
            const expected: SearchClause[] = [
                {type: SearchClauseType.AND, data: ['part1'], field: 'searchTerms'}
            ];
            const result = parseSearchQuery('part1');
            expect(result).toEqual(expected);
        });

        it('converts dash to negative clause', () => {
            const expected: SearchClause[] = [
                {type: SearchClauseType.NOT, data: 'part2', field: 'searchTerms'}
            ];
            const result = parseSearchQuery('- part2');
            expect(result).toEqual(expected);
        });

        it('only uses first phrase after dash in negative clause', () => {
            const expected: SearchClause[] = [
                {type: SearchClauseType.NOT, data: 'part2', field: 'searchTerms'},
                {type: SearchClauseType.AND, data: ['part3'], field: 'searchTerms'}
            ];
            const result = parseSearchQuery('- part2 part3');
            expect(result).toEqual(expected);
        });

        it('creates single negative phrase when enclosed with quotes', () => {
            const expected: SearchClause[] = [
                {type: SearchClauseType.NOT, data: 'part2a part2b', field: 'searchTerms'}
            ];
            const result = parseSearchQuery('- "part2a part2b"');
            expect(result).toEqual(expected);
        });

        it('bundles all consecutive positive phrases in single conjunctive clause', () => {
            const expected: SearchClause[] = [
                {type: SearchClauseType.AND, data: ['part1', 'part2', 'part3'], field: 'searchTerms'}
            ];
            const result = parseSearchQuery('part1 part2 part3');
            expect(result).toEqual(expected);
        });
        it('handles multiple negative and conjunctive clauses', () => {
            const expected: SearchClause[] = [
                {type: SearchClauseType.AND, data: ['part1', 'part2'], field: 'searchTerms'},
                {type: SearchClauseType.NOT, data: 'part4', field: 'searchTerms'},
                {type: SearchClauseType.AND, data: ['part5'], field: 'searchTerms'}
            ];
            const result = parseSearchQuery('part1 part2 - part4 part5');
            expect(result).toEqual(expected);
        });
        it('creates reference genome clause', () => {
            const expected: SearchClause[] = [
                {type: SearchClauseType.REFERENCE_GENOME, data: 'hg42', field: 'referenceGenome'}
            ];
            const result = parseSearchQuery('reference-genome:hg42');
            expect(result).toEqual(expected);
        });
        it('handles mix of conjunctive, negative and reference genome clauses', () => {
            const expected: SearchClause[] = [
                {type: SearchClauseType.REFERENCE_GENOME, data: 'hg2000', field: 'referenceGenome'},
                {type: SearchClauseType.AND, data: ['part1'], field: 'searchTerms'},
                {type: SearchClauseType.NOT, data: 'part4', field: 'searchTerms'},
                {type: SearchClauseType.AND, data: ['part5a part5b', 'part6'], field: 'searchTerms'},
            ];
            const result = parseSearchQuery('part1 reference-genome:hg2000 - part4 "part5a part5b" part6');
            expect(result).toEqual(expected);
        });
    });

});