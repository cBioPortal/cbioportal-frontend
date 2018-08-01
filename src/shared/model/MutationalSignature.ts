export interface IMutationalSignature {
    sampleId: string;
    uniqueSampleKey: string;
    patientId: string;
    uniquePatientKey: string;
    studyId: string;
    mutationalSignatureId: string;
    value: number;
    confidence: number;
}

export interface IMutationalSignatureMeta{
    mutationalSignatureId: string;
    description: string;
    confidenceStatement: string;
}

interface ISignificantMutationalSignaturesBySample{
    uniqueSampleKey: string;
    numberOfMutations: number;
    confidenceStatement: string;
}
