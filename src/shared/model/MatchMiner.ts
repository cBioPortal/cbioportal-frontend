enum MatchType {
    MUTATION = 'MUTATION',
    CNA = 'CNA',
    MSI = 'MSI',
    WILDTYPE = 'WILDTYPE'
}

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
    oncotreePrimaryDiagnosisName?: string;
    gender?: string;
    matchType: string;
    armDescription?: string;
    armType?: string;
    sampleId: string;
    mrn: string;
    trueHugoSymbol?: string;
    trueProteinChange?: string;
    vitalStatus?: string | null;
    genomicAlteration?: string;
    trialAgeNumerical?: string;
    trialOncotreePrimaryDiagnosis?: string;
}

export interface ITrialQuery {
    nct_id: string[];
    protocol_no: string[];
}

export interface IGenomicMatch {
    trueHugoSymbol?: string;
    trueProteinChange?: string;
    sampleIds: string[];
}

export interface IClinicalGroupMatch {
    trialAgeNumerical: string;
    trialOncotreePrimaryDiagnosis: {
        positive: string[], // trialOncotreePrimaryDiagnosis not includes '!'
        negative: string[] // trialOncotreePrimaryDiagnosis includes '!'
    };
    matches: IGenomicMatchType;
    notMatches: IGenomicMatchType;
}

export interface IGenomicMatchType {
    MUTATION: IGenomicGroupMatch[],
    CNA: IGenomicGroupMatch[],
    MSI: IGenomicGroupMatch[],
    WILDTYPE: IGenomicGroupMatch[],
    [key: string]: IGenomicGroupMatch[]
}

export interface IGenomicGroupMatch {
    genomicAlteration: string;
    matchType: string;
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
