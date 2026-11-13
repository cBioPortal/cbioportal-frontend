import {
    buildCnaBySample,
    buildMutationsBySample,
    buildStructuralVariantBySample,
    CnaApiRecord,
    CopyNumberCountRecord,
    MutationApiRecord,
    SampleIdentifier,
    StructuralVariantApiRecord,
    VariantCountRecord,
} from './wsiDataMergeUtils';
import {
    CNADetail,
    MutationDetail,
    StructuralVariantDetail,
    WsiSampleClinicalDatum,
} from './wsiViewerTypes';
import { getWsiViewerRuntime } from './wsiViewerConfig';

// Requests go to the host's portal API URLs through the host's fetch.

/** Portal API URL for `path`, which may carry a query string. */
function portalApiUrl(path: string): string {
    const queryStart = path.indexOf('?');
    const { buildApiUrl } = getWsiViewerRuntime();
    return queryStart < 0
        ? buildApiUrl(path)
        : buildApiUrl(path.slice(0, queryStart)) + path.slice(queryStart);
}

function portalFetch(input: string, init?: RequestInit): Promise<Response> {
    return getWsiViewerRuntime().fetchImpl(input, init);
}

const WSI_CBIOPORTAL_REQUEST_CACHE_TTL_MS = 5 * 60 * 1000;

type CachedRequestEntry<T> = {
    expiresAt: number;
    promise: Promise<T>;
};

/** HTTP failures are distinct from a successful response with no data. */
export class WsiCbioportalHttpError extends Error {
    public readonly status: number;
    public readonly url: string;

    constructor(url: string, status: number) {
        super(`cBioPortal request failed (${status}): ${url}`);
        this.name = 'WsiCbioportalHttpError';
        this.status = status;
        this.url = url;
    }
}

/** A study profile as the portal API returns it. */
export type WsiMolecularProfileRecord = {
    molecularProfileId: string;
    molecularAlterationType?: string;
    datatype?: string;
};

/**
 * The study's profiles the viewer reads, each null when the study has none:
 * its mutation profile, its discrete copy-number profile and its structural
 * variant profile.
 */
export type WsiStudyMolecularProfiles = {
    mutation: string | null;
    discreteCna: string | null;
    structuralVariant: string | null;
};

/** A sample's mutations; `profileId` is null when the study has none. */
export type WsiMutationData = {
    profileId: string | null;
    bySample: Map<string, MutationDetail[]>;
};

const molecularProfilesRequestCache = new Map<
    string,
    CachedRequestEntry<WsiStudyMolecularProfiles>
>();
const clinicalDataRequestCache = new Map<
    string,
    CachedRequestEntry<WsiSampleClinicalDatum[]>
>();
const mutationDataRequestCache = new Map<
    string,
    CachedRequestEntry<WsiMutationData>
>();
const cnaDataRequestCache = new Map<
    string,
    CachedRequestEntry<Map<string, CNADetail[]> | null>
>();
const structuralVariantDataRequestCache = new Map<
    string,
    CachedRequestEntry<Map<string, StructuralVariantDetail[]> | null>
>();
const copyNumberCountRequestCache = new Map<
    string,
    CachedRequestEntry<CopyNumberCountRecord | undefined>
>();
const variantCountRequestCache = new Map<
    string,
    CachedRequestEntry<VariantCountRecord | undefined>
>();

function dedupeSampleIdentifiers(
    sampleIdentifiers: SampleIdentifier[]
): SampleIdentifier[] {
    const deduped = new Map<string, SampleIdentifier>();
    for (const sampleIdentifier of sampleIdentifiers) {
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

function sampleIdentifiersCacheKey(
    sampleIdentifiers: SampleIdentifier[]
): string {
    return sampleIdentifiers
        .map(({ studyId, sampleId }) => `${studyId}:${sampleId}`)
        .join('|');
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

    // A failed request is evicted, so the next call asks again.
    const promise = factory().catch(error => {
        if (cache.get(cacheKey)?.promise === promise) {
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

/**
 * Per-key cached counts: the keys not cached yet are requested in one batch,
 * and each key keeps its own cache entry, so a later request asks only for
 * new keys.
 */
async function fetchCachedCounts<Q, R>(
    cache: Map<string, CachedRequestEntry<R | undefined>>,
    queries: Q[],
    queryKey: (query: Q) => string,
    resultKey: (result: R) => string,
    request: (queries: Q[]) => Promise<R[]>
): Promise<Map<string, R>> {
    const now = Date.now();
    const missing = new Map<string, Q>();
    const pending = new Map<string, Promise<R | undefined>>();
    for (const query of queries) {
        const key = queryKey(query);
        const cached = cache.get(key);
        if (cached && cached.expiresAt > now) {
            pending.set(key, cached.promise);
        } else {
            missing.set(key, query);
        }
    }

    if (missing.size > 0) {
        const batch = request(Array.from(missing.values())).then(results => {
            const byKey = new Map<string, R>();
            for (const result of results) {
                byKey.set(resultKey(result), result);
            }
            return byKey;
        });
        missing.forEach((_query, key) => {
            const promise = batch.then(byKey => byKey.get(key));
            promise.catch(() => {
                if (cache.get(key)?.promise === promise) {
                    cache.delete(key);
                }
            });
            cache.set(key, {
                expiresAt: now + WSI_CBIOPORTAL_REQUEST_CACHE_TTL_MS,
                promise,
            });
            pending.set(key, promise);
        });
    }

    const counts = new Map<string, R>();
    const keys = Array.from(pending.keys());
    const results = await Promise.all(keys.map(key => pending.get(key)!));
    keys.forEach((key, index) => {
        const result = results[index];
        if (result !== undefined) {
            counts.set(key, result);
        }
    });
    return counts;
}

async function readJsonArray<T>(url: string, init?: RequestInit): Promise<T[]> {
    const resp = await portalFetch(url, init);
    if (!resp.ok) {
        throw new WsiCbioportalHttpError(url, resp.status);
    }
    const body = await resp.json();
    if (!Array.isArray(body)) {
        throw new Error(`cBioPortal response was not an array: ${url}`);
    }
    return body as T[];
}

function postJsonArray<T>(url: string, body: unknown): Promise<T[]> {
    return readJsonArray<T>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

/**
 * The study's first mutation profile, first discrete copy-number profile and
 * first structural variant profile, as the patient view picks them.
 */
export function selectStudyMolecularProfiles(
    profiles: ReadonlyArray<WsiMolecularProfileRecord>
): WsiStudyMolecularProfiles {
    const find = (match: (profile: WsiMolecularProfileRecord) => boolean) =>
        profiles.find(match)?.molecularProfileId ?? null;
    return {
        mutation: find(
            profile => profile.molecularAlterationType === 'MUTATION_EXTENDED'
        ),
        discreteCna: find(
            profile =>
                profile.molecularAlterationType === 'COPY_NUMBER_ALTERATION' &&
                profile.datatype === 'DISCRETE'
        ),
        structuralVariant: find(
            profile => profile.molecularAlterationType === 'STRUCTURAL_VARIANT'
        ),
    };
}

/**
 * The study's molecular profiles, requested once per study and cached. Rejects
 * when the request fails.
 */
export function fetchStudyMolecularProfiles(
    studyId: string
): Promise<WsiStudyMolecularProfiles> {
    return getCachedRequest(molecularProfilesRequestCache, studyId, async () =>
        selectStudyMolecularProfiles(
            await readJsonArray<WsiMolecularProfileRecord>(
                portalApiUrl(
                    `api/studies/${encodeURIComponent(
                        studyId
                    )}/molecular-profiles`
                ) + '?projection=SUMMARY'
            )
        )
    );
}

export function clearWsiCbioportalRequestCaches() {
    molecularProfilesRequestCache.clear();
    clinicalDataRequestCache.clear();
    mutationDataRequestCache.clear();
    cnaDataRequestCache.clear();
    structuralVariantDataRequestCache.clear();
    copyNumberCountRequestCache.clear();
    variantCountRequestCache.clear();
}

/** The samples' clinical data; null when the request fails. */
export async function fetchClinicalDataRecords(
    sampleIdentifiers: SampleIdentifier[]
): Promise<WsiSampleClinicalDatum[] | null> {
    const samples = dedupeSampleIdentifiers(sampleIdentifiers);
    if (samples.length === 0) {
        return [];
    }

    return getCachedRequest(
        clinicalDataRequestCache,
        sampleIdentifiersCacheKey(samples),
        () =>
            postJsonArray<WsiSampleClinicalDatum>(
                portalApiUrl(
                    'api/clinical-data/fetch?clinicalDataType=SAMPLE&projection=SUMMARY'
                ),
                {
                    identifiers: samples.map(({ studyId, sampleId }) => ({
                        studyId,
                        entityId: sampleId,
                    })),
                }
            )
    ).catch(error => {
        console.debug('[WSI] sample clinical data unavailable', error);
        return null;
    });
}

/**
 * The samples' mutations in the study's mutation profile. Makes no mutation
 * request when the study has no mutation profile. Rejects when a request
 * fails.
 */
export function fetchMutationData(
    studyId: string,
    sampleIdentifiers: SampleIdentifier[]
): Promise<WsiMutationData> {
    const samples = dedupeSampleIdentifiers(sampleIdentifiers);
    return getCachedRequest(
        mutationDataRequestCache,
        `${studyId}::${sampleIdentifiersCacheKey(samples)}`,
        async () => {
            const { mutation: profileId } = await fetchStudyMolecularProfiles(
                studyId
            );
            if (!profileId || samples.length === 0) {
                return { profileId, bySample: new Map() };
            }
            const mutations = await postJsonArray<MutationApiRecord>(
                portalApiUrl('api/mutations/fetch?projection=DETAILED'),
                {
                    sampleMolecularIdentifiers: samples.map(({ sampleId }) => ({
                        molecularProfileId: profileId,
                        sampleId,
                    })),
                }
            );
            return { profileId, bySample: buildMutationsBySample(mutations) };
        }
    );
}

function copyNumberCountKey(
    profileId: string,
    entrezGeneId: number,
    alteration: number
): string {
    return `${profileId}::${entrezGeneId}::${alteration}`;
}

/**
 * The samples' copy-number alterations in the study's discrete copy-number
 * profile, with how many of the profile's samples have the same alteration.
 * Null when the study has no such profile or the request fails.
 */
export function fetchCnaData(
    studyId: string,
    sampleIdentifiers: SampleIdentifier[]
): Promise<Map<string, CNADetail[]> | null> {
    const samples = dedupeSampleIdentifiers(sampleIdentifiers);
    return getCachedRequest(
        cnaDataRequestCache,
        `${studyId}::${sampleIdentifiersCacheKey(samples)}`,
        async () => {
            const {
                discreteCna: profileId,
            } = await fetchStudyMolecularProfiles(studyId);
            if (!profileId || samples.length === 0) return null;

            const rows = (
                await postJsonArray<CnaApiRecord>(
                    portalApiUrl(
                        `api/molecular-profiles/${encodeURIComponent(
                            profileId
                        )}/molecular-data/fetch?projection=DETAILED`
                    ),
                    { sampleIds: samples.map(({ sampleId }) => sampleId) }
                )
            ).filter(row => row.value !== 0);
            if (rows.length === 0) return new Map<string, CNADetail[]>();

            const counts = await fetchCopyNumberCounts(profileId, rows);
            return buildCnaBySample(rows, (entrezGeneId, alteration) =>
                counts.get(
                    copyNumberCountKey(profileId, entrezGeneId, alteration)
                )
            );
        }
    ).catch(error => {
        console.debug('[WSI] copy-number data unavailable', error);
        return null;
    });
}

/** Study counts of the rows' gene alterations; empty when they fail. */
async function fetchCopyNumberCounts(
    profileId: string,
    rows: CnaApiRecord[]
): Promise<Map<string, CopyNumberCountRecord>> {
    const queries: Array<{ entrezGeneId: number; alteration: number }> = [];
    for (const row of rows) {
        const entrezGeneId = row.gene?.entrezGeneId ?? row.entrezGeneId;
        if (entrezGeneId != null) {
            queries.push({ entrezGeneId, alteration: row.value });
        }
    }
    try {
        return await fetchCachedCounts<
            { entrezGeneId: number; alteration: number },
            CopyNumberCountRecord
        >(
            copyNumberCountRequestCache,
            queries,
            query =>
                copyNumberCountKey(
                    profileId,
                    query.entrezGeneId,
                    query.alteration
                ),
            count =>
                copyNumberCountKey(
                    profileId,
                    count.entrezGeneId,
                    count.alteration
                ),
            missing =>
                postJsonArray<CopyNumberCountRecord>(
                    portalApiUrl(
                        `api/molecular-profiles/${encodeURIComponent(
                            profileId
                        )}/discrete-copy-number-counts/fetch`
                    ),
                    missing
                )
        );
    } catch (error) {
        console.debug('[WSI] copy-number counts unavailable', error);
        return new Map();
    }
}

/**
 * The samples' structural variants in the study's structural variant
 * profile. Null when the study has no such profile or the request fails.
 */
export function fetchStructuralVariantData(
    studyId: string,
    sampleIdentifiers: SampleIdentifier[]
): Promise<Map<string, StructuralVariantDetail[]> | null> {
    const samples = dedupeSampleIdentifiers(sampleIdentifiers);
    return getCachedRequest(
        structuralVariantDataRequestCache,
        `${studyId}::${sampleIdentifiersCacheKey(samples)}`,
        async () => {
            const {
                structuralVariant: profileId,
            } = await fetchStudyMolecularProfiles(studyId);
            if (!profileId || samples.length === 0) return null;

            const rows = await postJsonArray<StructuralVariantApiRecord>(
                portalApiUrl('api/structural-variant/fetch'),
                {
                    sampleMolecularIdentifiers: samples.map(({ sampleId }) => ({
                        molecularProfileId: profileId,
                        sampleId,
                    })),
                }
            );
            return buildStructuralVariantBySample(rows);
        }
    ).catch(error => {
        console.debug('[WSI] structural variant data unavailable', error);
        return null;
    });
}

export function variantCountKey(
    profileId: string,
    entrezGeneId: number,
    keyword: string
): string {
    return `${profileId}::${entrezGeneId}::${keyword}`;
}

/**
 * How many samples of the mutation profile have each mutation's variant (the
 * portal's mutation keyword, e.g. "KRAS G12 missense"), keyed by
 * `variantCountKey`. Mutations without a keyword are not counted.
 */
export function fetchVariantCounts(
    profileId: string,
    mutations: ReadonlyArray<MutationDetail>
): Promise<Map<string, VariantCountRecord>> {
    const queries = new Map<
        string,
        { entrezGeneId: number; keyword: string }
    >();
    for (const mutation of mutations) {
        if (mutation.entrezGeneId != null && mutation.keyword) {
            queries.set(
                variantCountKey(
                    profileId,
                    mutation.entrezGeneId,
                    mutation.keyword
                ),
                {
                    entrezGeneId: mutation.entrezGeneId,
                    keyword: mutation.keyword,
                }
            );
        }
    }
    if (queries.size === 0) {
        return Promise.resolve(new Map());
    }
    return fetchCachedCounts<
        { entrezGeneId: number; keyword: string },
        VariantCountRecord
    >(
        variantCountRequestCache,
        Array.from(queries.values()),
        query => variantCountKey(profileId, query.entrezGeneId, query.keyword),
        count => variantCountKey(profileId, count.entrezGeneId, count.keyword),
        missing =>
            postJsonArray<VariantCountRecord>(
                portalApiUrl(
                    `api/molecular-profiles/${encodeURIComponent(
                        profileId
                    )}/variant-counts/fetch`
                ),
                missing
            )
    );
}
