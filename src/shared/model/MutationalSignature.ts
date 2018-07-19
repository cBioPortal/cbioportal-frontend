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

