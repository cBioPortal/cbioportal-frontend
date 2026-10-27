import {
    Block,
    MatchLevel,
    Part,
    PatientHierarchy,
    Sample,
    Slide,
    TileMetadata,
    UNMATCHED_SAMPLE_ID,
    WsiResourceRow,
    WsiStainKind,
} from './wsiViewerTypes';
import {
    clearWsiResourceAccessTargets,
    normalizeWsiAuthScope,
    registerWsiResourceAccess,
} from './wsiAuth';
import { getWsiViewerRuntime } from './wsiViewerConfig';
import { createPromiseCache, withAbort } from './wsiCacheUtils';
import { buildWsiResourceRowsApiUrl } from './wsiUrls';

const HIERARCHY_CACHE_TTL_MS = 5 * 60 * 1000;

const hierarchyCache = createPromiseCache<PatientHierarchy>(
    () => Date.now() + HIERARCHY_CACHE_TTL_MS
);

/** The resources that hold one row per slide. */
export const WSI_RESOURCE_IDS = ['WSI_SAMPLE', 'WSI_PATIENT'];

/** More slides than any patient has; the rows come back in one page. */
const WSI_ROWS_PAGE_SIZE = 10_000;

// A stored type naming a stain the flags don't confirm is unknown.
const UNCONFIRMED_SLIDE_TYPES = new Set(['IHC', 'H&E', 'HE', 'UNKNOWN']);

function text(metadata: Record<string, unknown>, key: string): string {
    const value = metadata[key];
    return value === null || value === undefined ? '' : String(value);
}

function stainKind(metadata: Record<string, unknown>): WsiStainKind {
    // The resolved boolean flags are the authoritative classification fields.
    if (metadata.is_ihc === true) return 'ihc';
    if (metadata.is_hne === true) return 'hne';
    const stored = text(metadata, 'slide_type')
        .trim()
        .toUpperCase();
    return UNCONFIRMED_SLIDE_TYPES.has(stored) ? 'unknown' : 'other';
}

function tileMetadata(
    metadata: Record<string, unknown>
): TileMetadata | undefined {
    const serving = metadata.wsi_serving as
        | { tile_metadata_json?: TileMetadata }
        | null
        | undefined;
    return serving?.tile_metadata_json ?? undefined;
}

/** A part or block number, compared numerically; missing numbers sort last. */
function numberOrder(value: string): number {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function compareRows(a: WsiResourceRow, b: WsiResourceRow): number {
    const am = a.metadata || {};
    const bm = b.metadata || {};
    return (
        // Unmatched slides (no sample) first.
        (a.sampleId || '').localeCompare(b.sampleId || '') ||
        numberOrder(text(am, 'part_number')) -
            numberOrder(text(bm, 'part_number')) ||
        text(am, 'part_key').localeCompare(text(bm, 'part_key')) ||
        numberOrder(text(am, 'block_number')) -
            numberOrder(text(bm, 'block_number')) ||
        text(am, 'block_key').localeCompare(text(bm, 'block_key')) ||
        text(am, 'slide_key').localeCompare(text(bm, 'slide_key'))
    );
}

/**
 * Builds a patient's sample → part → block → slide tree from the slide rows of
 * the WSI_SAMPLE and WSI_PATIENT resources. Slides without a sample form the
 * unmatched group, which comes first; parts and blocks follow their numbers.
 */
export function buildPatientHierarchy(
    rows: WsiResourceRow[],
    patientId: string
): PatientHierarchy {
    const samples = new Map<string, Sample>();
    const parts = new Map<string, Part>();
    const blocks = new Map<string, Block>();
    let referenceSampleId: string | null = null;

    [...rows].sort(compareRows).forEach(row => {
        const metadata = row.metadata || {};
        referenceSampleId =
            referenceSampleId || text(metadata, 'reference_sample_id') || null;
        const sampleId = row.sampleId || UNMATCHED_SAMPLE_ID;
        let sample = samples.get(sampleId);
        if (!sample) {
            sample = { sample_id: sampleId, parts: [] };
            samples.set(sampleId, sample);
        }
        const partKey = `${sampleId}::${text(metadata, 'part_key')}`;
        let part = parts.get(partKey);
        if (!part) {
            part = {
                part_number: text(metadata, 'part_number'),
                part_type: text(metadata, 'part_type'),
                part_description: text(metadata, 'part_description'),
                subspecialty: text(metadata, 'subspecialty'),
                blocks: [],
            };
            parts.set(partKey, part);
            sample.parts.push(part);
        }
        const blockKey = `${partKey}::${text(metadata, 'block_key')}`;
        let block = blocks.get(blockKey);
        if (!block) {
            block = {
                block_number: text(metadata, 'block_number'),
                block_label: text(metadata, 'block_label'),
                slides: [],
            };
            blocks.set(blockKey, block);
            part.blocks.push(block);
        }
        const slide: Slide = {
            slide_key: text(metadata, 'slide_key'),
            stain_name: text(metadata, 'stain_name'),
            stain_group: text(metadata, 'stain_group'),
            stain_kind: stainKind(metadata),
            magnification: text(metadata, 'magnification'),
            file_size_bytes: text(metadata, 'file_size_bytes'),
            can_serve_tiles: metadata.can_serve_tiles === true,
            block_label: block.block_label,
            block_number: block.block_number,
            part_description: part.part_description,
            part_number: part.part_number,
            sample_id: row.sampleId,
            match_level: text(metadata, 'match_level') as MatchLevel,
            specimen_key: text(metadata, 'specimen_key'),
        };
        const slideTileMetadata = tileMetadata(metadata);
        if (slideTileMetadata) slide.tile_metadata = slideTileMetadata;
        block.slides.push(slide);
    });

    return {
        patient_id: patientId,
        reference_sample_id: referenceSampleId,
        samples: [...samples.values()],
    };
}

async function requestSlideRows(
    studyId: string,
    patientId: string,
    resourceId: string
): Promise<WsiResourceRow[]> {
    const { buildApiUrl, fetchImpl } = getWsiViewerRuntime();
    const response = await fetchImpl(buildWsiResourceRowsApiUrl(buildApiUrl), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            studyIds: [studyId],
            resourceId,
            patientIdentifiers: [{ studyId, patientId }],
            sampleIdentifiers: [],
            pageNumber: 0,
            pageSize: WSI_ROWS_PAGE_SIZE,
        }),
    });
    if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
    }
    const rows = await response.json();
    if (!Array.isArray(rows)) {
        throw new Error('Invalid WSI slide rows: expected an array');
    }
    return rows;
}

async function requestHierarchy(
    studyId: string,
    patientId: string
): Promise<PatientHierarchy> {
    const rows = await Promise.all(
        WSI_RESOURCE_IDS.map(resourceId =>
            requestSlideRows(studyId, patientId, resourceId)
        )
    );
    return buildPatientHierarchy(
        ([] as WsiResourceRow[]).concat(...rows),
        patientId
    );
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
