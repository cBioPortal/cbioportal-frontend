export interface ITrial {
    id: string;
    nctId: string | '';
    protocolNo: string | '';
    phase: string;
    shortTitle: string;
    status: string;
    treatmentList: {
        step: IStep[];
    };
}

export interface IStep {
    match?: object[];
    arm?: IArm[];
}

export interface IArm {
    arm_description: string | ''; // Arm full name.
    arm_type?: string | ''; // Arm type(Control Arm)
    arm_eligibility?: string;
    arm_info?: string; // Real arm description.
    drugs?: IDrug[];
    match: object[];
}

export interface IDrug {
    name: string;
    ncit_code?: string;
    synonyms?: string;
}

export interface ITrialMatch {
    id: string;
    nctId: string | '';
    protocolNo: string | '';
    oncotreePrimaryDiagnosisName: string;
    gender?: string | null;
    matchType: string;
    armDescription: string | null;
    armType?: string | null;
    trueHugoSymbol?: string | null;
    trialAccrualStatus: string;
    matchLevel: string;
    sampleId: string;
    mrn: string;
    trueProteinChange?: string | null;
    vitalStatus?: string | null;
    genomicAlteration?: string;
    patientClinical?: string | null;
    patientGenomic?: string | null;
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
    sampleIds: string[];
}

export interface IClinicalGroupMatch {
    trialAgeNumerical: string;
    trialOncotreePrimaryDiagnosis: {
        positive: string[], // trialOncotreePrimaryDiagnosis not includes '!'
        negative: string[] // trialOncotreePrimaryDiagnosis includes '!'
    };
    matches: IGenomicGroupMatch[];
    notMatches: IGenomicGroupMatch[];
}
export interface IGenomicGroupMatch {
    genomicAlteration: string;
    matches: IGenomicMatch[];
}

export interface IArmMatch {
    armDescription: string | '';
    drugs: string[][];
    matches: IClinicalGroupMatch[];
}

export interface IDetailedTrialMatch {
    id: string;
    nctId: string | '';
    protocolNo: string | '';
    phase: string;
    shortTitle: string;
    status: string;
    matches: IArmMatch[];
    priority: number;
}
