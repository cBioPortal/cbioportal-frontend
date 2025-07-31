import { ColoringMenuOmnibarOption } from './PlotsTab';
import {
    IPlotSampleData,
    makeScatterPlotPointAppearance,
} from './PlotsTabUtils';
import { StudyViewPageStore } from '../../../pages/studyView/StudyViewPageStore';
import { Sample, ClinicalAttribute } from 'cbioportal-ts-api-client';
import {
    EmbeddingData,
    PatientEmbeddingData,
    SampleEmbeddingData,
} from '../embeddings/EmbeddingTypes';
import {
    aggregateMolecularDataByPatient,
    createSampleLookupMap,
    createSampleIdLookupMap,
    preComputeClinicalDataMaps,
    getMolecularDataForGeneSync,
} from '../../lib/PatientMolecularDataUtils';
import {
    CNA_COLOR_AMP,
    CNA_COLOR_HOMDEL,
    STRUCTURAL_VARIANT_COLOR,
    getCanonicalMutationType,
    getProteinImpactTypeFromCanonical,
    ProteinImpactType,
} from 'cbioportal-frontend-commons';
import {
    getColorForProteinImpactType,
    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS,
} from '../../../../packages/react-mutation-mapper/src/util/MutationTypeUtils';

// Constants for non-cohort sample styling
const NON_COHORT_COLOR = '#666666'; // Dark gray

// Function to get context-aware label for non-cohort entries
function getNonCohortLabel(embeddingType: 'patients' | 'samples'): string {
    return embeddingType === 'samples'
        ? 'Sample not in this cohort'
        : 'Case not in this cohort';
}

// Oncoprint mixed color from existing infrastructure
const DEFAULT_MIXED_COLOR = [48, 97, 194, 1]; // Same as ResultsViewOncoprint.tsx
const DEFAULT_UNKNOWN_COLOR = '#BEBEBE'; // Default for no data

// Utility function to convert RGBA array to hex
function rgbaArrayToHex(rgba: number[]): string {
    if (!rgba || rgba.length < 3) {
        return '#CCCCCC'; // Fallback color
    }

    const [r, g, b] = rgba.map(val =>
        Math.max(0, Math.min(255, Math.round(val)))
    );

    const toHex = (num: number): string => {
        return num
            .toString(16)
            .padStart(2, '0')
            .toUpperCase();
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const MIXED_COLOR_HEX = rgbaArrayToHex(DEFAULT_MIXED_COLOR);

export interface PatientEmbeddingCoordinate {
    x: number;
    y: number;
    patientId: string;
}

export interface SampleEmbeddingCoordinate {
    x: number;
    y: number;
    sampleId: string;
}

export type EmbeddingCoordinate =
    | PatientEmbeddingCoordinate
    | SampleEmbeddingCoordinate;

export interface EmbeddingPlotPoint {
    x: number;
    y: number;
    patientId?: string;
    sampleId?: string;
    uniqueSampleKey?: string;
    color?: string;
    strokeColor?: string;
    displayLabel?: string;
    isInCohort?: boolean;
}

/**
 * Transforms embedding data into plot data using the same patterns as PlotsTab
 * This ensures consistency with existing scatter plot infrastructure
 */
export function makeEmbeddingScatterPlotData(
    embeddingData: EmbeddingData,
    store: StudyViewPageStore,
    coloringOption?: ColoringMenuOmnibarOption,
    mutationTypeEnabled: boolean = true,
    copyNumberEnabled: boolean = true,
    structuralVariantEnabled: boolean = true,
    coloringLogScale: boolean = false
): EmbeddingPlotPoint[] {
    if (embeddingData.embedding_type === 'samples') {
        return transformSampleEmbedding(
            embeddingData as SampleEmbeddingData,
            store,
            coloringOption,
            mutationTypeEnabled,
            copyNumberEnabled,
            structuralVariantEnabled,
            coloringLogScale
        );
    } else {
        return transformPatientEmbedding(
            embeddingData as PatientEmbeddingData,
            store,
            coloringOption,
            mutationTypeEnabled,
            copyNumberEnabled,
            structuralVariantEnabled,
            coloringLogScale
        );
    }
}

/**
 * Transform patient-level embedding data
 */
function transformPatientEmbedding(
    embeddingData: PatientEmbeddingData,
    store: StudyViewPageStore,
    coloringOption?: ColoringMenuOmnibarOption,
    mutationTypeEnabled: boolean = true,
    copyNumberEnabled: boolean = true,
    structuralVariantEnabled: boolean = true,
    coloringLogScale: boolean = false
): EmbeddingPlotPoint[] {
    const allSamples = store.samples.result || [];
    const patientLookupMap = createSampleLookupMap(allSamples);

    // Use optimized approach - pre-compute cancer type lookup from store
    const patientToCancerTypeMap = new Map<string, string>();
    const filteredSamplesByDetailedCancerType =
        store.filteredSamplesByDetailedCancerType.result;
    if (filteredSamplesByDetailedCancerType) {
        for (const [cancerType, samples] of Object.entries(
            filteredSamplesByDetailedCancerType
        )) {
            samples.forEach((sample: Sample) => {
                patientToCancerTypeMap.set(sample.patientId, cancerType);
            });
        }
    }

    // Pre-compute clinical data if needed
    let clinicalDataColorMap: Map<string, string> | undefined;
    let clinicalDataValueMap: Map<string, string> | undefined;

    if (coloringOption?.info?.clinicalAttribute) {
        const clinicalDataCacheEntry = store.clinicalDataCache.get(
            coloringOption.info.clinicalAttribute
        );

        if (
            clinicalDataCacheEntry.isComplete &&
            clinicalDataCacheEntry.result
        ) {
            const { colorMap, valueMap } = preComputeClinicalDataMaps(
                clinicalDataCacheEntry.result.data,
                clinicalDataCacheEntry.result.categoryToColor,
                clinicalDataCacheEntry.result.numericalValueToColor
            );
            clinicalDataColorMap = colorMap;
            clinicalDataValueMap = valueMap;
        }
    }

    // Pre-compute patient molecular data map
    let patientMolecularDataMap = new Map<string, any>();
    if (
        coloringOption?.info?.entrezGeneId &&
        coloringOption.info.entrezGeneId !== -3
    ) {
        const entrezGeneId = coloringOption.info.entrezGeneId;

        const molecularData = getMolecularDataForGeneSync(entrezGeneId, store, {
            mutationTypeEnabled,
            copyNumberEnabled,
            structuralVariantEnabled,
        });

        // Pre-aggregate molecular data by patient
        patientMolecularDataMap = aggregateMolecularDataByPatient(
            allSamples,
            molecularData.mutations,
            molecularData.cnas,
            molecularData.svs
        );
    }

    return embeddingData.data.map(coord => {
        const sample = patientLookupMap.get(coord.patientId);
        const isInCohort = !!sample;

        if (!isInCohort) {
            return {
                x: coord.x,
                y: coord.y,
                patientId: coord.patientId,
                color: NON_COHORT_COLOR,
                strokeColor: NON_COHORT_COLOR,
                displayLabel: getNonCohortLabel(embeddingData.embedding_type),
                isInCohort: false,
            };
        }

        // Use optimized approach - simple O(1) lookups
        let color = DEFAULT_UNKNOWN_COLOR;
        let strokeColor = DEFAULT_UNKNOWN_COLOR;
        let displayLabel = 'Unknown';

        if (
            coloringOption?.info?.entrezGeneId &&
            coloringOption.info.entrezGeneId !== -3
        ) {
            // Gene-based coloring - use pre-computed patient molecular data map (O(1) lookup)
            const patientMolecularData = patientMolecularDataMap.get(
                coord.patientId
            );

            // First determine if patient has mutations
            if (patientMolecularData?.mutations.length > 0) {
                // Has mutations - use shared mutation classification utilities
                const driversAnnotated =
                    store.driverAnnotationSettings?.driversAnnotated || false;

                // Use shared utility for mutation color selection
                color = getColorForProteinImpactType(
                    patientMolecularData.mutations,
                    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS,
                    () => 1, // getMutationCount
                    driversAnnotated
                        ? (mutation: any) => mutation.putativeDriver
                        : undefined
                );

                // Get protein impact type for display label
                const firstMutation = patientMolecularData.mutations[0];
                const mutationType =
                    firstMutation.mutationType ||
                    firstMutation.type ||
                    'unknown';
                const canonicalType = getCanonicalMutationType(mutationType);
                const proteinImpactType = getProteinImpactTypeFromCanonical(
                    canonicalType
                );

                // Set display label based on protein impact type
                switch (proteinImpactType) {
                    case ProteinImpactType.MISSENSE:
                        displayLabel = 'Missense';
                        break;
                    case ProteinImpactType.TRUNCATING:
                        displayLabel = 'Truncating';
                        break;
                    case ProteinImpactType.INFRAME:
                        displayLabel = 'Inframe';
                        break;
                    case ProteinImpactType.SPLICE:
                        displayLabel = 'Splice';
                        break;
                    case ProteinImpactType.FUSION:
                        displayLabel = 'Fusion';
                        break;
                    default:
                        displayLabel = 'Other';
                }

                // Add driver annotation to label
                if (
                    driversAnnotated &&
                    firstMutation.putativeDriver !== undefined
                ) {
                    const isDriver = firstMutation.putativeDriver;
                    displayLabel = isDriver
                        ? `${displayLabel} (Driver)`
                        : `${displayLabel} (VUS)`;
                }
                strokeColor = color; // Solid fill for mutations
            } else {
                // No mutations - use blue fill for all non-mutated cases
                color = '#c4e5f5'; // Blue fill for "Not mutated"

                // Then determine the border color based on CNA or SV status
                if (patientMolecularData?.svs.length > 0) {
                    // Structural variant but no mutations
                    displayLabel = 'Structural Variant';
                    strokeColor = STRUCTURAL_VARIANT_COLOR;
                } else if (patientMolecularData?.cnas.length > 0) {
                    const firstCna = patientMolecularData.cnas[0];
                    const cnaValue =
                        firstCna.value !== undefined ? firstCna.value : 0;

                    if (cnaValue !== 0) {
                        // Non-diploid CNA but no mutations - only show significant alterations
                        switch (cnaValue) {
                            case -2:
                                displayLabel = 'Deep Deletion';
                                strokeColor = CNA_COLOR_HOMDEL;
                                break;
                            case 2:
                                displayLabel = 'Amplification';
                                strokeColor = CNA_COLOR_AMP;
                                break;
                            default:
                                // Skip shallow deletion (-1) and gain (1) as requested
                                displayLabel = 'Not mutated';
                                strokeColor = color; // Same as fill color
                        }
                    } else {
                        // Diploid (normal) CNA and no mutations
                        displayLabel = 'Not mutated';
                        strokeColor = color; // Same as fill color
                    }
                } else {
                    // No alterations at all
                    displayLabel = 'Not mutated';
                    strokeColor = color; // Same as fill color
                }
            }
        } else if (coloringOption?.info?.clinicalAttribute && sample) {
            // Clinical attribute coloring - use pre-computed maps (O(1) lookup)
            const sampleKey = `${sample.studyId}:${sample.sampleId}`;
            color =
                clinicalDataColorMap?.get(sampleKey) || DEFAULT_UNKNOWN_COLOR;
            strokeColor = color;

            // Get from clinical data map OR fallback to cancer type map
            displayLabel =
                clinicalDataValueMap?.get(sampleKey) ||
                patientToCancerTypeMap.get(coord.patientId) ||
                'Unknown';
        } else {
            // Default coloring - use pre-computed cancer type map (O(1) lookup)
            displayLabel =
                patientToCancerTypeMap.get(coord.patientId) || 'Unknown';
            color = DEFAULT_UNKNOWN_COLOR;
            strokeColor = color;
        }

        return {
            x: coord.x,
            y: coord.y,
            patientId: coord.patientId,
            color,
            strokeColor,
            displayLabel,
            isInCohort: true,
        };
    });
}

/**
 * Transform sample-level embedding data
 */
function transformSampleEmbedding(
    embeddingData: SampleEmbeddingData,
    store: StudyViewPageStore,
    coloringOption?: ColoringMenuOmnibarOption,
    mutationTypeEnabled: boolean = true,
    copyNumberEnabled: boolean = true,
    structuralVariantEnabled: boolean = true,
    coloringLogScale: boolean = false
): EmbeddingPlotPoint[] {
    const allSamples = store.samples.result || [];
    const sampleLookupMap = createSampleIdLookupMap(allSamples);

    // Use same optimized approach - pre-compute cancer type lookup from store
    const patientToCancerTypeMap = new Map<string, string>();
    const filteredSamplesByDetailedCancerType =
        store.filteredSamplesByDetailedCancerType.result;
    if (filteredSamplesByDetailedCancerType) {
        for (const [cancerType, samples] of Object.entries(
            filteredSamplesByDetailedCancerType
        )) {
            samples.forEach((sample: Sample) => {
                patientToCancerTypeMap.set(sample.patientId, cancerType);
            });
        }
    }

    // Pre-compute clinical data if needed
    let clinicalDataColorMap: Map<string, string> | undefined;
    let clinicalDataValueMap: Map<string, string> | undefined;

    if (coloringOption?.info?.clinicalAttribute) {
        const clinicalDataCacheEntry = store.clinicalDataCache.get(
            coloringOption.info.clinicalAttribute
        );

        if (
            clinicalDataCacheEntry.isComplete &&
            clinicalDataCacheEntry.result
        ) {
            const { colorMap, valueMap } = preComputeClinicalDataMaps(
                clinicalDataCacheEntry.result.data,
                clinicalDataCacheEntry.result.categoryToColor,
                clinicalDataCacheEntry.result.numericalValueToColor
            );
            clinicalDataColorMap = colorMap;
            clinicalDataValueMap = valueMap;
        }
    }

    // Pre-compute molecular data maps
    let sampleMolecularDataMap = new Map<string, any>();
    if (
        coloringOption?.info?.entrezGeneId &&
        coloringOption.info.entrezGeneId !== -3
    ) {
        const entrezGeneId = coloringOption.info.entrezGeneId;

        const molecularData = getMolecularDataForGeneSync(entrezGeneId, store, {
            mutationTypeEnabled,
            copyNumberEnabled,
            structuralVariantEnabled,
        });

        // Pre-compute sample-specific molecular data map for O(1) lookups
        const sampleKeyToMolecularData = new Map<
            string,
            { mutations: any[]; cnas: any[]; svs: any[] }
        >();

        // Index mutations by sample key
        molecularData.mutations.forEach(m => {
            const sampleKey = `${m.studyId}:${m.sampleId}`;
            if (!sampleKeyToMolecularData.has(sampleKey)) {
                sampleKeyToMolecularData.set(sampleKey, {
                    mutations: [],
                    cnas: [],
                    svs: [],
                });
            }
            sampleKeyToMolecularData.get(sampleKey)!.mutations.push(m);
        });

        // Index CNAs by sample key
        molecularData.cnas.forEach(c => {
            const sampleKey = `${c.studyId}:${c.sampleId}`;
            if (!sampleKeyToMolecularData.has(sampleKey)) {
                sampleKeyToMolecularData.set(sampleKey, {
                    mutations: [],
                    cnas: [],
                    svs: [],
                });
            }
            sampleKeyToMolecularData.get(sampleKey)!.cnas.push(c);
        });

        // Index SVs by sample key
        molecularData.svs.forEach(sv => {
            const sampleKey = `${sv.studyId}:${sv.sampleId}`;
            if (!sampleKeyToMolecularData.has(sampleKey)) {
                sampleKeyToMolecularData.set(sampleKey, {
                    mutations: [],
                    cnas: [],
                    svs: [],
                });
            }
            sampleKeyToMolecularData.get(sampleKey)!.svs.push(sv);
        });

        sampleMolecularDataMap = sampleKeyToMolecularData;
    }

    return embeddingData.data.map(coord => {
        const sample = sampleLookupMap.get(coord.sampleId);
        const patientId = sample?.patientId || coord.sampleId;
        const isInCohort = !!sample;

        if (!isInCohort) {
            return {
                x: coord.x,
                y: coord.y,
                patientId,
                sampleId: coord.sampleId,
                color: NON_COHORT_COLOR,
                strokeColor: NON_COHORT_COLOR,
                displayLabel: getNonCohortLabel(embeddingData.embedding_type),
                isInCohort: false,
            };
        }

        // Use optimized approach - simple O(1) lookups
        let color = DEFAULT_UNKNOWN_COLOR;
        let strokeColor = DEFAULT_UNKNOWN_COLOR;
        let displayLabel = 'Unknown';

        if (
            coloringOption?.info?.entrezGeneId &&
            coloringOption.info.entrezGeneId !== -3 &&
            sample
        ) {
            // Gene-based coloring - use pre-computed sample molecular data map (O(1) lookup)
            const sampleKey = `${sample.studyId}:${sample.sampleId}`;
            const sampleMolecularData = sampleMolecularDataMap.get(sampleKey);

            // First determine if sample has mutations
            if (sampleMolecularData?.mutations.length > 0) {
                // Has mutations - use shared mutation classification utilities
                const driversAnnotated =
                    store.driverAnnotationSettings?.driversAnnotated || false;

                // Use shared utility for mutation color selection
                color = getColorForProteinImpactType(
                    sampleMolecularData.mutations,
                    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS,
                    () => 1, // getMutationCount
                    driversAnnotated
                        ? (mutation: any) => mutation.putativeDriver
                        : undefined
                );

                // Get protein impact type for display label
                const firstMutation = sampleMolecularData.mutations[0];
                const mutationType =
                    firstMutation.mutationType ||
                    firstMutation.type ||
                    'unknown';
                const canonicalType = getCanonicalMutationType(mutationType);
                const proteinImpactType = getProteinImpactTypeFromCanonical(
                    canonicalType
                );

                // Set display label based on protein impact type
                switch (proteinImpactType) {
                    case ProteinImpactType.MISSENSE:
                        displayLabel = 'Missense';
                        break;
                    case ProteinImpactType.TRUNCATING:
                        displayLabel = 'Truncating';
                        break;
                    case ProteinImpactType.INFRAME:
                        displayLabel = 'Inframe';
                        break;
                    case ProteinImpactType.SPLICE:
                        displayLabel = 'Splice';
                        break;
                    case ProteinImpactType.FUSION:
                        displayLabel = 'Fusion';
                        break;
                    default:
                        displayLabel = 'Other';
                }

                // Add driver annotation to label
                if (
                    driversAnnotated &&
                    firstMutation.putativeDriver !== undefined
                ) {
                    const isDriver = firstMutation.putativeDriver;
                    displayLabel = isDriver
                        ? `${displayLabel} (Driver)`
                        : `${displayLabel} (VUS)`;
                }
                strokeColor = color; // Solid fill for mutations
            } else {
                // No mutations - use blue fill for all non-mutated cases
                color = '#c4e5f5'; // Blue fill for "Not mutated"

                // Then determine the border color based on CNA or SV status
                if (sampleMolecularData?.svs.length > 0) {
                    // Structural variant but no mutations
                    displayLabel = 'Structural Variant';
                    strokeColor = STRUCTURAL_VARIANT_COLOR;
                } else if (sampleMolecularData?.cnas.length > 0) {
                    const firstCna = sampleMolecularData.cnas[0];
                    const cnaValue =
                        firstCna.value !== undefined ? firstCna.value : 0;

                    if (cnaValue !== 0) {
                        // Non-diploid CNA but no mutations - only show significant alterations
                        switch (cnaValue) {
                            case -2:
                                displayLabel = 'Deep Deletion';
                                strokeColor = CNA_COLOR_HOMDEL;
                                break;
                            case 2:
                                displayLabel = 'Amplification';
                                strokeColor = CNA_COLOR_AMP;
                                break;
                            default:
                                // Skip shallow deletion (-1) and gain (1) as requested
                                displayLabel = 'Not mutated';
                                strokeColor = color; // Same as fill color
                        }
                    } else {
                        // Diploid (normal) CNA and no mutations
                        displayLabel = 'Not mutated';
                        strokeColor = color; // Same as fill color
                    }
                } else {
                    // No alterations at all
                    displayLabel = 'Not mutated';
                    strokeColor = color; // Same as fill color
                }
            }
        } else if (coloringOption?.info?.clinicalAttribute && sample) {
            // Clinical attribute coloring - use pre-computed maps (O(1) lookup)
            const sampleKey = `${sample.studyId}:${sample.sampleId}`;
            color =
                clinicalDataColorMap?.get(sampleKey) || DEFAULT_UNKNOWN_COLOR;
            strokeColor = color;

            // For sample embeddings: direct clinical data lookup, with cancer type fallback
            displayLabel =
                clinicalDataValueMap?.get(sampleKey) ||
                patientToCancerTypeMap.get(patientId) ||
                'Unknown';
        } else {
            // Default coloring - use pre-computed cancer type map (O(1) lookup)
            displayLabel = patientToCancerTypeMap.get(patientId) || 'Unknown';
            color = DEFAULT_UNKNOWN_COLOR;
            strokeColor = color;
        }

        return {
            x: coord.x,
            y: coord.y,
            patientId,
            sampleId: coord.sampleId,
            uniqueSampleKey: sample?.uniqueSampleKey,
            color,
            strokeColor,
            displayLabel,
            isInCohort: true,
        };
    });
}
