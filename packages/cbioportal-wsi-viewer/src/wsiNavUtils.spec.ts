import { compareSamplesForNavigation, fmtFileSize } from './wsiNavUtils';
import { makeSample } from './wsiTestFixtures';

describe('wsiNavUtils', () => {
    describe('fmtFileSize', () => {
        it('shows MB below 1 GB and GB from there up', () => {
            expect(fmtFileSize(26.2 * 1024 * 1024)).toBe('26.2 MB');
            expect(fmtFileSize(1407 * 1024 * 1024)).toBe('1.4 GB');
            expect(fmtFileSize(null)).toBe('—');
        });
    });

    describe('compareSamplesForNavigation', () => {
        it('places unmatched slides after matched samples', () => {
            const unmatched = makeSample('UNMATCHED');
            const matched = makeSample('S-1');

            expect(
                compareSamplesForNavigation(unmatched, matched)
            ).toBeGreaterThan(0);
            expect(
                compareSamplesForNavigation(matched, unmatched)
            ).toBeLessThan(0);
        });

        it('keeps the hierarchy order of matched samples', () => {
            const samples = [
                makeSample('S-2', [], { sample_type: 'Primary' }),
                makeSample('UNMATCHED'),
                makeSample('S-10', [], { sample_type: 'Metastasis' }),
                makeSample('S-1', [], { sample_type: 'Primary' }),
            ];

            expect(
                [...samples]
                    .sort(compareSamplesForNavigation)
                    .map(sample => sample.sample_id)
            ).toEqual(['S-2', 'S-10', 'S-1', 'UNMATCHED']);
        });
    });
});
