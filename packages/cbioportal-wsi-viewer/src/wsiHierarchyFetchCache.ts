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
import { createPromiseCache, withAbort } from './wsiCacheUtils';
import { buildWsiHierarchyApiUrl } from './wsiUrls';

const HIERARCHY_CACHE_TTL_MS = 5 * 60 * 1000;

const hierarchyCache = createPromiseCache<PatientHierarchy>(
    () => Date.now() + HIERARCHY_CACHE_TTL_MS
);

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

async function requestHierarchy(
    studyId: string,
    patientId: string
): Promise<PatientHierarchy> {
    const { buildApiUrl, fetchImpl } = getWsiViewerRuntime();
    const response = await fetchImpl(
        buildWsiHierarchyApiUrl(buildApiUrl, studyId, patientId),
        { credentials: 'include' }
    );
    if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
    }
    return normalizeHierarchyPayload(await response.json(), patientId);
}

/**
 * Loads one patient's hierarchy from the portal through the cache the viewer
 * reads, so a viewer opened later for the same patient and `authScope` reuses
 * this request. Every returned hierarchy (network or cached) registers the
 * slides that slide access requests may name.
 */
export function fetchWsiPatientHierarchy(
    studyId: string,
    patientId: string,
    authScope?: string,
    signal?: AbortSignal
): Promise<PatientHierarchy> {
    const key = [normalizeWsiAuthScope(authScope), studyId, patientId].join(
        '::'
    );
    return withAbort(
        hierarchyCache
            .get(key, () => requestHierarchy(studyId, patientId))
            .then(hierarchy => {
                registerWsiResourceAccess(studyId, hierarchy);
                return hierarchy;
            }),
        signal
    );
}

export function clearPatientHierarchyCache() {
    hierarchyCache.clear();
    clearWsiResourceAccessTargets();
}
