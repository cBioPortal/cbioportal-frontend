import { Phrase } from 'shared/components/query/SearchClause';
import { createUpdate } from 'shared/components/query/filteredSearch/field/CheckboxFilterField';

describe('FilteredSearchDropdownForm', () => {
    describe('createUpdate', () => {
        const a = { phrase: 'a' } as Phrase;
        const b = { phrase: 'b' } as Phrase;
        const c = { phrase: 'c' } as Phrase;
        const d = { phrase: 'd' } as Phrase;
        const e = { phrase: 'e' } as Phrase;

        it('creates shortest update with more Not than And', () => {
            const not = [a, b, c];
            const and = [d, e];
            const result = createUpdate(not, and);
            expect(result.toAdd?.length).toEqual(2);
            expect(result.toAdd?.map(c => c.isAnd())).toEqual([true, true]);
            expect(result.toRemove?.length).toEqual(3);
            expect(result.toRemove?.map(p => p.phrase)).toEqual([
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
