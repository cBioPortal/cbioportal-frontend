import { mergeClinicalDataIntoSamples } from './wsiDataMergeUtils';
import {
    CNADetail,
    MutationDetail,
    Sample,
    StructuralVariantDetail,
    WsiSampleClinicalDatum,
} from './wsiViewerTypes';

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
