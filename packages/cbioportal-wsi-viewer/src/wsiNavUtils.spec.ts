import { compareSamplesForNavigation } from './wsiNavUtils';
import { Sample } from './wsiViewerTypes';

function makeSample(overrides: Partial<Sample> = {}): Sample {
    return {
        sample_id: 'S-1',
        cancer_type: '',
        cancer_type_detailed: '',
        oncotree_code: '',
        primary_site: '',
        sample_type: '',
        parts: [],
        ...overrides,
    };
}

describe('wsiNavUtils', () => {
    describe('compareSamplesForNavigation', () => {
        it('places unmatched slides after matched samples', () => {
            const unmatched = makeSample({ sample_id: 'UNMATCHED' });
            const matched = makeSample({ sample_id: 'S-1' });

            expect(
                compareSamplesForNavigation(unmatched, matched)
            ).toBeGreaterThan(0);
            expect(
                compareSamplesForNavigation(matched, unmatched)
            ).toBeLessThan(0);
        });

        it('keeps the hierarchy order of matched samples', () => {
            const samples = [
                makeSample({ sample_id: 'S-2', sample_type: 'Primary' }),
                makeSample({ sample_id: 'UNMATCHED' }),
                makeSample({ sample_id: 'S-10', sample_type: 'Metastasis' }),
                makeSample({ sample_id: 'S-1', sample_type: 'Primary' }),
            ];

            expect(
                [...samples]
                    .sort(compareSamplesForNavigation)
                    .map(sample => sample.sample_id)
            ).toEqual(['S-2', 'S-10', 'S-1', 'UNMATCHED']);
        });
    });
});
