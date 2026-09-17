import {
    addPatientWsiSlideCounts,
    fetchClinicalDataForStudyViewClinicalDataTab,
} from './ClinicalDataTab';
import * as studyViewUtils from '../StudyViewUtils';
import { Sample, StudyViewFilter } from 'cbioportal-ts-api-client';

describe('clinical data pagination', () => {
    afterEach(() => jest.restoreAllMocks());

    it('requests a globally sorted page beyond row 500 with filters and search intact', async () => {
        const filters = { studyIds: ['coad_msk_2025'] } as StudyViewFilter;
        const fetch = jest
            .spyOn(studyViewUtils, 'getAllClinicalDataByStudyViewFilter')
            .mockResolvedValue({
                totalItems: 2814,
                // The server returns an object, whose order is not the sort order.
                data: {
                    S502: [
                        {
                            clinicalAttributeId: 'WSI_PATIENT_SLIDE_COUNT',
                            value: '9',
                        },
                    ],
                    S501: [
                        {
                            clinicalAttributeId: 'WSI_PATIENT_SLIDE_COUNT',
                            value: '100',
                        },
                    ],
                },
            } as any);
        const samples = {
            S501: {
                studyId: 'coad_msk_2025',
                patientId: 'P1',
                sampleId: 'S501',
            } as Sample,
            S502: {
                studyId: 'coad_msk_2025',
                patientId: 'P2',
                sampleId: 'S502',
            } as Sample,
        };

        const result = await fetchClinicalDataForStudyViewClinicalDataTab(
            filters,
            samples,
            'Colon',
            'WSI_PATIENT_SLIDE_COUNT',
            'desc',
            20,
            25
        );

        expect(fetch).toHaveBeenCalledWith(
            filters,
            'Colon',
            'WSI_PATIENT_SLIDE_COUNT',
            'desc',
            20,
            25
        );
        expect(result.totalItems).toBe(2814);
        expect(result.data.map(row => row.sampleId)).toEqual(['S501', 'S502']);
        expect(result.data.map(row => row.WSI_PATIENT_SLIDE_COUNT)).toEqual([
            '100',
            '9',
        ]);
    });

    it('uses stable sample sorting and preserves an empty filtered result', async () => {
        const fetch = jest
            .spyOn(studyViewUtils, 'getAllClinicalDataByStudyViewFilter')
            .mockResolvedValue({ totalItems: 0, data: {} });
        const filters = { studyIds: ['mskimpact'] } as StudyViewFilter;
        const result = await fetchClinicalDataForStudyViewClinicalDataTab(
            filters,
            {},
            'no-match',
            undefined,
            undefined,
            50
        );
        expect(fetch).toHaveBeenCalledWith(
            filters,
            'no-match',
            'sampleId',
            'asc',
            50,
            0
        );
        expect(result).toEqual({ totalItems: 0, data: [] });
    });
});

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

    it('preserves importer-provided patient totals when only one sample is loaded', () => {
        const rows = addPatientWsiSlideCounts([
            {
                patientId: 'P-1',
                sampleId: 'S-1',
                WSI_SAMPLE_SLIDE_COUNT: '2',
                WSI_PATIENT_SLIDE_COUNT: '9',
            },
        ]);

        expect(rows[0]).toEqual(
            expect.objectContaining({
                WSI_SAMPLE_SLIDE_COUNT: '2',
                WSI_PATIENT_SLIDE_COUNT: '9',
            })
        );
    });
});
