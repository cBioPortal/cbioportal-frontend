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
