import {
    ClinicalEvent,
    ClinicalDataBySampleId,
} from 'cbioportal-ts-api-client';
import SampleManager from 'pages/patientView/SampleManager';
import { fetchPatientHierarchyReadOnly } from 'shared/components/wsiViewer/wsiHierarchyFetchCache';
import { PatientHierarchy } from 'shared/components/wsiViewer/wsiViewerTypes';
import {
    countServableBlocksForSample,
    getServableSlideCountsForHierarchy,
} from 'shared/components/wsiViewer/wsiSlideUtils';

const PATHOLOGY_EVENT_TYPE = 'PATHOLOGY';
const PATHOLOGY_EVENT_ATTRIBUTE_KEYS = {
    imageCount: 'IMAGE_COUNT',
    linkout: 'LINKOUT',
    sampleId: 'SAMPLE_ID',
    subtype: 'SUBTYPE',
    timepointSource: 'WSI_TIMEPOINT_SOURCE',
} as const;
const PATHOLOGY_SUBTYPES = [
    { label: 'H&E', stainFilter: 'hne' },
    { label: 'IHC', stainFilter: 'ihc' },
] as const;

type PathologySubtype = typeof PATHOLOGY_SUBTYPES[number];
type EligiblePathologySample = {
    sampleId: string;
    startDays: number;
    timepointSource: string;
};
type PathologyTimelineCacheEntry = {
    expiresAt: number;
    events?: ClinicalEvent[];
    promise?: Promise<ClinicalEvent[]>;
};

const PATHOLOGY_TIMELINE_CACHE_TTL_MS = 5 * 60 * 1000;
const pathologyTimelineEventsCache = new Map<
    string,
    PathologyTimelineCacheEntry
>();

function getAllowedSampleIds(samples: ClinicalDataBySampleId[]): Set<string> {
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

function getEligiblePathologySample(
    hierarchySampleId: string,
    allowedSampleIds: Set<string>,
    sampleById: Map<string, ClinicalDataBySampleId>
): EligiblePathologySample | undefined {
    if (!allowedSampleIds.has(hierarchySampleId)) {
        return undefined;
    }

    const sample = sampleById.get(hierarchySampleId);
    if (!sample) {
        return undefined;
    }

    const timepointValue = getSampleClinicalValue(sample, 'WSI_TIMEPOINT_DAYS');
    if (!timepointValue) {
        return undefined;
    }

    const startDays = Number(timepointValue);
    if (Number.isNaN(startDays)) {
        return undefined;
    }

    return {
        sampleId: hierarchySampleId,
        startDays,
        timepointSource:
            getSampleClinicalValue(sample, 'WSI_TIMEPOINT_SOURCE') || '',
    };
}

export function hasServableDiagnosticSlides(
    hierarchy: PatientHierarchy,
    allowedSampleIds?: Set<string>
): boolean {
    if (!allowedSampleIds) {
        return getServableSlideCountsForHierarchy(hierarchy).all > 0;
    }

    return hierarchy.samples.some(
        sample =>
            allowedSampleIds.has(sample.sample_id) &&
            countServableBlocksForSample(sample, 'all') > 0
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
    subtype?: PathologySubtype['label']
): string {
    const stainFilter = PATHOLOGY_SUBTYPES.find(
        pathologySubtype => pathologySubtype.label === subtype
    )?.stainFilter;

    return `/patient/wsiHESlides?studyId=${encodeURIComponent(
        studyId
    )}&caseId=${encodeURIComponent(patientId)}${
        sampleId ? `&sampleId=${encodeURIComponent(sampleId)}` : ''
    }${stainFilter ? `&stainFilter=${encodeURIComponent(stainFilter)}` : ''}`;
}

function buildPathologyEvent(
    studyId: string,
    patientId: string,
    pathologySample: EligiblePathologySample,
    subtype: PathologySubtype,
    imageCount: number
): ClinicalEvent {
    return {
        attributes: [
            {
                key: PATHOLOGY_EVENT_ATTRIBUTE_KEYS.sampleId,
                value: pathologySample.sampleId,
            },
            {
                key: PATHOLOGY_EVENT_ATTRIBUTE_KEYS.subtype,
                value: subtype.label,
            },
            {
                key: PATHOLOGY_EVENT_ATTRIBUTE_KEYS.imageCount,
                value: String(imageCount),
            },
            {
                key: PATHOLOGY_EVENT_ATTRIBUTE_KEYS.linkout,
                value: buildPatientWsiTimelineUrl(
                    studyId,
                    patientId,
                    pathologySample.sampleId,
                    subtype.label
                ),
            },
            {
                key: PATHOLOGY_EVENT_ATTRIBUTE_KEYS.timepointSource,
                value: pathologySample.timepointSource,
            },
        ],
        endNumberOfDaysSinceDiagnosis: pathologySample.startDays,
        eventType: PATHOLOGY_EVENT_TYPE,
        patientId,
        startNumberOfDaysSinceDiagnosis: pathologySample.startDays,
        studyId,
        uniquePatientKey: `${studyId}_${patientId}`,
        uniqueSampleKey: `${studyId}_${pathologySample.sampleId}`,
    };
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
        const pathologySample = getEligiblePathologySample(
            hierarchySample.sample_id,
            allowedSampleIds,
            sampleById
        );
        if (!pathologySample) return;

        PATHOLOGY_SUBTYPES.forEach(subtype => {
            const imageCount = countServableBlocksForSample(
                hierarchySample,
                subtype.stainFilter
            );
            if (imageCount < 1) return;

            events.push(
                buildPathologyEvent(
                    studyId,
                    patientId,
                    pathologySample,
                    subtype,
                    imageCount
                )
            );
        });
    });

    return events;
}

export function buildPathologyTimelineSampleSignature(
    samples: ClinicalDataBySampleId[]
): string {
    return samples
        .map(sample => {
            const timepointDays =
                getSampleClinicalValue(sample, 'WSI_TIMEPOINT_DAYS') || '';
            const timepointSource =
                getSampleClinicalValue(sample, 'WSI_TIMEPOINT_SOURCE') || '';

            return `${sample.id || ''}:${timepointDays}:${timepointSource}`;
        })
        .sort()
        .join('|');
}

function getPathologyTimelineEventsCacheKey(
    tileServerBase: string,
    patientId: string,
    studyId: string,
    samples: ClinicalDataBySampleId[]
): string {
    return [
        tileServerBase,
        studyId,
        patientId,
        buildPathologyTimelineSampleSignature(samples),
    ].join('::');
}

function getValidPathologyTimelineCacheEntry(
    cacheKey: string
): PathologyTimelineCacheEntry | undefined {
    const cachedEntry = pathologyTimelineEventsCache.get(cacheKey);
    if (!cachedEntry) {
        return undefined;
    }

    if (cachedEntry.expiresAt <= Date.now()) {
        pathologyTimelineEventsCache.delete(cacheKey);
        return undefined;
    }

    return cachedEntry;
}

function appendPathologyEvents(
    clinicalEvents: ClinicalEvent[],
    pathologyEvents: ClinicalEvent[]
): ClinicalEvent[] {
    return pathologyEvents.length > 0
        ? clinicalEvents.concat(pathologyEvents)
        : clinicalEvents;
}

export function clearPathologyTimelineEventsCache() {
    pathologyTimelineEventsCache.clear();
}

export function getCachedAppendedPathologyTimelineEvents(
    clinicalEvents: ClinicalEvent[],
    tileServerBase: string | null | undefined,
    patientId: string | undefined,
    studyId: string | undefined,
    samples: ClinicalDataBySampleId[]
): ClinicalEvent[] {
    if (!tileServerBase || !patientId || !studyId) {
        return clinicalEvents;
    }

    const cachedEntry = getValidPathologyTimelineCacheEntry(
        getPathologyTimelineEventsCacheKey(
            tileServerBase,
            patientId,
            studyId,
            samples
        )
    );

    return cachedEntry?.events
        ? appendPathologyEvents(clinicalEvents, cachedEntry.events)
        : clinicalEvents;
}

export async function fetchPathologyTimelineEvents(
    tileServerBase: string | null | undefined,
    patientId: string,
    studyId: string,
    samples: ClinicalDataBySampleId[]
): Promise<ClinicalEvent[]> {
    if (!tileServerBase) {
        return [];
    }

    const cacheKey = getPathologyTimelineEventsCacheKey(
        tileServerBase,
        patientId,
        studyId,
        samples
    );
    const now = Date.now();
    const cachedEntry = getValidPathologyTimelineCacheEntry(cacheKey);
    if (cachedEntry) {
        if (cachedEntry.events) {
            return cachedEntry.events;
        }
        if (cachedEntry.promise) {
            return cachedEntry.promise;
        }
    }

    const request = fetchPatientHierarchyReadOnly(
        buildPatientHierarchyUrl(tileServerBase, patientId, studyId)
    )
        .then(hierarchy =>
            buildPathologyTimelineEvents(hierarchy, samples, studyId, patientId)
        )
        .then(events => {
            pathologyTimelineEventsCache.set(cacheKey, {
                events,
                expiresAt: Date.now() + PATHOLOGY_TIMELINE_CACHE_TTL_MS,
            });
            return events;
        })
        .catch(error => {
            pathologyTimelineEventsCache.delete(cacheKey);
            throw error;
        });

    pathologyTimelineEventsCache.set(cacheKey, {
        expiresAt: now + PATHOLOGY_TIMELINE_CACHE_TTL_MS,
        promise: request,
    });

    return request;
}

export async function appendPathologyTimelineEvents(
    clinicalEvents: ClinicalEvent[],
    tileServerBase: string | null | undefined,
    patientId: string | undefined,
    studyId: string | undefined,
    samples: ClinicalDataBySampleId[]
): Promise<ClinicalEvent[]> {
    if (!tileServerBase || !patientId || !studyId) {
        return clinicalEvents;
    }

    const pathologyEvents = await fetchPathologyTimelineEvents(
        tileServerBase,
        patientId,
        studyId,
        samples
    );
    return appendPathologyEvents(clinicalEvents, pathologyEvents);
}
