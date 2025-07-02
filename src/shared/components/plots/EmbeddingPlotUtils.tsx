import { ColoringMenuOmnibarOption } from './PlotsTab';
import {
    IPlotSampleData,
    makeScatterPlotPointAppearance,
} from './PlotsTabUtils';
import { StudyViewPageStore } from '../../../pages/studyView/StudyViewPageStore';
import { Sample } from 'cbioportal-ts-api-client';
import {
    aggregateMolecularDataByPatient,
    createSampleLookupMap,
    preComputeClinicalDataMaps,
    getMolecularDataForGeneSync,
} from '../../lib/PatientMolecularDataUtils';
import {
    MUT_COLOR_MISSENSE,
    MUT_COLOR_MISSENSE_PASSENGER,
    MUT_COLOR_TRUNC,
    MUT_COLOR_TRUNC_PASSENGER,
    MUT_COLOR_INFRAME,
    MUT_COLOR_INFRAME_PASSENGER,
    MUT_COLOR_SPLICE,
    MUT_COLOR_SPLICE_PASSENGER,
    MUT_COLOR_OTHER,
    MUT_COLOR_OTHER_PASSENGER,
    CNA_COLOR_AMP,
    CNA_COLOR_HOMDEL,
    STRUCTURAL_VARIANT_COLOR,
} from 'cbioportal-frontend-commons';

export interface EmbeddingCoordinate {
    x: number;
    y: number;
    patientId: string;
}

export interface EmbeddingPlotPoint extends EmbeddingCoordinate {
    color?: string;
    strokeColor?: string;
    cancerType?: string;
}

/**
 * Transforms embedding coordinates into plot data using the same patterns as PlotsTab
 * This ensures consistency with existing scatter plot infrastructure
 */
export function makeEmbeddingScatterPlotData(
    embeddingCoordinates: EmbeddingCoordinate[],
    store: StudyViewPageStore,
    coloringOption?: ColoringMenuOmnibarOption,
    mutationTypeEnabled: boolean = true,
    copyNumberEnabled: boolean = true,
    structuralVariantEnabled: boolean = true,
    coloringLogScale: boolean = false
): EmbeddingPlotPoint[] {
    const allSamples = store.samples.result || [];
    const sampleLookupMap = createSampleLookupMap(allSamples);

    // Pre-compute cancer type lookup
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

    // Get molecular data if gene-based coloring is selected
    let patientMolecularDataMap = new Map<string, any>();
    if (
        coloringOption?.info?.entrezGeneId &&
        coloringOption.info.entrezGeneId !== -3
    ) {
        const entrezGeneId = coloringOption.info.entrezGeneId;

        // Use the new shared utility to get molecular data from store caches
        const molecularData = getMolecularDataForGeneSync(entrezGeneId, store, {
            mutationTypeEnabled,
            copyNumberEnabled,
            structuralVariantEnabled,
        });

        // Aggregate molecular data by patient
        patientMolecularDataMap = aggregateMolecularDataByPatient(
            allSamples,
            molecularData.mutations,
            molecularData.cnas,
            molecularData.svs
        );
    }

    // Pre-compute clinical data colors if clinical attribute is selected
    let clinicalDataColorMap = new Map<string, string>();
    let clinicalDataValueMap = new Map<string, string>();

    if (coloringOption?.info?.clinicalAttribute) {
        const clinicalAttribute = coloringOption.info.clinicalAttribute;
        const cacheEntry = store.clinicalDataCache.get(clinicalAttribute);

        if (cacheEntry.isComplete && cacheEntry.result) {
            const data = cacheEntry.result;
            const { colorMap, valueMap } = preComputeClinicalDataMaps(
                data.data,
                data.categoryToColor,
                data.numericalValueToColor
            );
            clinicalDataColorMap = colorMap;
            clinicalDataValueMap = valueMap;
        }
    }

    // Create appearance function using PlotsTab infrastructure
    let appearanceFunction: ((plotData: IPlotSampleData) => any) | null = null;
    if (coloringOption) {
        const coloringTypes: any = {};
        if (mutationTypeEnabled) coloringTypes.MutationType = true;
        if (copyNumberEnabled) coloringTypes.CopyNumber = true;
        if (structuralVariantEnabled) coloringTypes.StructuralVariant = true;

        appearanceFunction = makeScatterPlotPointAppearance(
            coloringTypes,
            !!store.annotatedMutationCache,
            !!store.annotatedCnaCache,
            !!store.structuralVariantCache,
            store.driverAnnotationSettings?.driversAnnotated || false,
            coloringOption,
            store.clinicalDataCache,
            coloringLogScale
        );
    }

    // Transform embedding coordinates to plot points
    return embeddingCoordinates.map(
        (coord: EmbeddingCoordinate): EmbeddingPlotPoint => {
            const sample = sampleLookupMap.get(coord.patientId);
            let color = '#CCCCCC';
            let strokeColor = '#CCCCCC';
            let cancerType = 'Unknown';

            if (sample && coloringOption) {
                if (
                    coloringOption.info?.entrezGeneId &&
                    coloringOption.info.entrezGeneId !== -3
                ) {
                    // Gene-based coloring - use appearance function
                    const molecularData = patientMolecularDataMap.get(
                        coord.patientId
                    ) || {
                        mutations: [],
                        cnas: [],
                        svs: [],
                        hasAnyAlteration: false,
                    };

                    // Create IPlotSampleData for appearance function
                    const plotData: IPlotSampleData = {
                        uniqueSampleKey: sample.uniqueSampleKey,
                        sampleId: sample.sampleId,
                        studyId: sample.studyId,
                        mutations: molecularData.mutations,
                        copyNumberAlterations: molecularData.cnas,
                        structuralVariants: molecularData.svs,
                        isProfiledMutations: mutationTypeEnabled,
                        isProfiledCna: copyNumberEnabled,
                        isProfiledStructuralVariants: structuralVariantEnabled,
                    };

                    // First classify by mutation status (aligns with plots tab behavior)
                    // First determine if patient has mutations
                    if (molecularData.mutations.length > 0) {
                        // Has mutations - use mutation-specific colors with solid fill
                        const firstMutation = molecularData.mutations[0];
                        const mutationType =
                            firstMutation.mutationType ||
                            firstMutation.type ||
                            'unknown';
                        const lowerType = mutationType.toLowerCase();
                        const driversAnnotated =
                            store.driverAnnotationSettings?.driversAnnotated ||
                            false;
                        const isDriver = firstMutation.putativeDriver;

                        // Use exact same mutation categorization and colors as backup
                        if (lowerType.includes('missense')) {
                            cancerType = 'Missense';
                            color =
                                driversAnnotated && !isDriver
                                    ? MUT_COLOR_MISSENSE_PASSENGER
                                    : MUT_COLOR_MISSENSE;
                        } else if (
                            lowerType.includes('truncating') ||
                            lowerType.includes('nonsense') ||
                            lowerType.includes('stop_gained') ||
                            lowerType.includes('frame_shift') ||
                            lowerType.includes('frameshift')
                        ) {
                            cancerType = 'Truncating';
                            color =
                                driversAnnotated && !isDriver
                                    ? MUT_COLOR_TRUNC_PASSENGER
                                    : MUT_COLOR_TRUNC;
                        } else if (
                            lowerType.includes('frame_del') ||
                            lowerType.includes('frame_ins') ||
                            lowerType.includes('in_frame_del') ||
                            lowerType.includes('in_frame_ins') ||
                            lowerType.includes('inframe')
                        ) {
                            cancerType = 'Inframe';
                            color =
                                driversAnnotated && !isDriver
                                    ? MUT_COLOR_INFRAME_PASSENGER
                                    : MUT_COLOR_INFRAME;
                        } else if (lowerType.includes('splice')) {
                            cancerType = 'Splice';
                            color =
                                driversAnnotated && !isDriver
                                    ? MUT_COLOR_SPLICE_PASSENGER
                                    : MUT_COLOR_SPLICE;
                        } else {
                            cancerType = 'Other';
                            color =
                                driversAnnotated && !isDriver
                                    ? MUT_COLOR_OTHER_PASSENGER
                                    : MUT_COLOR_OTHER;
                        }

                        // Add driver annotation to label
                        if (
                            driversAnnotated &&
                            firstMutation.putativeDriver !== undefined
                        ) {
                            cancerType = isDriver
                                ? `${cancerType} (Driver)`
                                : `${cancerType} (VUS)`;
                        }
                        strokeColor = color; // Solid fill for mutations
                    } else {
                        // No mutations - use blue fill for all non-mutated cases
                        color = '#c4e5f5'; // Blue fill for "Not mutated"

                        // Then determine the border color based on CNA or SV status
                        if (molecularData.svs.length > 0) {
                            // Structural variant but no mutations
                            cancerType = 'Structural Variant';
                            strokeColor = STRUCTURAL_VARIANT_COLOR;
                        } else if (molecularData.cnas.length > 0) {
                            const firstCna = molecularData.cnas[0];
                            const cnaValue =
                                firstCna.value !== undefined
                                    ? firstCna.value
                                    : 0;

                            if (cnaValue !== 0) {
                                // Non-diploid CNA but no mutations
                                switch (cnaValue) {
                                    case -2:
                                        cancerType = 'Deep Deletion';
                                        strokeColor = CNA_COLOR_HOMDEL;
                                        break;
                                    case -1:
                                        cancerType = 'Shallow Deletion';
                                        strokeColor = '#8FC7E8';
                                        break;
                                    case 1:
                                        cancerType = 'Gain';
                                        strokeColor = '#FF8A8A';
                                        break;
                                    case 2:
                                        cancerType = 'Amplification';
                                        strokeColor = CNA_COLOR_AMP;
                                        break;
                                    default:
                                        cancerType = `CNA ${cnaValue}`;
                                        strokeColor = '#BEBEBE';
                                }
                            } else {
                                // Diploid (normal) CNA and no mutations
                                cancerType = 'Not mutated';
                                strokeColor = color; // Same as fill color
                            }
                        } else {
                            // No alterations at all
                            cancerType = 'Not mutated';
                            strokeColor = color; // Same as fill color
                        }
                    }
                } else if (coloringOption.info?.clinicalAttribute) {
                    // Clinical attribute coloring
                    const sampleKey = `${sample.studyId}:${sample.sampleId}`;
                    color = clinicalDataColorMap.get(sampleKey) || '#BEBEBE';
                    strokeColor = color;

                    cancerType =
                        clinicalDataValueMap.get(sampleKey) ||
                        patientToCancerTypeMap.get(coord.patientId) ||
                        'Unknown';
                }
            } else if (sample) {
                // Default coloring
                cancerType =
                    patientToCancerTypeMap.get(coord.patientId) || 'Unknown';
            }

            return {
                x: coord.x,
                y: coord.y,
                patientId: coord.patientId,
                color,
                strokeColor,
                cancerType,
            };
        }
    );
}
