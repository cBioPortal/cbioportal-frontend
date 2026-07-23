import {
    buildCnaBySample,
    buildMutationFrequencyQuery,
    buildMutationMaps,
    buildStructuralVariantBySample,
    MutationFrequencyQuery,
    SampleIdentifier,
} from './wsiDataMergeUtils';
import {
    CNADetail,
    MutationDetail,
    Sample,
    StructuralVariantDetail,
} from './wsiViewerTypes';

type ClinicalDataRecord = {
    sampleId: string;
    clinicalAttributeId: string;
    value: string;
};

type MutationCountRecord = {
    entrezGeneId: number;
    proteinPosStart: number;
    proteinPosEnd: number;
    count: number;
};

const MOLECULAR_PROFILE_CACHE_TTL_MS = 5 * 60 * 1000;
const WSI_CBIOPORTAL_REQUEST_CACHE_TTL_MS = 5 * 60 * 1000;

type CachedMolecularProfileEntry = {
    expiresAt: number;
    promise: Promise<string | null>;
};

const molecularProfileCache = new Map<string, CachedMolecularProfileEntry>();

type CachedRequestEntry<T> = {
    expiresAt: number;
    promise: Promise<T>;
};

const clinicalDataRequestCache = new Map<
    string,
    CachedRequestEntry<ClinicalDataRecord[] | null>
>();
const mutationDataRequestCache = new Map<
    string,
    CachedRequestEntry<{
        allMutsBySample: Map<string, Array<{ token: string; vaf: number }>>;
        detailsBySample: Map<string, Map<string, MutationDetail>>;
    } | null>
>();
const cnaDataRequestCache = new Map<
    string,
    CachedRequestEntry<Map<string, CNADetail[]> | null>
>();
const structuralVariantDataRequestCache = new Map<
    string,
    CachedRequestEntry<Map<string, StructuralVariantDetail[]> | null>
>();
const mutationFrequencyRequestCache = new Map<
    string,
    CachedRequestEntry<{ counts: MutationCountRecord[]; total: number } | null>
>();

function cloneCachedValue<T>(value: T): T {
    if (
        value == null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
    ) {
        return value;
    }

    if (typeof structuredClone === 'function') {
        return structuredClone(value) as T;
    }

    if (Array.isArray(value)) {
        const cloned = new Array(value.length);
        for (let index = 0; index < value.length; index += 1) {
            cloned[index] = cloneCachedValue(value[index]);
        }
        return cloned as T;
    }

    if (value instanceof Map) {
        const cloned = new Map();
        value.forEach((mapValue, key) => {
            cloned.set(key, cloneCachedValue(mapValue));
        });
        return cloned as T;
    }

    if (typeof value === 'object') {
        const cloned: Record<string, unknown> = {};
        const entries = Object.entries(value as Record<string, unknown>);
        for (let index = 0; index < entries.length; index += 1) {
            const [key, objectValue] = entries[index];
            cloned[key] = cloneCachedValue(objectValue);
        }
        return cloned as T;
    }

    return value;
}

function molecularProfileCacheKey(
    base: string,
    studyId: string,
    alterationType: string
) {
    return `${base}::${studyId}::${alterationType}`;
}

function buildSampleIdentifiersCacheKey(
    sampleIdentifiers: SampleIdentifier[]
): string {
    const deduped = new Set<string>();
    for (let index = 0; index < sampleIdentifiers.length; index += 1) {
        const { studyId, sampleId } = sampleIdentifiers[index];
        deduped.add(`${studyId}:${sampleId}`);
    }

    const ordered = Array.from(deduped);
    ordered.sort();

    let cacheKey = '';
    for (let index = 0; index < ordered.length; index += 1) {
        if (index > 0) {
            cacheKey += '|';
        }
        cacheKey += ordered[index];
    }

    return cacheKey;
}

function buildClinicalDataIdentifiers(sampleIdentifiers: SampleIdentifier[]) {
    const identifiers = new Array(sampleIdentifiers.length);
    for (let index = 0; index < sampleIdentifiers.length; index += 1) {
        const { studyId, sampleId } = sampleIdentifiers[index];
        identifiers[index] = {
            studyId,
            entityId: sampleId,
        };
    }
    return identifiers;
}

function buildSampleMolecularIdentifiers(
    sampleIdentifiers: SampleIdentifier[],
    molecularProfileId: string
) {
    const identifiers = new Array(sampleIdentifiers.length);
    for (let index = 0; index < sampleIdentifiers.length; index += 1) {
        identifiers[index] = {
            molecularProfileId,
            sampleId: sampleIdentifiers[index].sampleId,
        };
    }
    return identifiers;
}

function buildSampleIds(sampleIdentifiers: SampleIdentifier[]) {
    const sampleIds = new Array(sampleIdentifiers.length);
    for (let index = 0; index < sampleIdentifiers.length; index += 1) {
        sampleIds[index] = sampleIdentifiers[index].sampleId;
    }
    return sampleIds;
}

function buildMutationFrequencyQueryKey(query: MutationFrequencyQuery[]) {
    let queryKey = '';
    for (let index = 0; index < query.length; index += 1) {
        if (index > 0) {
            queryKey += '|';
        }
        const item = query[index];
        queryKey += `${item.entrezGeneId}:${item.proteinPosStart}:${item.proteinPosEnd}`;
    }
    return queryKey;
}

function dedupeSampleIdentifiers(
    sampleIdentifiers: SampleIdentifier[]
): SampleIdentifier[] {
    const deduped = new Map<string, SampleIdentifier>();

    for (let index = 0; index < sampleIdentifiers.length; index += 1) {
        const sampleIdentifier = sampleIdentifiers[index];
        deduped.set(
            `${sampleIdentifier.studyId}:${sampleIdentifier.sampleId}`,
            sampleIdentifier
        );
    }

    const ordered = Array.from(deduped.values());
    ordered.sort(
        (a, b) =>
            a.studyId.localeCompare(b.studyId) ||
            a.sampleId.localeCompare(b.sampleId, undefined, {
                numeric: true,
                sensitivity: 'base',
            })
    );
    return ordered;
}

function getCachedRequest<T>(
    cache: Map<string, CachedRequestEntry<T>>,
    cacheKey: string,
    factory: () => Promise<T>
): Promise<T> {
    const now = Date.now();
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
        return cached.promise;
    }

    const promise = factory().catch(error => {
        const current = cache.get(cacheKey);
        if (current?.promise === promise) {
            cache.delete(cacheKey);
        }
        throw error;
    });

    cache.set(cacheKey, {
        expiresAt: now + WSI_CBIOPORTAL_REQUEST_CACHE_TTL_MS,
        promise,
    });
    return promise;
}

export async function postJson<T>(
    url: string,
    body: unknown
): Promise<T | null> {
    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!resp.ok) return null;
    return resp.json() as Promise<T>;
}

async function getFirstMolecularProfileId(
    base: string,
    studyId: string,
    alterationType: string
): Promise<string | null> {
    const cacheKey = molecularProfileCacheKey(base, studyId, alterationType);
    const now = Date.now();
    const cached = molecularProfileCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
        return cached.promise;
    }

    const request = fetch(
        `${base}/api/studies/${encodeURIComponent(
            studyId
        )}/molecular-profiles` +
            `?molecularAlterationType=${alterationType}&projection=SUMMARY`
    )
        .then(async resp => {
            if (!resp.ok) return null;
            const profiles: Array<{
                molecularProfileId: string;
                molecularAlterationType?: string;
            }> = await resp.json();
            let firstProfileId: string | null = null;
            for (let index = 0; index < profiles.length; index += 1) {
                const profile = profiles[index];
                if (firstProfileId == null) {
                    firstProfileId = profile.molecularProfileId;
                }
                if (profile.molecularAlterationType === alterationType) {
                    return profile.molecularProfileId;
                }
            }
            return firstProfileId;
        })
        .catch(error => {
            const current = molecularProfileCache.get(cacheKey);
            if (current?.promise === request) {
                molecularProfileCache.delete(cacheKey);
            }
            throw error;
        });

    molecularProfileCache.set(cacheKey, {
        expiresAt: now + MOLECULAR_PROFILE_CACHE_TTL_MS,
        promise: request,
    });
    return request;
}

export function clearMolecularProfileIdCache() {
    molecularProfileCache.clear();
}

export function clearWsiCbioportalRequestCaches() {
    clinicalDataRequestCache.clear();
    mutationDataRequestCache.clear();
    cnaDataRequestCache.clear();
    structuralVariantDataRequestCache.clear();
    mutationFrequencyRequestCache.clear();
}

export async function fetchClinicalDataRecordsReadOnly(
    base: string,
    sampleIdentifiers: SampleIdentifier[]
): Promise<ClinicalDataRecord[] | null> {
    const dedupedSampleIdentifiers = dedupeSampleIdentifiers(sampleIdentifiers);
    if (dedupedSampleIdentifiers.length === 0) {
        return [];
    }
    const cacheKey = [
        base,
        'clinical-data',
        buildSampleIdentifiersCacheKey(dedupedSampleIdentifiers),
    ].join('::');

    const response = await getCachedRequest(
        clinicalDataRequestCache,
        cacheKey,
        async () => {
            const identifiers = buildClinicalDataIdentifiers(
                dedupedSampleIdentifiers
            );
            const resp = await fetch(
                `${base}/api/clinical-data/fetch?clinicalDataType=SAMPLE&projection=SUMMARY`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifiers }),
                }
            );
            if (!resp.ok) return null;

            const text = await resp.text();
            if (!text) return null;
            return JSON.parse(text) as ClinicalDataRecord[];
        }
    );

    return response;
}

export async function fetchClinicalDataRecords(
    base: string,
    sampleIdentifiers: SampleIdentifier[]
): Promise<ClinicalDataRecord[] | null> {
    return cloneCachedValue(
        await fetchClinicalDataRecordsReadOnly(base, sampleIdentifiers)
    );
}

export async function fetchMutationDataReadOnly(
    base: string,
    studyId: string,
    sampleIdentifiers: SampleIdentifier[]
): Promise<{
    allMutsBySample: Map<string, Array<{ token: string; vaf: number }>>;
    detailsBySample: Map<string, Map<string, MutationDetail>>;
} | null> {
    const dedupedSampleIdentifiers = dedupeSampleIdentifiers(sampleIdentifiers);
    if (dedupedSampleIdentifiers.length === 0) {
        return {
            allMutsBySample: new Map(),
            detailsBySample: new Map(),
        };
    }
    const cacheKey = [
        base,
        studyId,
        'mutation-data',
        buildSampleIdentifiersCacheKey(dedupedSampleIdentifiers),
    ].join('::');

    const response = await getCachedRequest(
        mutationDataRequestCache,
        cacheKey,
        async () => {
            const molecularProfileId = await getFirstMolecularProfileId(
                base,
                studyId,
                'MUTATION_EXTENDED'
            );
            if (!molecularProfileId) return null;

            const sampleMolecularIdentifiers = buildSampleMolecularIdentifiers(
                dedupedSampleIdentifiers,
                molecularProfileId
            );

            const mutations: Array<{
                sampleId: string;
                entrezGeneId?: number;
                gene?: { hugoGeneSymbol: string; entrezGeneId?: number } | null;
                proteinChange: string;
                mutationType?: string;
                driverFilterAnnotation?: string;
                tumorAltCount?: number;
                tumorRefCount?: number;
                proteinPosStart?: number;
                proteinPosEnd?: number;
            }> | null = await postJson(
                `${base}/api/mutations/fetch?projection=DETAILED`,
                { sampleMolecularIdentifiers }
            );
            if (!mutations) return null;

            return buildMutationMaps(mutations);
        }
    );

    return response;
}

export async function fetchMutationData(
    base: string,
    studyId: string,
    sampleIdentifiers: SampleIdentifier[]
): Promise<{
    allMutsBySample: Map<string, Array<{ token: string; vaf: number }>>;
    detailsBySample: Map<string, Map<string, MutationDetail>>;
} | null> {
    return cloneCachedValue(
        await fetchMutationDataReadOnly(base, studyId, sampleIdentifiers)
    );
}

export async function fetchCnaDataReadOnly(
    base: string,
    studyId: string,
    sampleIdentifiers: SampleIdentifier[]
): Promise<Map<string, CNADetail[]> | null> {
    const dedupedSampleIdentifiers = dedupeSampleIdentifiers(sampleIdentifiers);
    if (dedupedSampleIdentifiers.length === 0) {
        return new Map();
    }
    const cacheKey = [
        base,
        studyId,
        'cna-data',
        buildSampleIdentifiersCacheKey(dedupedSampleIdentifiers),
    ].join('::');

    const response = await getCachedRequest(
        cnaDataRequestCache,
        cacheKey,
        async () => {
            const profileId = await getFirstMolecularProfileId(
                base,
                studyId,
                'COPY_NUMBER_ALTERATION'
            );
            if (!profileId) return null;

            const sampleIds = buildSampleIds(dedupedSampleIdentifiers);
            const data: Array<{
                sampleId: string;
                value: number;
                entrezGeneId?: number;
                gene?: {
                    entrezGeneId?: number;
                    hugoGeneSymbol: string;
                    cytoband?: string;
                } | null;
            }> | null = await postJson(
                `${base}/api/molecular-profiles/${encodeURIComponent(
                    profileId
                )}/molecular-data/fetch?projection=DETAILED`,
                { sampleIds }
            );
            if (!data) return null;

            const countRows: Array<{
                alteration: number;
                cytoband?: string;
                entrezGeneId: number;
                hugoGeneSymbol: string;
                numberOfAlteredCases?: number;
                numberOfProfiledCases?: number;
                totalCount?: number;
            }> | null = await postJson(`${base}/api/cna-genes/fetch`, {
                studyIds: [studyId],
                alterationFilter: {
                    copyNumberAlterationEventTypes: {
                        AMP: true,
                        HOMDEL: true,
                        GAIN: true,
                        HETLOSS: true,
                    },
                },
            });

            return buildCnaBySample(data, countRows);
        }
    );

    return response;
}

export async function fetchCnaData(
    base: string,
    studyId: string,
    sampleIdentifiers: SampleIdentifier[]
): Promise<Map<string, CNADetail[]> | null> {
    return cloneCachedValue(
        await fetchCnaDataReadOnly(base, studyId, sampleIdentifiers)
    );
}

export async function fetchStructuralVariantDataReadOnly(
    base: string,
    studyId: string,
    sampleIdentifiers: SampleIdentifier[]
): Promise<Map<string, StructuralVariantDetail[]> | null> {
    const dedupedSampleIdentifiers = dedupeSampleIdentifiers(sampleIdentifiers);
    if (dedupedSampleIdentifiers.length === 0) {
        return new Map();
    }
    const cacheKey = [
        base,
        studyId,
        'structural-variant-data',
        buildSampleIdentifiersCacheKey(dedupedSampleIdentifiers),
    ].join('::');

    const response = await getCachedRequest(
        structuralVariantDataRequestCache,
        cacheKey,
        async () => {
            const profileId = await getFirstMolecularProfileId(
                base,
                studyId,
                'STRUCTURAL_VARIANT'
            );
            if (!profileId) return null;

            const rows: Array<{
                sampleId: string;
                site1HugoSymbol?: string;
                site2HugoSymbol?: string;
                site1EntrezGeneId?: number;
                site2EntrezGeneId?: number;
                variantClass?: string;
                annotation?: string;
                breakpointType?: string;
                connectionType?: string;
                eventInfo?: string;
                length?: number;
                comments?: string;
                svStatus?: string;
                dnaSupport?: string;
                rnaSupport?: string;
                tumorVariantCount?: number;
                normalVariantCount?: number;
                tumorReadCount?: number;
                normalReadCount?: number;
                tumorPairedEndReadCount?: number;
                tumorSplitReadCount?: number;
                site1Description?: string;
                site2Description?: string;
                site1Chromosome?: string;
                site1Position?: number;
                site2Chromosome?: string;
                site2Position?: number;
                ncbiBuild?: string;
            }> | null = await postJson(`${base}/api/structural-variant/fetch`, {
                sampleMolecularIdentifiers: buildSampleMolecularIdentifiers(
                    dedupedSampleIdentifiers,
                    profileId
                ),
            });
            if (!rows) return null;

            return buildStructuralVariantBySample(rows);
        }
    );

    return response;
}

export async function fetchStructuralVariantData(
    base: string,
    studyId: string,
    sampleIdentifiers: SampleIdentifier[]
): Promise<Map<string, StructuralVariantDetail[]> | null> {
    return cloneCachedValue(
        await fetchStructuralVariantDataReadOnly(
            base,
            studyId,
            sampleIdentifiers
        )
    );
}

export async function fetchMutationFrequencyDataReadOnly(
    base: string,
    studyId: string,
    samples: Sample[]
): Promise<{ counts: MutationCountRecord[]; total: number } | null> {
    const query: MutationFrequencyQuery[] = buildMutationFrequencyQuery(
        samples
    );
    query.sort(
        (a, b) =>
            a.entrezGeneId - b.entrezGeneId ||
            a.proteinPosStart - b.proteinPosStart ||
            a.proteinPosEnd - b.proteinPosEnd
    );
    if (!query.length) return null;

    const queryKey = buildMutationFrequencyQueryKey(query);
    const cacheKey = [base, studyId, 'mutation-frequency', queryKey].join('::');

    const response = await getCachedRequest(
        mutationFrequencyRequestCache,
        cacheKey,
        async () => {
            const [studyResp, counts] = await Promise.all([
                fetch(`${base}/api/studies/${encodeURIComponent(studyId)}`),
                postJson<MutationCountRecord[]>(
                    `${base}/api/mutation-counts-by-position/fetch`,
                    query
                ),
            ]);
            if (!studyResp.ok || !counts) return null;

            const study: {
                sequencedSampleCount?: number;
            } = await studyResp.json();
            const total = study.sequencedSampleCount ?? 0;
            if (!total) return null;

            return { counts, total };
        }
    );

    return response;
}

export async function fetchMutationFrequencyData(
    base: string,
    studyId: string,
    samples: Sample[]
): Promise<{ counts: MutationCountRecord[]; total: number } | null> {
    return cloneCachedValue(
        await fetchMutationFrequencyDataReadOnly(base, studyId, samples)
    );
}
