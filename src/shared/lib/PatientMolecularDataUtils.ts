import { Sample } from 'cbioportal-ts-api-client';
import MobxPromiseCache from '../lib/MobxPromiseCache';

export interface PatientMolecularData {
    mutations: any[];
    cnas: any[];
    svs: any[];
    hasAnyAlteration: boolean;
}

export interface MolecularDataStore {
    annotatedMutationCache?: MobxPromiseCache<{ entrezGeneId: number }, any[]>;
    annotatedCnaCache?: MobxPromiseCache<{ entrezGeneId: number }, any[]>;
    structuralVariantCache?: MobxPromiseCache<{ entrezGeneId: number }, any[]>;
}

/**
 * Gets molecular data for a specific gene from store caches (synchronous version for cached data)
 * This provides a standard way for tabs to access molecular data from StudyViewPageStore or ResultsViewPageStore
 */
export function getMolecularDataForGeneSync(
    entrezGeneId: number,
    store: MolecularDataStore,
    options: {
        mutationTypeEnabled?: boolean;
        copyNumberEnabled?: boolean;
        structuralVariantEnabled?: boolean;
    } = {}
): {
    mutations: any[];
    cnas: any[];
    svs: any[];
} {
    const {
        mutationTypeEnabled = true,
        copyNumberEnabled = true,
        structuralVariantEnabled = true,
    } = options;

    let mutations: any[] = [];
    let cnas: any[] = [];
    let svs: any[] = [];

    // Get mutations if enabled and cache exists
    if (mutationTypeEnabled && store.annotatedMutationCache) {
        const mutationCacheResult = store.annotatedMutationCache.get({
            entrezGeneId,
        });

        if (mutationCacheResult?.isComplete && mutationCacheResult.result) {
            mutations = mutationCacheResult.result;
        }
    }

    // Get CNAs if enabled and cache exists
    if (copyNumberEnabled && store.annotatedCnaCache) {
        const cnaCacheResult = store.annotatedCnaCache.get({ entrezGeneId });
        if (cnaCacheResult?.isComplete && cnaCacheResult.result) {
            cnas = cnaCacheResult.result;
        }
    }

    // Get structural variants if enabled and cache exists
    if (structuralVariantEnabled && store.structuralVariantCache) {
        const svCacheResult = store.structuralVariantCache.get({
            entrezGeneId,
        });
        if (svCacheResult?.isComplete && svCacheResult.result) {
            svs = svCacheResult.result;
        }
    }

    return { mutations, cnas, svs };
}

/**
 * Gets molecular data for a specific gene from store caches (async version)
 * This provides a standard way for tabs to access molecular data from StudyViewPageStore or ResultsViewPageStore
 */
export async function getMolecularDataForGene(
    entrezGeneId: number,
    store: MolecularDataStore,
    options: {
        mutationTypeEnabled?: boolean;
        copyNumberEnabled?: boolean;
        structuralVariantEnabled?: boolean;
    } = {}
): Promise<{
    mutations: any[];
    cnas: any[];
    svs: any[];
}> {
    // For now, just call the sync version since we're dealing with cached data
    // This can be extended later if we need true async behavior
    return getMolecularDataForGeneSync(entrezGeneId, store, options);
}

/**
 * Aggregates molecular data at the patient level using union approach (same as Results View)
 * This utility can be used by any component that needs patient-level molecular data
 */
export function aggregateMolecularDataByPatient(
    allSamples: Sample[],
    allMutations: any[],
    allCnas: any[],
    allSvs: any[]
): Map<string, PatientMolecularData> {
    const patientMolecularDataMap = new Map<string, PatientMolecularData>();

    // Group samples by patient
    const patientToSamplesMap = new Map<string, Sample[]>();
    allSamples.forEach(sample => {
        if (!patientToSamplesMap.has(sample.patientId)) {
            patientToSamplesMap.set(sample.patientId, []);
        }
        patientToSamplesMap.get(sample.patientId)!.push(sample);
    });

    // Index molecular data by sample key for O(1) lookups
    const mutationsBySample = new Map<string, any[]>();
    const cnasBySample = new Map<string, any[]>();
    const svsBySample = new Map<string, any[]>();

    // Index mutations by sample key
    allMutations.forEach(m => {
        const sampleKey = `${m.studyId}:${m.sampleId}`;
        if (!mutationsBySample.has(sampleKey)) {
            mutationsBySample.set(sampleKey, []);
        }
        mutationsBySample.get(sampleKey)!.push(m);
    });

    // Index CNAs by sample key
    allCnas.forEach(c => {
        const sampleKey = `${c.studyId}:${c.sampleId}`;
        if (!cnasBySample.has(sampleKey)) {
            cnasBySample.set(sampleKey, []);
        }
        cnasBySample.get(sampleKey)!.push(c);
    });

    // Index SVs by sample key
    allSvs.forEach(sv => {
        const sampleKey = `${sv.studyId}:${sv.sampleId}`;
        if (!svsBySample.has(sampleKey)) {
            svsBySample.set(sampleKey, []);
        }
        svsBySample.get(sampleKey)!.push(sv);
    });

    // Aggregate molecular data by patient (union approach)
    patientToSamplesMap.forEach((samples, patientId) => {
        const patientMutations: any[] = [];
        const patientCnas: any[] = [];
        const patientSvs: any[] = [];

        // Aggregate all alterations across patient's samples
        samples.forEach(sample => {
            const sampleKey = `${sample.studyId}:${sample.sampleId}`;

            // O(1) lookup instead of O(n) filter
            const sampleMutations = mutationsBySample.get(sampleKey) || [];
            patientMutations.push(...sampleMutations);

            const sampleCnas = cnasBySample.get(sampleKey) || [];
            patientCnas.push(...sampleCnas);

            const sampleSvs = svsBySample.get(sampleKey) || [];
            patientSvs.push(...sampleSvs);
        });

        // Store aggregated patient data
        patientMolecularDataMap.set(patientId, {
            mutations: patientMutations,
            cnas: patientCnas,
            svs: patientSvs,
            hasAnyAlteration:
                patientMutations.length > 0 ||
                patientCnas.length > 0 ||
                patientSvs.length > 0,
        });
    });

    return patientMolecularDataMap;
}

/**
 * Creates a fast lookup map from patients to samples
 */
export function createSampleLookupMap(
    allSamples: Sample[]
): Map<string, Sample> {
    const sampleLookupMap = new Map<string, Sample>();
    allSamples.forEach(sample => {
        sampleLookupMap.set(sample.patientId, sample);
    });
    return sampleLookupMap;
}

/**
 * Creates a lookup map for samples by sampleId (for sample-level embeddings)
 */
export function createSampleIdLookupMap(
    allSamples: Sample[]
): Map<string, Sample> {
    const sampleLookupMap = new Map<string, Sample>();
    allSamples.forEach(sample => {
        sampleLookupMap.set(sample.sampleId, sample);
    });
    return sampleLookupMap;
}

/**
 * Pre-computes clinical data colors and values for fast O(1) lookup
 * Handles both sample-level and patient-level attributes
 */
// Matches ResultsViewOncoprint's DEFAULT_MIXED_COLOR ([48, 97, 194]) — the
// colour the oncoprint falls back to for a value not present in
// category_to_color, which is exactly the "Mixed" case produced here.
export const MIXED_CLINICAL_VALUE = 'Mixed';
const DEFAULT_MIXED_CLINICAL_COLOR = '#3061C2';
const NO_DATA_COLOR = '#BEBEBE';

function colorForClinicalValue(
    value: any,
    categoryToColor?: { [key: string]: string } | null,
    numericalValueToColor?: (value: number) => string
): string {
    if (categoryToColor) {
        return categoryToColor[value] || NO_DATA_COLOR;
    } else if (numericalValueToColor) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            return numericalValueToColor(numValue);
        }
    }
    return NO_DATA_COLOR;
}

export function preComputeClinicalDataMaps(
    clinicalData: any[],
    categoryToColor?: { [key: string]: string } | null,
    numericalValueToColor?: (value: number) => string,
    isPatientAttribute: boolean = false,
    mixedColor: string = DEFAULT_MIXED_CLINICAL_COLOR
): {
    colorMap: Map<string, string>;
    valueMap: Map<string, string>;
    patientColorMap: Map<string, string>;
    patientValueMap: Map<string, string>;
} {
    const clinicalDataColorMap = new Map<string, string>();
    const clinicalDataValueMap = new Map<string, string>();
    const patientColorMap = new Map<string, string>();
    const patientValueMap = new Map<string, string>();

    if (clinicalData) {
        // Sample-keyed maps: used directly for sample-level embeddings, where
        // each rendered point is a single sample.
        clinicalData.forEach(data => {
            const sampleKey = `${data.studyId}:${data.sampleId}`;
            const color = colorForClinicalValue(
                data.value,
                categoryToColor,
                numericalValueToColor
            );
            clinicalDataColorMap.set(sampleKey, color);
            clinicalDataValueMap.set(sampleKey, data.value || 'Unknown');
        });

        // Patient-keyed maps: used for patient-level embeddings, where each
        // rendered point is a patient. A patient attribute has one value per
        // patient. A sample attribute is reduced across the patient's samples
        // the same way the oncoprint does in patient mode: the average for
        // numeric data, and "Mixed" when the samples disagree categorically.
        const rowsByPatient = new Map<string, any[]>();
        clinicalData.forEach(data => {
            if (!data.patientId) return;
            const rows = rowsByPatient.get(data.patientId) || [];
            rows.push(data);
            rowsByPatient.set(data.patientId, rows);
        });

        rowsByPatient.forEach((rows, patientId) => {
            if (isPatientAttribute) {
                // One value per patient — assign it directly.
                const { value } = rows[0];
                patientColorMap.set(
                    patientId,
                    colorForClinicalValue(
                        value,
                        categoryToColor,
                        numericalValueToColor
                    )
                );
                patientValueMap.set(patientId, value || 'Unknown');
            } else if (numericalValueToColor && !categoryToColor) {
                // Numeric sample attribute — average across the patient's samples.
                const nums = rows
                    .map(r => parseFloat(r.value))
                    .filter(n => !isNaN(n));
                if (nums.length === 0) return;
                const avg = nums.reduce((sum, n) => sum + n, 0) / nums.length;
                patientColorMap.set(patientId, numericalValueToColor(avg));
                patientValueMap.set(patientId, `${avg}`);
            } else {
                // Categorical sample attribute — "Mixed" if the samples differ.
                const distinct = Array.from(
                    new Set(
                        rows
                            .map(r => r.value)
                            .filter(
                                v => v !== undefined && v !== null && v !== ''
                            )
                    )
                );
                if (distinct.length === 0) return;
                if (distinct.length > 1) {
                    patientColorMap.set(patientId, mixedColor);
                    patientValueMap.set(patientId, MIXED_CLINICAL_VALUE);
                } else {
                    patientColorMap.set(
                        patientId,
                        colorForClinicalValue(
                            distinct[0],
                            categoryToColor,
                            numericalValueToColor
                        )
                    );
                    patientValueMap.set(patientId, distinct[0]);
                }
            }
        });
    }

    return {
        colorMap: clinicalDataColorMap,
        valueMap: clinicalDataValueMap,
        patientColorMap,
        patientValueMap,
    };
}
