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

    constructor(props: IEmbeddingsTabProps) {
        super(props);
        makeObservable(this);

        this.coloringService = new ColoringService({
            clinicalDataCache: this.props.store.clinicalDataCache,
        });
    }

    private initializeDefaultColoring() {
        // Set default to CANCER_TYPE_DETAILED if available
        const cancerTypeAttr = this.clinicalAttributes.find(
            attr => attr.clinicalAttributeId === 'CANCER_TYPE_DETAILED'
        );

        console.log(
            'Initializing default coloring - available attributes:',
            this.clinicalAttributes.length
        );
        console.log('CANCER_TYPE_DETAILED found:', !!cancerTypeAttr);

        if (cancerTypeAttr) {
            this.selectedColoringOption = {
                label: cancerTypeAttr.displayName,
                value: `clinical_${cancerTypeAttr.clinicalAttributeId}`,
                info: {
                    clinicalAttribute: cancerTypeAttr,
                },
            };

            console.log(
                'Set selectedColoringOption to:',
                this.selectedColoringOption
            );

            // Trigger the clinical data cache to load this attribute
            const cacheEntry = this.props.store.clinicalDataCache.get(
                cancerTypeAttr
            );
            console.log('Clinical data cache entry status:', {
                isPending: cacheEntry.isPending,
                isComplete: cacheEntry.isComplete,
                isError: cacheEntry.isError,
                hasResult: !!cacheEntry.result,
            });

            // Update the coloring service with the default selection
            this.coloringService.updateConfig({
                selectedOption: this.selectedColoringOption,
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
        // For EmbeddingsTab, we might not need genes initially
        // but this allows the dropdown to show gene options if needed
        return [];
    }

    @computed get logScalePossible(): boolean {
        // Log scale not needed for UMAP coordinates
        return false;
    }

    @action.bound
    private onColoringSelectionChange(option?: ColoringMenuOmnibarOption) {
        console.log('Coloring selection changed to:', option);
        this.selectedColoringOption = option;
        this.coloringService.updateConfig({ selectedOption: option });

        // Trigger clinical data loading by accessing the cache
        if (option?.info?.clinicalAttribute) {
            console.log(
                'Selected clinical attribute:',
                option.info.clinicalAttribute.clinicalAttributeId,
                option.info.clinicalAttribute.displayName
            );
            const cacheEntry = this.props.store.clinicalDataCache.get(
                option.info.clinicalAttribute
            );
            console.log('Cache entry status for new selection:', {
                isPending: cacheEntry.isPending,
                isComplete: cacheEntry.isComplete,
                isError: cacheEntry.isError,
                hasResult: !!cacheEntry.result,
            });
        }

        // MobX will automatically trigger re-render when plotData computed changes
    }

    @action.bound
    private onLogScaleChange(enabled: boolean) {
        this.coloringLogScale = enabled;
        this.coloringService.updateConfig({ logScale: enabled });

        // MobX will automatically trigger re-render when plotData computed changes
    }

    @computed get filteredPatientIds(): string[] {
        // selectedSamples IS the filtered data! It returns filtered results when chartsAreFiltered is true
        const filteredSamples = this.props.store.selectedSamples.result || [];
        const chartsAreFiltered = this.props.store.chartsAreFiltered;

        // Extract unique patient IDs from the filtered samples
        const patientIds = [
            ...new Set(filteredSamples.map((s: any) => s.patientId)),
        ];

        console.log(
            'COMPUTED: filteredPatientIds - chartsAreFiltered:',
            chartsAreFiltered,
            'patients:',
            patientIds.length,
            'samples:',
            filteredSamples.length
        );

        return patientIds;
    }

    private loadUMAPData(): UMAPDataPoint[] {
        // Use the computed property to force reactivity
        const filteredPatientIds = this.filteredPatientIds;

        // Check if data is ready
        const samplesReady = this.props.store.samples.isComplete;
        const allSamples = this.props.store.samples.result || [];

        console.log(
            'Data readiness - samples:',
            samplesReady,
            'total samples:',
            allSamples.length
        );

        // Get all unique patient IDs from samples
        const allPatientIds = [
            ...new Set(allSamples.map((s: any) => s.patientId)),
        ];

        console.log(
            'All patient IDs in study:',
            allPatientIds.length,
            allPatientIds.slice(0, 5)
        );
        console.log(
            'Filtered patient IDs (from computed):',
            filteredPatientIds.length,
            filteredPatientIds.slice(0, 5)
        );
        console.log(
            'UMAP patient IDs:',
            umapData.data.length,
            umapData.data.slice(0, 5).map((p: any) => p.patientId)
        );

        const allData: UMAPDataPoint[] = umapData.data.map(
            (patient: any, index: number) => {
                // Find the sample for this patient
                const sample = allSamples.find(
                    s => s.patientId === patient.patientId
                );

                let color = '#CCCCCC';
                let cancerType = 'Unknown';

                if (sample && this.selectedColoringOption) {
                    // Update coloring service config to ensure it has the latest selection
                    this.coloringService.updateConfig({
                        selectedOption: this.selectedColoringOption,
                        logScale: this.coloringLogScale,
                    });

                    console.log(
                        `Processing patient ${patient.patientId} with selectedOption: ${this.selectedColoringOption.label}`
                    );
                    color = this.coloringService.getPointColor(sample);
                    const displayValue = this.coloringService.getDisplayValue(
                        sample
                    );
                    cancerType =
                        displayValue ||
                        this.getPatientCancerType(patient.patientId) ||
                        'Unknown';

                    if (index < 3) {
                        // Only log first few patients to avoid spam
                        console.log(
                            `Patient ${patient.patientId}: sample=${sample.sampleId}, selectedOption=${this.selectedColoringOption?.label}, color=${color}, cancerType=${cancerType}, displayValue=${displayValue}`
                        );
                    }
                } else {
                    if (index < 3) {
                        console.log(
                            `Patient ${
                                patient.patientId
                            }: sample found=${!!sample}, selectedOption=${!!this
                                .selectedColoringOption}, optionLabel=${
                                this.selectedColoringOption?.label
                            }`
                        );
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
                };
            }
        );

        // If samples aren't ready yet, show all UMAP data
        if (!samplesReady || allPatientIds.length === 0) {
            console.log('Data not ready, showing all UMAP points');
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
        console.log(
            'Overlap between study and UMAP patients:',
            studyUmapOverlap.length,
            studyUmapOverlap.slice(0, 5)
        );

        // Use the filtered patient IDs from the computed property
        // This will automatically contain the right patients based on current filters
        const patientsToShow = new Set(filteredPatientIds);
        console.log(
            'Using filtered patients from store:',
            filteredPatientIds.length
        );

        const filteredData = allData.filter((point: UMAPDataPoint) =>
            patientsToShow.has(point.patientId)
        );

        console.log(
            'Final filtered UMAP data:',
            filteredData.length,
            'points out of',
            allData.length,
            'total UMAP points'
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

        console.log('Cancer types found in UMAP data:', cancerTypes);

        const traces = cancerTypes.map(cancerType => {
            const cancerTypeData = patientData.filter(
                (d: UMAPDataPoint) => (d.cancerType || 'Unknown') === cancerType
            );

            // Use the cancer type color for all points of this type
            const cancerTypeColor =
                cancerTypeData.length > 0
                    ? cancerTypeData[0].color || '#CCCCCC'
                    : '#CCCCCC';

            console.log(
                `Cancer type '${cancerType}': ${cancerTypeData.length} patients, color: ${cancerTypeColor}`
            );

            return {
                x: cancerTypeData.map((d: UMAPDataPoint) => d.x),
                y: cancerTypeData.map((d: UMAPDataPoint) => d.y),
                mode: 'markers' as const,
                type: 'scattergl' as const,
                name: cancerType,
                marker: {
                    color: cancerTypeColor,
                    size: 4,
                    opacity: 0.8,
                },
                text: cancerTypeData.map(
                    (d: UMAPDataPoint) =>
                        `Patient: ${
                            d.patientId
                        }<br>Cancer Type: ${d.cancerType || 'Unknown'}`
                ),
                hovertemplate: '%{text}<extra></extra>',
            };
        });

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
                bgcolor: 'rgba(255,255,255,0.8)',
                bordercolor: 'rgba(0,0,0,0.2)',
                borderwidth: 1,
            },
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
            console.log('Selected patient IDs from UMAP:', selectedPatientIds);

            // Get actual samples from the store to map patient IDs to sample IDs
            const allSamples = this.props.store.samples.result || [];
            const selectedPatientSet = new Set(selectedPatientIds);

            // Find samples that belong to the selected patients
            const samplesForSelectedPatients = allSamples.filter(sample =>
                selectedPatientSet.has(sample.patientId)
            );

            console.log(
                'Samples for selected patients:',
                samplesForSelectedPatients
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

            console.log(
                'Custom chart data with correct sample IDs:',
                customChartData
            );

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
                    onSelectionChange={this.onColoringSelectionChange}
                    onLogScaleChange={this.onLogScaleChange}
                />
            </div>
        );
    }
}

export default EmbeddingsTab;
