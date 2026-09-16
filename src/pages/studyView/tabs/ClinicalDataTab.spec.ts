jest.mock('../StudyViewUtils', () => {
    const actual = jest.requireActual('../StudyViewUtils');
    return {
        ...actual,
        getAllClinicalDataByStudyViewFilter: jest.fn(),
        getSampleToClinicalData: jest.fn(),
    };
});

import {
    addPatientWsiSlideCounts,
    fetchClinicalDataForStudyViewClinicalDataTab,
    sortClinicalDataRows,
} from './ClinicalDataTab';
import * as StudyViewUtils from '../StudyViewUtils';
import { ClinicalAttribute, Sample } from 'cbioportal-ts-api-client';

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

describe('fetchClinicalDataForStudyViewClinicalDataTab', () => {
    const selectedSamples = [
        {
            uniqueSampleKey: 'study:S-1',
            uniquePatientKey: 'study:P-1',
            studyId: 'study',
            sampleId: 'S-1',
            patientId: 'P-1',
        },
        {
            uniqueSampleKey: 'study:S-2',
            uniquePatientKey: 'study:P-2',
            studyId: 'study',
            sampleId: 'S-2',
            patientId: 'P-2',
        },
    ] as Sample[];
    const sortAttribute = {
        clinicalAttributeId: 'WSI_PATIENT_SLIDE_COUNT',
        patientAttribute: false,
        datatype: 'NUMBER',
    } as ClinicalAttribute;
    const filters = { studyIds: ['study'] } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(StudyViewUtils.getSampleToClinicalData).mockResolvedValue({
            'study:S-1': {
                uniqueSampleKey: 'study:S-1',
                value: '2',
            },
            'study:S-2': {
                uniqueSampleKey: 'study:S-2',
                value: '10',
            },
        } as any);
        jest.mocked(
            StudyViewUtils.getAllClinicalDataByStudyViewFilter
        ).mockResolvedValue({
            totalItems: 999,
            data: {
                'study:S-1': [
                    {
                        clinicalAttributeId: 'WSI_PATIENT_SLIDE_COUNT',
                        value: '2',
                    },
                ],
                'study:S-2': [
                    {
                        clinicalAttributeId: 'WSI_PATIENT_SLIDE_COUNT',
                        value: '10',
                    },
                ],
            },
        } as any);
    });

    it.each([
        ['asc', ['S-1', 'S-2']],
        ['desc', ['S-2', 'S-1']],
    ] as const)(
        'ranks selected samples and reports their filtered total (%s)',
        async (direction, expectedSampleIds) => {
            const result = await fetchClinicalDataForStudyViewClinicalDataTab(
                filters,
                selectedSamples,
                undefined,
                sortAttribute.clinicalAttributeId,
                sortAttribute,
                direction,
                2
            );

            expect(
                jest.mocked(StudyViewUtils.getSampleToClinicalData)
            ).toHaveBeenCalledWith(selectedSamples, sortAttribute);
            const requestFilters = jest.mocked(
                StudyViewUtils.getAllClinicalDataByStudyViewFilter
            ).mock.calls[0][0];
            expect(requestFilters.sampleIdentifiers).toEqual(
                expectedSampleIds.map(sampleId => ({
                    sampleId,
                    studyId: 'study',
                }))
            );
            expect(result.totalItems).toBe(selectedSamples.length);
            expect(result.data.map(row => row.sampleId)).toEqual(
                expectedSampleIds
            );
        }
    );
});
