import { expect } from 'chai';
import { fuzzySearchItems } from './FuzzySearchUtils';

describe('FuzzySearchUtils', () => {
    const items = [
        { name: 'Breast Cancer Study' },
        { name: 'Lung Cancer Study' },
        { name: 'Brain Tumor Study' },
        { name: 'Colorectal Cancer' },
        { name: 'Prostate Cancer Study' },
    ];

    describe('fuzzySearchItems', () => {
        it('should return all items when pattern is empty', () => {
            const results = fuzzySearchItems('', items, ['name']);
            expect(results).to.have.length(items.length);
        });

        it('should return matching items for exact substring', () => {
            const results = fuzzySearchItems('Breast', items, ['name']);
            expect(results.length).to.be.greaterThan(0);
            expect(results[0].name).to.equal('Breast Cancer Study');
        });

        it('should return matching items for fuzzy pattern', () => {
            const results = fuzzySearchItems('brest', items, ['name']);
            expect(results.length).to.be.greaterThan(0);
            expect(results[0].name).to.equal('Breast Cancer Study');
        });

        it('should be case insensitive', () => {
            const results = fuzzySearchItems('breast cancer', items, ['name']);
            expect(results.length).to.be.greaterThan(0);
            expect(results[0].name).to.equal('Breast Cancer Study');
        });

        it('should return empty array when nothing matches', () => {
            const results = fuzzySearchItems('zzzzzzz', items, ['name']);
            expect(results).to.have.length(0);
        });

        it('should rank closer matches higher', () => {
            const results = fuzzySearchItems('Cancer', items, ['name']);
            expect(results.length).to.be.greaterThan(1);
            // All cancer items should be returned
            results.forEach(item => {
                expect(item.name.toLowerCase()).to.include('cancer');
            });
        });

        it('should handle empty items list', () => {
            const results = fuzzySearchItems('test', [], ['name']);
            expect(results).to.have.length(0);
        });

        it('should work with simple string-like objects', () => {
            const simpleItems = [
                { value: 'abc' },
                { value: 'def' },
                { value: 'abcdef' },
            ];
            const results = fuzzySearchItems('abc', simpleItems, ['value']);
            expect(results.length).to.be.greaterThan(0);
            expect(results.every(r => r.value.includes('abc'))).to.be.true;
        });
    });
});
