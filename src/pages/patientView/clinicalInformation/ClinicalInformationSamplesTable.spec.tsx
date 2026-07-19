import ClinicalInformationSamplesTable from './ClinicalInformationSamplesTable';
import { IConvertedSamplesData } from './lib/convertSamplesData';

describe('ClinicalInformationSamplesTable', () => {
    it('hides WSI-derived sample attributes', () => {
        const table = new ClinicalInformationSamplesTable({});
        const data: IConvertedSamplesData = {
            columns: [{ id: 'S-1' }],
            items: {
                HAS_WSI_SLIDE: {
                    id: 'HAS_WSI_SLIDE',
                    clinicalAttribute: {
                        clinicalAttributeId: 'HAS_WSI_SLIDE',
                        displayName: 'Has WSI Slide',
                        priority: '1',
                    } as any,
                    'S-1': 'TRUE',
                },
                WSI_SLIDE_COUNT: {
                    id: 'WSI_SLIDE_COUNT',
                    clinicalAttribute: {
                        clinicalAttributeId: 'WSI_SLIDE_COUNT',
                        displayName: 'WSI Slide Count',
                        priority: '1',
                    } as any,
                    'S-1': '5',
                },
            },
        };

        const rows = table.prepareData(data);

        expect(rows).toEqual([]);
    });

    it('fills missing sample values with n/a while preserving sample-column order', () => {
        const table = new ClinicalInformationSamplesTable({});
        const data: IConvertedSamplesData = {
            columns: [{ id: 'S-2' }, { id: 'S-1' }],
            items: {
                SAMPLE_TYPE: {
                    id: 'SAMPLE_TYPE',
                    clinicalAttribute: {
                        clinicalAttributeId: 'SAMPLE_TYPE',
                        displayName: 'Sample Type',
                        priority: '1',
                    } as any,
                    'S-2': 'Metastasis',
                },
                CANCER_TYPE: {
                    id: 'CANCER_TYPE',
                    clinicalAttribute: {
                        clinicalAttributeId: 'CANCER_TYPE',
                        displayName: 'Cancer Type',
                        priority: '2',
                    } as any,
                    'S-2': 'Breast Cancer',
                    'S-1': 'Breast Cancer',
                },
            },
        };

        const rows = table.prepareData(data);

        expect(rows).toEqual([
            {
                attribute: 'Cancer Type',
                'S-2': 'Breast Cancer',
                'S-1': 'Breast Cancer',
            },
            {
                attribute: 'Sample Type',
                'S-2': 'Metastasis',
                'S-1': 'n/a',
            },
        ]);
    });
});
