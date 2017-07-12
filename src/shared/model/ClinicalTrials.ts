import {ClinicalTrialCount} from "shared/api/generated/CBioPortalAPI";

export type ClinicalTrials = {
    patient?: {
        id: string,
    },
    clinicalData: ClinicalTrialCount[]

};

