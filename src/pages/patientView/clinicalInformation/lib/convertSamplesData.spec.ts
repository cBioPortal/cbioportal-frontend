import mockClinicalData from "../../../../shared/api/mock/Clinical_data_study_ucec_tcga_pub.json";
import { ClinicalData } from "../../../../shared/api/generated/CBioPortalAPI";
import { default as convertSampleData, IConvertedSamplesData } from "./convertSamplesData";
import { groupByEntityId } from '../../../../shared/lib/StoreUtils';
import { ClinicalDataBySampleId } from "../../../../shared/api/api-types-extended";
import {assert} from "chai";

describe('convertSamplesData', () => {
    it('api data is properly transformed into table data', () => {

        const res: Array<ClinicalDataBySampleId> = groupByEntityId(['TCGA-BK-A0CC-01'], mockClinicalData as Array<ClinicalData>);

        const result: IConvertedSamplesData = convertSampleData(res);

        assert.equal(result.columns.length, 1);

        assert.equal(result.items['CANCER_TYPE']['TCGA-BK-A0CC-01'], 'Endometrial Cancer');

        assert.equal(result.items['CANCER_TYPE_DETAILED']['TCGA-BK-A0CC-01'], 'Uterine Serous Carcinoma/Uterine Papillary Serous Carcinoma');

        assert.equal(result.items['TUMOR_STAGE_2009']['TCGA-BK-A0CC-01'], 'Stage III');

    });
});

