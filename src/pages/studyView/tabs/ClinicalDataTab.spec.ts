import {
    getClinicalDataLastPage,
    getClinicalDataPageRange,
} from './ClinicalDataTab';

describe('Clinical Data pagination', () => {
    it('calculates the final page beyond the old 500-row limit', () => {
        expect(getClinicalDataLastPage(501, 20)).toBe(25);
        expect(getClinicalDataLastPage(500, 20)).toBe(24);
        expect(getClinicalDataLastPage(0, 20)).toBe(0);
    });

    it('calculates the displayed range for full and partial pages', () => {
        expect(getClinicalDataPageRange(0, 20, 501, 20)).toEqual({
            first: 1,
            last: 20,
        });
        expect(getClinicalDataPageRange(25, 20, 501, 1)).toEqual({
            first: 501,
            last: 501,
        });
        expect(getClinicalDataPageRange(0, 20, 0, 0)).toEqual({
            first: 0,
            last: 0,
        });
    });
});
