import { fetchClinicalDataForStudyViewClinicalDataTab } from './ClinicalDataTab';
import * as studyViewUtils from '../StudyViewUtils';
import { Sample, StudyViewFilter } from 'cbioportal-ts-api-client';

describe('fetchClinicalDataForStudyViewClinicalDataTab', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('keeps patient counts unavailable when the clinical table is paginated', async () => {
        jest.spyOn(
            studyViewUtils,
            'getAllClinicalDataByStudyViewFilter'
        ).mockResolvedValue({
            totalItems: 2,
            data: {
                'study::sample-1': [
                    {
                        clinicalAttributeId: 'WSI_SAMPLE_SLIDE_COUNT',
                        value: '2',
                    },
                ],
            } as any,
        });

        const sample = {
            studyId: 'study',
            patientId: 'patient',
            sampleId: 'sample-1',
            uniqueSampleKey: 'study::sample-1',
        } as Sample;

        const result = await fetchClinicalDataForStudyViewClinicalDataTab(
            {} as StudyViewFilter,
            { 'study::sample-1': sample },
            undefined,
            undefined,
            undefined,
            1
        );

        expect(result.totalItems).toBe(2);
        expect(result.data[0]).toEqual(
            expect.objectContaining({
                patientId: 'patient',
                WSI_SAMPLE_SLIDE_COUNT: '2',
            })
        );
        expect(result.data[0].WSI_PATIENT_SLIDE_COUNT).toBeUndefined();
    });

    it('keeps patient counts unavailable for filtered sample results', async () => {
        jest.spyOn(
            studyViewUtils,
            'getAllClinicalDataByStudyViewFilter'
        ).mockResolvedValue({
            totalItems: 1,
            data: {
                'study::sample-1': [
                    {
                        clinicalAttributeId: 'WSI_SAMPLE_SLIDE_COUNT',
                        value: '3',
                    },
                ],
            } as any,
        });

        const sample = {
            studyId: 'study',
            patientId: 'patient',
            sampleId: 'sample-1',
            uniqueSampleKey: 'study::sample-1',
        } as Sample;

        const result = await fetchClinicalDataForStudyViewClinicalDataTab(
            {} as StudyViewFilter,
            { 'study::sample-1': sample },
            'sample-1',
            undefined,
            undefined,
            500
        );

        expect(result.data[0].WSI_PATIENT_SLIDE_COUNT).toBeUndefined();
    });
});
