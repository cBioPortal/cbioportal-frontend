import {
    applyMutationFrequencies,
    mergeClinicalDataIntoSamples,
} from './wsiDataMergeUtils';
import { parseMutationTokens } from './wsiMolecularUtils';
import {
    CNADetail,
    MutationDetail,
    Sample,
    StructuralVariantDetail,
} from './wsiViewerTypes';
import {
    CivicCnaAnnotation,
    CivicMutationAnnotation,
    OncoKbCnaAnnotation,
    OncoKbMutationAnnotation,
    OncoKbStructuralVariantAnnotation,
} from './wsiAnnotationDataUtils';
import {
    cnaOncoKbId,
    mutationOncoKbId,
    structuralVariantOncoKbId,
} from './wsiAnnotationFetchUtils';

export function applyClinicalDataRecords(
    samples: Sample[],
    data: Array<{
        sampleId: string;
        clinicalAttributeId: string;
        value: string;
    }>
): void {
    mergeClinicalDataIntoSamples(samples, data);
}

export function applyMutationData(
    samples: Sample[],
    allMutsBySample: Map<string, Array<{ token: string; vaf: number }>>,
    detailsBySample: Map<string, Map<string, MutationDetail>>
): void {
    for (const sample of samples) {
        const apiMuts = allMutsBySample.get(sample.sample_id);
        if (apiMuts?.length) {
            sample.oncogenic_mutations = apiMuts.map(m => m.token).join('; ');
        }
        if (sample.oncogenic_mutations) {
            const sampleDetails = detailsBySample.get(sample.sample_id);
            const tokens = parseMutationTokens(sample.oncogenic_mutations);
            sample.oncogenic_mutation_details = tokens.map(
                t => sampleDetails?.get(t) ?? { token: t }
            );
        }
    }
}

export function applyOncoKbMutationAnnotations(
    samples: Sample[],
    annotations: OncoKbMutationAnnotation[]
): void {
    const byId = new Map(
        annotations.map(annotation => [annotation.id, annotation])
    );
    for (const sample of samples) {
        for (const detail of sample.oncogenic_mutation_details ?? []) {
            const id = mutationOncoKbId(detail);
            if (!id) continue;
            const annotation = byId.get(id);
            if (!annotation) continue;
            detail.oncogenic = annotation.oncogenic;
            detail.mutationEffect = annotation.mutationEffect;
            detail.hotspot = annotation.hotspot;
            detail.geneSummary = annotation.geneSummary;
            detail.variantSummary = annotation.variantSummary;
            detail.hasCivic = annotation.variantExist === true;
        }
    }
}

export function applyCivicMutationAnnotations(
    samples: Sample[],
    annotations: CivicMutationAnnotation[]
): void {
    const byToken = new Map(
        annotations.map(annotation => [annotation.token, annotation])
    );
    for (const sample of samples) {
        for (const detail of sample.oncogenic_mutation_details ?? []) {
            const annotation = byToken.get(detail.token);
            if (!annotation) continue;
            detail.civicEntry = annotation.civicEntry;
            detail.hasCivic = annotation.hasCivic;
        }
    }
}

export function applyCnaData(
    samples: Sample[],
    bySample: Map<string, CNADetail[]>
): void {
    for (const sample of samples) {
        const cnList = bySample.get(sample.sample_id);
        if (cnList?.length) sample.cna_alterations = cnList;
    }
}

export function applyCivicCnaAnnotations(
    samples: Sample[],
    annotations: CivicCnaAnnotation[]
): void {
    const byGeneAndValue = new Map(
        annotations.map(annotation => [
            `${annotation.gene}:${annotation.cnaValue}`,
            annotation,
        ])
    );
    for (const sample of samples) {
        for (const cna of sample.cna_alterations ?? []) {
            const annotation = byGeneAndValue.get(
                `${cna.gene}:${cna.cnaValue}`
            );
            if (!annotation) continue;
            cna.civicEntry = annotation.civicEntry;
            cna.hasCivicVariants = annotation.hasCivicVariants;
        }
    }
}

export function applyOncoKbCnaAnnotations(
    samples: Sample[],
    annotations: OncoKbCnaAnnotation[]
): void {
    const byId = new Map(
        annotations.map(annotation => [annotation.id, annotation])
    );
    for (const sample of samples) {
        for (const cna of sample.cna_alterations ?? []) {
            const id = cnaOncoKbId(cna);
            if (!id) continue;
            const annotation = byId.get(id);
            if (!annotation) continue;
            cna.oncogenic = annotation.oncogenic;
            cna.mutationEffect = annotation.mutationEffect;
            cna.geneSummary = annotation.geneSummary;
            cna.variantSummary = annotation.variantSummary;
        }
    }
}

export function applyStructuralVariantData(
    samples: Sample[],
    bySample: Map<string, StructuralVariantDetail[]>
): void {
    for (const sample of samples) {
        const svList = bySample.get(sample.sample_id);
        if (svList?.length) sample.structural_variants = svList;
    }
}

export function applyOncoKbStructuralVariantAnnotations(
    samples: Sample[],
    annotations: OncoKbStructuralVariantAnnotation[]
): void {
    const byId = new Map(
        annotations.map(annotation => [annotation.id, annotation])
    );
    for (const sample of samples) {
        for (const structuralVariant of sample.structural_variants ?? []) {
            const id = structuralVariantOncoKbId(structuralVariant);
            if (!id) continue;
            const annotation = byId.get(id);
            if (!annotation) continue;
            structuralVariant.oncogenic = annotation.oncogenic;
            structuralVariant.mutationEffect = annotation.mutationEffect;
            structuralVariant.geneSummary = annotation.geneSummary;
            structuralVariant.variantSummary = annotation.variantSummary;
        }
    }
}

export function applyMutationFrequencyData(
    samples: Sample[],
    counts: Array<{
        entrezGeneId: number;
        proteinPosStart: number;
        proteinPosEnd: number;
        count: number;
    }>,
    total: number
): void {
    applyMutationFrequencies(samples, counts, total);
}
