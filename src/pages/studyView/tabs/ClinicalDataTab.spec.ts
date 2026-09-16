import {
    addPatientWsiSlideCounts,
    sortClinicalDataRows,
} from './ClinicalDataTab';

describe('addPatientWsiSlideCounts', () => {
    it('aggregates sample WSI counts per patient across sample rows', () => {
        const rows = addPatientWsiSlideCounts([
            {
                patientId: 'P-1',
                sampleId: 'S-1',
                WSI_SAMPLE_SLIDE_COUNT: '3',
                WSI_SAMPLE_PART_MATCHED_SLIDE_COUNT: '2',
                WSI_SAMPLE_BLOCK_MATCHED_SLIDE_COUNT: '1',
            },
            {
                patientId: 'P-1',
                sampleId: 'S-2',
                WSI_SAMPLE_SLIDE_COUNT: '4',
                WSI_SAMPLE_PART_MATCHED_SLIDE_COUNT: '1',
                WSI_SAMPLE_BLOCK_MATCHED_SLIDE_COUNT: '3',
            },
            {
                patientId: 'P-2',
                sampleId: 'S-3',
                WSI_SAMPLE_SLIDE_COUNT: '2',
            },
        ]);

        expect(rows).toEqual([
            expect.objectContaining({
                patientId: 'P-1',
                WSI_PATIENT_SLIDE_COUNT: '7',
                WSI_PATIENT_PART_MATCHED_SLIDE_COUNT: '3',
                WSI_PATIENT_BLOCK_MATCHED_SLIDE_COUNT: '4',
            }),
            expect.objectContaining({
                patientId: 'P-1',
                WSI_PATIENT_SLIDE_COUNT: '7',
                WSI_PATIENT_PART_MATCHED_SLIDE_COUNT: '3',
                WSI_PATIENT_BLOCK_MATCHED_SLIDE_COUNT: '4',
            }),
            expect.objectContaining({
                patientId: 'P-2',
                WSI_PATIENT_SLIDE_COUNT: '2',
            }),
        ]);
    });
});

describe('sortClinicalDataRows', () => {
    const rows = [
        { sampleId: 'S-1', WSI_PATIENT_SLIDE_COUNT: '2' },
        { sampleId: 'S-2', WSI_PATIENT_SLIDE_COUNT: '10' },
        { sampleId: 'S-3', WSI_PATIENT_SLIDE_COUNT: '' },
    ];

    it.each([
        ['asc', ['S-1', 'S-2', 'S-3']],
        ['desc', ['S-2', 'S-1', 'S-3']],
    ] as const)(
        'sorts the filtered rows %s and keeps missing values last',
        (direction, expectedSampleIds) => {
            expect(
                sortClinicalDataRows(
                    rows,
                    'WSI_PATIENT_SLIDE_COUNT',
                    direction
                ).map(row => row.sampleId)
            ).toEqual(expectedSampleIds);
        }
    );
});
