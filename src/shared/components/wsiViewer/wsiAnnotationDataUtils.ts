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

export async function fetchOncoKbMutationAnnotations(
    tileOrigin: string,
    details: MutationDetail[]
): Promise<OncoKbMutationAnnotation[] | null> {
    const queryableDetails = details.filter(detail => detail.entrezGeneId);
    if (!queryableDetails.length) return null;

    const items = buildOncoKbMutationItems(queryableDetails);
    if (!items.length) return null;

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

export async function fetchCivicMutationAnnotations(
    details: MutationDetail[]
): Promise<CivicMutationAnnotation[] | null> {
    if (!details.length) return null;

    const mutationSpecs = buildCivicMutationSpecs(details);
    if (!mutationSpecs.length) return null;

    let civicGenes: ICivicGeneIndex;
    let civicVariants: ICivicVariantIndex;
    try {
        civicGenes = await getCivicGenes(
            Array.from(
                new Set(mutationSpecs.map(spec => spec.gene.hugoGeneSymbol))
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

export async function fetchOncoKbCnaAnnotations(
    tileOrigin: string,
    cnas: CNADetail[]
): Promise<OncoKbCnaAnnotation[] | null> {
    const queryableCnas = cnas.filter(
        cna => cna.entrezGeneId && cnaOncoKbAlteration(cna.cnaValue)
    );
    if (!queryableCnas.length) return null;

    const items = buildOncoKbCnaItems(queryableCnas);
    if (!items.length) return null;

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

export async function fetchCivicCnaAnnotations(
    cnas: CNADetail[]
): Promise<CivicCnaAnnotation[] | null> {
    if (!cnas.length) return null;

    let civicGenes: ICivicGeneIndex;
    let civicVariants: ICivicVariantIndex;
    try {
        civicGenes = await getCivicGenes(
            Array.from(new Set(cnas.map(cna => cna.gene).filter(Boolean)))
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
                hasCivicVariants: Object.keys(civicGeneVariants).length > 0,
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

export async function fetchOncoKbStructuralVariantAnnotations(
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

export function annotationMapById<T extends { id: string }>(
    annotations: T[]
): Map<string, T> {
    return new Map(annotations.map(annotation => [annotation.id, annotation]));
}

export function civicMutationAnnotationMapByToken(
    annotations: CivicMutationAnnotation[]
): Map<string, CivicMutationAnnotation> {
    return new Map(annotations.map(annotation => [annotation.token, annotation]));
}

export function civicCnaAnnotationMap(
    annotations: CivicCnaAnnotation[]
): Map<string, CivicCnaAnnotation> {
    return new Map(
        annotations.map(annotation => [
            `${annotation.gene}:${annotation.cnaValue}`,
            annotation,
        ])
    );
}

export {
    cnaOncoKbId,
    mutationOncoKbId,
    structuralVariantOncoKbId,
};
