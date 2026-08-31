import mockClinicalData from '../../../../shared/api/mock/Clinical_data_study_ucec_tcga_pub.json';
import { ClinicalData, ClinicalDataBySampleId } from 'cbioportal-ts-api-client';
import {
    default as convertSampleData,
    IConvertedSamplesData,
} from './convertSamplesData';
import { groupBySampleId } from '../../../../shared/lib/StoreUtils';
import { assert } from 'chai';

describe('convertSamplesData', () => {
    it('api data is properly transformed into table data', () => {
        const res: Array<ClinicalDataBySampleId> = groupBySampleId(
            ['TCGA-BK-A0CC-01'],
            mockClinicalData as Array<ClinicalData>
        );

        const result: IConvertedSamplesData = convertSampleData(res);

        assert.equal(result.columns.length, 1);

        assert.equal(
            result.items['CANCER_TYPE']['TCGA-BK-A0CC-01'],
            'Endometrial Cancer'
        );

        assert.equal(
            result.items['CANCER_TYPE_DETAILED']['TCGA-BK-A0CC-01'],
            'Uterine Serous Carcinoma/Uterine Papillary Serous Carcinoma'
        );

        assert.equal(
            result.items['TUMOR_STAGE_2009']['TCGA-BK-A0CC-01'],
            'Stage III'
        );
    });

    it('preserves sample column order and fills attribute rows across samples', () => {
        const result: IConvertedSamplesData = convertSampleData([
            {
                id: 'S-2',
                clinicalData: [
                    {
                        clinicalAttributeId: 'ATTR_A',
                        value: 'x',
                        clinicalAttribute: {
                            clinicalAttributeId: 'ATTR_A',
                        },
                    },
                ],
            },
            {
                id: 'S-1',
                clinicalData: [
                    {
                        clinicalAttributeId: 'ATTR_A',
                        value: 'y',
                        clinicalAttribute: {
                            clinicalAttributeId: 'ATTR_A',
                        },
                    },
                    {
                        clinicalAttributeId: 'ATTR_B',
                        value: 'z',
                        clinicalAttribute: {
                            clinicalAttributeId: 'ATTR_B',
                        },
                    },
                ],
            },
        ] as any);

        assert.deepEqual(result.columns, [{ id: 'S-2' }, { id: 'S-1' }]);
        assert.equal(result.items['ATTR_A']['S-2'], 'x');
        assert.equal(result.items['ATTR_A']['S-1'], 'y');
        assert.equal(result.items['ATTR_B']['S-1'], 'z');
        assert.equal(result.items['ATTR_A'].id, 'ATTR_A');
    });
});
