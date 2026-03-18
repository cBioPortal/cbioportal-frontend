import { expect } from 'chai';
import { fuzzyMatch, fuzzyMatchScore } from './FuzzySearchUtils';

describe('FuzzySearchUtils', () => {
    describe('fuzzyMatch', () => {
        it('should return true if pattern is empty', () => {
            expect(fuzzyMatch('', 'abc')).to.be.true;
            expect(fuzzyMatch('', '')).to.be.true;
        });

        it('should return false if text is empty and pattern is not', () => {
            expect(fuzzyMatch('a', '')).to.be.false;
        });

        it('should return true for exact matches', () => {
            expect(fuzzyMatch('abc', 'abc')).to.be.true;
        });

        it('should return true for simple fuzzy matches', () => {
            expect(fuzzyMatch('ac', 'abc')).to.be.true;
            expect(fuzzyMatch('a c', 'a big cat')).to.be.true;
        });

        it('should ignore casing operations', () => {
            expect(fuzzyMatch('AC', 'abc')).to.be.true;
            expect(fuzzyMatch('abc', 'ABC')).to.be.true;
            expect(fuzzyMatch('aB c', 'a biG Cat')).to.be.true;
        });

        it('should return false if pattern characters are out of order', () => {
            expect(fuzzyMatch('ca', 'abc')).to.be.false;
        });

        it('should return false if pattern characters are not in text', () => {
            expect(fuzzyMatch('d', 'abc')).to.be.false;
            expect(fuzzyMatch('abcd', 'abc')).to.be.false;
        });
    });

    describe('fuzzyMatchScore', () => {
        it('should return Infinity if it is not a fuzzy match', () => {
            expect(fuzzyMatchScore('d', 'abc')).to.equal(Infinity);
            expect(fuzzyMatchScore('ca', 'abc')).to.equal(Infinity);
        });

        it('should return 0 if pattern is empty', () => {
            expect(fuzzyMatchScore('', 'abc')).to.equal(0);
        });

        it('should return a lower score for exact matches than fuzzy matches', () => {
            const exactScore = fuzzyMatchScore('abc', 'abc');
            const fuzzyScore = fuzzyMatchScore('ac', 'abc');
            expect(exactScore).to.be.lessThan(fuzzyScore);
        });

        it('should return a lower score for matches closer to the beginning', () => {
            const score1 = fuzzyMatchScore('bc', 'abcd');
            const score2 = fuzzyMatchScore('bc', 'aabcd');
            expect(score1).to.be.lessThan(score2);
        });

        it('should handle case insensitivity correctly for scores', () => {
            expect(fuzzyMatchScore('abc', 'abc')).to.equal(
                fuzzyMatchScore('ABC', 'aBc')
            );
        });
    });
});
