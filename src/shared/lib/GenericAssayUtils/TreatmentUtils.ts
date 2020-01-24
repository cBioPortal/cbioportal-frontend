// Define Treatment and TreatmentMolecularData type
export type Treatment = {
    description: string;
    name: string;
    refLink: string;
    treatmentId: string;
};

export type TreatmentMolecularData = {
    'geneticProfileId': string;
    'patientId': string;
    'sampleId': string;
    'stableId': string;
    'studyId': string;
    'treatmentId': string;
    'uniquePatientKey': string;
    'uniqueSampleKey': string;
    'value': string;
}
