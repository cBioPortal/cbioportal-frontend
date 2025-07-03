import * as React from 'react';
import { observer } from 'mobx-react';
import {
    computed,
    observable,
    action,
    makeObservable,
    reaction,
    runInAction,
} from 'mobx';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import * as Plotly from 'plotly.js';
import umapData from '../../../data/msk_chord_2024_umap_data.json';
import pcaData from '../../../data/msk_chord_2024_pca_data.json';
import { SpecialChartsUniqueKeyEnum } from '../StudyViewUtils';
import ColorSamplesByDropdown from 'shared/components/colorSamplesByDropdown/ColorSamplesByDropdown';
import ColoringService from 'shared/components/colorSamplesByDropdown/ColoringService';
import { ColoringMenuOmnibarOption } from 'shared/components/plots/PlotsTab';
import { makeScatterPlotPointAppearance } from 'shared/components/plots/PlotsTabUtils';
import { remoteData, MobxPromise } from 'cbioportal-frontend-commons';
import _ from 'lodash';
import { ClinicalAttribute, Gene } from 'cbioportal-ts-api-client';
import { getRemoteDataGroupStatus } from 'cbioportal-utils';
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

// Define standard gray color for diploid CNAs
const DEFAULT_GREY = '#BEBEBE';

interface EmbeddingDataPoint {
    x: number;
    y: number;
    patientId: string;
    cluster: number;
    pointIndex: number;
    cancerType?: string;
    color?: string;
    strokeColor?: string;
}

interface EmbeddingData {
    studyId: string;
    title: string;
    description: string;
    totalPatients: number;
    sampleSize: number;
    data: { patientId: string; x: number; y: number }[];
}

interface EmbeddingOption {
    value: string;
    label: string;
    data: EmbeddingData;
}

export interface IEmbeddingsTabProps {
    store: StudyViewPageStore;
}

@observer
export class EmbeddingsTab extends React.Component<IEmbeddingsTabProps, {}> {
    private plotRef = React.createRef<HTMLDivElement>();
    private patientDataMap = new Map<number, EmbeddingDataPoint>();
    private coloringService: ColoringService;

    @observable private selectedColoringOption?: ColoringMenuOmnibarOption;
    @observable private coloringLogScale = false;
    @observable private mutationTypeEnabled = true;
    @observable private copyNumberEnabled = true;
    @observable private structuralVariantEnabled = true;
    @observable private selectedEmbedding: EmbeddingOption = {
        value: 'umap',
        label: 'UMAP',
        data: umapData as EmbeddingData,
    };
    @observable private processingProgress = 0;
    @observable private isProcessingData = false;
    @observable private isDataReady = true;
    private currentProcessingController: AbortController | null = null;

    constructor(props: IEmbeddingsTabProps) {
        super(props);
        makeObservable(this);

        this.coloringService = new ColoringService({
            clinicalDataCache: this.props.store.clinicalDataCache,
            annotatedMutationCache: this.props.store.annotatedMutationCache,
            annotatedCnaCache: this.props.store.annotatedCnaCache,
            annotatedSvCache: this.props.store.structuralVariantCache,
            driverAnnotationSettings: this.props.store.driverAnnotationSettings,
        });
    }

    private initializeDefaultColoring() {
        // Set default to CANCER_TYPE_DETAILED if available
        const cancerTypeAttr = this.clinicalAttributes.find(
            attr => attr.clinicalAttributeId === 'CANCER_TYPE_DETAILED'
        );

        if (cancerTypeAttr) {
            this.selectedColoringOption = {
                label: cancerTypeAttr.displayName,
                value: `clinical_${cancerTypeAttr.clinicalAttributeId}`,
                info: {
                    clinicalAttribute: cancerTypeAttr,
                },
            };

            // Trigger the clinical data cache to load this attribute
            const cacheEntry = this.props.store.clinicalDataCache.get(
                cancerTypeAttr
            );

            // Update the coloring service with the default selection
            this.coloringService.updateConfig({
                selectedOption: this.selectedColoringOption,
                driverAnnotationSettings: this.props.store
                    .driverAnnotationSettings,
            });
        }
    }

    @computed get clinicalAttributes(): ClinicalAttribute[] {
        // Get clinical attributes from the study view store
        const clinicalAttributesCacheEntry = this.props.store
            .clinicalAttributes;
        return clinicalAttributesCacheEntry.result || [];
    }

    @computed get coloringClinicalDataPromise(): MobxPromise<any> | undefined {
        if (
            this.selectedColoringOption &&
            this.selectedColoringOption.info.clinicalAttribute
        ) {
            return this.props.store.clinicalDataCache.get(
                this.selectedColoringOption.info.clinicalAttribute
            );
        }
        return undefined;
    }

    @computed get shouldInitializeDefaultColoring(): boolean {
        // Reactive check for when we should initialize default coloring
        return (
            this.clinicalAttributes.length > 0 && !this.selectedColoringOption
        );
    }

    @computed get genes(): Gene[] {
        // Use allGenes to match PlotsTab pattern exactly
        // This provides comprehensive gene search capability in StudyView
        const genesResult = this.props.store.allGenes;
        return genesResult.isComplete ? genesResult.result || [] : [];
    }

    @computed get logScalePossible(): boolean {
        // Log scale not needed for UMAP coordinates
        return false;
    }

    @computed get mutationDataExists(): boolean {
        return !!this.props.store.annotatedMutationCache;
    }

    @computed get cnaDataExists(): boolean {
        return !!this.props.store.annotatedCnaCache;
    }

    @computed get svDataExists(): boolean {
        return !!this.props.store.structuralVariantCache;
    }

    @action.bound
    private onColoringSelectionChange(option?: ColoringMenuOmnibarOption) {
        this.selectedColoringOption = option;
        this.coloringService.updateConfig({
            selectedOption: option,
            annotatedMutationCache: this.mutationTypeEnabled
                ? this.props.store.annotatedMutationCache
                : undefined,
            annotatedCnaCache: this.copyNumberEnabled
                ? this.props.store.annotatedCnaCache
                : undefined,
            structuralVariantCache: this.structuralVariantEnabled
                ? this.props.store.structuralVariantCache
                : undefined,
            driverAnnotationSettings: this.props.store.driverAnnotationSettings,
        });

        // Handle different selection types
        if (option?.info?.clinicalAttribute) {
            const cacheEntry = this.props.store.clinicalDataCache.get(
                option.info.clinicalAttribute
            );
        } else if (
            option?.info?.entrezGeneId &&
            option.info.entrezGeneId !== -3
        ) {
        } else {
        }

        // MobX will automatically trigger re-render when plotData computed changes
    }

    @action.bound
    private onLogScaleChange(enabled: boolean) {
        this.coloringLogScale = enabled;
        this.coloringService.updateConfig({ logScale: enabled });

        // MobX will automatically trigger re-render when plotData computed changes
    }

    @action.bound
    private onMutationTypeToggle(enabled: boolean) {
        this.mutationTypeEnabled = enabled;
        this.updateColoringServiceConfig();
    }

    @action.bound
    private onCopyNumberToggle(enabled: boolean) {
        this.copyNumberEnabled = enabled;
        this.updateColoringServiceConfig();
    }

    @action.bound
    private onStructuralVariantToggle(enabled: boolean) {
        this.structuralVariantEnabled = enabled;
        this.updateColoringServiceConfig();
    }

    private updateColoringServiceConfig() {
        this.coloringService.updateConfig({
            selectedOption: this.selectedColoringOption,
            logScale: this.coloringLogScale,
            annotatedMutationCache: this.mutationTypeEnabled
                ? this.props.store.annotatedMutationCache
                : undefined,
            annotatedCnaCache: this.copyNumberEnabled
                ? this.props.store.annotatedCnaCache
                : undefined,
            structuralVariantCache: this.structuralVariantEnabled
                ? this.props.store.structuralVariantCache
                : undefined,
            driverAnnotationSettings: this.props.store.driverAnnotationSettings,
        });
    }

    @computed get embeddingOptions(): EmbeddingOption[] {
        return [
            {
                value: 'umap',
                label: 'UMAP',
                data: umapData as EmbeddingData,
            },
            {
                value: 'pca',
                label: 'PCA',
                data: pcaData as EmbeddingData,
            },
        ];
    }

    @action.bound
    private onEmbeddingSelectionChange(option: EmbeddingOption) {
        this.selectedEmbedding = option;
    }

    @computed get filteredPatientIds(): string[] {
        // selectedSamples IS the filtered data! It returns filtered results when chartsAreFiltered is true
        const filteredSamples = this.props.store.selectedSamples.result || [];
        const chartsAreFiltered = this.props.store.chartsAreFiltered;

        // Extract unique patient IDs from the filtered samples
        const patientIds = [
            ...new Set(filteredSamples.map((s: any) => s.patientId)),
        ];

        return patientIds;
    }

    // Helper function to process data in chunks to prevent browser freezing
    private async processDataInChunks<T, R>(
        data: T[],
        processor: (item: T, index: number) => R,
        chunkSize: number = 1000
    ): Promise<R[]> {
        const results: R[] = [];
        const totalItems = data.length;

        // Cancel any existing processing
        if (this.currentProcessingController) {
            this.currentProcessingController.abort();
        }

        this.currentProcessingController = new AbortController();
        const signal = this.currentProcessingController.signal;

        runInAction(() => {
            this.isProcessingData = true;
            this.processingProgress = 0;
            this.isDataReady = false;
        });

        try {
            for (let i = 0; i < totalItems; i += chunkSize) {
                // Check if processing was cancelled
                if (signal.aborted) {
                    throw new Error('Processing cancelled');
                }

                const chunk = data.slice(
                    i,
                    Math.min(i + chunkSize, totalItems)
                );
                const chunkResults = chunk.map((item, chunkIndex) =>
                    processor(item, i + chunkIndex)
                );
                results.push(...chunkResults);

                // Update progress
                const progress = Math.min(
                    100,
                    ((i + chunkSize) / totalItems) * 100
                );
                runInAction(() => {
                    this.processingProgress = progress;
                });

                // Yield to browser for UI updates (every chunk except the last)
                if (i + chunkSize < totalItems) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            runInAction(() => {
                this.isProcessingData = false;
                this.processingProgress = 100;
                this.isDataReady = true;
            });

            return results;
        } catch (error) {
            runInAction(() => {
                this.isProcessingData = false;
                this.processingProgress = 0;
                this.isDataReady = false;
            });
            throw error;
        }
    }

    @observable private cachedEmbeddingData: EmbeddingDataPoint[] = [];
    private lastCacheKey = '';

    private getCacheKey(): string {
        // Create a cache key based on dependencies that affect the data
        return JSON.stringify({
            selectedEmbedding: this.selectedEmbedding.value, // This will invalidate cache when switching embeddings
            selectedColoring: this.selectedColoringOption?.value || 'none',
            mutationEnabled: this.mutationTypeEnabled,
            cnaEnabled: this.copyNumberEnabled,
            svEnabled: this.structuralVariantEnabled,
            logScale: this.coloringLogScale,
            samplesReady: this.props.store.samples.isComplete,
            selectedSamplesReady: this.props.store.selectedSamples.isComplete,
        });
    }

    private async loadEmbeddingDataAsync(): Promise<EmbeddingDataPoint[]> {
        console.time('🔍 TOTAL loadEmbeddingDataAsync');

        const embeddingData = this.selectedEmbedding.data;

        // Use the computed property to force reactivity
        const filteredPatientIds = this.filteredPatientIds;

        // Check if data is ready
        const samplesReady = this.props.store.samples.isComplete;
        const allSamples = this.props.store.samples.result || [];

        // Get all unique patient IDs from samples
        const allPatientIds = [
            ...new Set(allSamples.map((s: any) => s.patientId)),
        ];

        console.time('📊 Sample lookup map creation');
        // PERFORMANCE OPTIMIZATION: Create sample lookup map to eliminate O(n²) operations
        const sampleLookupMap = new Map<string, any>();
        allSamples.forEach(sample => {
            sampleLookupMap.set(sample.patientId, sample);
        });
        console.timeEnd('📊 Sample lookup map creation');
        console.log(
            `📊 Created sample lookup for ${allSamples.length} samples`
        );

        // PERFORMANCE OPTIMIZATION: Pre-compute cancer type lookup map
        const patientToCancerTypeMap = new Map<string, string>();

        // Cache detailed cancer type lookups
        const filteredSamplesByDetailedCancerType = this.props.store
            .filteredSamplesByDetailedCancerType.result;
        if (filteredSamplesByDetailedCancerType) {
            for (const [cancerType, samples] of Object.entries(
                filteredSamplesByDetailedCancerType
            )) {
                (samples as any[]).forEach(sample => {
                    patientToCancerTypeMap.set(sample.patientId, cancerType);
                });
            }
        }

        // Fallback: cache study-based cancer types
        const studyIdToStudy = this.props.store.studyIdToStudy.result;
        if (studyIdToStudy && patientToCancerTypeMap.size === 0) {
            allSamples.forEach(sample => {
                if (!patientToCancerTypeMap.has(sample.patientId)) {
                    const study = studyIdToStudy[sample.studyId];
                    if (study && study.cancerType) {
                        const cancerTypeName =
                            study.cancerType.name ||
                            study.cancerType.cancerTypeId;
                        patientToCancerTypeMap.set(
                            sample.patientId,
                            cancerTypeName
                        );
                    }
                }
            });
        }

        console.time('🧬 Molecular data pre-aggregation');
        // PERFORMANCE OPTIMIZATION: Results View approach - pre-aggregate molecular data by PATIENT
        let patientMolecularDataMap = new Map<
            string,
            {
                mutations: any[];
                cnas: any[];
                svs: any[];
                hasAnyAlteration: boolean;
            }
        >();

        if (
            this.selectedColoringOption?.info?.entrezGeneId &&
            this.selectedColoringOption.info.entrezGeneId !== -3
        ) {
            const entrezGeneId = this.selectedColoringOption.info.entrezGeneId;
            console.log(
                `🧬 Pre-aggregating molecular data for gene ${entrezGeneId}`
            );

            console.time('🧬 Step 1: Fetch molecular data');
            // Step 1: Get all molecular data for the gene (like Results View does)
            let allMutations: any[] = [];
            let allCnas: any[] = [];
            let allSvs: any[] = [];

            if (
                this.mutationTypeEnabled &&
                this.props.store.annotatedMutationCache
            ) {
                const mutationCacheResult = this.props.store.annotatedMutationCache.get(
                    { entrezGeneId }
                );
                if (
                    mutationCacheResult?.isComplete &&
                    mutationCacheResult.result
                ) {
                    allMutations = mutationCacheResult.result;
                }
            }

            if (this.copyNumberEnabled && this.props.store.annotatedCnaCache) {
                const cnaCacheResult = this.props.store.annotatedCnaCache.get({
                    entrezGeneId,
                });
                if (cnaCacheResult?.isComplete && cnaCacheResult.result) {
                    allCnas = cnaCacheResult.result;
                }
            }

            if (
                this.structuralVariantEnabled &&
                this.props.store.structuralVariantCache
            ) {
                const svCacheResult = this.props.store.structuralVariantCache.get(
                    { entrezGeneId }
                );
                if (svCacheResult?.isComplete && svCacheResult.result) {
                    allSvs = svCacheResult.result;
                }
            }
            console.timeEnd('🧬 Step 1: Fetch molecular data');
            console.log(
                `🧬 Found: ${allMutations.length} mutations, ${allCnas.length} CNAs, ${allSvs.length} SVs`
            );

            console.time('🧬 Step 2: Patient-to-samples mapping');
            // Step 2: Group molecular data by patient (taking union like Results View)
            const patientToSamplesMap = new Map<string, any[]>();
            allSamples.forEach(sample => {
                if (!patientToSamplesMap.has(sample.patientId)) {
                    patientToSamplesMap.set(sample.patientId, []);
                }
                patientToSamplesMap.get(sample.patientId)!.push(sample);
            });
            console.timeEnd('🧬 Step 2: Patient-to-samples mapping');
            console.log(
                `🧬 Mapped ${patientToSamplesMap.size} patients to samples`
            );

            console.time('🧬 Step 3: Patient-level aggregation');

            // PERFORMANCE FIX: Index molecular data by sample key first to avoid O(n²) operations
            console.time('🧬 Step 3a: Index molecular data by sample');
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
            console.timeEnd('🧬 Step 3a: Index molecular data by sample');
            console.log(
                `🧬 Indexed: ${mutationsBySample.size} mutation samples, ${cnasBySample.size} CNA samples, ${svsBySample.size} SV samples`
            );

            console.time('🧬 Step 3b: Aggregate by patient (O(n) lookups)');
            // Step 3: Pre-compute patient-level molecular data aggregations using indexed lookups
            patientToSamplesMap.forEach((samples, patientId) => {
                const patientMutations: any[] = [];
                const patientCnas: any[] = [];
                const patientSvs: any[] = [];

                // Aggregate all alterations across patient's samples (union approach)
                // Now using O(1) Map lookups instead of O(n) filter operations
                samples.forEach(sample => {
                    const sampleKey = `${sample.studyId}:${sample.sampleId}`;

                    // O(1) lookup instead of O(n) filter
                    const sampleMutations =
                        mutationsBySample.get(sampleKey) || [];
                    patientMutations.push(...sampleMutations);

                    // O(1) lookup instead of O(n) filter
                    const sampleCnas = cnasBySample.get(sampleKey) || [];
                    patientCnas.push(...sampleCnas);

                    // O(1) lookup instead of O(n) filter
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
            console.timeEnd('🧬 Step 3b: Aggregate by patient (O(n) lookups)');
            console.timeEnd('🧬 Step 3: Patient-level aggregation');
            console.log(
                `🧬 Aggregated molecular data for ${patientMolecularDataMap.size} patients (embedding has ${embeddingData.data.length} patients)`
            );
        }
        console.timeEnd('🧬 Molecular data pre-aggregation');

        console.time('🎨 Clinical data pre-aggregation');
        // PERFORMANCE OPTIMIZATION: Pre-compute clinical data colors AND values for fast lookup
        let clinicalDataColorMap = new Map<string, string>();
        let clinicalDataValueMap = new Map<string, string>();

        if (this.selectedColoringOption?.info?.clinicalAttribute) {
            const clinicalAttribute = this.selectedColoringOption.info
                .clinicalAttribute;
            const cacheEntry = this.props.store.clinicalDataCache.get(
                clinicalAttribute
            );

            if (cacheEntry.isComplete && cacheEntry.result) {
                const data = cacheEntry.result;

                // Pre-compute BOTH color and value for each sample to avoid repeated lookups
                if (data.data && Array.isArray(data.data)) {
                    (data.data as any[]).forEach((clinicalData: any) => {
                        const sampleKey = `${clinicalData.studyId}:${clinicalData.sampleId}`;
                        let color = '#BEBEBE'; // Default

                        if (
                            clinicalAttribute.datatype === 'STRING' &&
                            data.categoryToColor
                        ) {
                            color =
                                data.categoryToColor[clinicalData.value] ||
                                '#BEBEBE';
                        } else if (
                            clinicalAttribute.datatype === 'NUMBER' &&
                            data.numericalValueToColor
                        ) {
                            const numValue = parseFloat(clinicalData.value);
                            if (!isNaN(numValue)) {
                                color = data.numericalValueToColor(numValue);
                            }
                        }

                        // Store both color and value for O(1) lookup
                        clinicalDataColorMap.set(sampleKey, color);
                        clinicalDataValueMap.set(
                            sampleKey,
                            clinicalData.value || 'Unknown'
                        );
                    });
                }
            }
        }
        console.timeEnd('🎨 Clinical data pre-aggregation');
        console.log(
            `🎨 Pre-computed colors and values for ${clinicalDataColorMap.size} clinical data points`
        );

        // PERFORMANCE OPTIMIZATION: Configure ColoringService once outside the loop
        if (this.selectedColoringOption) {
            this.coloringService.updateConfig({
                selectedOption: this.selectedColoringOption,
                logScale: this.coloringLogScale,
                annotatedMutationCache: this.mutationTypeEnabled
                    ? this.props.store.annotatedMutationCache
                    : undefined,
                annotatedCnaCache: this.copyNumberEnabled
                    ? this.props.store.annotatedCnaCache
                    : undefined,
                structuralVariantCache: this.structuralVariantEnabled
                    ? this.props.store.structuralVariantCache
                    : undefined,
                driverAnnotationSettings: this.props.store
                    .driverAnnotationSettings,
            });
        }

        // PERFORMANCE OPTIMIZATION: Fast patient-level molecular data lookup (Results View pattern)
        const getPatientMolecularData = (patientId: string) => {
            return (
                patientMolecularDataMap.get(patientId) || {
                    mutations: [],
                    cnas: [],
                    svs: [],
                    hasAnyAlteration: false,
                }
            );
        };

        // PERFORMANCE OPTIMIZATION: Pre-compute appearance function once (not per patient!)
        let appearanceFunction: ((plotData: any) => any) | null = null;
        let coloringTypes: any = {};

        if (this.selectedColoringOption) {
            if (this.mutationTypeEnabled) {
                coloringTypes.MutationType = true;
            }
            if (this.copyNumberEnabled) {
                coloringTypes.CopyNumber = true;
            }
            if (this.structuralVariantEnabled) {
                coloringTypes.StructuralVariant = true;
            }

            // Create appearance function ONCE outside the loop
            appearanceFunction = makeScatterPlotPointAppearance(
                coloringTypes,
                this.mutationDataExists,
                this.cnaDataExists,
                this.svDataExists,
                this.props.store.driverAnnotationSettings?.driversAnnotated ||
                    false,
                this.selectedColoringOption,
                this.props.store.clinicalDataCache,
                this.coloringLogScale
            );
        }

        // PERFORMANCE OPTIMIZATION: Simplified patient processing
        const processPatient = (
            patient: any,
            index: number
        ): EmbeddingDataPoint => {
            // OPTIMIZED: Use Map lookup instead of find() - O(1) vs O(n)
            const sample = sampleLookupMap.get(patient.patientId);

            let color = '#CCCCCC';
            let strokeColor = '#CCCCCC';
            let cancerType = 'Unknown';

            if (sample && this.selectedColoringOption && appearanceFunction) {
                if (
                    this.selectedColoringOption.info.entrezGeneId &&
                    this.selectedColoringOption.info.entrezGeneId !== -3
                ) {
                    // Gene-based coloring - use pre-aggregated patient molecular data
                    const molecularData = getPatientMolecularData(
                        patient.patientId
                    );

                    // PERFORMANCE OPTIMIZATION: Generate legend label using proper mutation categories (same as PlotsTab)
                    if (molecularData.svs.length > 0) {
                        cancerType = 'Structural Variant';
                    } else if (molecularData.mutations.length > 0) {
                        // Use proper mutation categorization that matches PlotsTab
                        const firstMutation = molecularData.mutations[0];
                        const mutationType =
                            firstMutation.mutationType ||
                            firstMutation.type ||
                            'unknown';

                        // Group mutations the same way as PlotsTab
                        let categoryType: string;
                        const lowerType = mutationType.toLowerCase();

                        if (lowerType.includes('missense')) {
                            categoryType = 'Missense';
                        } else if (
                            lowerType.includes('truncating') ||
                            lowerType.includes('nonsense') ||
                            lowerType.includes('stop_gained') ||
                            lowerType.includes('frame_shift') ||
                            lowerType.includes('frameshift')
                        ) {
                            categoryType = 'Truncating';
                        } else if (
                            lowerType.includes('frame_del') ||
                            lowerType.includes('frame_ins') ||
                            lowerType.includes('in_frame_del') ||
                            lowerType.includes('in_frame_ins') ||
                            lowerType.includes('inframe')
                        ) {
                            categoryType = 'Inframe';
                        } else if (lowerType.includes('splice')) {
                            categoryType = 'Splice';
                        } else {
                            categoryType = 'Other';
                        }

                        const driversAnnotated =
                            this.props.store.driverAnnotationSettings
                                ?.driversAnnotated || false;
                        if (driversAnnotated) {
                            const isDriver = firstMutation.putativeDriver;
                            cancerType = isDriver
                                ? `${categoryType} (Driver)`
                                : `${categoryType} (VUS)`;
                        } else {
                            cancerType = categoryType;
                        }
                    } else if (molecularData.cnas.length > 0) {
                        // Use first CNA's value
                        const firstCna = molecularData.cnas[0];
                        const cnaValue =
                            firstCna.value !== undefined ? firstCna.value : 0;
                        switch (cnaValue) {
                            case -2:
                                cancerType = 'Deep Deletion';
                                break;
                            case -1:
                                cancerType = 'Shallow Deletion';
                                break;
                            case 1:
                                cancerType = 'Gain';
                                break;
                            case 2:
                                cancerType = 'Amplification';
                                break;
                            case 0:
                                cancerType = 'Diploid';
                                break;
                            default:
                                cancerType = `CNA ${cnaValue}`;
                        }
                    } else {
                        cancerType = 'No mutation';
                    }

                    // Build proper plotData structure that makeScatterPlotPointAppearance expects
                    const plotData: any = {
                        sampleId: sample.sampleId,
                        studyId: sample.studyId,
                        mutations: molecularData.mutations,
                        copyNumberAlterations: molecularData.cnas,
                        structuralVariants: molecularData.svs,
                        uniqueSampleKey: `${sample.studyId}:${sample.sampleId}`,
                    };

                    // Add required fields for appearance function to work correctly
                    if (molecularData.mutations.length > 0) {
                        const firstMutation = molecularData.mutations[0];
                        plotData.dispMutationType =
                            firstMutation.mutationType || firstMutation.type;
                        plotData.isDriverMutation =
                            firstMutation.putativeDriver;
                        plotData.isProfiledMutations = true;
                    } else {
                        plotData.isProfiledMutations = true; // Still profiled, just no mutations
                    }

                    if (molecularData.cnas.length > 0) {
                        const firstCna = molecularData.cnas[0];
                        plotData.dispCna = firstCna;
                        plotData.isProfiledCna = true;
                    } else {
                        plotData.isProfiledCna = true; // Still profiled, just no CNAs
                    }

                    if (molecularData.svs.length > 0) {
                        const firstSv = molecularData.svs[0];
                        plotData.dispStructuralVariant =
                            firstSv.variantClass || firstSv.eventInfo || 'SV';
                        plotData.isProfiledStructuralVariants = true;
                    } else {
                        plotData.isProfiledStructuralVariants = true;
                    }

                    // PERFORMANCE FIX: Use standard cBioPortal colors (same as PlotsTab)
                    if (molecularData.svs.length > 0) {
                        // Structural variants - use standard SV color
                        color = 'rgba(255,255,255,0.9)'; // Nearly transparent fill
                        strokeColor = STRUCTURAL_VARIANT_COLOR; // Standard purple stroke
                    } else if (molecularData.mutations.length > 0) {
                        // Mutations - use standard mutation colors with proper categorization (same as PlotsTab)
                        const firstMutation = molecularData.mutations[0];
                        const mutationType =
                            firstMutation.mutationType ||
                            firstMutation.type ||
                            'unknown';
                        const isDriver = firstMutation.putativeDriver;
                        const driversAnnotated =
                            this.props.store.driverAnnotationSettings
                                ?.driversAnnotated || false;

                        // Use exact same categorization and colors as PlotsTab
                        const lowerType = mutationType.toLowerCase();

                        if (lowerType.includes('missense')) {
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
                            color =
                                driversAnnotated && !isDriver
                                    ? MUT_COLOR_INFRAME_PASSENGER
                                    : MUT_COLOR_INFRAME;
                        } else if (lowerType.includes('splice')) {
                            color =
                                driversAnnotated && !isDriver
                                    ? MUT_COLOR_SPLICE_PASSENGER
                                    : MUT_COLOR_SPLICE;
                        } else {
                            color =
                                driversAnnotated && !isDriver
                                    ? MUT_COLOR_OTHER_PASSENGER
                                    : MUT_COLOR_OTHER;
                        }
                        strokeColor = color;
                    } else if (molecularData.cnas.length > 0) {
                        // CNAs - use standard CNA colors
                        const firstCna = molecularData.cnas[0];
                        const cnaValue =
                            firstCna.value !== undefined ? firstCna.value : 0;

                        color = 'rgba(255,255,255,0.9)'; // Nearly transparent fill for CNAs

                        switch (cnaValue) {
                            case -2:
                                strokeColor = CNA_COLOR_HOMDEL;
                                break; // Deep deletion - standard blue
                            case -1:
                                strokeColor = '#8FC7E8';
                                break; // Shallow deletion - light blue
                            case 0:
                                strokeColor = DEFAULT_GREY;
                                break; // Diploid - standard gray
                            case 1:
                                strokeColor = '#FF8A8A';
                                break; // Gain - light red
                            case 2:
                                strokeColor = CNA_COLOR_AMP;
                                break; // Amplification - standard red
                            default:
                                strokeColor = DEFAULT_GREY;
                        }
                    } else {
                        // No alterations - standard vanilla color
                        color = '#c4e5f5'; // Standard "no mutation" color
                        strokeColor = '#c4e5f5';
                    }
                } else {
                    // Clinical attribute coloring - use pre-computed colors and values for O(1) lookup
                    const sampleKey = `${sample.studyId}:${sample.sampleId}`;
                    color = clinicalDataColorMap.get(sampleKey) || '#BEBEBE';
                    strokeColor = color;

                    // Get display value using O(1) lookup instead of expensive find()
                    cancerType =
                        clinicalDataValueMap.get(sampleKey) ||
                        patientToCancerTypeMap.get(patient.patientId) ||
                        'Unknown';
                }
            } else if (sample) {
                // Default coloring
                cancerType =
                    patientToCancerTypeMap.get(patient.patientId) || 'Unknown';
            }

            return {
                x: patient.x,
                y: patient.y,
                patientId: patient.patientId,
                cluster: Math.floor(Math.random() * 8) + 1,
                pointIndex: index,
                cancerType: cancerType,
                color: color,
                strokeColor: strokeColor,
            };
        };

        console.time('🎨 Patient processing');
        console.log(
            `🎨 Processing ${embeddingData.data.length} patients for ${this.selectedEmbedding.label}`
        );

        // For small datasets (like PCA with 10 patients), don't use chunking
        const allData: EmbeddingDataPoint[] = embeddingData.data.map(
            processPatient
        );

        console.timeEnd('🎨 Patient processing');
        console.log(
            `🎨 Processed ${allData.length} data points for ${this.selectedEmbedding.label}`
        );

        // If samples aren't ready yet, show all embedding data
        if (!samplesReady || allPatientIds.length === 0) {
            this.patientDataMap.clear();
            allData.forEach((point: EmbeddingDataPoint, index: number) => {
                point.pointIndex = index;
                this.patientDataMap.set(point.pointIndex, point);
            });
            return allData;
        }

        // Check overlap between study patients and embedding patients
        const studyPatientIds = new Set(allPatientIds);
        const embeddingPatientIds = new Set(
            embeddingData.data.map((p: any) => p.patientId)
        );
        const studyEmbeddingOverlap = allPatientIds.filter((pid: string) =>
            embeddingPatientIds.has(pid)
        );

        // Use the filtered patient IDs from the computed property
        // This will automatically contain the right patients based on current filters
        const patientsToShow = new Set(filteredPatientIds);

        const filteredData = allData.filter((point: EmbeddingDataPoint) =>
            patientsToShow.has(point.patientId)
        );

        // Build a map for quick lookup
        this.patientDataMap.clear();
        filteredData.forEach((point: EmbeddingDataPoint, index: number) => {
            // Re-index the filtered data
            point.pointIndex = index;
            this.patientDataMap.set(point.pointIndex, point);
        });

        console.time('💾 Cache and return');
        // Cache the result and mark data as ready
        runInAction(() => {
            this.cachedEmbeddingData = filteredData;
            this.isDataReady = true;
            this.isProcessingData = false;
        });
        console.timeEnd('💾 Cache and return');

        console.timeEnd('🔍 TOTAL loadEmbeddingDataAsync');
        console.log(`✅ Returning ${filteredData.length} data points`);

        return filteredData;
    }

    // Trigger async loading when dependencies change
    private triggerDataLoad() {
        const currentCacheKey = this.getCacheKey();

        if (
            this.props.store.samples.isComplete &&
            this.props.store.selectedSamples.isComplete &&
            !this.isProcessingData &&
            currentCacheKey !== this.lastCacheKey
        ) {
            // Cache is invalid, clear it and start loading
            runInAction(() => {
                this.cachedEmbeddingData = [];
                this.isDataReady = false;
            });

            this.lastCacheKey = currentCacheKey;

            this.loadEmbeddingDataAsync().catch(error => {
                console.error('Error loading embedding data:', error);
                runInAction(() => {
                    this.isProcessingData = false;
                    this.processingProgress = 0;
                    this.isDataReady = false;
                });
            });
        }
    }

    private getPatientCancerType(patientId: string): string | undefined {
        // Get cancer type from the filtered samples by detailed cancer type
        const filteredSamplesByDetailedCancerType = this.props.store
            .filteredSamplesByDetailedCancerType.result;

        if (filteredSamplesByDetailedCancerType) {
            // Find which cancer type this patient belongs to
            for (const [cancerType, samples] of Object.entries(
                filteredSamplesByDetailedCancerType
            )) {
                if (
                    samples.some(
                        (sample: any) => sample.patientId === patientId
                    )
                ) {
                    return cancerType;
                }
            }
        }

        // Fallback: try to get from study information
        const studyIdToStudy = this.props.store.studyIdToStudy.result;
        const samples = this.props.store.samples.result || [];

        if (studyIdToStudy) {
            for (const sample of samples) {
                if (sample.patientId === patientId) {
                    const study = studyIdToStudy[sample.studyId];
                    if (study && study.cancerType) {
                        return (
                            study.cancerType.name ||
                            study.cancerType.cancerTypeId
                        );
                    }
                }
            }
        }

        return undefined;
    }

    private getCancerTypeColorMap(): Map<string, string> {
        const colorMap = new Map<string, string>();

        // First try to get colors from the study view store's cancer type chart
        const filteredSamplesByDetailedCancerType = this.props.store
            .filteredSamplesByDetailedCancerType.result;

        if (filteredSamplesByDetailedCancerType) {
            // Get cancer type chart data which should have colors assigned
            const cancerTypeChartData = this.getCancerTypeChartData();

            if (cancerTypeChartData) {
                cancerTypeChartData.forEach((item: any) => {
                    if (item.value && item.color) {
                        colorMap.set(item.value, item.color);
                    }
                });
            }
        }

        // Fallback: get colors from study dedicated colors
        if (colorMap.size === 0) {
            const studyIdToStudy = this.props.store.studyIdToStudy.result;
            if (studyIdToStudy) {
                Object.values(studyIdToStudy).forEach((study: any) => {
                    if (study.cancerType) {
                        const cancerTypeName =
                            study.cancerType.name ||
                            study.cancerType.cancerTypeId;
                        const color =
                            study.cancerType.dedicatedColor ||
                            this.generateColorFromString(cancerTypeName);
                        colorMap.set(cancerTypeName, color);
                    }
                });
            }
        }

        // Add default color for unknown
        colorMap.set('Unknown', '#CCCCCC');

        return colorMap;
    }

    private getCancerTypeChartData(): any[] | undefined {
        try {
            // Try to get cancer type chart data from the store
            // Look for CANCER_TYPE_DETAILED clinical attribute
            const cancerTypeAttr = this.clinicalAttributes.find(
                attr => attr.clinicalAttributeId === 'CANCER_TYPE_DETAILED'
            );

            if (cancerTypeAttr) {
                const clinicalDataCache = this.props.store.clinicalDataCache;
                const cacheEntry = clinicalDataCache.get(cancerTypeAttr);
                if (
                    cacheEntry.isComplete &&
                    cacheEntry.result &&
                    cacheEntry.result.categoryToColor
                ) {
                    // Convert categoryToColor map to array format
                    const categoryToColor = cacheEntry.result.categoryToColor;
                    return Object.entries(categoryToColor).map(
                        ([value, color]) => ({
                            value,
                            color,
                        })
                    );
                }
            }
        } catch (e) {
            console.warn('Could not get cancer type chart data:', e);
        }

        return undefined;
    }

    private generateColorFromString(str: string): string {
        // Generate a consistent color based on string hash
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }

        // Convert to hex color
        const c = (hash & 0x00ffffff).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    }

    private getColoringLabel(): string {
        if (!this.selectedColoringOption) {
            return 'Cancer Type';
        }

        // For gene-based coloring, return the gene name
        if (
            this.selectedColoringOption.info.entrezGeneId &&
            this.selectedColoringOption.info.entrezGeneId !== -3
        ) {
            return this.selectedColoringOption.label; // e.g., "EGFR"
        }

        // For clinical attribute coloring, return the display name
        if (this.selectedColoringOption.info.clinicalAttribute) {
            return this.selectedColoringOption.label; // e.g., "Clinical Summary", "Age at Diagnosis"
        }

        // Default fallback
        return 'Cancer Type';
    }

    componentDidMount() {
        // Check if we should initialize default coloring
        if (this.shouldInitializeDefaultColoring) {
            this.initializeDefaultColoring();
        }
    }

    componentDidUpdate() {
        // Check if we should initialize default coloring
        if (this.shouldInitializeDefaultColoring) {
            this.initializeDefaultColoring();
        }
    }

    componentWillUnmount() {
        if (this.plotRef.current) {
            Plotly.purge(this.plotRef.current);
        }
    }

    @computed get plotData(): EmbeddingDataPoint[] {
        // This computed property will automatically trigger re-render when dependencies change
        if (
            !this.props.store.samples.isComplete ||
            !this.props.store.selectedSamples.isComplete
        ) {
            return [];
        }

        // Check if clinical data is needed and ready
        if (this.selectedColoringOption?.info?.clinicalAttribute) {
            const cacheEntry = this.props.store.clinicalDataCache.get(
                this.selectedColoringOption.info.clinicalAttribute
            );
            if (!cacheEntry.isComplete) {
                return []; // Still loading clinical data
            }
        }

        // Check if we have valid cached data for current parameters
        const currentCacheKey = this.getCacheKey();
        const hasValidCache =
            this.lastCacheKey === currentCacheKey &&
            this.cachedEmbeddingData.length > 0;

        if (!hasValidCache) {
            // Trigger async loading for large datasets
            this.triggerDataLoad();

            // Return empty array while loading (isLoading will show progress indicator)
            return [];
        }

        // Return cached data when valid
        return this.cachedEmbeddingData;
    }

    @computed get molecularDataCachesComplete(): boolean {
        // Only check caches that are enabled and relevant to the current selection
        if (
            this.selectedColoringOption?.info?.entrezGeneId &&
            this.selectedColoringOption.info.entrezGeneId !== -3
        ) {
            const entrezGeneId = this.selectedColoringOption.info.entrezGeneId;

            // For gene-based coloring, check enabled molecular data types
            if (
                this.mutationTypeEnabled &&
                this.props.store.annotatedMutationCache
            ) {
                const mutationCacheResult = this.props.store.annotatedMutationCache.get(
                    { entrezGeneId }
                );
                if (!mutationCacheResult.isComplete) {
                    return false;
                }
            }

            if (this.copyNumberEnabled && this.props.store.annotatedCnaCache) {
                const cnaCacheResult = this.props.store.annotatedCnaCache.get({
                    entrezGeneId,
                });
                if (!cnaCacheResult.isComplete) {
                    return false;
                }
            }

            if (
                this.structuralVariantEnabled &&
                this.props.store.structuralVariantCache
            ) {
                const svCacheResult = this.props.store.structuralVariantCache.get(
                    { entrezGeneId }
                );
                if (!svCacheResult.isComplete) {
                    return false;
                }
            }
        }

        return true;
    }

    @computed get isLoading(): boolean {
        if (
            !this.props.store.samples.isComplete ||
            !this.props.store.selectedSamples.isComplete
        ) {
            return true;
        }

        if (this.selectedColoringOption?.info?.clinicalAttribute) {
            const cacheEntry = this.props.store.clinicalDataCache.get(
                this.selectedColoringOption.info.clinicalAttribute
            );
            if (!cacheEntry.isComplete) {
                return true;
            }
        }

        // Check molecular data caches to prevent flickering
        if (!this.molecularDataCachesComplete) {
            return true;
        }

        // Include data processing state
        if (this.isProcessingData) {
            return true;
        }

        // Show loading if data is not ready
        if (!this.isDataReady) {
            return true;
        }

        return false;
    }

    @computed get plotComponent(): JSX.Element {
        if (this.isLoading) {
            return (
                <div
                    style={{
                        width: '100%',
                        height: '600px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '20px',
                    }}
                >
                    <LoadingIndicator
                        isLoading={true}
                        center={true}
                        size={'big'}
                    />
                    {this.isProcessingData && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ marginBottom: '10px' }}>
                                Processing{' '}
                                {this.selectedEmbedding.data.totalPatients.toLocaleString()}{' '}
                                patients...
                            </div>
                            <div
                                style={{
                                    width: '300px',
                                    height: '6px',
                                    backgroundColor: '#f0f0f0',
                                    borderRadius: '3px',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        width: `${this.processingProgress}%`,
                                        height: '100%',
                                        backgroundColor: '#007cff',
                                        transition: 'width 0.3s ease',
                                    }}
                                />
                            </div>
                            <div
                                style={{
                                    marginTop: '5px',
                                    fontSize: '12px',
                                    color: '#666',
                                }}
                            >
                                {Math.round(this.processingProgress)}% complete
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        const patientData = this.plotData;
        if (patientData.length === 0) {
            return (
                <div
                    style={{
                        width: '100%',
                        height: '600px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <span>No data available for visualization</span>
                </div>
            );
        }

        // Trigger plot creation when this computed runs with new data
        setTimeout(() => {
            if (this.plotRef.current && patientData.length > 0) {
                this.createPlotlyVisualization(patientData);
            }
        }, 0);

        return (
            <div
                ref={this.plotRef}
                style={{ width: '100%', height: '600px' }}
                key={`plot-${this.selectedColoringOption?.value || 'none'}`} // Force re-render when selection changes
            />
        );
    }

    render() {
        // Safety check for study ID access
        const studyIds = this.props.store.queriedPhysicalStudyIds.result;
        const currentStudyId =
            studyIds && studyIds.length > 0 ? studyIds[0] : null;

        if (!currentStudyId) {
            return (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h4>Embeddings Visualization</h4>
                    <p>Loading study information...</p>
                </div>
            );
        }

        if (currentStudyId !== 'msk_chord_2024') {
            return (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h4>Embeddings Visualization</h4>
                    <p>
                        Embeddings are currently only available for the
                        msk_chord_2024 study.
                    </p>
                    <p>
                        Current study: <strong>{currentStudyId}</strong>
                    </p>
                </div>
            );
        }

        return (
            <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h4>Patient Embeddings Visualization</h4>
                    <p>
                        Interactive UMAP projection showing patient similarity
                        patterns. Each point represents a patient. Use the
                        toolbar to zoom, pan, and download the plot.
                    </p>
                </div>

                {this.controls}

                {/* Reactive plot component */}
                {this.plotComponent}
            </div>
        );
    }

    private createPlotlyVisualization(patientData: EmbeddingDataPoint[]) {
        console.time('📊 TOTAL Plotly visualization');
        console.log(
            `📊 Creating Plotly visualization for ${patientData.length} points`
        );

        if (!this.plotRef.current) {
            return;
        }

        console.time('📊 Plotly purge');
        // Clear any existing plot
        Plotly.purge(this.plotRef.current);
        console.timeEnd('📊 Plotly purge');

        const currentStudyId = this.props.store.queriedPhysicalStudyIds
            .result?.[0];

        // PERFORMANCE OPTIMIZATION: Create sample lookup for tooltip generation
        const allSamples = this.props.store.samples.result || [];
        const sampleLookupMap = new Map<string, any>();
        allSamples.forEach(sample => {
            sampleLookupMap.set(sample.patientId, sample);
        });

        console.time('📊 Appearance grouping');
        // PERFORMANCE OPTIMIZATION: Group by appearance (color + stroke) instead of cancer type
        // This minimizes data passed to Plotly and reduces rendering overhead
        const appearanceGroups = new Map<string, EmbeddingDataPoint[]>();

        patientData.forEach(point => {
            // Create a unique key for each appearance combination
            const appearanceKey = `${point.color ||
                '#CCCCCC'}|${point.strokeColor ||
                '#CCCCCC'}|${point.cancerType || 'Unknown'}`;

            if (!appearanceGroups.has(appearanceKey)) {
                appearanceGroups.set(appearanceKey, []);
            }
            appearanceGroups.get(appearanceKey)!.push(point);
        });
        console.timeEnd('📊 Appearance grouping');
        console.log(`📊 Created ${appearanceGroups.size} appearance groups`);

        console.time('📊 Trace creation');
        const traces: any[] = [];

        // Create one trace per appearance group (much fewer traces than individual points)
        appearanceGroups.forEach((points, appearanceKey) => {
            const [fillColor, strokeColor, cancerType] = appearanceKey.split(
                '|'
            );

            traces.push({
                x: points.map(d => d.x),
                y: points.map(d => d.y),
                mode: 'markers' as const,
                type: 'scattergl' as const,
                name: cancerType,
                showlegend: false, // Hide default legend for data traces
                marker: {
                    color: fillColor,
                    size: 8,
                    opacity: 0.8,
                    line: {
                        color: strokeColor,
                        width: strokeColor !== fillColor ? 2 : 0, // Only show stroke if different from fill
                    },
                },
                text: points.map((d: EmbeddingDataPoint) => {
                    // PERFORMANCE OPTIMIZATION: Use pre-computed cancerType instead of expensive service calls
                    const coloringLabel = this.getColoringLabel();
                    return `Patient: ${
                        d.patientId
                    }<br>${coloringLabel}: ${d.cancerType || 'Unknown'}`;
                }),
                hovertemplate: '%{text}<extra></extra>',
            });
        });
        console.timeEnd('📊 Trace creation');
        console.log(`📊 Created ${traces.length} traces`);

        console.time('📊 Legend creation');
        // Create custom legend traces
        if (this.selectedColoringOption) {
            if (
                this.selectedColoringOption.info?.entrezGeneId &&
                this.selectedColoringOption.info.entrezGeneId !== -3
            ) {
                // Gene-based coloring: Generate legend based on actual data present and our direct coloring logic
                const presentAlterations = new Set<string>();
                const alterationToAppearance = new Map<
                    string,
                    { color: string; strokeColor: string }
                >();

                // Collect all unique alterations and their colors from the actual data
                patientData.forEach(point => {
                    if (point.cancerType && point.cancerType !== 'Unknown') {
                        presentAlterations.add(point.cancerType);
                        alterationToAppearance.set(point.cancerType, {
                            color: point.color || '#CCCCCC',
                            strokeColor: point.strokeColor || '#CCCCCC',
                        });
                    }
                });

                // Convert to array and sort for consistent ordering
                const sortedAlterations = Array.from(presentAlterations).sort(
                    (a, b) => {
                        // Sort order: mutations first, then CNAs, then SVs, then "No mutation"
                        const getOrder = (name: string) => {
                            if (name.includes('Missense')) return 1;
                            if (name.includes('In_Frame')) return 2;
                            if (
                                name.includes('Truncating') ||
                                name.includes('Nonsense')
                            )
                                return 3;
                            if (name.includes('Splice')) return 4;
                            if (name.includes('Amplification')) return 5;
                            if (name.includes('Gain')) return 6;
                            if (name.includes('Diploid')) return 7;
                            if (name.includes('Deletion')) return 8;
                            if (name.includes('Structural')) return 9;
                            if (name.includes('No mutation')) return 10;
                            return 99;
                        };
                        return getOrder(a) - getOrder(b);
                    }
                );

                // Create legend traces for each present alteration
                sortedAlterations.forEach(alterationType => {
                    const appearance = alterationToAppearance.get(
                        alterationType
                    );
                    if (!appearance) return;

                    let marker: any = { size: 8, opacity: 0.8 };

                    // Determine marker style based on alteration type
                    if (
                        alterationType.includes('Missense') ||
                        alterationType.includes('In_Frame') ||
                        alterationType.includes('Truncating') ||
                        alterationType.includes('Splice') ||
                        alterationType.includes('No mutation')
                    ) {
                        // Filled dots for mutations and "no mutation"
                        marker.color = appearance.color;
                        marker.line = { width: 0 };
                    } else if (
                        alterationType.includes('Amplification') ||
                        alterationType.includes('Gain') ||
                        alterationType.includes('Diploid') ||
                        alterationType.includes('Deletion')
                    ) {
                        // Border-only for CNAs
                        marker.color = 'rgba(255,255,255,0.9)'; // Nearly transparent fill
                        marker.line = {
                            color: appearance.strokeColor,
                            width: 2,
                        };
                    } else if (alterationType.includes('Structural')) {
                        // Border-only for SVs
                        marker.color = 'rgba(255,255,255,0.9)'; // Nearly transparent fill
                        marker.line = {
                            color: appearance.strokeColor,
                            width: 2,
                        };
                    } else {
                        // Fallback
                        marker.color = appearance.color;
                        marker.line = {
                            color: appearance.strokeColor,
                            width: 1,
                        };
                    }

                    traces.push({
                        x: [NaN],
                        y: [NaN],
                        mode: 'markers' as const,
                        type: 'scattergl' as const,
                        name: alterationType,
                        marker: marker,
                        showlegend: true,
                        hovertemplate: '<extra></extra>', // Hide hover for legend items
                    } as any);
                });
            } else if (this.selectedColoringOption.info?.clinicalAttribute) {
                // Clinical attribute coloring: show categories that are present
                const presentCategories = new Set<string>();
                patientData.forEach(point => {
                    if (point.cancerType && point.cancerType !== 'Unknown') {
                        presentCategories.add(point.cancerType);
                    }
                });

                const legendData = this.coloringService.getLegendData();

                // Filter to show only present categories
                const filteredLegendData = legendData.filter(item =>
                    presentCategories.has(item.name)
                );

                filteredLegendData.forEach(item => {
                    traces.push({
                        x: [NaN],
                        y: [NaN],
                        mode: 'markers' as const,
                        type: 'scattergl' as const,
                        name: item.name,
                        marker: {
                            color: item.color,
                            size: 8,
                            opacity: 0.8,
                            line: { width: 0 },
                        },
                        showlegend: true,
                        hovertemplate: '<extra></extra>', // Hide hover for legend items
                    } as any);
                });
            }
        }

        const layout: Partial<Plotly.Layout> = {
            title: {
                text: `${
                    this.selectedEmbedding.label
                } Embedding - ${currentStudyId} (${patientData.length.toLocaleString()} patients)`,
                font: { size: 16 },
            },
            xaxis: {
                title: { text: `${this.selectedEmbedding.label} 1` },
                showgrid: false,
                zeroline: false,
            },
            yaxis: {
                title: { text: `${this.selectedEmbedding.label} 2` },
                showgrid: false,
                zeroline: false,
            },
            showlegend: true,
            legend: {
                x: 1.02,
                y: 1,
                bgcolor: 'rgba(255,255,255,0.9)',
                borderwidth: 0,
            },
            annotations:
                this.selectedColoringOption &&
                this.selectedColoringOption.value !== 'none'
                    ? [
                          {
                              text: `<b>${this.getColoringLabel()}</b>`,
                              x: 1.02,
                              y: 1.01,
                              xref: 'paper',
                              yref: 'paper',
                              xanchor: 'left',
                              yanchor: 'bottom',
                              showarrow: false,
                              font: { size: 12, color: 'black' },
                              bgcolor: 'rgba(255,255,255,0.9)',
                              borderwidth: 0,
                          },
                      ]
                    : [],
            margin: { l: 60, r: 150, t: 60, b: 60 },
            plot_bgcolor: 'white',
            paper_bgcolor: 'white',
            hovermode: 'closest',
        };

        const config: Partial<Plotly.Config> = {
            displayModeBar: true,
            modeBarButtonsToRemove: [],
            displaylogo: false,
            toImageButtonOptions: {
                format: 'png' as const,
                filename: `${this.selectedEmbedding.value}_embedding_${currentStudyId}`,
                height: 600,
                width: 800,
                scale: 2,
            },
        };
        console.timeEnd('📊 Legend creation');

        console.time('📊 Plotly.newPlot');
        Plotly.newPlot(this.plotRef.current, traces, layout, config);
        console.timeEnd('📊 Plotly.newPlot');

        // Add selection event handler
        if (this.plotRef.current) {
            (this.plotRef.current as any).on(
                'plotly_selected',
                (eventData: any) => {
                    this.handlePlotSelection(eventData);
                }
            );
        }

        console.timeEnd('📊 TOTAL Plotly visualization');
        console.log('📊 Plotly visualization complete');
    }

    private handlePlotSelection(eventData: any) {
        if (!eventData || !eventData.points || eventData.points.length === 0) {
            return;
        }

        // Extract selected patient IDs from the selection
        const selectedPatientIds: string[] = [];

        eventData.points.forEach((point: any) => {
            // Get point index from the trace data
            const pointIndex = point.pointIndex;
            // Look up the corresponding patient data
            const patientData = this.patientDataMap.get(pointIndex);
            if (patientData && patientData.patientId) {
                selectedPatientIds.push(patientData.patientId);
            }
        });

        if (selectedPatientIds.length > 0) {
            // Get actual samples from the store to map patient IDs to sample IDs
            const allSamples = this.props.store.samples.result || [];
            const selectedPatientSet = new Set(selectedPatientIds);

            // Find samples that belong to the selected patients
            const samplesForSelectedPatients = allSamples.filter(sample =>
                selectedPatientSet.has(sample.patientId)
            );

            // Create CustomChartData for patient selection
            const customChartData = {
                origin: [this.selectedEmbedding.label],
                displayName: `${this.selectedEmbedding.label} Selection`,
                description: `Patients selected from ${this.selectedEmbedding.label} embedding`,
                datatype: 'STRING',
                patientAttribute: true,
                priority: 1,
                data: samplesForSelectedPatients.map(sample => ({
                    studyId: sample.studyId,
                    patientId: sample.patientId,
                    sampleId: sample.sampleId,
                    value: 'Selected',
                })),
            };

            // Update the study view filter with selected patients
            this.props.store.updateCustomSelect(customChartData);
        }
    }

    @computed get controls(): JSX.Element {
        if (
            !this.props.store.samples.isComplete ||
            this.clinicalAttributes.length === 0
        ) {
            return (
                <LoadingIndicator isLoading={true} center={true} size={'big'} />
            );
        }

        return (
            <div style={{ marginBottom: '20px' }}>
                {/* Embedding and Color Selection on same line */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        marginBottom: '15px',
                        flexWrap: 'wrap',
                    }}
                >
                    {/* Embedding Selection */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <label
                            style={{ marginRight: '10px', fontWeight: 'bold' }}
                        >
                            Embedding:
                        </label>
                        <select
                            value={this.selectedEmbedding.value}
                            onChange={e => {
                                const selectedOption = this.embeddingOptions.find(
                                    opt => opt.value === e.target.value
                                );
                                if (selectedOption) {
                                    this.onEmbeddingSelectionChange(
                                        selectedOption
                                    );
                                }
                            }}
                            style={{
                                padding: '5px 10px',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                                fontSize: '14px',
                            }}
                        >
                            {this.embeddingOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Color By Selection */}
                    <div
                        className="coloring-menu"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            position: 'relative',
                            minWidth: 350,
                        }}
                    >
                        <style>
                            {`
                                .coloring-menu .gene-select-background .gene-select-container .gene-select {
                                    width: 350px !important;
                                }
                            `}
                        </style>
                        <ColorSamplesByDropdown
                            genes={this.genes}
                            clinicalAttributes={this.clinicalAttributes}
                            selectedOption={this.selectedColoringOption}
                            logScale={this.coloringLogScale}
                            hasNoQueriedGenes={true}
                            logScalePossible={this.logScalePossible}
                            isLoading={this.isLoading}
                            mutationDataExists={this.mutationDataExists}
                            cnaDataExists={this.cnaDataExists}
                            svDataExists={this.svDataExists}
                            mutationTypeEnabled={this.mutationTypeEnabled}
                            copyNumberEnabled={this.copyNumberEnabled}
                            structuralVariantEnabled={
                                this.structuralVariantEnabled
                            }
                            onSelectionChange={this.onColoringSelectionChange}
                            onLogScaleChange={this.onLogScaleChange}
                            onMutationTypeToggle={this.onMutationTypeToggle}
                            onCopyNumberToggle={this.onCopyNumberToggle}
                            onStructuralVariantToggle={
                                this.onStructuralVariantToggle
                            }
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default EmbeddingsTab;
