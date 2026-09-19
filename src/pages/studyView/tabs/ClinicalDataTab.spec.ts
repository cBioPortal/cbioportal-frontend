import {
    addPatientWsiSlideCounts,
    fetchClinicalDataForStudyViewClinicalDataTab,
} from './ClinicalDataTab';
import * as studyViewUtils from '../StudyViewUtils';
import { Sample, StudyViewFilter } from 'cbioportal-ts-api-client';

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

    it('does not synthesize patient totals from a partial page', () => {
        const rows = addPatientWsiSlideCounts(
            [
                {
                    studyId: 'study',
                    patientId: 'patient',
                    sampleId: 'sample-1',
                    WSI_SAMPLE_SLIDE_COUNT: '2',
                },
            ],
            false
        );

        expect(rows[0].WSI_PATIENT_SLIDE_COUNT).toBeUndefined();
    });

    it('does not combine same patient ids from different studies', () => {
        const rows = addPatientWsiSlideCounts([
            {
                studyId: 'study-a',
                patientId: 'P-1',
                sampleId: 'S-1',
                WSI_SAMPLE_SLIDE_COUNT: '3',
            },
            {
                studyId: 'study-b',
                patientId: 'P-1',
                sampleId: 'S-2',
                WSI_SAMPLE_SLIDE_COUNT: '4',
            },
        ]);

        expect(rows[0].WSI_PATIENT_SLIDE_COUNT).toBe('3');
        expect(rows[1].WSI_PATIENT_SLIDE_COUNT).toBe('4');
    });
});
