import { ClinicalData } from '../generated/CBioPortalAPIInternal';

export type ClinicalDataCollection = {
    patientClinicalData: Array<ClinicalData>;

    sampleClinicalData: Array<ClinicalData>;
};
