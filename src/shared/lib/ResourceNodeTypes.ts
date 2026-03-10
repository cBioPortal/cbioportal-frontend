export interface ResourceNodeRow {
    patientId: string;
    sampleId: string;
    resourceId: string;
    url: string;
    displayName: string;
    type?: string;
    groupPath?: string;
    metadata?: Record<string, any>;
}
