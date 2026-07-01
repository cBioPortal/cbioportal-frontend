import { deriveStructuralVariantType, generateQueryStructuralVariantId } from 'oncokb-frontend-commons';
import {
    CNADetail,
    MutationDetail,
    StructuralVariantDetail,
} from './wsiViewerTypes';
import { parseMutationToken } from './wsiMolecularUtils';

export interface OncoKbMutationItem {
    id: string;
    alteration: string;
    consequence?: string;
    gene: { entrezGeneId: number };
    proteinStart?: number;
    proteinEnd?: number;
    tumorType: null;
}

export interface CivicMutationSpec {
    gene: { hugoGeneSymbol: string };
    proteinChange: string;
}

export interface OncoKbCnaItem {
    id: string;
    copyNameAlterationType: string;
    gene: { entrezGeneId: number };
    referenceGenome: 'GRCh37';
    tumorType: null;
}

export interface OncoKbStructuralVariantItem {
    id: string;
    geneA: { entrezGeneId?: number };
    geneB: { entrezGeneId?: number };
    structuralVariantType: string;
    functionalFusion: boolean;
    tumorType: null;
}

export function mutationOncoKbId(detail: MutationDetail): string | null {
    if (!detail.entrezGeneId) return null;
    const { variant } = parseMutationToken(detail.token);
    const alteration = variant.startsWith('p.') ? variant.slice(2) : variant;
    return `${detail.entrezGeneId}_${alteration}_${detail.consequence ?? ''}`;
}

export function buildOncoKbMutationItems(
    details: MutationDetail[]
): OncoKbMutationItem[] {
    const seen = new Set<string>();
    const items: OncoKbMutationItem[] = [];

    for (const detail of details) {
        if (!detail.entrezGeneId) continue;
        const { variant } = parseMutationToken(detail.token);
        const alteration = variant.startsWith('p.') ? variant.slice(2) : variant;
        const id = mutationOncoKbId(detail);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        items.push({
            id,
            alteration,
            consequence: detail.consequence,
            gene: { entrezGeneId: detail.entrezGeneId },
            proteinStart: detail.proteinStart,
            proteinEnd: detail.proteinEnd,
            tumorType: null,
        });
    }

    return items;
}

export function buildCivicMutationSpecs(
    details: MutationDetail[]
): CivicMutationSpec[] {
    return details
        .map(detail => {
            const { gene, variant } = parseMutationToken(detail.token);
            const proteinChange = variant.startsWith('p.')
                ? variant.slice(2)
                : variant;
            return gene && proteinChange
                ? { gene: { hugoGeneSymbol: gene }, proteinChange }
                : null;
        })
        .filter((spec): spec is CivicMutationSpec => spec !== null);
}

export function cnaOncoKbAlteration(cnaValue: number): string | null {
    if (cnaValue === -2) return 'DELETION';
    if (cnaValue === -1) return 'LOSS';
    if (cnaValue === 1) return 'GAIN';
    if (cnaValue === 2) return 'AMPLIFICATION';
    return null;
}

export function cnaOncoKbId(cna: CNADetail): string | null {
    const alteration = cnaOncoKbAlteration(cna.cnaValue);
    if (!cna.entrezGeneId || !alteration) return null;
    return `${cna.entrezGeneId}_${alteration}`;
}

export function buildOncoKbCnaItems(cnas: CNADetail[]): OncoKbCnaItem[] {
    const seen = new Set<string>();
    const items: OncoKbCnaItem[] = [];

    for (const cna of cnas) {
        const alteration = cnaOncoKbAlteration(cna.cnaValue);
        const id = cnaOncoKbId(cna);
        if (!alteration || !id || seen.has(id)) continue;
        seen.add(id);
        items.push({
            id,
            copyNameAlterationType: alteration,
            gene: { entrezGeneId: cna.entrezGeneId! },
            referenceGenome: 'GRCh37',
            tumorType: null,
        });
    }

    return items;
}

export function structuralVariantOncoKbId(
    sv: StructuralVariantDetail
): string | null {
    const structuralVariantType = deriveStructuralVariantType({
        site1HugoSymbol: sv.gene1 === '—' ? undefined : sv.gene1,
        site2HugoSymbol: sv.gene2 === '—' ? undefined : sv.gene2,
        site1EntrezGeneId: sv.site1EntrezGeneId,
        site2EntrezGeneId: sv.site2EntrezGeneId,
        variantClass: sv.variantClass,
    } as any);
    const site1EntrezGeneId = sv.site1EntrezGeneId ?? sv.site2EntrezGeneId;
    const site2EntrezGeneId = sv.site2EntrezGeneId ?? sv.site1EntrezGeneId;
    if (!site1EntrezGeneId || !site2EntrezGeneId) return null;
    return generateQueryStructuralVariantId(
        site1EntrezGeneId,
        site2EntrezGeneId,
        null,
        structuralVariantType
    );
}

export function buildOncoKbStructuralVariantItems(
    structuralVariants: StructuralVariantDetail[]
): OncoKbStructuralVariantItem[] {
    const seen = new Set<string>();
    const items: OncoKbStructuralVariantItem[] = [];

    for (const sv of structuralVariants) {
        const structuralVariantType = deriveStructuralVariantType({
            site1HugoSymbol: sv.gene1 === '—' ? undefined : sv.gene1,
            site2HugoSymbol: sv.gene2 === '—' ? undefined : sv.gene2,
            site1EntrezGeneId: sv.site1EntrezGeneId,
            site2EntrezGeneId: sv.site2EntrezGeneId,
            variantClass: sv.variantClass,
        } as any);
        const id = structuralVariantOncoKbId(sv);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        items.push({
            id,
            geneA: {
                entrezGeneId: sv.site1EntrezGeneId ?? sv.site2EntrezGeneId,
            },
            geneB: {
                entrezGeneId: sv.site2EntrezGeneId ?? sv.site1EntrezGeneId,
            },
            structuralVariantType,
            functionalFusion:
                !!sv.site1EntrezGeneId && !!sv.site2EntrezGeneId,
            tumorType: null,
        });
    }

    return items;
}
