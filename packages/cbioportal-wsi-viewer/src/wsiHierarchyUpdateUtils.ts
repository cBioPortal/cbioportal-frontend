import { mergeClinicalDataIntoSamples } from './wsiDataMergeUtils';
import {
    CNADetail,
    MutationDetail,
    Sample,
    StructuralVariantDetail,
    WsiGenomicLocation,
    WsiHotspotFlags,
    WsiSampleClinicalDatum,
} from './wsiViewerTypes';
import {
    CivicCnaAnnotation,
    CivicMutationAnnotation,
    OncoKbAnnotation,
    OncoKbMutationAnnotation,
} from './wsiMolecularAnnotationDataUtils';
import {
    cnaOncoKbId,
    mutationOncoKbId,
    structuralVariantOncoKbId,
} from './wsiMolecularAnnotationFetchUtils';

export function applyClinicalDataRecords(
    samples: Sample[],
    data: ReadonlyArray<WsiSampleClinicalDatum>
): void {
    mergeClinicalDataIntoSamples(samples, data);
}

/**
 * Sets the mutations of the requested samples; a requested sample without
 * mutations gets an empty list.
 */
export function applyMutationData(
    samples: Sample[],
    requestedSampleIds: ReadonlySet<string>,
    bySample: Map<string, MutationDetail[]>
): void {
    for (const sample of samples) {
        if (requestedSampleIds.has(sample.sample_id)) {
            sample.mutations = bySample.get(sample.sample_id) ?? [];
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

export function applyStructuralVariantData(
    samples: Sample[],
    bySample: Map<string, StructuralVariantDetail[]>
): void {
    for (const sample of samples) {
        const svList = bySample.get(sample.sample_id);
        if (svList?.length) sample.structural_variants = svList;
    }
}

/** The sample's OncoTree code, OncoKB's tumor type; null when it has none. */
export function sampleTumorType(sample: Sample): string | null {
    return sample.oncotree_code || null;
}

function annotationMap<T extends { id: string }>(annotations: T[]) {
    return new Map(annotations.map(annotation => [annotation.id, annotation]));
}

function applyOncoKbAnnotation(
    target: Omit<OncoKbAnnotation, 'id'>,
    annotation: OncoKbAnnotation | undefined
) {
    if (!annotation) return;
    target.oncogenic = annotation.oncogenic;
    target.mutationEffect = annotation.mutationEffect;
    target.geneSummary = annotation.geneSummary;
    target.variantSummary = annotation.variantSummary;
}

export function applyOncoKbMutationAnnotations(
    samples: Sample[],
    annotations: OncoKbMutationAnnotation[]
): void {
    const byId = annotationMap(annotations);
    for (const sample of samples) {
        for (const mutation of sample.mutations ?? []) {
            const id = mutationOncoKbId(mutation, sampleTumorType(sample));
            const annotation = id ? byId.get(id) : undefined;
            if (!annotation) continue;
            applyOncoKbAnnotation(mutation, annotation);
            mutation.hotspot = annotation.hotspot;
        }
    }
}

/** Key of a hotspot lookup: the location and the mutation type. */
export function hotspotKey(
    location: WsiGenomicLocation,
    mutationType: string | undefined
): string {
    return [
        location.chromosome,
        location.start,
        location.end,
        location.referenceAllele,
        location.variantAllele,
        mutationType || '',
    ].join('\u0000');
}

/** Sets each mutation's Cancer Hotspots flags, by `hotspotKey`. */
export function applyHotspotAnnotations(
    samples: Sample[],
    flagsByKey: ReadonlyMap<string, WsiHotspotFlags>
): void {
    for (const sample of samples) {
        for (const mutation of sample.mutations ?? []) {
            if (!mutation.genomicLocation) continue;
            const flags = flagsByKey.get(
                hotspotKey(mutation.genomicLocation, mutation.consequence)
            );
            if (!flags) continue;
            mutation.recurrentHotspot = flags.recurrent;
            mutation.hotspot3d = flags.threeD;
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
        for (const mutation of sample.mutations ?? []) {
            const annotation = byToken.get(mutation.token);
            if (annotation) {
                mutation.civicEntry = annotation.civicEntry;
            }
        }
    }
}

export function applyOncoKbCnaAnnotations(
    samples: Sample[],
    annotations: OncoKbAnnotation[]
): void {
    const byId = annotationMap(annotations);
    for (const sample of samples) {
        for (const cna of sample.cna_alterations ?? []) {
            const id = cnaOncoKbId(cna, sampleTumorType(sample));
            applyOncoKbAnnotation(cna, id ? byId.get(id) : undefined);
        }
    }
}

export function applyCivicCnaAnnotations(
    samples: Sample[],
    annotations: CivicCnaAnnotation[]
): void {
    const byAlteration = new Map(
        annotations.map(annotation => [
            `${annotation.gene}:${annotation.cnaValue}`,
            annotation,
        ])
    );
    for (const sample of samples) {
        for (const cna of sample.cna_alterations ?? []) {
            const annotation = byAlteration.get(`${cna.gene}:${cna.cnaValue}`);
            if (!annotation) continue;
            cna.civicEntry = annotation.civicEntry;
            cna.hasCivicVariants = annotation.hasCivicVariants;
        }
    }
}

export function applyOncoKbStructuralVariantAnnotations(
    samples: Sample[],
    annotations: OncoKbAnnotation[]
): void {
    const byId = annotationMap(annotations);
    for (const sample of samples) {
        for (const sv of sample.structural_variants ?? []) {
            const id = structuralVariantOncoKbId(sv, sampleTumorType(sample));
            applyOncoKbAnnotation(sv, id ? byId.get(id) : undefined);
        }
    }
}
