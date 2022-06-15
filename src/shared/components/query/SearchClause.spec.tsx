import {
    AndSearchClause,
    Phrase,
    NotSearchClause,
    DefaultPhrase,
    ListPhrase,
} from 'shared/components/query/SearchClause';
import { CancerTreeNode } from 'shared/components/query/CancerStudyTreeData';

function createTestPhrase(): Phrase {
    return new DefaultPhrase('a', 'a', ['studyId']);
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
                new DefaultPhrase('a', 'a', ['studyId']),
            ]);
            expect(a.equals(b)).toEqual(true);
        });

        it('returns true when calling contains() with contained phrase', () => {
            const a = new AndSearchClause([createTestPhrase()]);
            expect(
                a.contains(new DefaultPhrase('a', 'a', ['studyId']))
            ).toEqual(true);
        });

        it('returns false when calling contains() with non contained phrase', () => {
            const a = new AndSearchClause([createTestPhrase()]);
            let b: Phrase = new DefaultPhrase('b', 'a', ['studyId']);
            expect(a.contains(b)).toEqual(false);
        });

        it('returns false when calling contains() with faulty textRepresentation', () => {
            const a = new AndSearchClause([createTestPhrase()]);
            expect(
                a.contains(new DefaultPhrase('a', 'faulty', ['studyId']))
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
            const b = new NotSearchClause(
                new DefaultPhrase('different', 'a', ['studyId'])
            );
            expect(a.equals(b)).toEqual(false);
        });

        it('returns true when calling contains() with contained phrase', () => {
            const a = new NotSearchClause(createTestPhrase());
            expect(
                a.contains(new DefaultPhrase('a', 'a', ['studyId']))
            ).toEqual(true);
        });

        it('returns false when calling contains() with non contained phrase', () => {
            const a = new NotSearchClause(createTestPhrase());
            expect(
                a.contains(new DefaultPhrase('b', 'a', ['studyId']))
            ).toEqual(false);
        });

        it('ignores textRepresentation when calling contains()', () => {
            const a = new NotSearchClause(createTestPhrase());
            expect(
                a.contains(new DefaultPhrase('a', 'faulty', ['studyId']))
            ).toEqual(true);
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

describe('Phrase', () => {
    describe('ListPhrase', () => {
        it('should match when single element in phraseList', () => {
            const phrase = new ListPhrase('a', 'test:a', ['studyId']);
            const study = { studyId: 'a' } as CancerTreeNode;
            expect(phrase.match(study)).toBe(true);
        });

        it('should not match when single element in phraseList does not match', () => {
            const phrase = new ListPhrase('a', 'test:a', ['studyId']);
            const study = { studyId: 'b' } as CancerTreeNode;
            expect(phrase.match(study)).toBe(false);
        });

        it('should do a full (instead of partial) match', () => {
            const phrase = new ListPhrase('a', 'test:a', ['studyId']);
            const study = { studyId: 'ab' } as CancerTreeNode;
            expect(phrase.match(study)).toBe(false);
        });

        it('should match when multiple elements in phraseList', () => {
            const phrase = new ListPhrase('a,b', 'test:a,b', ['studyId']);
            const study = { studyId: 'a' } as CancerTreeNode;
            expect(phrase.match(study)).toBe(true);
        });
    });
});
