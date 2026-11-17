import {
    compareSamplesForNavigation,
    fmtFileSize,
    formatDaysSinceDiagnosis,
    formatDaysSinceDiagnosisShort,
} from './wsiNavUtils';
import { makeSample } from './wsiTestFixtures';

describe('wsiNavUtils', () => {
    describe('fmtFileSize', () => {
        it('shows MB below 1 GB and GB from there up', () => {
            expect(fmtFileSize(26.2 * 1024 * 1024)).toBe('26.2 MB');
            expect(fmtFileSize(1407 * 1024 * 1024)).toBe('1.4 GB');
            expect(fmtFileSize(null)).toBe('—');
        });
    });

    describe('formatDaysSinceDiagnosis', () => {
        it('writes days in d-notation', () => {
            expect(formatDaysSinceDiagnosis(0)).toBe('d0');
            expect(formatDaysSinceDiagnosis(7)).toBe('d+7');
            expect(formatDaysSinceDiagnosis(-242)).toBe('d-242');
        });
    });

    describe('formatDaysSinceDiagnosisShort', () => {
        it('keeps d-notation within a year and uses years past it', () => {
            expect(formatDaysSinceDiagnosisShort(0)).toBe('d0');
            expect(formatDaysSinceDiagnosisShort(364)).toBe('d+364');
            expect(formatDaysSinceDiagnosisShort(-364)).toBe('d-364');
            expect(formatDaysSinceDiagnosisShort(365)).toBe('+1y');
            expect(formatDaysSinceDiagnosisShort(1096)).toBe('+3y');
            expect(formatDaysSinceDiagnosisShort(-2393)).toBe('-6.6y');
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
                makeSample('S-2'),
                makeSample('UNMATCHED'),
                makeSample('S-10'),
                makeSample('S-1'),
            ];

            expect(
                [...samples]
                    .sort(compareSamplesForNavigation)
                    .map(sample => sample.sample_id)
            ).toEqual(['S-2', 'S-10', 'S-1', 'UNMATCHED']);
        });
    });
});
