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

});
