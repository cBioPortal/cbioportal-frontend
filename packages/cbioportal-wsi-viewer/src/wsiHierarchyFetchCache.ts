import {
    PatientHierarchy,
    SlideAssociation,
    WsiV2Hierarchy,
    WsiV2Slide,
} from './wsiViewerTypes';
import {
    clearWsiResourceAccessTargets,
    normalizeWsiAuthScope,
    registerWsiResourceAccess,
} from './wsiAuth';
import { getWsiViewerRuntime } from './wsiViewerConfig';
import { deleteExpiredEntries, withAbort } from './wsiCacheUtils';
import { buildWsiHierarchyApiUrl } from './wsiUrls';

const HIERARCHY_CACHE_TTL_MS = 5 * 60 * 1000;

type CachedHierarchyEntry = {
    expiresAt: number;
    promise: Promise<PatientHierarchy>;
    /** Study whose resource access targets this entry registered. */
    studyId?: string;
    patientId?: string;
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
                    slide_key: slide.slide_key,
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

function normalizeV2Hierarchy(
    payload: WsiV2Hierarchy,
    patientId: string
): PatientHierarchy {
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
                part_type: part.partType,
                part_description: part.partDescription,
                subspecialty: part.subspecialty,
                blocks: part.blocks.map(block => ({
                    block_number: block.blockNumber,
                    block_label: block.blockLabel,
                    slides: block.slides.map(slide => ({
                        slide_key: slide.slideKey,
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
                        block_label: block.blockLabel,
                        block_number: block.blockNumber,
                        part_description: part.partDescription,
                        sample_id: slide.sampleId ?? group.sampleId,
                        match_level: slide.matchLevel,
                        specimen_key: slide.specimenKey,
                        slide_type: normalizeSlideType(slide),
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

/**
 * Publishes the slides of a hierarchy for slide access, but only while that
 * hierarchy is still the cached one for its URL, so a superseded response
 * cannot overwrite a newer one.
 */
function registerIfCurrent(
    url: string,
    authScope: string | undefined,
    promise: Promise<PatientHierarchy>,
    hierarchy: PatientHierarchy,
    studyId: string | undefined
): void {
    if (!studyId) return;
    const current = hierarchyCache.get(hierarchyCacheKey(url, authScope));
    if (current?.promise !== promise) return;
    registerWsiResourceAccess(studyId, hierarchy);
}

function getOrCreateHierarchyRequest(
    url: string,
    authScope: string | undefined,
    studyId: string | undefined,
    patientId: string | undefined
): Promise<PatientHierarchy> {
    const cacheKey = hierarchyCacheKey(url, authScope);
    const now = Date.now();
    const cached = hierarchyCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
        const cachedPromise = cached.promise;
        const targetStudyId = studyId ?? cached.studyId;
        if (studyId && !cached.studyId) {
            cached.studyId = studyId;
        }
        return cachedPromise.then(hierarchy => {
            registerIfCurrent(
                url,
                authScope,
                cachedPromise,
                hierarchy,
                targetStudyId
            );
            return hierarchy;
        });
    }

    const expiresAt = now + HIERARCHY_CACHE_TTL_MS;

    const promise: Promise<PatientHierarchy> = getWsiViewerRuntime()
        .fetchImpl(url, { credentials: 'include' })
        .then(async response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            const payload = await response.json();
            const hierarchy = normalizeHierarchyPayload(
                payload,
                patientId ?? ''
            );
            registerIfCurrent(url, authScope, promise, hierarchy, studyId);
            return hierarchy;
        })
        .catch(error => {
            const current = hierarchyCache.get(cacheKey);
            if (current?.promise === promise) {
                hierarchyCache.delete(cacheKey);
            }
            throw error;
        });

    deleteExpiredEntries(hierarchyCache, now);
    hierarchyCache.set(cacheKey, {
        expiresAt,
        promise,
        studyId,
        patientId: patientId ?? '',
    });
    return promise;
}

/**
 * Loads a patient hierarchy through the shared cache. When `studyId` is given,
 * every returned hierarchy (network or cached) registers the slides that slide
 * access requests may name. `patientId` is recorded on the
 * normalized hierarchy; the URL is never parsed for either identity.
 */
export async function fetchPatientHierarchyReadOnly(
    url: string,
    signal?: AbortSignal,
    authScope?: string,
    studyId?: string,
    patientId?: string
): Promise<PatientHierarchy> {
    return withAbort(
        getOrCreateHierarchyRequest(url, authScope, studyId, patientId),
        signal
    );
}

/**
 * Loads one patient's hierarchy from the portal through the cache the viewer
 * reads, so a viewer opened later for the same patient and `authScope` reuses
 * this request.
 */
export function fetchWsiPatientHierarchy(
    studyId: string,
    patientId: string,
    authScope?: string,
    signal?: AbortSignal
): Promise<PatientHierarchy> {
    return fetchPatientHierarchyReadOnly(
        buildWsiHierarchyApiUrl(
            getWsiViewerRuntime().buildApiUrl,
            studyId,
            patientId
        ),
        signal,
        authScope,
        studyId,
        patientId
    );
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
    clearWsiResourceAccessTargets();
}
