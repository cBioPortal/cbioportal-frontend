import { ClinicalData } from "./CBioPortalAPI";

export type ClinicalDataBySampleId = {
    id: string;
    clinicalData: Array<ClinicalData>;
};

export type RequestStatus = 'pending' | 'complete' | 'error';