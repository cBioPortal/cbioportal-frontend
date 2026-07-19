import { sortClinicalDataRows } from './ClinicalDataTab';

describe('sortClinicalDataRows', () => {
    const rows = [
        { sampleId: 'S-1', WSI_SLIDE_COUNT: '2' },
        { sampleId: 'S-2', WSI_SLIDE_COUNT: '33' },
        { sampleId: 'S-3' },
        { sampleId: 'S-4', WSI_SLIDE_COUNT: '9' },
    ];

    it('sorts numeric clinical values descending with missing values last', () => {
        expect(
            sortClinicalDataRows(rows, 'WSI_SLIDE_COUNT', 'desc').map(
                row => row.sampleId
            )
        ).toEqual(['S-2', 'S-4', 'S-1', 'S-3']);
    });

    it('sorts numeric clinical values ascending with missing values last', () => {
        expect(
            sortClinicalDataRows(rows, 'WSI_SLIDE_COUNT', 'asc').map(
                row => row.sampleId
            )
        ).toEqual(['S-1', 'S-4', 'S-2', 'S-3']);
    });
});
