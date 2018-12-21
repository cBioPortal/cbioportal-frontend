export interface ITrial {
    nctId: string | '';
    protocolNo: string | '';
    phase: string;
    shortTitle: string;
    status: string;
    treatmentList: string;
}

export interface ITrialMatch {
    nctId: string | '';
    protocolNo: string | '';
    oncotreePrimaryDiagnosisName: string;
    gender: string | null;
    matchType: string;
    armDescription: string | null;
    trueHugoSymbol: string | null;
    trialAccrualStatus: string;
    matchLevel: string;
    sampleId: string;
    mrn: string;
    trueProteinChange: string | null;
    vitalStatus: string | null;
    genomicAlteration: string;
    patientClinical: string | null;
    patientGenomic: string | null;
    trialAgeNumerical: string;
    trialOncotreePrimaryDiagnosis: string;
}

export interface ITrialQuery {
    nct_id: string[];
    protocol_no: string[];
}

export interface IGenomicMatch {
    trueHugoSymbol: string | null;
    trueProteinChange: string | null;
    sampleIds: Array<string>;
}

export interface IClinicalGroupMatch {
    trialAgeNumerical: string;
    trialOncotreePrimaryDiagnosis: {
        general: Array<string>,
        not: Array<string>
    };
    matches: Array<IGenomicGroupMatch>;
    notMatches: Array<IGenomicGroupMatch>;
}
export interface IGenomicGroupMatch {
    genomicAlteration: string;
    matches: Array<IGenomicMatch>;
}

export interface IArmMatch {
    armDescription: string | null;
    drugs: Array<Array<string>>;
    matches: Array<IClinicalGroupMatch>;
}

export interface IDetailedTrialMatch {
    nctId: string | '';
    protocolNo: string | '';
    phase: string;
    shortTitle: string;
    status: string;
    matches: Array<IArmMatch>;
    priority: number;
}
