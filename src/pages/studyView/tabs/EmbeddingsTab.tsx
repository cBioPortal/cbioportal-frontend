import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, observable, action, makeObservable, reaction } from 'mobx';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import * as Plotly from 'plotly.js';
import umapData from '../../../data/msk_chord_2024_umap_data.json';
import { SpecialChartsUniqueKeyEnum } from '../StudyViewUtils';
import ColorSamplesByDropdown from 'shared/components/colorSamplesByDropdown/ColorSamplesByDropdown';
import ColoringService from 'shared/components/colorSamplesByDropdown/ColoringService';
import { ColoringMenuOmnibarOption } from 'shared/components/plots/PlotsTab';
import { remoteData, MobxPromise } from 'cbioportal-frontend-commons';
import { ClinicalAttribute, Gene } from 'cbioportal-ts-api-client';
import { getRemoteDataGroupStatus } from 'cbioportal-utils';

interface UMAPDataPoint {
    x: number;
    y: number;
    patientId: string;
    cluster: number;
    pointIndex: number;
    cancerType?: string;
    color?: string;
    strokeColor?: string;
}

export interface IEmbeddingsTabProps {
    store: StudyViewPageStore;
}

@observer
export class EmbeddingsTab extends React.Component<IEmbeddingsTabProps, {}> {
    private plotRef = React.createRef<HTMLDivElement>();
    private patientDataMap = new Map<number, UMAPDataPoint>();
    private coloringService: ColoringService;

    @observable private selectedColoringOption?: ColoringMenuOmnibarOption;
    @observable private coloringLogScale = false;
    @observable private mutationTypeEnabled = true;
    @observable private copyNumberEnabled = true;
    @observable private structuralVariantEnabled = true;

    constructor(props: IEmbeddingsTabProps) {
        super(props);
        makeObservable(this);

        this.coloringService = new ColoringService({
            clinicalDataCache: this.props.store.clinicalDataCache,
            annotatedMutationCache: this.props.store.annotatedMutationCache,
            annotatedCnaCache: this.props.store.annotatedCnaCache,
            annotatedSvCache: this.props.store.structuralVariantCache,
            driversAnnotated: true, // Use false for now, can be enhanced later
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
                driversAnnotated: true,
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
            driversAnnotated: true,
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
            driversAnnotated: true,
        });
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

    private loadUMAPData(): UMAPDataPoint[] {
        // Use the computed property to force reactivity
        const filteredPatientIds = this.filteredPatientIds;

        // Check if data is ready
        const samplesReady = this.props.store.samples.isComplete;
        const allSamples = this.props.store.samples.result || [];

        // Get all unique patient IDs from samples
        const allPatientIds = [
            ...new Set(allSamples.map((s: any) => s.patientId)),
        ];

        const allData: UMAPDataPoint[] = umapData.data.map(
            (patient: any, index: number) => {
                // Find the sample for this patient
                const sample = allSamples.find(
                    s => s.patientId === patient.patientId
                );

                let color = '#CCCCCC';
                let strokeColor = '#CCCCCC';
                let cancerType = 'Unknown';

                if (sample && this.selectedColoringOption) {
                    // Update coloring service config to ensure it has the latest selection and molecular data
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
                        driversAnnotated: true,
                    });

                    // Get both fill and stroke colors for proper molecular alteration display
                    const appearance = this.coloringService.getPointAppearance(
                        sample
                    );
                    color = appearance.fill;
                    strokeColor = appearance.stroke;
                    const displayValue = this.coloringService.getDisplayValue(
                        sample
                    );

                    // For gene-based coloring, use alteration type as category
                    if (
                        this.selectedColoringOption.info.entrezGeneId &&
                        this.selectedColoringOption.info.entrezGeneId !== -3
                    ) {
                        // Use the legend label directly from the appearance function (same as PlotsTab)
                        cancerType = this.coloringService.getGeneLegendLabel(
                            sample,
                            this.selectedColoringOption.info.entrezGeneId
                        );
                    } else {
                        // For clinical data coloring, use the display value or cancer type
                        cancerType =
                            displayValue ||
                            this.getPatientCancerType(patient.patientId) ||
                            'Unknown';
                    }
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
            }
        );

        // If samples aren't ready yet, show all UMAP data
        if (!samplesReady || allPatientIds.length === 0) {
            this.patientDataMap.clear();
            allData.forEach((point: UMAPDataPoint, index: number) => {
                point.pointIndex = index;
                this.patientDataMap.set(point.pointIndex, point);
            });
            return allData;
        }

        // Check overlap between study patients and UMAP patients
        const studyPatientIds = new Set(allPatientIds);
        const umapPatientIds = new Set(
            umapData.data.map((p: any) => p.patientId)
        );
        const studyUmapOverlap = allPatientIds.filter((pid: string) =>
            umapPatientIds.has(pid)
        );

        // Use the filtered patient IDs from the computed property
        // This will automatically contain the right patients based on current filters
        const patientsToShow = new Set(filteredPatientIds);

        const filteredData = allData.filter((point: UMAPDataPoint) =>
            patientsToShow.has(point.patientId)
        );

        // Build a map for quick lookup
        this.patientDataMap.clear();
        filteredData.forEach((point: UMAPDataPoint, index: number) => {
            // Re-index the filtered data
            point.pointIndex = index;
            this.patientDataMap.set(point.pointIndex, point);
        });

        return filteredData;
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

    @computed get plotData(): UMAPDataPoint[] {
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

        return this.loadUMAPData();
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
            return !cacheEntry.isComplete;
        }

        // Check molecular data caches to prevent flickering
        if (!this.molecularDataCachesComplete) {
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

    private createPlotlyVisualization(patientData: UMAPDataPoint[]) {
        if (!this.plotRef.current) {
            return;
        }

        // Clear any existing plot
        Plotly.purge(this.plotRef.current);

        const currentStudyId = this.props.store.queriedPhysicalStudyIds
            .result?.[0];

        // Group by cancer type for coloring
        const cancerTypes = Array.from(
            new Set(
                patientData.map((d: UMAPDataPoint) => d.cancerType || 'Unknown')
            )
        ).sort();

        const traces = cancerTypes.map(cancerType => {
            const cancerTypeData = patientData.filter(
                (d: UMAPDataPoint) => (d.cancerType || 'Unknown') === cancerType
            );

            // Use individual colors for each point to support both fill and stroke colors
            const fillColors = cancerTypeData.map(
                (d: UMAPDataPoint) => d.color || '#CCCCCC'
            );
            const strokeColors = cancerTypeData.map(
                (d: UMAPDataPoint) => d.strokeColor || '#CCCCCC'
            );

            return {
                x: cancerTypeData.map((d: UMAPDataPoint) => d.x),
                y: cancerTypeData.map((d: UMAPDataPoint) => d.y),
                mode: 'markers' as const,
                type: 'scattergl' as const,
                name: cancerType,
                showlegend: false, // Hide default legend for data traces
                marker: {
                    color: fillColors,
                    size: 8,
                    opacity: 0.8,
                    line: {
                        color: strokeColors,
                        width: 2,
                    },
                },
                text: cancerTypeData.map((d: UMAPDataPoint) => {
                    // Get the dynamic label based on selected coloring option
                    const coloringLabel = this.getColoringLabel();
                    return `Patient: ${
                        d.patientId
                    }<br>${coloringLabel}: ${d.cancerType || 'Unknown'}`;
                }),
                hovertemplate: '%{text}<extra></extra>',
            };
        });

        // Create custom legend traces
        if (this.selectedColoringOption) {
            if (
                this.selectedColoringOption.info?.entrezGeneId &&
                this.selectedColoringOption.info.entrezGeneId !== -3
            ) {
                // Gene-based coloring: show molecular alteration types that are present
                const presentAlterations = new Set<string>();
                patientData.forEach(point => {
                    if (point.cancerType && point.cancerType !== 'Unknown') {
                        presentAlterations.add(point.cancerType);
                    }
                });

                const legendData = this.coloringService.getLegendData();

                // Filter legend to only show alterations that are present in the data
                const filteredLegendData = legendData.filter(item =>
                    presentAlterations.has(item.name)
                );

                filteredLegendData.forEach(item => {
                    let marker: any = { size: 8, opacity: 0.8 };

                    if (item.style === 'filled') {
                        // Filled dots for mutations
                        marker.color = item.color;
                        marker.line = { width: 0 };
                    } else if (item.style === 'border') {
                        // Unfilled with colored border for CNAs and SVs
                        marker.color = 'rgba(255,255,255,0.9)'; // Nearly transparent fill
                        marker.line = { color: item.color, width: 2 };
                    } else if (item.style === 'vanilla') {
                        // Vanilla dot for no mutation
                        marker.color = item.color;
                        marker.line = { width: 0 };
                    } else {
                        // Fallback
                        marker.color = item.color;
                        marker.line = { width: 1 };
                    }

                    traces.push({
                        x: [NaN],
                        y: [NaN],
                        mode: 'markers' as const,
                        type: 'scattergl' as const,
                        name: item.name,
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
                text: `UMAP Embedding - ${currentStudyId} (${patientData.length.toLocaleString()} patients)`,
                font: { size: 16 },
            },
            xaxis: {
                title: { text: 'UMAP 1' },
                showgrid: false,
                zeroline: false,
            },
            yaxis: {
                title: { text: 'UMAP 2' },
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
                filename: `umap_embedding_${currentStudyId}`,
                height: 600,
                width: 800,
                scale: 2,
            },
        };

        Plotly.newPlot(this.plotRef.current, traces, layout, config);

        // Add selection event handler
        if (this.plotRef.current) {
            (this.plotRef.current as any).on(
                'plotly_selected',
                (eventData: any) => {
                    this.handlePlotSelection(eventData);
                }
            );
        }
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
                origin: ['UMAP'],
                displayName: 'UMAP Selection',
                description: 'Patients selected from UMAP embedding',
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
            <div
                className="coloring-menu"
                style={{
                    marginBottom: '20px',
                    textAlign: 'left',
                    position: 'relative',
                    minWidth: 600,
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
                    structuralVariantEnabled={this.structuralVariantEnabled}
                    onSelectionChange={this.onColoringSelectionChange}
                    onLogScaleChange={this.onLogScaleChange}
                    onMutationTypeToggle={this.onMutationTypeToggle}
                    onCopyNumberToggle={this.onCopyNumberToggle}
                    onStructuralVariantToggle={this.onStructuralVariantToggle}
                />
            </div>
        );
    }
}

export default EmbeddingsTab;
