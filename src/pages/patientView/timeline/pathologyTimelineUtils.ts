import { ClinicalEvent, ClinicalDataBySampleId } from 'cbioportal-ts-api-client';
import SampleManager from 'pages/patientView/SampleManager';
import { PatientHierarchy } from 'shared/components/wsiViewer/wsiViewerTypes';
import {
    countServableSlidesForSample,
    getServableSlideEntriesForHierarchy,
} from 'shared/components/wsiViewer/wsiSlideUtils';

const PATHOLOGY_EVENT_TYPE = 'PATHOLOGY';

function getAllowedSampleIds(
    samples: ClinicalDataBySampleId[]
): Set<string> {
    return new Set(samples.map(sample => sample.id).filter(Boolean));
}

function getSampleClinicalValue(
    sample: ClinicalDataBySampleId | undefined,
    clinicalAttributeId: string
): string | undefined {
    if (!sample) return undefined;
    return SampleManager.getClinicalAttributeInSample(
        sample,
        clinicalAttributeId
    )?.value;
}

export function hasServableDiagnosticSlides(
    hierarchy: PatientHierarchy,
    allowedSampleIds?: Set<string>
): boolean {
    return getServableSlideEntriesForHierarchy(hierarchy).some(
        ({ sample }) =>
            !allowedSampleIds || allowedSampleIds.has(sample.sample_id)
    );
}

export function buildPatientHierarchyUrl(
    tileServerBase: string,
    patientId: string,
    studyId: string
): string {
    return `${tileServerBase}/patient/${encodeURIComponent(
        patientId
    )}?studyId=${encodeURIComponent(studyId)}`;
}

export function buildPatientWsiTimelineUrl(
    studyId: string,
    patientId: string,
    sampleId?: string,
    subtype?: 'H&E' | 'IHC'
): string {
    const stainFilter =
        subtype === 'H&E' ? 'hne' : subtype === 'IHC' ? 'ihc' : undefined;
    return `/patient/wsiHESlides?studyId=${encodeURIComponent(
        studyId
    )}&caseId=${encodeURIComponent(patientId)}${
        sampleId ? `&sampleId=${encodeURIComponent(sampleId)}` : ''
    }${
        stainFilter ? `&stainFilter=${encodeURIComponent(stainFilter)}` : ''
    }`;
}

export function buildPathologyTimelineEvents(
    hierarchy: PatientHierarchy,
    samples: ClinicalDataBySampleId[],
    studyId: string,
    patientId: string
): ClinicalEvent[] {
    const allowedSampleIds = getAllowedSampleIds(samples);
    const sampleById = new Map(samples.map(sample => [sample.id, sample]));
    const events: ClinicalEvent[] = [];

    hierarchy.samples.forEach(hierarchySample => {
        const sampleId = hierarchySample.sample_id;
        if (!allowedSampleIds.has(sampleId)) return;
        const sample = sampleById.get(sampleId);
        if (!sample) return;

        const timepointValue = getSampleClinicalValue(
            sample,
            'WSI_TIMEPOINT_DAYS'
        );
        if (timepointValue === undefined || timepointValue === '') return;

        const startDays = Number(timepointValue);
        if (Number.isNaN(startDays)) return;

        const timepointSource =
            getSampleClinicalValue(sample, 'WSI_TIMEPOINT_SOURCE') || '';

        (['H&E', 'IHC'] as const).forEach(subtype => {
            const imageCount = countServableSlidesForSample(
                hierarchySample,
                subtype === 'H&E' ? 'hne' : 'ihc'
            );
            if (imageCount < 1) return;
            const linkout = buildPatientWsiTimelineUrl(
                studyId,
                patientId,
                sampleId,
                subtype
            );

            events.push({
                attributes: [
                    { key: 'SAMPLE_ID', value: sampleId },
                    { key: 'SUBTYPE', value: subtype },
                    { key: 'IMAGE_COUNT', value: String(imageCount) },
                    { key: 'LINKOUT', value: linkout },
                    { key: 'WSI_TIMEPOINT_SOURCE', value: timepointSource },
                ],
                endNumberOfDaysSinceDiagnosis: startDays,
                eventType: PATHOLOGY_EVENT_TYPE,
                patientId,
                startNumberOfDaysSinceDiagnosis: startDays,
                studyId,
                uniquePatientKey: `${studyId}_${patientId}`,
                uniqueSampleKey: `${studyId}_${sampleId}`,
            });
        });
    });

    return events;
}

export async function fetchPathologyTimelineEvents(
    tileServerBase: string | null | undefined,
    patientId: string,
    studyId: string,
    samples: ClinicalDataBySampleId[]
): Promise<ClinicalEvent[]> {
    if (tileServerBase === null || tileServerBase === undefined) {
        return [];
    }

    const response = await fetch(
        buildPatientHierarchyUrl(tileServerBase, patientId, studyId)
    );
    if (!response.ok) {
        return [];
    }

    const hierarchy = (await response.json()) as PatientHierarchy;
    return buildPathologyTimelineEvents(hierarchy, samples, studyId, patientId);
}
