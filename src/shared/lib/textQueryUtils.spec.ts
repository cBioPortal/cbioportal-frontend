import {
    defaultSearchFields,
    parseSearchQuery,
    performSearchSingle,
    phrasesToSearchFields,
    SearchClause,
    SearchClauseType
} from "shared/lib/textQueryUtils";
import {CancerTreeNode, NodeMetadata} from "shared/components/query/CancerStudyTreeData";

describe('textQueryUtils', () => {
    describe('parseSearchQuery', () => {

        it('creates clause from search query string', () => {
            const expected: SearchClause[] = [
                {type: SearchClauseType.AND, data: [{phrase: 'part1', fields: defaultSearchFields}]}
            ];
            const result = parseSearchQuery('part1');
            expect(result).toEqual(expected);
        });

        it('converts dash to negative clause', () => {
            const expected: SearchClause[] = [
                {type: SearchClauseType.NOT, data: 'part2', fields: defaultSearchFields}
            ];
            const result = parseSearchQuery('- part2');
            expect(result).toEqual(expected);
        });

        it('only uses first phrase after dash in negative clause', () => {
            const expected: SearchClause[] = [
                {type: SearchClauseType.NOT, data: 'part2', fields: defaultSearchFields},
                {type: SearchClauseType.AND, data: [{phrase: 'part3', fields: defaultSearchFields}]}
            ];
            const result = parseSearchQuery('- part2 part3');
            expect(result).toEqual(expected);
        });

        it('creates single negative phrase when enclosed with quotes', () => {
            const expected: SearchClause[] = [
                {type: SearchClauseType.NOT, data: 'part2a part2b', fields: defaultSearchFields},
            ];
            const result = parseSearchQuery('- "part2a part2b"');
            expect(result).toEqual(expected);
        });

        it('bundles all consecutive positive phrases in single conjunctive clause', () => {
            const expected: SearchClause[] = [
                {type: SearchClauseType.AND, data: [
                    {phrase: 'part1', fields: defaultSearchFields},
                    {phrase: 'part2', fields: defaultSearchFields},
                    {phrase: 'part3', fields: defaultSearchFields}
                ]}
            ];
            const result = parseSearchQuery('part1 part2 part3');
            expect(result).toEqual(expected);
        });

        it('creates reference genome clause', () => {
            const expected: SearchClause[] = [
                {type: SearchClauseType.AND, data: [{phrase: 'hg42', fields: phrasesToSearchFields['reference-genome']}]}
            ];
            const result = parseSearchQuery('reference-genome:hg42');
            expect(result).toEqual(expected);
        });

        it('handles mix of conjunctive, negative and reference genome clauses', () => {
            const expected: SearchClause[] = [
                {type: SearchClauseType.AND, data: [
                        {phrase: 'part1', fields: defaultSearchFields},
                        {phrase: 'hg2000', fields: phrasesToSearchFields['reference-genome']},
                ]},
                {type: SearchClauseType.NOT, data: 'part4', fields: defaultSearchFields},
                {type: SearchClauseType.AND, data: [
                        {phrase: 'part5a part5b', fields: defaultSearchFields},
                        {phrase: 'part6', fields: defaultSearchFields},
                ]},
            ];
            const result = parseSearchQuery('part1 reference-genome:hg2000 - part4 "part5a part5b" part6');
            expect(result).toEqual(expected);
        });
    });

    describe('performSearchSingle', () => {

        it('matches searchTerms by single conjunctive clause', () => {
            const expected = {match: true, forced: false};
            const clauses: SearchClause[] = [
                {type: SearchClauseType.AND, data: [{phrase: 'match', fields: defaultSearchFields}]}
            ];
            const studyNode = {name: 'match'} as CancerTreeNode;
            const result = performSearchSingle(clauses, studyNode);
            expect(result).toEqual(expected);
        });

        it('matches searchTerms by single negative clause', () => {
            const expected = {match: true, forced: false};
            const clauses: SearchClause[] = [
                {type: SearchClauseType.NOT, data: 'no-match', fields: defaultSearchFields}
            ];
            const studyNode = {name: 'match'} as CancerTreeNode;
            const result = performSearchSingle(clauses, studyNode);
            expect(result).toEqual(expected);
        });

        it('does not match searchTerms by conjunctive clause', () => {
            const expected = {match: false, forced: false};
            const clauses: SearchClause[] = [
                {type: SearchClauseType.AND, data: [{phrase: 'no-match', fields: defaultSearchFields}]}
            ];
            const studyNode = {description: 'foo match bar'} as CancerTreeNode;
            const result = performSearchSingle(clauses, studyNode);
            expect(result).toEqual(expected);
        });

        it('does not match searchTerms by negative clause (forced)', () => {
            const expected = {match: false, forced: true};
            const clauses: SearchClause[] = [
                {type: SearchClauseType.NOT, data: 'match', fields: defaultSearchFields}
            ];
            const studyNode = {studyId: 'match'} as CancerTreeNode;
            const result = performSearchSingle(clauses, studyNode);
            expect(result).toEqual(expected);
        });

        it('matches referenceGenome by reference genome clause', () => {
            const expected = {match: true, forced: false};
            const clauses: SearchClause[] = [
                {type: SearchClauseType.AND, data: [
                    {phrase: 'hg2000', fields: phrasesToSearchFields['reference-genome']}
                ]}
            ];

            const studyNode = {referenceGenome: 'hg2000'} as CancerTreeNode;
            const result = performSearchSingle(clauses, studyNode);
            expect(result).toEqual(expected);
        });

        it('does not match referenceGenome by reference genome clause', () => {
            const expected = {match: false, forced: false};
            const clauses: SearchClause[] = [
                {type: SearchClauseType.AND, data: [
                        {phrase: 'hg2000', fields: phrasesToSearchFields['reference-genome']}
                ]}
            ];
            const studyNode = {referenceGenome: 'hg42'} as CancerTreeNode;
            const result = performSearchSingle(clauses, studyNode);
            expect(result).toEqual(expected);
        });

        it('matches with mix of negative, conjunctive and reference genome clauses', () => {
            const expected = {match: true, forced: false};
            const clauses: SearchClause[] = [
                {type: SearchClauseType.AND, data: [
                        {phrase: 'match1', fields: defaultSearchFields},
                        {phrase: 'hg2000', fields: phrasesToSearchFields['reference-genome']},
                ]},
                {type: SearchClauseType.NOT, data: 'no-match-4', fields: defaultSearchFields},
                {type: SearchClauseType.AND, data: [
                        {phrase: 'part5a part5b', fields: defaultSearchFields},
                        {phrase: 'part6', fields: defaultSearchFields},
                    ]},
            ];
            const studyNode = {
                name: 'match1',
                description: 'match5a match5b',
                studyId: 'match6',
                referenceGenome: 'hg2000'
            } as CancerTreeNode;
            const result = performSearchSingle(clauses, studyNode);
            expect(result).toEqual(expected);
        });

    });

});