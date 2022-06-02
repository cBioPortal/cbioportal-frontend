import {
    AndSearchClause,
    Phrase,
    NotSearchClause,
} from 'shared/components/query/SearchClause';

function createTestPhrase(): Phrase {
    return { fields: ['studyId'], phrase: 'a', textRepresentation: 'a' };
}

describe('ISearchClause', () => {
    describe('AndSearchClause', () => {
        it('should equal when empty phrases', () => {
            const a = new AndSearchClause([]);
            const b = new AndSearchClause([]);
            expect(a.equals(b)).toEqual(true);
        });

        it('should not equal when different phrases', () => {
            const a = new AndSearchClause([createTestPhrase()]);
            const b = new AndSearchClause([]);
            expect(a.equals(b)).toEqual(false);
        });

        it('should equal when same phrases', () => {
            const a = new AndSearchClause([createTestPhrase()]);
            const b = new AndSearchClause([
                { phrase: 'a', fields: ['studyId'], textRepresentation: 'a' },
            ]);
            expect(a.equals(b)).toEqual(true);
        });

        it('returns true when calling contains() with contained phrase', () => {
            const a = new AndSearchClause([createTestPhrase()]);
            expect(
                a.contains({
                    phrase: 'a',
                    textRepresentation: 'a',
                    fields: ['studyId'],
                })
            ).toEqual(true);
        });

        it('returns false when calling contains() with non contained phrase', () => {
            const a = new AndSearchClause([createTestPhrase()]);
            expect(
                a.contains({
                    phrase: 'b',
                    textRepresentation: 'a',
                    fields: ['studyId'],
                })
            ).toEqual(true);
        });

        it('returns false when calling contains() with faulty textRepresentation', () => {
            const a = new AndSearchClause([createTestPhrase()]);
            expect(
                a.contains({
                    phrase: 'a',
                    textRepresentation: 'faulty',
                    fields: ['studyId'],
                })
            ).toEqual(true);
        });

        it('returns textRepresentation when calling toString', () => {
            const a = new AndSearchClause([createTestPhrase()]);
            expect(a.toString()).toEqual('a');
        });

        it('returns empty string when calling toString with no phrases', () => {
            const a = new AndSearchClause([createTestPhrase()]);
            (a as any).phrases = [];
            expect(a.toString()).toEqual('');
        });
    });

    describe('NotSearchClause', () => {
        it('should equal when same phrases', () => {
            const a = new NotSearchClause(createTestPhrase());
            const b = new NotSearchClause(createTestPhrase());
            expect(a.equals(b)).toEqual(true);
        });

        it('should not equal when different phrases', () => {
            const a = new NotSearchClause(createTestPhrase());
            const b = new NotSearchClause({
                fields: ['studyId'],
                phrase: 'different',
                textRepresentation: 'a',
            });
            expect(a.equals(b)).toEqual(false);
        });

        it('returns true when calling contains() with contained phrase', () => {
            const a = new NotSearchClause(createTestPhrase());
            expect(
                a.contains({
                    phrase: 'a',
                    textRepresentation: 'a',
                    fields: ['studyId'],
                })
            ).toEqual(true);
        });

        it('returns false when calling contains() with non contained phrase', () => {
            const a = new NotSearchClause(createTestPhrase());
            expect(
                a.contains({
                    phrase: 'b',
                    textRepresentation: 'a',
                    fields: ['studyId'],
                })
            ).toEqual(false);
        });

        it('returns false when calling contains() with faulty textRepresentation', () => {
            const a = new NotSearchClause(createTestPhrase());
            expect(
                a.contains({
                    phrase: 'a',
                    textRepresentation: 'faulty',
                    fields: ['studyId'],
                })
            ).toEqual(false);
        });

        it('returns negative textRepresentation when calling toString', () => {
            const a = new NotSearchClause(createTestPhrase());
            expect(a.toString()).toEqual('- a');
        });

        it('returns empty string when calling toString with empty phrase', () => {
            const a = new NotSearchClause(createTestPhrase());
            (a as any).phrase = null;
            expect(a.toString()).toEqual('');
        });
    });
});
