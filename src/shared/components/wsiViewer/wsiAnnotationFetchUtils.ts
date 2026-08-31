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

function trimProteinPrefix(variant: string): string {
    return variant.startsWith('p.') ? variant.slice(2) : variant;
}

export function mutationOncoKbId(detail: MutationDetail): string | null {
    if (!detail.entrezGeneId) return null;
    const { variant } = parseMutationToken(detail.token);
    const alteration = trimProteinPrefix(variant);
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
        const alteration = trimProteinPrefix(variant);
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

    items.sort(
        (a, b) =>
            a.gene.entrezGeneId - b.gene.entrezGeneId ||
            a.alteration.localeCompare(b.alteration) ||
            (a.consequence || '').localeCompare(b.consequence || '')
    );
    return items;
}

export function buildCivicMutationSpecs(
    details: MutationDetail[]
): CivicMutationSpec[] {
    const seen = new Set<string>();
    const specs: CivicMutationSpec[] = [];

    for (const detail of details) {
        const { gene, variant } = parseMutationToken(detail.token);
        const proteinChange = trimProteinPrefix(variant);
        if (!gene || !proteinChange) {
            continue;
        }

        const key = `${gene}::${proteinChange}`;
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        specs.push({
            gene: { hugoGeneSymbol: gene },
            proteinChange,
        });
    }

    specs.sort(
        (a, b) =>
            a.gene.hugoGeneSymbol.localeCompare(b.gene.hugoGeneSymbol) ||
            a.proteinChange.localeCompare(b.proteinChange)
    );
    return specs;
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

    items.sort(
        (a, b) =>
            a.gene.entrezGeneId - b.gene.entrezGeneId ||
            a.copyNameAlterationType.localeCompare(b.copyNameAlterationType)
    );
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

    items.sort(
        (a, b) =>
            (a.geneA.entrezGeneId ?? 0) - (b.geneA.entrezGeneId ?? 0) ||
            (a.geneB.entrezGeneId ?? 0) - (b.geneB.entrezGeneId ?? 0) ||
            a.structuralVariantType.localeCompare(b.structuralVariantType)
    );
    return items;
}
