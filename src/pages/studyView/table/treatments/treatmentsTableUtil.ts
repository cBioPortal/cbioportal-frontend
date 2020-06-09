import {
    SampleTreatmentRow,
    SampleTreatmentFilter,
    PatientTreatmentFilter,
    PatientTreatmentRow,
} from 'cbioportal-ts-api-client';

export function sampleTreatmentUniqueKey(
    cell: SampleTreatmentRow | SampleTreatmentFilter
): string {
    return cell.treatment + '::' + cell.time;
}

export function patientTreatmentUniqueKey(
    cell: PatientTreatmentRow | PatientTreatmentFilter
): string {
    return cell.treatment + "::" + cell.received;
}

export function toSampleTreatmentFilter(uniqueKey: string): SampleTreatmentFilter {
    const split = uniqueKey.split('::');
    return {
        treatment: split[0],
        time: split[1] as 'Pre' | 'Post' | 'Unknown',
    };
}

export function toPatientTreatmentFilter(uniqueKey: string): PatientTreatmentFilter {
    const split = uniqueKey.split("::");
    return {
        treatment: split[0],
        received: split[1] === "true",
    }
}

export enum TreatmentTableType {
    SAMPLE = 'SAMPLE_TREATMENTS',
    PATIENT = 'PATIENT_TREATMENTS',
}