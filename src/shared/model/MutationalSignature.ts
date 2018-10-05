export interface IMutationalSignature {
    sampleId: string;
    uniqueSampleKey: string;
    patientId: string;
    uniquePatientKey: string;
    studyId: string;
    mutationalSignatureId: string;
    value: number;
    confidence: number;
    numberOfMutationsForSample: number;
}

export interface IMutationalSignatureMeta{
    mutationalSignatureId: string;
    description: string;
    confidenceStatement: string;
}

export interface ISignificantMutationalSignaturesForSample{
    numberOfMutationsForSample: number;
    confidenceStatement: string;
    significantSignatures: {
        [mutationalSignatureId: string]: number
    }
}
