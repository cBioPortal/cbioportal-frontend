import { DefaultPhrase, Phrase } from 'shared/components/query/SearchClause';
import { createUpdate } from 'shared/components/query/filteredSearch/field/CheckboxFilterField';
import { defaultNodeFields } from 'shared/lib/query/textQueryUtils';

describe('FilteredSearchDropdownForm', () => {
    describe('createUpdate', () => {
        const a = new DefaultPhrase('a', 'a', defaultNodeFields);
        const b = new DefaultPhrase('b', 'b', defaultNodeFields);
        const c = new DefaultPhrase('c', 'c', defaultNodeFields);
        const d = new DefaultPhrase('d', 'd', defaultNodeFields);
        const e = new DefaultPhrase('e', 'e', defaultNodeFields);

        it('creates shortest update with more Not than And', () => {
            const not = [a, b, c];
            const and = [d, e];
            const result = createUpdate(not, and);
            expect(result.toAdd?.length).toEqual(2);
            expect(result.toAdd?.map(c => c.isAnd())).toEqual([true, true]);
            expect(result.toRemove?.length).toEqual(3);
            expect(result.toRemove?.map(p => p.toString())).toEqual([
                'a',
                'b',
                'c',
            ]);
        });

        it('creates shortest update with more And than Not', () => {
            const and = [a, b, c];
            const not = [d, e];
            const result = createUpdate(not, and);
            expect(result.toAdd?.length).toEqual(2);
            expect(result.toAdd?.map(c => c.isNot())).toEqual([true, true]);
            expect(result.toRemove?.length).toEqual(3);
        });

        it('removes all update when only And', () => {
            const and = [a, b, c, d, e];
            const not: Phrase[] = [];
            const result = createUpdate(not, and);
            expect(result.toAdd?.length).toEqual(0);
            expect(result.toRemove?.length).toEqual(5);
        });

        it('creates only Not when no And', () => {
            const not = [a, b, c, d, e];
            const and: Phrase[] = [];
            const result = createUpdate(not, and);
            expect(result.toAdd?.length).toEqual(5);
            expect(result.toAdd?.map(c => c.isNot())).toEqual([
                true,
                true,
                true,
                true,
                true,
            ]);
            expect(result.toRemove?.length).toEqual(0);
        });
    });
});
