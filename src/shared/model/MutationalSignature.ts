export interface IMutationalSignature {
    sampleId: string;
    uniqueSampleKey: string;
    patientId: string;
    uniquePatientKey: string;
    studyId: string;
    mutationalSignatureId: string;
    version: string;
    value: number;
    confidence: number;
    numberOfMutationsForSample: number;
    meta: IMutationalSignatureMeta;
}

export interface IMutationalSignatureMeta {
    mutationalSignatureId: string;
    name: string;
    description: string;
    url: string;
    category: string;
    confidenceStatement: string;
}
