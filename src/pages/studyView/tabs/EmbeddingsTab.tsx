import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, observable, action, makeObservable, reaction } from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import boehmData from '../../../data/boehm_2025_umap_embedding.json';
import ColorSamplesByDropdown from 'shared/components/colorSamplesByDropdown/ColorSamplesByDropdown';
import { ColoringMenuOmnibarOption } from 'shared/components/plots/PlotsTab';
import {
    makeEmbeddingScatterPlotData,
    EmbeddingPlotPoint,
} from 'shared/components/plots/EmbeddingPlotUtils';
import {
    EmbeddingDeckGLVisualization,
    EmbeddingDataOption,
} from 'shared/components/embeddings';
import Select from 'react-select';
import { Gene } from 'cbioportal-ts-api-client';

import {
    EmbeddingData,
    ViewState,
    EmbeddingPoint,
} from 'shared/components/embeddings/EmbeddingTypes';
import { calculateDataBounds } from 'shared/components/embeddings/utils/dataUtils';

export interface IEmbeddingsTabProps {
    store: StudyViewPageStore;
}

@observer
export class EmbeddingsTab extends React.Component<IEmbeddingsTabProps, {}> {
    @observable private selectedColoringOption?: ColoringMenuOmnibarOption;
    @observable private coloringLogScale = false;
    @observable private mutationTypeEnabled = true;
    @observable private copyNumberEnabled = true;
    @observable private structuralVariantEnabled = true;
    @observable private selectedEmbeddingValue: string = 'boehm_2025';
    @observable.ref private viewState: ViewState = {
        target: [0, 0, 0],
        zoom: 0,
        minZoom: -5,
        maxZoom: 10,
    };
    @observable private windowHeight = window.innerHeight;
    @observable private hiddenCategories = new Set<string>();
    private urlParameterReactionDisposer?: () => void;
    private urlSyncReactionDisposer?: () => void;

    constructor(props: IEmbeddingsTabProps) {
        super(props);
        makeObservable(this);

        // Initialize default coloring
        this.initializeDefaultColoring();

        // Initialize view state based on initial data
        this.initializeViewState();

        // Listen for window resize events
        this.handleResize = this.handleResize.bind(this);

        // Set up single URL-driven reaction for state management
        this.urlParameterReactionDisposer = reaction(
            () => {
                const urlOption = this.coloringFromURLParameter;
                const clinicalAttributesReady =
                    this.clinicalAttributes.length > 0;
                const urlWrapperReady = !!(this.props.store as any).urlWrapper;

                return {
                    urlOption,
                    clinicalAttributesReady,
                    urlWrapperReady,
                    hasUrlParams: this.hasExistingURLParameters,
                };
            },
            ({
                urlOption,
                clinicalAttributesReady,
                urlWrapperReady,
                hasUrlParams,
            }) => {
                if (!urlWrapperReady || !clinicalAttributesReady) {
                    return;
                }

                if (urlOption) {
                    // URL parameters exist - apply them
                    this.selectedColoringOption = urlOption;
                } else if (!hasUrlParams) {
                    // No URL parameters - set default and sync to URL
                    const defaultOption = this.getDefaultColoringOption();
                    if (defaultOption) {
                        this.selectedColoringOption = defaultOption;
                        this.syncColoringSelectionToURL(defaultOption);
                    }
                }
            },
            { fireImmediately: true }
        );
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);

        // Clean up reactions
        if (this.urlParameterReactionDisposer) {
            this.urlParameterReactionDisposer();
        }
        if (this.urlSyncReactionDisposer) {
            this.urlSyncReactionDisposer();
        }
    }

    @action.bound
    private handleResize() {
        this.windowHeight = window.innerHeight;
    }

    private initializeDefaultColoring() {
        // Initialize with default coloring - URL parameters will be applied via reaction
        const cancerTypeAttr = this.clinicalAttributes.find(
            attr => attr.clinicalAttributeId === 'CANCER_TYPE_DETAILED'
        );
        if (cancerTypeAttr) {
            this.selectedColoringOption = {
                info: { clinicalAttribute: cancerTypeAttr },
                label: cancerTypeAttr.displayName,
                value: `clinical_${cancerTypeAttr.clinicalAttributeId}`,
            } as ColoringMenuOmnibarOption;
        } else {
            this.selectedColoringOption = {
                label: 'None',
                value: 'none',
                info: {
                    entrezGeneId: -10000,
                },
            };
        }
    }

    private parseColoringSelectionFromURL(
        selectedOption: string
    ): ColoringMenuOmnibarOption | undefined {
        try {
            // Parse gene selection (format: "entrezGeneId_undefined" e.g., "1956_undefined")
            const geneMatch = selectedOption.match(/^(\d+)_/);
            if (geneMatch) {
                const entrezGeneId = parseInt(geneMatch[1]);

                // Find the gene in the genes list
                const gene = this.genes.find(
                    g => g.entrezGeneId === entrezGeneId
                );
                if (gene) {
                    return {
                        info: { entrezGeneId: gene.entrezGeneId },
                        label: gene.hugoGeneSymbol,
                        value: `${gene.entrezGeneId}_${gene.hugoGeneSymbol}`,
                    } as ColoringMenuOmnibarOption;
                }
            }

            // Parse clinical attribute selection (format: "undefined_{...json...}")
            // This matches PlotsTab's encoding format exactly
            if (selectedOption.startsWith('undefined_')) {
                const jsonPart = selectedOption.substring('undefined_'.length);
                const clinicalInfo = JSON.parse(jsonPart);

                // Find the clinical attribute by ID
                const clinicalAttr = this.clinicalAttributes.find(
                    attr =>
                        attr.clinicalAttributeId ===
                        clinicalInfo.clinicalAttributeId
                );

                if (clinicalAttr) {
                    return {
                        info: { clinicalAttribute: clinicalAttr },
                        label: clinicalAttr.displayName,
                        value: `clinical_${clinicalAttr.clinicalAttributeId}`,
                    } as ColoringMenuOmnibarOption;
                }
            }

            return undefined;
        } catch (e) {
            return undefined;
        }
    }

    private initializeViewState() {
        // Calculate initial view state when component loads
        if (this.selectedEmbedding?.data) {
            const bounds = calculateDataBounds(
                this.selectedEmbedding.data.data as EmbeddingPoint[]
            );
            this.viewState = {
                target: [bounds.centerX, bounds.centerY, 0],
                zoom: bounds.zoom,
                minZoom: -5,
                maxZoom: 10,
            };
        }
    }

    @computed get clinicalAttributes() {
        return this.props.store.clinicalAttributes.result || [];
    }

    @computed get hasExistingURLParameters(): boolean {
        // Check if there are already URL parameters for embeddings coloring selection
        const embeddingsColoringSelection = (this.props.store as any).urlWrapper
            ?.query?.embeddings_coloring_selection;
        return !!embeddingsColoringSelection?.selectedOption;
    }

    @computed get genes(): Gene[] {
        // Use allGenes to match PlotsTab pattern exactly
        // This provides comprehensive gene search capability in StudyView
        const genesResult = this.props.store.allGenes;
        return genesResult.isComplete ? genesResult.result || [] : [];
    }

    // Reactive computed property that applies URL parameter once genes are loaded (for genes) or immediately (for clinical attributes)
    @computed get coloringFromURLParameter():
        | ColoringMenuOmnibarOption
        | undefined {
        // Check if there's a URL parameter for embeddings coloring selection
        const embeddingsColoringSelection = (this.props.store as any).urlWrapper
            ?.query?.embeddings_coloring_selection;
        if (embeddingsColoringSelection?.selectedOption) {
            const selectedOption = embeddingsColoringSelection.selectedOption;

            // For gene selections (format: "1956_undefined"), wait for genes to load
            if (selectedOption.match(/^\d+_/)) {
                if (this.genes.length === 0) {
                    return undefined;
                }
            }
            // For clinical attributes (format: "undefined_{...}"), process immediately

            const parsedOption = this.parseColoringSelectionFromURL(
                selectedOption
            );
            if (parsedOption) {
                return parsedOption;
            }
        }

        return undefined;
    }

    // Effective coloring option (URL parameter is applied via reaction to selectedColoringOption)
    @computed get effectiveColoringOption():
        | ColoringMenuOmnibarOption
        | undefined {
        return this.selectedColoringOption;
    }

    private isDefaultColoring(option: ColoringMenuOmnibarOption): boolean {
        // Check if this is the default cancer type coloring
        return (
            option.info?.clinicalAttribute?.clinicalAttributeId ===
                'CANCER_TYPE_DETAILED' || option.info?.entrezGeneId === -10000
        ); // "None" option
    }

    @action.bound
    private applyColoringOption(option: ColoringMenuOmnibarOption) {
        this.selectedColoringOption = option;
    }

    @computed get logScalePossible(): boolean {
        // Log scale not needed for UMAP coordinates
        return false;
    }

    @computed get plotHeight(): number {
        // Calculate available viewport height dynamically
        const viewportHeight = this.windowHeight;

        // Estimate space used by headers, controls, and padding (more conservative)
        // - cBioPortal header: ~50px
        // - Study view tabs: ~50px
        // - Embedding controls: ~50px
        // - Bottom axis labels and padding: ~90px
        // - Additional buffer for safety: ~60px
        const headerAndControlsHeight = 300;

        const calculatedHeight = viewportHeight - headerAndControlsHeight;

        // Minimum 500px for usability, maximum 70% of viewport to ensure bottom axis is visible
        return Math.max(500, Math.min(calculatedHeight, viewportHeight * 0.8));
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

    @computed get allEmbeddingOptions(): EmbeddingDataOption[] {
        return [
            {
                value: 'boehm_2025',
                label: 'Boehm 2025',
                data: boehmData as EmbeddingData,
            },
        ];
    }

    @computed get currentStudyIds(): string[] {
        return this.props.store.queriedPhysicalStudyIds.result || [];
    }

    @computed get embeddingOptions(): EmbeddingDataOption[] {
        // Filter embedding options to show those that support ANY of the current studies
        // (Changed from requiring ALL studies to just needing at least one match)
        if (this.currentStudyIds.length === 0) {
            return [];
        }

        return this.allEmbeddingOptions.filter(option =>
            this.currentStudyIds.some(studyId =>
                option.data.studyIds.includes(studyId)
            )
        );
    }

    @computed get hasEmbeddingSupport(): boolean {
        return this.embeddingOptions.length > 0;
    }

    @computed get selectedEmbedding(): EmbeddingDataOption | null {
        const availableOption = this.embeddingOptions.find(
            option => option.value === this.selectedEmbeddingValue
        );

        // If the selected embedding is not available for any of the current studies,
        // fall back to first available option
        if (!availableOption && this.embeddingOptions.length > 0) {
            return this.embeddingOptions[0];
        }

        return availableOption || null;
    }

    @computed get reactSelectEmbeddingOptions() {
        return this.embeddingOptions.map(option => ({
            value: option.value,
            label: option.label,
        }));
    }

    @computed get selectedReactSelectOption() {
        const selected = this.selectedEmbedding;
        return selected
            ? { value: selected.value, label: selected.label }
            : null;
    }

    // Ensure molecular data is loaded for gene-based coloring (similar to PlotsTab pattern)
    readonly molecularDataForColoring = remoteData({
        await: () => {
            const toAwait: any[] = [];

            if (
                this.selectedColoringOption?.info?.entrezGeneId &&
                this.selectedColoringOption.info.entrezGeneId !== -3 // Not "Cancer Type"
            ) {
                const entrezGeneId = this.selectedColoringOption.info
                    .entrezGeneId;
                const queries = [{ entrezGeneId }];

                // Ensure driver annotations are enabled first (reactive dependency)
                const driverAnnotationsReady = this.driverAnnotationsEnabled;

                // CRITICAL FIX: Explicitly wait for OncoKB and Hotspots data to be fully loaded
                // This ensures annotatedMutationCache doesn't use stale driver annotation data
                if (
                    driverAnnotationsReady &&
                    this.props.store.driverAnnotationSettings
                ) {
                    // Wait for OncoKB annotation data if enabled
                    if (this.props.store.driverAnnotationSettings.oncoKb) {
                        toAwait.push(
                            this.props.store
                                .oncoKbMutationAnnotationForOncoprint
                        );
                    }

                    // Wait for Hotspots data if enabled
                    if (this.props.store.driverAnnotationSettings.hotspots) {
                        toAwait.push(this.props.store.isHotspotForOncoprint);
                    }

                    // IMPORTANT: Wait for the driver info function itself - this is the key dependency
                    // The annotatedMutationCache depends on getMutationPutativeDriverInfo, so we need
                    // to ensure it's ready before we allow the cache to be used
                    toAwait.push(
                        this.props.store.getMutationPutativeDriverInfo
                    );
                }

                // CRITICAL: Wait for the annotation dependencies BEFORE accessing mutation cache
                // This ensures that annotatedMutationCache has fresh data computed with proper annotations

                // Add mutation data if enabled
                if (
                    this.mutationTypeEnabled &&
                    this.props.store.annotatedMutationCache
                ) {
                    toAwait.push(
                        ...this.props.store.annotatedMutationCache.getAll(
                            queries
                        )
                    );
                }

                // Add CNA data if enabled
                if (
                    this.copyNumberEnabled &&
                    this.props.store.annotatedCnaCache
                ) {
                    toAwait.push(
                        ...this.props.store.annotatedCnaCache.getAll(queries)
                    );
                }

                // Add structural variant data if enabled
                if (
                    this.structuralVariantEnabled &&
                    this.props.store.structuralVariantCache
                ) {
                    toAwait.push(
                        ...this.props.store.structuralVariantCache.getAll(
                            queries
                        )
                    );
                }
            }

            return toAwait;
        },
        invoke: () => Promise.resolve(true), // Just indicate that data is ready
    });

    @computed get plotData(): EmbeddingPlotPoint[] {
        // Trigger URL parameter application if genes are loaded
        const effectiveColoring = this.effectiveColoringOption;

        if (
            !this.props.store.samples.isComplete ||
            !this.selectedEmbedding?.data
        ) {
            return [];
        }

        // Ensure driver annotations are enabled (this will trigger reactive updates)
        const driverAnnotationsEnabled = this.driverAnnotationsEnabled;

        // If we're coloring by a gene, wait for molecular data to be loaded
        if (
            this.selectedColoringOption?.info?.entrezGeneId &&
            this.selectedColoringOption.info.entrezGeneId !== -3 && // Not "Cancer Type"
            (this.mutationTypeEnabled ||
                this.copyNumberEnabled ||
                this.structuralVariantEnabled)
        ) {
            // Depend on the remoteData to ensure proper loading
            if (!this.molecularDataForColoring.isComplete) {
                return [];
            }
        }

        // Pass the entire embedding data object to handle both patient and sample types
        const rawPlotData = makeEmbeddingScatterPlotData(
            this.selectedEmbedding.data,
            this.props.store,
            this.selectedColoringOption,
            this.mutationTypeEnabled,
            this.copyNumberEnabled,
            this.structuralVariantEnabled,
            this.coloringLogScale
        );

        // Post-process to handle selection state - update displayLabels for better legend consistency
        const selectedPatientIds = this.selectedPatientIds;
        const hasSelection = selectedPatientIds.length > 0;

        if (!hasSelection) {
            // Even without selection, clean up "Unknown" labels to be more descriptive
            const unknownPoints = rawPlotData.filter(
                p => p.displayLabel === 'Unknown'
            );

            return rawPlotData.map(point => {
                if (
                    point.displayLabel === 'Unknown' &&
                    point.isInCohort !== false
                ) {
                    return {
                        ...point,
                        displayLabel: 'Unspecified Cancer Type',
                    };
                }
                return point;
            });
        }

        const selectedPatientSet = new Set(selectedPatientIds);

        const processedData = rawPlotData.map(point => {
            // Skip non-cohort samples
            if (point.isInCohort === false) {
                return point;
            }

            // Check if this point is selected (must have patientId and be in the selected set)
            const hasPatientId = Boolean(point.patientId);
            const isSelected =
                hasPatientId && selectedPatientSet.has(point.patientId!);

            if (!isSelected) {
                // Update ALL unselected in-cohort points to show "Unselected" in legend with light gray color
                return {
                    ...point,
                    displayLabel: 'Unselected',
                    color: '#C8C8C8', // Light gray to match visual rendering
                    strokeColor: '#C8C8C8',
                };
            }

            // This point is SELECTED - but if it's "Unknown", make it more descriptive
            if (point.displayLabel === 'Unknown') {
                return {
                    ...point,
                    displayLabel: 'Cancer Type Not Available',
                };
            }

            return point;
        });

        // Filter out hidden categories
        const filteredData = processedData.filter(
            point => !this.hiddenCategories.has(point.displayLabel || '')
        );

        return filteredData;
    }

    @computed get categoryCounts(): Map<string, number> {
        if (
            !this.props.store.samples.isComplete ||
            !this.selectedEmbedding?.data
        ) {
            return new Map();
        }

        // Get the raw plot data without any filtering to count all categories
        const rawPlotData = makeEmbeddingScatterPlotData(
            this.selectedEmbedding.data,
            this.props.store,
            this.selectedColoringOption,
            this.mutationTypeEnabled,
            this.copyNumberEnabled,
            this.structuralVariantEnabled,
            this.coloringLogScale
        );

        // Apply the same post-processing logic as plotData but without filtering
        const selectedPatientIds = this.selectedPatientIds;
        const hasSelection = selectedPatientIds.length > 0;

        let processedData;
        if (!hasSelection) {
            processedData = rawPlotData.map(point => {
                if (
                    point.displayLabel === 'Unknown' &&
                    point.isInCohort !== false
                ) {
                    return {
                        ...point,
                        displayLabel: 'Unspecified Cancer Type',
                    };
                }
                return point;
            });
        } else {
            const selectedPatientSet = new Set(selectedPatientIds);
            processedData = rawPlotData.map(point => {
                if (point.isInCohort === false) {
                    return point;
                }
                const hasPatientId = Boolean(point.patientId);
                const isSelected =
                    hasPatientId && selectedPatientSet.has(point.patientId!);

                if (!isSelected) {
                    return { ...point, displayLabel: 'Unselected' };
                }
                if (point.displayLabel === 'Unknown') {
                    return {
                        ...point,
                        displayLabel: 'Cancer Type Not Available',
                    };
                }
                return point;
            });
        }

        // Count categories - when there's a selection, exclude "Unselected" points from the count
        // This makes the legend totals reflect the selected cohort, not the entire dataset
        const counts = new Map<string, number>();
        processedData.forEach(point => {
            const category = point.displayLabel || '';
            // When there's a selection, only count selected points (exclude "Unselected")
            // When there's no selection, count all points as before
            if (!hasSelection || category !== 'Unselected') {
                counts.set(category, (counts.get(category) || 0) + 1);
            }
        });

        return counts;
    }

    @computed get categoryColors(): Map<
        string,
        { fillColor: string; strokeColor: string; hasStroke: boolean }
    > {
        if (
            !this.props.store.samples.isComplete ||
            !this.selectedEmbedding?.data
        ) {
            return new Map();
        }

        // Get the raw plot data without any filtering to get all category colors
        const rawPlotData = makeEmbeddingScatterPlotData(
            this.selectedEmbedding.data,
            this.props.store,
            this.selectedColoringOption,
            this.mutationTypeEnabled,
            this.copyNumberEnabled,
            this.structuralVariantEnabled,
            this.coloringLogScale
        );

        // Apply the same post-processing logic as plotData but without filtering
        const selectedPatientIds = this.selectedPatientIds;
        const hasSelection = selectedPatientIds.length > 0;

        let processedData;
        if (!hasSelection) {
            processedData = rawPlotData.map(point => {
                if (
                    point.displayLabel === 'Unknown' &&
                    point.isInCohort !== false
                ) {
                    return {
                        ...point,
                        displayLabel: 'Unspecified Cancer Type',
                    };
                }
                return point;
            });
        } else {
            const selectedPatientSet = new Set(selectedPatientIds);
            processedData = rawPlotData.map(point => {
                if (point.isInCohort === false) {
                    return point;
                }
                const hasPatientId = Boolean(point.patientId);
                const isSelected =
                    hasPatientId && selectedPatientSet.has(point.patientId!);

                if (!isSelected) {
                    return { ...point, displayLabel: 'Unselected' };
                }
                if (point.displayLabel === 'Unknown') {
                    return {
                        ...point,
                        displayLabel: 'Cancer Type Not Available',
                    };
                }
                return point;
            });
        }

        // Extract color information for each category
        const colors = new Map<
            string,
            { fillColor: string; strokeColor: string; hasStroke: boolean }
        >();
        processedData.forEach(point => {
            if (
                point.displayLabel &&
                point.color &&
                !colors.has(point.displayLabel)
            ) {
                // Determine if this category should have a stroke
                const isSpecialCategory =
                    point.displayLabel === 'Amplification' ||
                    point.displayLabel === 'Deep Deletion' ||
                    point.displayLabel === 'Structural Variant';

                colors.set(point.displayLabel, {
                    fillColor: point.color,
                    strokeColor: point.strokeColor || point.color,
                    hasStroke:
                        isSpecialCategory ||
                        !!(
                            point.strokeColor &&
                            point.strokeColor !== point.color
                        ),
                });
            }
        });

        return colors;
    }

    @computed get visibleSampleCount(): number {
        if (!this.categoryCounts) return 0;
        let visibleCount = 0;
        this.categoryCounts.forEach((count, category) => {
            // Only count samples from categories that are not hidden
            // Also exclude non-cohort samples from visible count like we do for total
            if (
                !this.hiddenCategories.has(category) &&
                category !== 'Sample not in this cohort' &&
                category !== 'Case not in this cohort'
            ) {
                visibleCount += count;
            }
        });
        return visibleCount;
    }

    @computed get totalSampleCount(): number {
        if (!this.categoryCounts) return 0;
        let total = 0;
        this.categoryCounts.forEach((count, category) => {
            // Exclude samples that are not in this cohort from the total count
            // These samples were used to construct the embedding but are not part of the current study
            if (
                category !== 'Sample not in this cohort' &&
                category !== 'Case not in this cohort'
            ) {
                total += count;
            }
        });
        return total;
    }

    @computed get visibleCategoryCount(): number {
        if (!this.categoryCounts) return 0;
        let visibleCount = 0;
        this.categoryCounts.forEach((count, category) => {
            if (!this.hiddenCategories.has(category)) {
                visibleCount++;
            }
        });
        return visibleCount;
    }

    @computed get totalCategoryCount(): number {
        return this.categoryCounts?.size || 0;
    }

    @computed get shouldShowToolbar(): boolean {
        // Check if there are URL parameters for embeddings coloring selection
        const hasUrlParams = (this.props.store as any).urlWrapper?.query
            ?.embeddings_coloring_selection?.selectedOption;

        if (hasUrlParams) {
            // For gene selections (format: "1956_undefined"), wait for genes to load
            if (hasUrlParams.match(/^\d+_/)) {
                return this.genes.length > 0;
            }
            // For clinical attributes (format: "undefined_{...}"), show immediately
            return true;
        } else {
            // No URL params, show toolbar immediately
            return true;
        }
    }

    @computed get selectedPatientIds(): string[] {
        return (
            this.props.store.selectedPatients?.map((p: any) => p.patientId) ||
            []
        );
    }

    @computed get driverAnnotationsEnabled(): boolean {
        // This computed property ensures driver annotations are enabled when needed
        // and triggers reactive updates when the settings change
        if (this.props.store.driverAnnotationSettings) {
            const settings = this.props.store.driverAnnotationSettings;

            // If not already annotated and we're coloring by a gene, enable them
            if (
                !settings.driversAnnotated &&
                this.selectedColoringOption?.info?.entrezGeneId &&
                this.selectedColoringOption.info.entrezGeneId !== -3
            ) {
                // Use MobX action to ensure proper reactivity
                this.enableDriverAnnotations();

                return true;
            }

            return settings.driversAnnotated;
        }
        return false;
    }

    @action.bound
    private enableDriverAnnotations() {
        if (this.props.store.driverAnnotationSettings) {
            this.props.store.driverAnnotationSettings.oncoKb = true;
            this.props.store.driverAnnotationSettings.hotspots = true;
            this.props.store.driverAnnotationSettings.customBinary = true;
            this.props.store.driverAnnotationSettings.includeDriver = true;
            this.props.store.driverAnnotationSettings.includeVUS = true;

            // MobX should automatically invalidate getMutationPutativeDriverInfo and
            // annotatedMutationCache when driverAnnotationSettings change
        }
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

        // Check molecular data loading to prevent flickering
        if (
            this.selectedColoringOption?.info?.entrezGeneId &&
            this.selectedColoringOption.info.entrezGeneId !== -3 &&
            (this.mutationTypeEnabled ||
                this.copyNumberEnabled ||
                this.structuralVariantEnabled) &&
            !this.molecularDataForColoring.isComplete
        ) {
            return true;
        }

        return this.plotData.length === 0;
    }

    @action.bound
    private onColoringSelectionChange(option?: ColoringMenuOmnibarOption) {
        this.selectedColoringOption = option;

        // Sync to URL parameter
        this.syncColoringSelectionToURL(option);
    }

    private syncColoringSelectionToURL(option?: ColoringMenuOmnibarOption) {
        const urlWrapper = (this.props.store as any).urlWrapper;
        if (!urlWrapper) {
            return;
        }

        try {
            if (
                option?.info?.entrezGeneId &&
                option.info.entrezGeneId !== -10000 &&
                option.info.entrezGeneId !== -3
            ) {
                // Gene coloring selection
                const selectedOption = `${option.info.entrezGeneId}_undefined`;

                urlWrapper.updateURL({
                    embeddings_coloring_selection: {
                        selectedOption: selectedOption,
                        colorByMutationType: this.mutationTypeEnabled
                            ? 'true'
                            : 'false',
                        colorByCopyNumber: this.copyNumberEnabled
                            ? 'true'
                            : 'false',
                        colorBySv: this.structuralVariantEnabled
                            ? 'true'
                            : 'false',
                    },
                });
            } else if (option?.info?.clinicalAttribute) {
                // Clinical attribute coloring selection
                // Follow PlotsTab's encoding format exactly
                const clinicalInfo = {
                    clinicalAttributeId:
                        option.info.clinicalAttribute.clinicalAttributeId,
                    patientAttribute:
                        option.info.clinicalAttribute.patientAttribute || false,
                    studyId: this.currentStudyIds[0] || '', // Use first study ID
                };
                const selectedOption = `undefined_${JSON.stringify(
                    clinicalInfo
                )}`;

                urlWrapper.updateURL({
                    embeddings_coloring_selection: {
                        selectedOption: selectedOption,
                        colorByMutationType: this.mutationTypeEnabled
                            ? 'true'
                            : 'false',
                        colorByCopyNumber: this.copyNumberEnabled
                            ? 'true'
                            : 'false',
                        colorBySv: this.structuralVariantEnabled
                            ? 'true'
                            : 'false',
                    },
                });
            } else {
                // Clear coloring selection (e.g., for "None" option)
                urlWrapper.updateURL({
                    embeddings_coloring_selection: undefined,
                });
            }
        } catch (e) {
            // Error syncing coloring selection to URL
        }
    }

    @action.bound
    private onLogScaleChange(enabled: boolean) {
        this.coloringLogScale = enabled;
    }

    @action.bound
    private onMutationTypeToggle(enabled: boolean) {
        this.mutationTypeEnabled = enabled;
    }

    @action.bound
    private onCopyNumberToggle(enabled: boolean) {
        this.copyNumberEnabled = enabled;
    }

    @action.bound
    private onStructuralVariantToggle(enabled: boolean) {
        this.structuralVariantEnabled = enabled;
    }

    @action.bound
    private onEmbeddingChange(
        selectedOption: { value: string; label: string } | null
    ) {
        if (selectedOption) {
            const embeddingOption = this.embeddingOptions.find(
                option => option.value === selectedOption.value
            );
            if (embeddingOption) {
                this.selectedEmbeddingValue = selectedOption.value;
                // Reset view state when embedding type changes
                const bounds = calculateDataBounds(
                    embeddingOption.data.data as EmbeddingPoint[]
                );
                this.viewState = {
                    target: [bounds.centerX, bounds.centerY, 0],
                    zoom: bounds.zoom,
                    minZoom: -5,
                    maxZoom: 10,
                };
            }
        }
    }

    @action.bound
    private onViewStateChange(newViewState: ViewState) {
        this.viewState = newViewState;
    }

    @action.bound
    private toggleCategoryVisibility(category: string) {
        if (this.hiddenCategories.has(category)) {
            this.hiddenCategories.delete(category);
        } else {
            this.hiddenCategories.add(category);
        }
    }

    @action.bound
    private toggleAllCategories() {
        if (this.hiddenCategories.size === 0) {
            // All categories are currently visible, so hide all biological categories
            // (allowing for an empty plot - only UI elements may remain)
            if (this.categoryCounts) {
                // Hide all biological categories but preserve UI categories
                this.categoryCounts.forEach((count, category) => {
                    // Don't hide UI categories like "Sample not in this cohort" and "Unselected"
                    const isUiCategory =
                        category === 'Sample not in this cohort' ||
                        category === 'Case not in this cohort' ||
                        category === 'Unselected';

                    if (!isUiCategory) {
                        this.hiddenCategories.add(category);
                    }
                });
            }
        } else {
            // Some categories are hidden, so show all of them
            this.hiddenCategories.clear();
        }
    }

    @action.bound
    private handlePointSelection(selectedPoints: any[]) {
        if (
            !selectedPoints ||
            selectedPoints.length === 0 ||
            !this.selectedEmbedding
        )
            return;

        const allSamples = this.props.store.samples.result || [];
        const embeddingType = this.selectedEmbedding.data.embedding_type;

        if (embeddingType === 'samples') {
            // Sample-level embedding: select specific samples
            const selectedSampleIds = new Set(
                selectedPoints.map(p => p.sampleId).filter(Boolean)
            );

            const samplesForSelection = allSamples.filter(sample =>
                selectedSampleIds.has(sample.sampleId)
            );

            const customChartData = {
                origin: [this.selectedEmbedding.label],
                displayName: `${this.selectedEmbedding.label} Sample Selection`,
                description: `Samples selected from ${this.selectedEmbedding.label} embedding`,
                datatype: 'STRING',
                patientAttribute: false, // Sample-level selection
                priority: 1,
                data: samplesForSelection.map(sample => ({
                    studyId: sample.studyId,
                    patientId: sample.patientId,
                    sampleId: sample.sampleId,
                    value: 'Selected',
                })),
            };

            this.props.store.updateCustomSelect(customChartData);
        } else {
            // Patient-level embedding: select all samples from selected patients
            const selectedPatientSet = new Set(
                selectedPoints.map(p => p.patientId).filter(Boolean)
            );

            const samplesForSelectedPatients = allSamples.filter(sample =>
                selectedPatientSet.has(sample.patientId)
            );

            const customChartData = {
                origin: [this.selectedEmbedding.label],
                displayName: `${this.selectedEmbedding.label} Patient Selection`,
                description: `Patients selected from ${this.selectedEmbedding.label} embedding`,
                datatype: 'STRING',
                patientAttribute: true, // Patient-level selection
                priority: 1,
                data: samplesForSelectedPatients.map(sample => ({
                    studyId: sample.studyId,
                    patientId: sample.patientId,
                    sampleId: sample.sampleId,
                    value: 'Selected',
                })),
            };

            this.props.store.updateCustomSelect(customChartData);
        }
    }

    @computed get plotComponent(): JSX.Element {
        if (this.isLoading) {
            return (
                <div
                    style={{
                        width: '100%',
                        height: `${this.plotHeight}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <LoadingIndicator
                        isLoading={true}
                        center={true}
                        size={'big'}
                    />
                </div>
            );
        }

        const patientData = this.plotData;
        if (patientData.length === 0) {
            return (
                <div
                    style={{
                        width: '100%',
                        height: `${this.plotHeight}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <p>No embedding data available</p>
                </div>
            );
        }

        if (!this.selectedEmbedding) {
            return (
                <div
                    style={{
                        width: '100%',
                        height: `${this.plotHeight}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <p>No embedding selected</p>
                </div>
            );
        }

        const visualizationProps = {
            data: patientData,
            title: `${this.selectedEmbedding.label} Embedding - ${this.selectedEmbedding.data.title}`,
            xAxisLabel: `${this.selectedEmbedding.label}1`,
            yAxisLabel: `${this.selectedEmbedding.label}2`,
            height: this.plotHeight,
            showLegend: true,
            filename: `${this.selectedEmbedding.value}_embedding`,
            viewState: this.viewState,
            onViewStateChange: this.onViewStateChange,
            onPointSelection: this.handlePointSelection,
            selectedPatientIds: this.selectedPatientIds,
            embeddingType: this.selectedEmbedding.data.embedding_type,
            categoryCounts: this.categoryCounts,
            categoryColors: this.categoryColors,
            hiddenCategories: this.hiddenCategories,
            onToggleCategoryVisibility: this.toggleCategoryVisibility,
            onToggleAllCategories: this.toggleAllCategories,
            visibleSampleCount: this.visibleSampleCount,
            totalSampleCount: this.totalSampleCount,
            visibleCategoryCount: this.visibleCategoryCount,
            totalCategoryCount: this.totalCategoryCount,
        };

        return (
            <div style={{ width: '100%' }}>
                <EmbeddingDeckGLVisualization {...visualizationProps} />
            </div>
        );
    }

    render() {
        // Safety check for study ID access
        if (this.currentStudyIds.length === 0) {
            return (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h4>Embeddings Visualization</h4>
                    <p>Loading study information...</p>
                </div>
            );
        }

        if (!this.hasEmbeddingSupport) {
            const studyText =
                this.currentStudyIds.length === 1
                    ? `Current study: ${this.currentStudyIds[0]}`
                    : `Current studies: ${this.currentStudyIds.join(', ')}`;

            return (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h4>Embeddings Visualization</h4>
                    <p>
                        Embeddings are not available for any of{' '}
                        {this.currentStudyIds.length === 1
                            ? 'this study'
                            : 'these studies'}
                        .
                    </p>
                    <p>
                        <strong>{studyText}</strong>
                    </p>
                </div>
            );
        }

        return (
            <div className="embeddings-tab">
                {this.shouldShowToolbar && (
                    <div style={{ marginBottom: '10px' }}>
                        <div
                            style={{
                                display: 'inline-block',
                                marginRight: '20px',
                                verticalAlign: 'middle',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <label
                                    style={{
                                        marginRight: '8px',
                                        whiteSpace: 'nowrap',
                                        fontSize: '14px',
                                    }}
                                >
                                    Embedding:
                                </label>
                                <Select
                                    name="embedding-select"
                                    value={this.selectedReactSelectOption}
                                    onChange={this.onEmbeddingChange}
                                    options={this.reactSelectEmbeddingOptions}
                                    isSearchable={false}
                                    styles={{
                                        container: (base: any) => ({
                                            ...base,
                                            minWidth: '150px',
                                        }),
                                        control: (base: any) => ({
                                            ...base,
                                            fontSize: '14px',
                                            minHeight: '34px',
                                        }),
                                        menu: (base: any) => ({
                                            ...base,
                                            zIndex: 9999,
                                        }),
                                    }}
                                />
                            </div>
                        </div>

                        <div
                            className="coloring-menu"
                            style={{
                                display: 'inline-block',
                                verticalAlign: 'middle',
                                position: 'relative',
                                minWidth: '350px',
                            }}
                        >
                            <style>
                                {`
                                    .embeddings-tab .coloring-menu .gene-select-background .gene-select-container .gene-select {
                                        width: 350px !important;
                                    }
                                `}
                            </style>
                            <ColorSamplesByDropdown
                                genes={this.genes}
                                clinicalAttributes={this.clinicalAttributes}
                                selectedOption={this.effectiveColoringOption}
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
                                onSelectionChange={
                                    this.onColoringSelectionChange
                                }
                                onLogScaleChange={this.onLogScaleChange}
                                onMutationTypeToggle={this.onMutationTypeToggle}
                                onCopyNumberToggle={this.onCopyNumberToggle}
                                onStructuralVariantToggle={
                                    this.onStructuralVariantToggle
                                }
                            />
                        </div>
                    </div>
                )}

                {/* Plot */}
                {this.plotComponent}
            </div>
        );
    }
}
