import {
    buildCivicEntry,
    getCivicGenes,
    getCivicVariants,
    ICivicEntry,
} from 'cbioportal-utils';
import {
    buildCivicMutationSpecs,
    buildOncoKbCnaItems,
    buildOncoKbMutationItems,
    buildOncoKbStructuralVariantItems,
    OncoKbReferenceGenome,
    WithTumorType,
} from './wsiMolecularAnnotationFetchUtils';
import {
    CNADetail,
    MutationDetail,
    StructuralVariantDetail,
} from './wsiViewerTypes';
import {
    getCivicCnaVariants,
    getOncoKbApiUrl,
    getWsiOncoKbClient,
} from './wsiMolecularServices';

const WSI_ANNOTATION_REQUEST_CACHE_TTL_MS = 5 * 60 * 1000;

type CachedRequestEntry<T> = {
    expiresAt: number;
    promise: Promise<T>;
};

export type OncoKbAnnotation = {
    id: string;
    oncogenic?: string;
    mutationEffect?: string;
    geneSummary?: string;
    variantSummary?: string;
};

export type OncoKbMutationAnnotation = OncoKbAnnotation & {
    hotspot?: boolean;
};

export type CivicMutationAnnotation = {
    token: string;
    civicEntry: ICivicEntry | null;
};

export type CivicCnaAnnotation = {
    gene: string;
    cnaValue: number;
    civicEntry: ICivicEntry | null;
    hasCivicVariants: boolean;
};

type OncoKbIndicator = {
    query: { id: string };
    oncogenic?: string;
    mutationEffect?: { knownEffect?: string };
    hotspot?: boolean;
    geneSummary?: string;
    variantSummary?: string;
};

const oncoKbRequestCache = new Map<
    string,
    CachedRequestEntry<OncoKbIndicator[] | null>
>();
const civicMutationRequestCache = new Map<
    string,
    CachedRequestEntry<CivicMutationAnnotation[] | null>
>();
const civicCnaRequestCache = new Map<
    string,
    CachedRequestEntry<CivicCnaAnnotation[] | null>
>();

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
    cache.set(cacheKey, {
        expiresAt: now + WSI_ANNOTATION_REQUEST_CACHE_TTL_MS,
        promise: factory(),
    });
    return cache.get(cacheKey)!.promise;
}

/**
 * Resolves a failed annotation request to null and evicts it from `cache`, so
 * the next load asks again. Annotations are optional, so the failure is only
 * logged at debug level.
 */
function optional<T>(
    cache: Map<string, CachedRequestEntry<T | null>>,
    cacheKey: string,
    label: string,
    request: () => Promise<T>
): Promise<T | null> {
    return getCachedRequest(cache, cacheKey, () =>
        request().catch(error => {
            console.debug(`[WSI] ${label} unavailable`, error);
            cache.delete(cacheKey);
            return null;
        })
    );
}

function sortedKey(values: Iterable<string>): string {
    return Array.from(new Set(values))
        .sort()
        .join('|');
}

/** OncoKB indicators for `items`, cached per API URL and item set. */
function fetchOncoKbIndicators<T extends { id: string }>(
    kind: string,
    items: T[],
    request: (items: T[]) => Promise<OncoKbIndicator[]>
): Promise<OncoKbIndicator[] | null> {
    if (!items.length) return Promise.resolve(null);
    const cacheKey = [
        getOncoKbApiUrl(),
        kind,
        sortedKey(items.map(item => item.id)),
    ].join('::');
    return optional(
        oncoKbRequestCache,
        cacheKey,
        `OncoKB ${kind} annotation`,
        async () => (await request(items)) ?? []
    );
}

function toOncoKbAnnotation(indicator: OncoKbIndicator): OncoKbAnnotation {
    return {
        id: indicator.query.id,
        oncogenic: indicator.oncogenic,
        mutationEffect: indicator.mutationEffect?.knownEffect,
        geneSummary: indicator.geneSummary,
        variantSummary: indicator.variantSummary,
    };
}

export async function fetchOncoKbMutationAnnotations(
    mutations: Array<WithTumorType<MutationDetail>>,
    referenceGenome: OncoKbReferenceGenome
): Promise<OncoKbMutationAnnotation[] | null> {
    const indicators = await fetchOncoKbIndicators(
        'mutation',
        buildOncoKbMutationItems(mutations, referenceGenome),
        body =>
            getWsiOncoKbClient().annotateMutationsByProteinChangePostUsingPOST_1(
                { body: body as any }
            )
    );
    return (
        indicators?.map(indicator => ({
            ...toOncoKbAnnotation(indicator),
            hotspot: indicator.hotspot,
        })) ?? null
    );
}

export async function fetchOncoKbCnaAnnotations(
    cnas: Array<WithTumorType<CNADetail>>,
    referenceGenome: OncoKbReferenceGenome
): Promise<OncoKbAnnotation[] | null> {
    const indicators = await fetchOncoKbIndicators(
        'cna',
        buildOncoKbCnaItems(cnas, referenceGenome),
        body =>
            getWsiOncoKbClient().annotateCopyNumberAlterationsPostUsingPOST_1({
                body: body as any,
            })
    );
    return indicators?.map(toOncoKbAnnotation) ?? null;
}

export async function fetchOncoKbStructuralVariantAnnotations(
    structuralVariants: Array<WithTumorType<StructuralVariantDetail>>,
    referenceGenome: OncoKbReferenceGenome
): Promise<OncoKbAnnotation[] | null> {
    const indicators = await fetchOncoKbIndicators(
        'structural-variant',
        buildOncoKbStructuralVariantItems(structuralVariants, referenceGenome),
        body =>
            getWsiOncoKbClient().annotateStructuralVariantsPostUsingPOST_1({
                body: body as any,
            })
    );
    return indicators?.map(toOncoKbAnnotation) ?? null;
}

/** CIViC entries of the mutations' variants, keyed by mutation token. */
export function fetchCivicMutationAnnotations(
    details: MutationDetail[]
): Promise<CivicMutationAnnotation[] | null> {
    const specs = buildCivicMutationSpecs(details);
    if (!specs.length) return Promise.resolve(null);

    return optional(
        civicMutationRequestCache,
        sortedKey(details.map(detail => detail.token)),
        'CIViC mutation annotation',
        async () => {
            const civicGenes = await getCivicGenes(
                Array.from(
                    new Set(specs.map(spec => spec.gene.hugoGeneSymbol))
                ).sort()
            );
            const civicVariants = await getCivicVariants(civicGenes, specs);
            return details.map(detail => {
                const geneEntry = civicGenes[detail.gene];
                const variantEntry =
                    civicVariants[detail.gene]?.[detail.proteinChange];
                return {
                    token: detail.token,
                    civicEntry:
                        geneEntry && variantEntry
                            ? (buildCivicEntry(geneEntry, {
                                  [detail.proteinChange]: variantEntry,
                              }) as ICivicEntry)
                            : null,
                };
            });
        }
    );
}

/**
 * CIViC entries of the amplifications and deep deletions (CIViC has no
 * entries for gains and shallow losses); only their genes are requested.
 */
export function fetchCivicCnaAnnotations(
    cnas: CNADetail[]
): Promise<CivicCnaAnnotation[] | null> {
    const annotatable = cnas.filter(cna => Math.abs(cna.cnaValue) === 2);
    if (!annotatable.length) return Promise.resolve(null);

    return optional(
        civicCnaRequestCache,
        sortedKey(annotatable.map(cna => `${cna.gene}:${cna.cnaValue}`)),
        'CIViC copy-number annotation',
        async () => {
            const civicGenes = await getCivicGenes(
                Array.from(new Set(annotatable.map(cna => cna.gene))).sort()
            );
            // Without mutation specs, only the genes' CNA variants are kept.
            const civicVariants = await getCivicVariants(civicGenes);
            return annotatable.map(cna => {
                const geneSummary = civicGenes[cna.gene];
                const variants = getCivicCnaVariants(
                    cna.cnaValue,
                    cna.gene,
                    civicVariants
                );
                const hasCivicVariants = Object.keys(variants).length > 0;
                return {
                    gene: cna.gene,
                    cnaValue: cna.cnaValue,
                    civicEntry:
                        geneSummary &&
                        (hasCivicVariants || geneSummary.description !== '')
                            ? (buildCivicEntry(
                                  geneSummary,
                                  variants
                              ) as ICivicEntry)
                            : null,
                    hasCivicVariants,
                };
            });
        }
    );
}

export function clearWsiMolecularAnnotationRequestCaches() {
    oncoKbRequestCache.clear();
    civicMutationRequestCache.clear();
    civicCnaRequestCache.clear();
}
