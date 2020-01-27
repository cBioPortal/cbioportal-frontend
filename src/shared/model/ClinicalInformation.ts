import { ClinicalData } from 'shared/api/generated/CBioPortalAPI';
import { ClinicalDataBySampleId } from 'shared/api/api-types-extended';

export type ClinicalInformationData = {
    patient?: {
        id: string;
        clinicalData: ClinicalData[];
    };
    samples?: ClinicalDataBySampleId[];
    nodes?: any[]; //PDXNode[],
};
