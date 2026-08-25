import {
    PatientHierarchy,
    SlideAssociation,
    WsiV2Hierarchy,
} from './wsiViewerTypes';
import { getWsiSessionStorage } from './wsiAuth';

const HIERARCHY_CACHE_TTL_MS = 5 * 60 * 1000;
const HIERARCHY_STORAGE_KEY_PREFIX = 'wsi-hierarchy-cache-v4::';

type CachedHierarchyEntry = {
    expiresAt: number;
    promise: Promise<PatientHierarchy>;
};

const hierarchyCache = new Map<string, CachedHierarchyEntry>();

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
                    slide_type: slide.slide_type ?? (slide.is_hne ? 'H&E' : 'IHC'),
                    stain_name: slide.stain_name,
                    procedure_date_days: slide.slide_timepoint_days,
                    timepoint_source: slide.slide_timepoint_source,
                    can_serve_tiles: slide.can_serve_tiles,
                }))
            )
        )
    );
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
                        slide_type:
                            slide.slideType === 'IHC' ? 'IHC' : 'H&E',
                        slide_timepoint_days: slide.procedureDateDays ?? undefined,
                        slide_timepoint_source:
                            slide.timepointSource ?? undefined,
                    })),
                })),
            })),
        })),
        slide_associations: [],
    };
    hierarchy.slide_associations = deriveSlideAssociations(hierarchy);
    return hierarchy;
}

function patientIdFromHierarchyUrl(url: string): string {
    const baseUrl =
        typeof window === 'undefined' ? 'http://localhost' : window.location.href;
    const pathname = new URL(url, baseUrl).pathname;
    return decodeURIComponent(pathname.split('/').pop() || '');
}

function getHierarchyStorageKey(url: string): string {
    return `${HIERARCHY_STORAGE_KEY_PREFIX}${url}`;
}

function readPersistedHierarchy(url: string): CachedHierarchyEntry | undefined {
    const storage = getWsiSessionStorage();
    if (!storage) {
        return undefined;
    }

    try {
        const storageKey = getHierarchyStorageKey(url);
        const raw = storage.getItem(storageKey);
        if (!raw) {
            return undefined;
        }

        const parsed = JSON.parse(raw) as {
            expiresAt?: number;
            data?: PatientHierarchy;
        };
        if (
            !parsed ||
            typeof parsed.expiresAt !== 'number' ||
            !parsed.data ||
            parsed.expiresAt <= Date.now()
        ) {
            storage.removeItem(storageKey);
            return undefined;
        }

        return {
            expiresAt: parsed.expiresAt,
            promise: Promise.resolve(
                parsed.data
            ),
        };
    } catch (_) {
        return undefined;
    }
}

function persistHierarchy(
    url: string,
    expiresAt: number,
    hierarchy: PatientHierarchy
): void {
    const storage = getWsiSessionStorage();
    if (!storage) {
        return;
    }

    try {
        const storageKey = getHierarchyStorageKey(url);
        storage.setItem(
            storageKey,
            JSON.stringify({
                expiresAt,
                data: hierarchy,
            })
        );
    } catch (_) {
        // Ignore storage quota or serialization failures.
    }
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

function getOrCreateHierarchyRequest(url: string): Promise<PatientHierarchy> {
    const now = Date.now();
    const cached = hierarchyCache.get(url);
    if (cached && cached.expiresAt > now) {
        return cached.promise;
    }

    const persisted = readPersistedHierarchy(url);
    if (persisted) {
        hierarchyCache.set(url, persisted);
        return persisted.promise;
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
            const payload = (await response.json()) as WsiV2Hierarchy | PatientHierarchy;
            const hierarchy =
                'sampleGroups' in payload
                    ? normalizeV2Hierarchy(
                          payload,
                          patientIdFromHierarchyUrl(url)
                      )
                    : payload;
            persistHierarchy(url, expiresAt, hierarchy);
            return hierarchy;
        })
        .catch(error => {
            const current = hierarchyCache.get(url);
            if (current?.promise === promise) {
                hierarchyCache.delete(url);
            }
            throw error;
        });

    hierarchyCache.set(url, {
        expiresAt,
        promise,
    });
    return promise;
}

export function seedPatientHierarchyCache(
    url: string,
    hierarchy: PatientHierarchy
): void {
    const expiresAt = Date.now() + HIERARCHY_CACHE_TTL_MS;
    const cloned = clonePatientHierarchy(hierarchy);
    hierarchyCache.set(url, {
        expiresAt,
        promise: Promise.resolve(cloned),
    });
    persistHierarchy(url, expiresAt, cloned);
}

export function seedPatientHierarchyCachePromise(
    url: string,
    hierarchyPromise: Promise<PatientHierarchy>
): void {
    const expiresAt = Date.now() + HIERARCHY_CACHE_TTL_MS;
    const promise = hierarchyPromise
        .then(hierarchy => {
            const cloned = clonePatientHierarchy(hierarchy);
            persistHierarchy(url, expiresAt, cloned);
            return cloned;
        })
        .catch(error => {
            const current = hierarchyCache.get(url);
            if (current?.promise === promise) {
                hierarchyCache.delete(url);
            }
            throw error;
        });

    hierarchyCache.set(url, {
        expiresAt,
        promise,
    });

    // Keep rejection observable for awaiters while handling unused prefetch work.
    promise.catch(() => undefined);
}

export async function fetchPatientHierarchyReadOnly(
    url: string,
    signal?: AbortSignal
): Promise<PatientHierarchy> {
    return wrapWithAbort(getOrCreateHierarchyRequest(url), signal);
}

export function hasCachedPatientHierarchy(url: string): boolean {
    const now = Date.now();
    const cached = hierarchyCache.get(url);
    return (
        (!!cached && cached.expiresAt > now) || !!readPersistedHierarchy(url)
    );
}

export function clearPatientHierarchyCache() {
    hierarchyCache.clear();
    const storage = getWsiSessionStorage();
    if (!storage) {
        return;
    }

    try {
        for (let index = storage.length - 1; index >= 0; index -= 1) {
            const key = storage.key(index);
            if (key?.startsWith(HIERARCHY_STORAGE_KEY_PREFIX)) {
                storage.removeItem(key);
            }
        }
    } catch (_) {
        // Ignore storage access failures.
    }
}

export function clearPatientHierarchyCacheEntry(url: string): void {
    hierarchyCache.delete(url);
    try {
        getWsiSessionStorage()?.removeItem(getHierarchyStorageKey(url));
    } catch (_) {
        // Ignore storage access failures.
    }
}
