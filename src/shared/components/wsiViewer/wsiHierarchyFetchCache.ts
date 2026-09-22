import {
    PatientHierarchy,
    SlideAssociation,
    WsiV2Hierarchy,
    WsiV2Slide,
} from './wsiViewerTypes';
import { normalizeWsiAuthScope } from './wsiAuth';

const HIERARCHY_CACHE_TTL_MS = 5 * 60 * 1000;

type CachedHierarchyEntry = {
    expiresAt: number;
    promise: Promise<PatientHierarchy>;
};

const hierarchyCache = new Map<string, CachedHierarchyEntry>();

function hierarchyCacheKey(url: string, authScope?: string): string {
    return `${normalizeWsiAuthScope(authScope)}::${url}`;
}

function deriveSlideAssociations(
    hierarchy: PatientHierarchy
): SlideAssociation[] {
    return hierarchy.samples.flatMap(sample =>
        sample.parts.flatMap(part =>
            part.blocks.flatMap(block =>
                block.slides.map(slide => ({
                    image_id: slide.image_id,
                    sample_id:
                        slide.sample_id ??
                        (sample.sample_id === 'UNMATCHED'
                            ? null
                            : sample.sample_id),
                    match_level:
                        slide.match_level ??
                        (sample.sample_id === 'UNMATCHED'
                            ? 'UNMATCHED'
                            : 'BLOCK'),
                    specimen_key: slide.specimen_key ?? '',
                    part_number: part.part_number,
                    part_description: part.part_description,
                    block_number: block.block_number,
                    block_label: block.block_label,
                    // Boolean stain flags are the canonical classification.
                    slide_type: slide.slide_type ?? 'Unknown',
                    stain_name: slide.stain_name,
                    procedure_date_days: slide.slide_timepoint_days,
                    timepoint_source: slide.slide_timepoint_source,
                    timepoint_kind: slide.slide_timepoint_kind,
                    timepoint_date_source: slide.slide_timepoint_date_source,
                    timepoint_reason: slide.slide_timepoint_reason,
                    timepoint_status: slide.slide_timepoint_status ?? null,
                    timepoint_coordinate_system:
                        slide.slide_timepoint_coordinate_system ?? null,
                    can_serve_tiles: slide.can_serve_tiles,
                }))
            )
        )
    );
}

function normalizeSlideType(
    slide: WsiV2Slide
): 'H&E' | 'IHC' | 'Other' | 'Unknown' {
    // The resolved boolean flags are the authoritative classification fields.
    if (slide.isIhc === true) {
        return 'IHC';
    }
    if (slide.isHne === true) {
        return 'H&E';
    }
    const stored = slide.slideType?.trim().toUpperCase();
    if (stored === 'IHC') return 'IHC';
    if (stored === 'H&E' || stored === 'HE') return 'H&E';
    if (stored === 'UNKNOWN') return 'Unknown';
    return 'Other';
}

function validateV2SlideTiming(slide: WsiV2Slide): void {
    const status = slide.procedureDateStatus;
    const kind = slide.procedureDateKind;
    if (
        !status ||
        !kind ||
        !slide.timepointSource ||
        !slide.procedureDateSource ||
        slide.procedureCoordinateSystem !==
            'patient_first_tumor_sequencing_day_zero'
    ) {
        throw new Error('Invalid WSI hierarchy: incomplete v3 timing contract');
    }
    if (
        ![
            'AVAILABLE',
            'MISSING_PROCEDURE_DATE',
            'MISSING_REFERENCE_SEQUENCING_DATE',
        ].includes(status) ||
        !['RECORDED', 'ESTIMATED', 'UNDATED'].includes(kind)
    ) {
        throw new Error('Invalid WSI hierarchy: unsupported v3 timing value');
    }
    if (status === 'AVAILABLE') {
        if (
            slide.procedureDateDays == null ||
            kind === 'UNDATED' ||
            slide.procedureDateReason
        ) {
            throw new Error(
                'Invalid WSI hierarchy: inconsistent available timing'
            );
        }
    } else if (slide.procedureDateDays != null) {
        throw new Error('Invalid WSI hierarchy: undated timing has a day');
    }
    if (status === 'MISSING_PROCEDURE_DATE' && kind !== 'UNDATED') {
        throw new Error(
            'Invalid WSI hierarchy: missing procedure date is not undated'
        );
    }
    if (status === 'MISSING_REFERENCE_SEQUENCING_DATE' && kind === 'UNDATED') {
        throw new Error(
            'Invalid WSI hierarchy: missing reference date is undated'
        );
    }
}

function normalizeV2Hierarchy(
    payload: WsiV2Hierarchy,
    patientId: string
): PatientHierarchy {
    payload.sampleGroups.forEach(group =>
        group.parts.forEach(part =>
            part.blocks.forEach(block =>
                block.slides.forEach(validateV2SlideTiming)
            )
        )
    );
    const hierarchy: PatientHierarchy = {
        patient_id: patientId,
        reference_sample_id: payload.referenceSampleId,
        samples: payload.sampleGroups.map(group => ({
            sample_id: group.sampleId ?? 'UNMATCHED',
            cancer_type: '',
            cancer_type_detailed: '',
            oncotree_code: '',
            primary_site: '',
            sample_type: '',
            parts: group.parts.map(part => ({
                part_number: part.partNumber,
                part_designator: part.partDesignator,
                part_type: part.partType,
                part_description: part.partDescription,
                subspecialty: part.subspecialty,
                path_dx_title: part.pathDxTitle,
                blocks: part.blocks.map(block => ({
                    block_number: block.blockNumber,
                    block_label: block.blockLabel,
                    slides: block.slides.map(slide => ({
                        image_id: slide.imageId,
                        stain_name: slide.stainName,
                        stain_group: slide.stainGroup,
                        is_hne: slide.isHne,
                        is_ihc: slide.isIhc,
                        magnification: slide.magnification,
                        file_size_bytes:
                            slide.fileSizeBytes === null
                                ? ''
                                : String(slide.fileSizeBytes),
                        can_serve_tiles: slide.canServeTiles,
                        barcode: slide.barcode,
                        block_label: block.blockLabel,
                        block_number: block.blockNumber,
                        part_description: part.partDescription,
                        path_dx_title: part.pathDxTitle,
                        sample_id: slide.sampleId ?? group.sampleId,
                        match_level: slide.matchLevel,
                        specimen_key: slide.specimenKey,
                        slide_type: normalizeSlideType(slide),
                        slide_timepoint_days:
                            slide.procedureDateDays ?? undefined,
                        slide_timepoint_source:
                            slide.timepointSource ?? undefined,
                        slide_timepoint_kind:
                            slide.procedureDateKind ?? undefined,
                        slide_timepoint_date_source:
                            slide.procedureDateSource ?? undefined,
                        slide_timepoint_reason:
                            slide.procedureDateReason ?? undefined,
                        slide_timepoint_status:
                            slide.procedureDateStatus ?? undefined,
                        slide_timepoint_coordinate_system:
                            slide.procedureCoordinateSystem ?? undefined,
                    })),
                })),
            })),
        })),
        slide_associations: [],
    };
    hierarchy.slide_associations = deriveSlideAssociations(hierarchy);
    return hierarchy;
}

function normalizeHierarchyPayload(
    payload: unknown,
    patientId: string
): PatientHierarchy {
    if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid WSI hierarchy: expected an object');
    }

    const candidate = payload as { sampleGroups?: unknown };
    if (Array.isArray(candidate.sampleGroups)) {
        return normalizeV2Hierarchy(payload as WsiV2Hierarchy, patientId);
    }
    throw new Error(
        'Invalid WSI hierarchy: expected the v2 sampleGroups contract'
    );
}

function patientIdFromHierarchyUrl(url: string): string {
    const baseUrl =
        typeof window === 'undefined'
            ? 'http://localhost'
            : window.location.href;
    const pathname = new URL(url, baseUrl).pathname;
    return decodeURIComponent(pathname.split('/').pop() || '');
}

function clonePatientHierarchy(hierarchy: PatientHierarchy): PatientHierarchy {
    // The hierarchy is plain JSON and consumers mutate it after load, so return
    // a fresh deep copy to keep the shared cache immutable from callers.
    const cloned =
        typeof structuredClone === 'function'
            ? (structuredClone(hierarchy) as PatientHierarchy)
            : (JSON.parse(JSON.stringify(hierarchy)) as PatientHierarchy);
    return cloned;
}

function wrapWithAbort<T>(
    promise: Promise<T>,
    signal?: AbortSignal
): Promise<T> {
    if (!signal) {
        return promise;
    }

    if (signal.aborted) {
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
    }

    return new Promise<T>((resolve, reject) => {
        const onAbort = () => {
            cleanup();
            reject(new DOMException('Aborted', 'AbortError'));
        };
        const cleanup = () => {
            signal.removeEventListener('abort', onAbort);
        };

        signal.addEventListener('abort', onAbort, { once: true });
        promise.then(
            value => {
                cleanup();
                resolve(value);
            },
            error => {
                cleanup();
                reject(error);
            }
        );
    });
}

function getOrCreateHierarchyRequest(
    url: string,
    authScope?: string
): Promise<PatientHierarchy> {
    const cacheKey = hierarchyCacheKey(url, authScope);
    const now = Date.now();
    const cached = hierarchyCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
        return cached.promise;
    }

    const expiresAt = now + HIERARCHY_CACHE_TTL_MS;

    const promise = fetch(url, {
        cache: 'no-store',
        credentials: 'include',
    })
        .then(async response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            const payload = await response.json();
            const hierarchy = normalizeHierarchyPayload(
                payload,
                patientIdFromHierarchyUrl(url)
            );
            return hierarchy;
        })
        .catch(error => {
            const current = hierarchyCache.get(cacheKey);
            if (current?.promise === promise) {
                hierarchyCache.delete(cacheKey);
            }
            throw error;
        });

    hierarchyCache.set(cacheKey, {
        expiresAt,
        promise,
    });
    return promise;
}

export function seedPatientHierarchyCache(
    url: string,
    hierarchy: PatientHierarchy,
    authScope?: string
): void {
    const expiresAt = Date.now() + HIERARCHY_CACHE_TTL_MS;
    const cloned = clonePatientHierarchy(hierarchy);
    hierarchyCache.set(hierarchyCacheKey(url, authScope), {
        expiresAt,
        promise: Promise.resolve(cloned),
    });
}

export function seedPatientHierarchyCachePromise(
    url: string,
    hierarchyPromise: Promise<PatientHierarchy>,
    authScope?: string
): void {
    const cacheKey = hierarchyCacheKey(url, authScope);
    const expiresAt = Date.now() + HIERARCHY_CACHE_TTL_MS;
    const promise = hierarchyPromise
        .then(hierarchy => {
            const cloned = clonePatientHierarchy(hierarchy);
            return cloned;
        })
        .catch(error => {
            const current = hierarchyCache.get(cacheKey);
            if (current?.promise === promise) {
                hierarchyCache.delete(cacheKey);
            }
            throw error;
        });

    hierarchyCache.set(cacheKey, {
        expiresAt,
        promise,
    });

    // Keep rejection observable for awaiters while handling unused prefetch work.
    promise.catch(() => undefined);
}

export async function fetchPatientHierarchyReadOnly(
    url: string,
    signal?: AbortSignal,
    authScope?: string
): Promise<PatientHierarchy> {
    return wrapWithAbort(getOrCreateHierarchyRequest(url, authScope), signal);
}

export function hasCachedPatientHierarchy(
    url: string,
    authScope?: string
): boolean {
    const now = Date.now();
    const cached = hierarchyCache.get(hierarchyCacheKey(url, authScope));
    return !!cached && cached.expiresAt > now;
}

export function clearPatientHierarchyCache() {
    hierarchyCache.clear();
}

export function clearPatientHierarchyCacheEntry(url: string): void {
    for (const key of hierarchyCache.keys()) {
        if (key.endsWith(`::${url}`)) hierarchyCache.delete(key);
    }
}
