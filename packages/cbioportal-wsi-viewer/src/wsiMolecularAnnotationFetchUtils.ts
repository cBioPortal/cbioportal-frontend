import {
    deriveStructuralVariantType,
    generateQueryStructuralVariantId,
} from 'oncokb-frontend-commons';
import {
    CNADetail,
    MutationDetail,
    StructuralVariantDetail,
} from './wsiViewerTypes';

export type OncoKbReferenceGenome = 'GRCh37' | 'GRCh38';

/**
 * A variant with the sample's OncoTree code, OncoKB's tumor type; null
 * when the sample has none, which annotates the variant without a tumor type.
 */
export type WithTumorType<T> = { entry: T; tumorType: string | null };

export interface OncoKbMutationItem {
    id: string;
    alteration: string;
    consequence?: string;
    gene: { entrezGeneId: number };
    proteinStart?: number;
    proteinEnd?: number;
    referenceGenome: OncoKbReferenceGenome;
    tumorType: string | null;
}

export interface CivicMutationSpec {
    gene: { hugoGeneSymbol: string };
    proteinChange: string;
}

export interface OncoKbCnaItem {
    id: string;
    copyNameAlterationType: string;
    gene: { entrezGeneId: number };
    referenceGenome: OncoKbReferenceGenome;
    tumorType: string | null;
}

export interface OncoKbStructuralVariantItem {
    id: string;
    geneA: { entrezGeneId?: number };
    geneB: { entrezGeneId?: number };
    structuralVariantType: string;
    functionalFusion: boolean;
    referenceGenome: OncoKbReferenceGenome;
    tumorType: string | null;
}

/** OncoKB's build for a study reference genome (`hg19`, `hg38`, `GRCh38`). */
export function oncoKbReferenceGenome(
    studyReferenceGenome: string | null | undefined
): OncoKbReferenceGenome {
    return /38/.test(studyReferenceGenome || '') ? 'GRCh38' : 'GRCh37';
}

export function mutationOncoKbId(
    detail: MutationDetail,
    tumorType: string | null
): string | null {
    if (!detail.entrezGeneId || !detail.proteinChange) return null;
    return `${detail.entrezGeneId}_${
        detail.proteinChange
    }_${detail.consequence ?? ''}_${tumorType ?? ''}`;
}

export function buildOncoKbMutationItems(
    mutations: Array<WithTumorType<MutationDetail>>,
    referenceGenome: OncoKbReferenceGenome
): OncoKbMutationItem[] {
    const items = new Map<string, OncoKbMutationItem>();
    for (const { entry: detail, tumorType } of mutations) {
        const id = mutationOncoKbId(detail, tumorType);
        if (!id || items.has(id)) continue;
        items.set(id, {
            id,
            alteration: detail.proteinChange,
            consequence: detail.consequence,
            gene: { entrezGeneId: detail.entrezGeneId! },
            proteinStart: detail.proteinStart,
            proteinEnd: detail.proteinEnd,
            referenceGenome,
            tumorType,
        });
    }
    return Array.from(items.values()).sort((a, b) => a.id.localeCompare(b.id));
}

export function buildCivicMutationSpecs(
    details: MutationDetail[]
): CivicMutationSpec[] {
    const specs = new Map<string, CivicMutationSpec>();
    for (const { gene, proteinChange } of details) {
        const key = `${gene}::${proteinChange}`;
        if (!gene || !proteinChange || specs.has(key)) continue;
        specs.set(key, { gene: { hugoGeneSymbol: gene }, proteinChange });
    }
    return Array.from(specs.values()).sort(
        (a, b) =>
            a.gene.hugoGeneSymbol.localeCompare(b.gene.hugoGeneSymbol) ||
            a.proteinChange.localeCompare(b.proteinChange)
    );
}

export function cnaOncoKbAlteration(cnaValue: number): string | null {
    if (cnaValue === -2) return 'DELETION';
    if (cnaValue === -1) return 'LOSS';
    if (cnaValue === 1) return 'GAIN';
    if (cnaValue === 2) return 'AMPLIFICATION';
    return null;
}

export function cnaOncoKbId(
    cna: CNADetail,
    tumorType: string | null
): string | null {
    const alteration = cnaOncoKbAlteration(cna.cnaValue);
    if (!cna.entrezGeneId || !alteration) return null;
    return `${cna.entrezGeneId}_${alteration}_${tumorType ?? ''}`;
}

export function buildOncoKbCnaItems(
    cnas: Array<WithTumorType<CNADetail>>,
    referenceGenome: OncoKbReferenceGenome
): OncoKbCnaItem[] {
    const items = new Map<string, OncoKbCnaItem>();
    for (const { entry: cna, tumorType } of cnas) {
        const id = cnaOncoKbId(cna, tumorType);
        if (!id || items.has(id)) continue;
        items.set(id, {
            id,
            copyNameAlterationType: cnaOncoKbAlteration(cna.cnaValue)!,
            gene: { entrezGeneId: cna.entrezGeneId! },
            referenceGenome,
            tumorType,
        });
    }
    return Array.from(items.values()).sort((a, b) => a.id.localeCompare(b.id));
}

function structuralVariantType(sv: StructuralVariantDetail): string {
    return deriveStructuralVariantType({
        site1HugoSymbol: sv.gene1 === '—' ? undefined : sv.gene1,
        site2HugoSymbol: sv.gene2 === '—' ? undefined : sv.gene2,
        site1EntrezGeneId: sv.site1EntrezGeneId,
        site2EntrezGeneId: sv.site2EntrezGeneId,
        variantClass: sv.variantClass,
    } as Parameters<typeof deriveStructuralVariantType>[0]);
}

export function structuralVariantOncoKbId(
    sv: StructuralVariantDetail,
    tumorType: string | null
): string | null {
    const site1EntrezGeneId = sv.site1EntrezGeneId ?? sv.site2EntrezGeneId;
    const site2EntrezGeneId = sv.site2EntrezGeneId ?? sv.site1EntrezGeneId;
    if (!site1EntrezGeneId || !site2EntrezGeneId) return null;
    return generateQueryStructuralVariantId(
        site1EntrezGeneId,
        site2EntrezGeneId,
        tumorType,
        structuralVariantType(sv)
    );
}

export function buildOncoKbStructuralVariantItems(
    structuralVariants: Array<WithTumorType<StructuralVariantDetail>>,
    referenceGenome: OncoKbReferenceGenome
): OncoKbStructuralVariantItem[] {
    const items = new Map<string, OncoKbStructuralVariantItem>();
    for (const { entry: sv, tumorType } of structuralVariants) {
        const id = structuralVariantOncoKbId(sv, tumorType);
        if (!id || items.has(id)) continue;
        items.set(id, {
            id,
            geneA: {
                entrezGeneId: sv.site1EntrezGeneId ?? sv.site2EntrezGeneId,
            },
            geneB: {
                entrezGeneId: sv.site2EntrezGeneId ?? sv.site1EntrezGeneId,
            },
            structuralVariantType: structuralVariantType(sv),
            functionalFusion: !!sv.site1EntrezGeneId && !!sv.site2EntrezGeneId,
            referenceGenome,
            tumorType,
        });
    }
    return Array.from(items.values()).sort((a, b) => a.id.localeCompare(b.id));
}
