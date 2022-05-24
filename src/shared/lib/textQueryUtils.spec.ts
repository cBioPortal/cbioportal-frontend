import {parseSearchQuery, performSearchSingle, SearchClause, SearchClauseType} from "shared/lib/textQueryUtils";
import {CancerTreeNode, NodeMetadata} from "shared/components/query/CancerStudyTreeData";

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

    describe('performSearchSingle', () => {

        it('matches searchTerms by single conjunctive clause', () => {
            const expected = {match: true, forced: false};
            const clauses: SearchClause[] = [
                {type: SearchClauseType.AND, data: ['match'], field: 'searchTerms'}
            ];
            const nodeMetaEntry: [CancerTreeNode, NodeMetadata] = [
                {referenceGenome: 'hg38'} as CancerTreeNode,
                {searchTerms: 'foo match bar'} as NodeMetadata
            ];
            const result = performSearchSingle(clauses, nodeMetaEntry);
            expect(result).toEqual(expected);
        });

        it('matches searchTerms by single negative clause', () => {
            const expected = {match: true, forced: false};
            const clauses: SearchClause[] = [
                {type: SearchClauseType.NOT, data: 'no-match', field: 'searchTerms'}
            ];
            const nodeMetaEntry: [CancerTreeNode, NodeMetadata] = [
                {referenceGenome: 'hg38'} as CancerTreeNode,
                {searchTerms: 'foo match bar'} as NodeMetadata
            ];
            const result = performSearchSingle(clauses, nodeMetaEntry);
            expect(result).toEqual(expected);
        });

        it('does not match searchTerms by conjunctive clause', () => {
            const expected = {match: false, forced: false};
            const clauses: SearchClause[] = [
                {type: SearchClauseType.AND, data: ['no-match'], field: 'searchTerms'}
            ];
            const nodeMetaEntry: [CancerTreeNode, NodeMetadata] = [
                {referenceGenome: 'hg38'} as CancerTreeNode,
                {searchTerms: 'foo match bar'} as NodeMetadata
            ];
            const result = performSearchSingle(clauses, nodeMetaEntry);
            expect(result).toEqual(expected);
        });

        it('does not match searchTerms by negative clause (forced)', () => {
            const expected = {match: false, forced: true};
            const clauses: SearchClause[] = [
                {type: SearchClauseType.NOT, data: 'match', field: 'searchTerms'}
            ];
            const nodeMetaEntry: [CancerTreeNode, NodeMetadata] = [
                {referenceGenome: 'hg38'} as CancerTreeNode,
                {searchTerms: 'foo match bar'} as NodeMetadata
            ];
            const result = performSearchSingle(clauses, nodeMetaEntry);
            expect(result).toEqual(expected);
        });

        it('matches referenceGenome by reference genome clause', () => {
            const expected = {match: true, forced: false};
            const clauses: SearchClause[] = [
                {type: SearchClauseType.REFERENCE_GENOME, data: 'hg2000', field: 'referenceGenome'},
            ];
            const nodeMetaEntry: [CancerTreeNode, NodeMetadata] = [
                {referenceGenome: 'hg2000'} as CancerTreeNode,
                {searchTerms: 'foo bar'} as NodeMetadata
            ];
            const result = performSearchSingle(clauses, nodeMetaEntry);
            expect(result).toEqual(expected);
        });

        it('does not match referenceGenome by reference genome clause', () => {
            const expected = {match: false, forced: false};
            const clauses: SearchClause[] = [
                {type: SearchClauseType.REFERENCE_GENOME, data: 'hg2000', field: 'referenceGenome'},
            ];
            const nodeMetaEntry: [CancerTreeNode, NodeMetadata] = [
                {referenceGenome: 'hg42'} as CancerTreeNode,
                {searchTerms: 'foo bar'} as NodeMetadata
            ];
            const result = performSearchSingle(clauses, nodeMetaEntry);
            expect(result).toEqual(expected);
        });

        it('matches with mix of negative, conjunctive and reference genome clauses', () => {
            const expected = {match: true, forced: false};
            const clauses: SearchClause[] = [
                {type: SearchClauseType.REFERENCE_GENOME, data: 'hg2000', field: 'referenceGenome'},
                {type: SearchClauseType.AND, data: ['match1'], field: 'searchTerms'},
                {type: SearchClauseType.NOT, data: 'match4', field: 'searchTerms'},
                {type: SearchClauseType.AND, data: ['match5a match5b', 'match6'], field: 'searchTerms'},
            ];
            const nodeMetaEntry: [CancerTreeNode, NodeMetadata] = [
                {referenceGenome: 'hg2000'} as CancerTreeNode,
                {searchTerms: 'foo bar match1 no-match-4 match5a match5b match6'} as NodeMetadata
            ];
            const result = performSearchSingle(clauses, nodeMetaEntry);
            expect(result).toEqual(expected);
        });

    });



});