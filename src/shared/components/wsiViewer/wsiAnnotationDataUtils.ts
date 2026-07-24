import {
    buildCivicEntry,
    getCivicGenes,
    getCivicVariants,
    ICivicEntry,
    ICivicGeneIndex,
    ICivicVariantIndex,
} from 'cbioportal-utils';
import { getCivicCNAVariants } from 'shared/lib/CivicUtils';
import {
    buildCivicMutationSpecs,
    buildOncoKbCnaItems,
    buildOncoKbMutationItems,
    buildOncoKbStructuralVariantItems,
    cnaOncoKbAlteration,
    cnaOncoKbId,
    mutationOncoKbId,
    structuralVariantOncoKbId,
} from './wsiAnnotationFetchUtils';
import { parseMutationToken } from './wsiMolecularUtils';
import { postJson } from './wsiCbioportalDataUtils';
import {
    CNADetail,
    MutationDetail,
    StructuralVariantDetail,
} from './wsiViewerTypes';

const WSI_ANNOTATION_REQUEST_CACHE_TTL_MS = 5 * 60 * 1000;

type CachedRequestEntry<T> = {
    expiresAt: number;
    promise: Promise<T>;
};

const oncoKbMutationAnnotationRequestCache = new Map<
    string,
    CachedRequestEntry<OncoKbMutationAnnotation[] | null>
>();
const civicMutationAnnotationRequestCache = new Map<
    string,
    CachedRequestEntry<CivicMutationAnnotation[] | null>
>();
const oncoKbCnaAnnotationRequestCache = new Map<
    string,
    CachedRequestEntry<OncoKbCnaAnnotation[] | null>
>();
const civicCnaAnnotationRequestCache = new Map<
    string,
    CachedRequestEntry<CivicCnaAnnotation[] | null>
>();
const oncoKbStructuralVariantAnnotationRequestCache = new Map<
    string,
    CachedRequestEntry<OncoKbStructuralVariantAnnotation[] | null>
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
        expiresAt: now + WSI_ANNOTATION_REQUEST_CACHE_TTL_MS,
        promise,
    });
    return promise;
}

function buildOrderedListCacheKey(values: Array<string | number>): string {
    const deduped = new Set<string>();
    for (let index = 0; index < values.length; index += 1) {
        deduped.add(String(values[index]));
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

function buildOrderedListCacheKeyFromItems<T>(
    items: T[],
    getValue: (item: T) => string | number
): string {
    const values = new Array<string | number>(items.length);
    for (let index = 0; index < items.length; index += 1) {
        values[index] = getValue(items[index]);
    }
    return buildOrderedListCacheKey(values);
}

function buildUniqueSortedStringList<T>(
    items: T[],
    getValue: (item: T) => string | undefined | null
): string[] {
    const deduped = new Set<string>();
    for (let index = 0; index < items.length; index += 1) {
        const value = getValue(items[index]);
        if (value) {
            deduped.add(value);
        }
    }

    const ordered = Array.from(deduped);
    ordered.sort();
    return ordered;
}

export type OncoKbMutationAnnotation = {
    id: string;
    oncogenic?: string;
    mutationEffect?: string;
    hotspot?: boolean;
    geneSummary?: string;
    variantSummary?: string;
    variantExist?: boolean;
};

export type CivicMutationAnnotation = {
    token: string;
    civicEntry: ICivicEntry | null;
    hasCivic: boolean;
};

export type OncoKbCnaAnnotation = {
    id: string;
    oncogenic?: string;
    mutationEffect?: string;
    geneSummary?: string;
    variantSummary?: string;
};

export type CivicCnaAnnotation = {
    gene: string;
    cnaValue: number;
    civicEntry: ICivicEntry | null;
    hasCivicVariants: boolean;
};

export type OncoKbStructuralVariantAnnotation = {
    id: string;
    oncogenic?: string;
    mutationEffect?: string;
    geneSummary?: string;
    variantSummary?: string;
};

export async function fetchOncoKbMutationAnnotationsReadOnly(
    tileOrigin: string,
    details: MutationDetail[]
): Promise<OncoKbMutationAnnotation[] | null> {
    const queryableDetails = details.filter(detail => detail.entrezGeneId);
    if (!queryableDetails.length) return null;

    const items = buildOncoKbMutationItems(queryableDetails);
    if (!items.length) return null;

    const cacheKey = [
        tileOrigin,
        'oncokb-mutation',
        buildOrderedListCacheKeyFromItems(items, item => item.id),
    ].join('::');

    const annotations = await getCachedRequest(
        oncoKbMutationAnnotationRequestCache,
        cacheKey,
        async () => {
            let annotations: Array<{
                query: { id: string };
                oncogenic?: string;
                mutationEffect?: { knownEffect?: string };
                hotspot?: boolean;
                geneSummary?: string;
                variantSummary?: string;
                variantExist?: boolean;
            }>;
            try {
                annotations =
                    (await postJson<typeof annotations[0][]>(
                        `${tileOrigin}/api/oncokb/annotate`,
                        items
                    )) ?? [];
            } catch {
                return null;
            }

            return annotations.map(annotation => ({
                id: annotation.query.id,
                oncogenic: annotation.oncogenic,
                mutationEffect: annotation.mutationEffect?.knownEffect,
                hotspot: annotation.hotspot,
                geneSummary: annotation.geneSummary,
                variantSummary: annotation.variantSummary,
                variantExist: annotation.variantExist,
            }));
        }
    );

    return annotations;
}

export async function fetchOncoKbMutationAnnotations(
    tileOrigin: string,
    details: MutationDetail[]
): Promise<OncoKbMutationAnnotation[] | null> {
    return cloneCachedValue(
        await fetchOncoKbMutationAnnotationsReadOnly(tileOrigin, details)
    );
}

export async function fetchCivicMutationAnnotationsReadOnly(
    details: MutationDetail[]
): Promise<CivicMutationAnnotation[] | null> {
    if (!details.length) return null;

    const mutationSpecs = buildCivicMutationSpecs(details);
    if (!mutationSpecs.length) return null;

    const cacheKey = [
        'civic-mutation',
        buildOrderedListCacheKey(details.map(detail => detail.token)),
    ].join('::');

    const annotations = await getCachedRequest(
        civicMutationAnnotationRequestCache,
        cacheKey,
        async () => {
            let civicGenes: ICivicGeneIndex;
            let civicVariants: ICivicVariantIndex;
            try {
                civicGenes = await getCivicGenes(
                    buildUniqueSortedStringList(
                        mutationSpecs,
                        spec => spec.gene.hugoGeneSymbol
                    )
                );
                civicVariants = await getCivicVariants(civicGenes, mutationSpecs);
            } catch {
                return null;
            }

            return details.map(detail => {
                const { gene, variant } = parseMutationToken(detail.token);
                const proteinChange = variant.startsWith('p.')
                    ? variant.slice(2)
                    : variant;
                const geneEntry = civicGenes[gene];
                const variantEntry = civicVariants[gene]?.[proteinChange];
                if (!geneEntry || !variantEntry) {
                    return {
                        token: detail.token,
                        civicEntry: null,
                        hasCivic: false,
                    };
                }

                return {
                    token: detail.token,
                    civicEntry: buildCivicEntry(geneEntry, {
                        [proteinChange]: variantEntry,
                    }) as ICivicEntry,
                    hasCivic: true,
                };
            });
        }
    );

    return annotations;
}

export async function fetchCivicMutationAnnotations(
    details: MutationDetail[]
): Promise<CivicMutationAnnotation[] | null> {
    return cloneCachedValue(await fetchCivicMutationAnnotationsReadOnly(details));
}

export async function fetchOncoKbCnaAnnotationsReadOnly(
    tileOrigin: string,
    cnas: CNADetail[]
): Promise<OncoKbCnaAnnotation[] | null> {
    const queryableCnas = cnas.filter(
        cna => cna.entrezGeneId && cnaOncoKbAlteration(cna.cnaValue)
    );
    if (!queryableCnas.length) return null;

    const items = buildOncoKbCnaItems(queryableCnas);
    if (!items.length) return null;

    const cacheKey = [
        tileOrigin,
        'oncokb-cna',
        buildOrderedListCacheKeyFromItems(items, item => item.id),
    ].join('::');

    const annotations = await getCachedRequest(
        oncoKbCnaAnnotationRequestCache,
        cacheKey,
        async () => {
            let annotations: Array<{
                query: { id: string };
                oncogenic?: string;
                mutationEffect?: { knownEffect?: string };
                geneSummary?: string;
                variantSummary?: string;
            }>;
            try {
                annotations =
                    (await postJson<typeof annotations[0][]>(
                        `${tileOrigin}/api/oncokb/annotate-copy-number`,
                        items
                    )) ?? [];
            } catch {
                return null;
            }

            return annotations.map(annotation => ({
                id: annotation.query.id,
                oncogenic: annotation.oncogenic,
                mutationEffect: annotation.mutationEffect?.knownEffect,
                geneSummary: annotation.geneSummary,
                variantSummary: annotation.variantSummary,
            }));
        }
    );

    return annotations;
}

export async function fetchOncoKbCnaAnnotations(
    tileOrigin: string,
    cnas: CNADetail[]
): Promise<OncoKbCnaAnnotation[] | null> {
    return cloneCachedValue(
        await fetchOncoKbCnaAnnotationsReadOnly(tileOrigin, cnas)
    );
}

export async function fetchCivicCnaAnnotationsReadOnly(
    cnas: CNADetail[]
): Promise<CivicCnaAnnotation[] | null> {
    if (!cnas.length) return null;

    const cacheKey = [
        'civic-cna',
        buildOrderedListCacheKeyFromItems(
            cnas,
            cna => `${cna.gene}:${cna.cnaValue}`
        ),
    ].join('::');

    const annotations = await getCachedRequest(
        civicCnaAnnotationRequestCache,
        cacheKey,
        async () => {
            let civicGenes: ICivicGeneIndex;
            let civicVariants: ICivicVariantIndex;
            try {
                civicGenes = await getCivicGenes(
                    buildUniqueSortedStringList(cnas, cna => cna.gene)
                );
                civicVariants = await getCivicVariants(civicGenes);
            } catch {
                return null;
            }

            return cnas.map(cna => {
                const geneSummary = civicGenes[cna.gene];
                const civicGeneVariants = getCivicCNAVariants(
                    [
                        {
                            alteration: cna.cnaValue,
                            gene: { hugoGeneSymbol: cna.gene },
                        } as any,
                    ],
                    cna.gene,
                    civicVariants
                );

                if (
                    geneSummary &&
                    (Object.keys(civicGeneVariants).length > 0 ||
                        geneSummary.description !== '')
                ) {
                    return {
                        gene: cna.gene,
                        cnaValue: cna.cnaValue,
                        civicEntry: buildCivicEntry(
                            geneSummary,
                            civicGeneVariants
                        ) as ICivicEntry,
                        hasCivicVariants:
                            Object.keys(civicGeneVariants).length > 0,
                    };
                }

                return {
                    gene: cna.gene,
                    cnaValue: cna.cnaValue,
                    civicEntry: null,
                    hasCivicVariants: false,
                };
            });
        }
    );

    return annotations;
}

export async function fetchCivicCnaAnnotations(
    cnas: CNADetail[]
): Promise<CivicCnaAnnotation[] | null> {
    return cloneCachedValue(await fetchCivicCnaAnnotationsReadOnly(cnas));
}

export async function fetchOncoKbStructuralVariantAnnotationsReadOnly(
    tileOrigin: string,
    structuralVariants: StructuralVariantDetail[]
): Promise<OncoKbStructuralVariantAnnotation[] | null> {
    const queryableStructuralVariants = structuralVariants.filter(
        sv => sv.site1EntrezGeneId || sv.site2EntrezGeneId
    );
    if (!queryableStructuralVariants.length) return null;

    const items = buildOncoKbStructuralVariantItems(
        queryableStructuralVariants
    );
    if (!items.length) return null;

    const cacheKey = [
        tileOrigin,
        'oncokb-structural-variant',
        buildOrderedListCacheKeyFromItems(items, item => item.id),
    ].join('::');

    const annotations = await getCachedRequest(
        oncoKbStructuralVariantAnnotationRequestCache,
        cacheKey,
        async () => {
            let annotations: Array<{
                query: { id: string };
                oncogenic?: string;
                mutationEffect?: { knownEffect?: string };
                geneSummary?: string;
                variantSummary?: string;
            }>;
            try {
                annotations =
                    (await postJson<typeof annotations[0][]>(
                        `${tileOrigin}/api/oncokb/annotate-structural-variants`,
                        items
                    )) ?? [];
            } catch {
                return null;
            }

            return annotations.map(annotation => ({
                id: annotation.query.id,
                oncogenic: annotation.oncogenic,
                mutationEffect: annotation.mutationEffect?.knownEffect,
                geneSummary: annotation.geneSummary,
                variantSummary: annotation.variantSummary,
            }));
        }
    );

    return annotations;
}

export async function fetchOncoKbStructuralVariantAnnotations(
    tileOrigin: string,
    structuralVariants: StructuralVariantDetail[]
): Promise<OncoKbStructuralVariantAnnotation[] | null> {
    return cloneCachedValue(
        await fetchOncoKbStructuralVariantAnnotationsReadOnly(
            tileOrigin,
            structuralVariants
        )
    );
}

export function clearWsiAnnotationRequestCaches() {
    oncoKbMutationAnnotationRequestCache.clear();
    civicMutationAnnotationRequestCache.clear();
    oncoKbCnaAnnotationRequestCache.clear();
    civicCnaAnnotationRequestCache.clear();
    oncoKbStructuralVariantAnnotationRequestCache.clear();
}

export function annotationMapById<T extends { id: string }>(
    annotations: T[]
): Map<string, T> {
    const map = new Map<string, T>();
    for (let index = 0; index < annotations.length; index += 1) {
        const annotation = annotations[index];
        map.set(annotation.id, annotation);
    }
    return map;
}

export function civicMutationAnnotationMapByToken(
    annotations: CivicMutationAnnotation[]
): Map<string, CivicMutationAnnotation> {
    const map = new Map<string, CivicMutationAnnotation>();
    for (let index = 0; index < annotations.length; index += 1) {
        const annotation = annotations[index];
        map.set(annotation.token, annotation);
    }
    return map;
}

export function civicCnaAnnotationMap(
    annotations: CivicCnaAnnotation[]
): Map<string, CivicCnaAnnotation> {
    const map = new Map<string, CivicCnaAnnotation>();
    for (let index = 0; index < annotations.length; index += 1) {
        const annotation = annotations[index];
        map.set(`${annotation.gene}:${annotation.cnaValue}`, annotation);
    }
    return map;
}

export {
    cnaOncoKbId,
    mutationOncoKbId,
    structuralVariantOncoKbId,
};
