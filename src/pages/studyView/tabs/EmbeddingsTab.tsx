import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, observable, action, makeObservable } from 'mobx';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import umapData from '../../../data/msk_chord_2024_umap_data.json';
import pcaData from '../../../data/msk_chord_2024_pca_data.json';
import ColorSamplesByDropdown from 'shared/components/colorSamplesByDropdown/ColorSamplesByDropdown';
import { ColoringMenuOmnibarOption } from 'shared/components/plots/PlotsTab';
import {
    makeEmbeddingScatterPlotData,
    EmbeddingCoordinate,
    EmbeddingPlotPoint,
} from 'shared/components/plots/EmbeddingPlotUtils';
import {
    EmbeddingSelector,
    EmbeddingDeckGLVisualization,
    EmbeddingDataOption,
} from 'shared/components/embeddings';
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
    @observable private selectedEmbedding: EmbeddingDataOption = {
        value: 'umap',
        label: 'UMAP',
        data: umapData as EmbeddingData,
    };
    @observable.ref private viewState: ViewState = {
        target: [0, 0, 0],
        zoom: 0,
        minZoom: -5,
        maxZoom: 10,
    };

    constructor(props: IEmbeddingsTabProps) {
        super(props);
        makeObservable(this);

        // Initialize default coloring
        this.initializeDefaultColoring();

        // Initialize view state based on initial data
        this.initializeViewState();
    }

    private initializeDefaultColoring() {
        // Set default to CANCER_TYPE_DETAILED if available
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

    private initializeViewState() {
        // Calculate initial view state when component loads
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

    @computed get clinicalAttributes() {
        return this.props.store.clinicalAttributes.result || [];
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

    @computed get embeddingOptions(): EmbeddingDataOption[] {
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

    @computed get plotData(): EmbeddingPlotPoint[] {
        if (
            !this.props.store.samples.isComplete ||
            !this.selectedEmbedding.data
        ) {
            return [];
        }

        // Use the new utility function to transform embedding data
        const embeddingCoordinates: EmbeddingCoordinate[] = this.selectedEmbedding.data.data.map(
            point => ({
                x: point.x,
                y: point.y,
                patientId: point.patientId,
            })
        );

        return makeEmbeddingScatterPlotData(
            embeddingCoordinates,
            this.props.store,
            this.selectedColoringOption,
            this.mutationTypeEnabled,
            this.copyNumberEnabled,
            this.structuralVariantEnabled,
            this.coloringLogScale
        );
    }

    @computed get selectedPatientIds(): string[] {
        return (
            this.props.store.selectedPatients?.map((p: any) => p.patientId) ||
            []
        );
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

        return this.plotData.length === 0;
    }

    @action.bound
    private onColoringSelectionChange(option?: ColoringMenuOmnibarOption) {
        this.selectedColoringOption = option;
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
    private onEmbeddingChange(value: string) {
        const selectedOption = this.embeddingOptions.find(
            option => option.value === value
        );
        if (selectedOption) {
            this.selectedEmbedding = selectedOption;
            // Reset view state when embedding type changes
            const bounds = calculateDataBounds(
                selectedOption.data.data as EmbeddingPoint[]
            );
            this.viewState = {
                target: [bounds.centerX, bounds.centerY, 0],
                zoom: bounds.zoom,
                minZoom: -5,
                maxZoom: 10,
            };
        }
    }

    @action.bound
    private onViewStateChange(newViewState: ViewState) {
        this.viewState = newViewState;
    }

    @action.bound
    private handlePointSelection(selectedPoints: any[]) {
        if (!selectedPoints || selectedPoints.length === 0) return;

        // Get all samples from the store to map patient IDs to sample IDs
        const allSamples = this.props.store.samples.result || [];
        const selectedPatientSet = new Set(
            selectedPoints.map(p => p.patientId)
        );

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
                    <p>No embedding data available</p>
                </div>
            );
        }

        const visualizationProps = {
            data: patientData,
            title: `${this.selectedEmbedding.label} Embedding - ${this.selectedEmbedding.data.title}`,
            xAxisLabel: `${this.selectedEmbedding.label}1`,
            yAxisLabel: `${this.selectedEmbedding.label}2`,
            height: 600,
            showLegend: true,
            filename: `${this.selectedEmbedding.value}_embedding`,
            viewState: this.viewState,
            onViewStateChange: this.onViewStateChange,
            onPointSelection: this.handlePointSelection,
            selectedPatientIds: this.selectedPatientIds,
        };

        return (
            <div style={{ width: '100%' }}>
                <EmbeddingDeckGLVisualization {...visualizationProps} />
            </div>
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
            <div className="embeddings-tab">
                <div style={{ marginBottom: '10px' }}>
                    <div
                        style={{
                            display: 'inline-block',
                            marginRight: '20px',
                            verticalAlign: 'middle',
                        }}
                    >
                        <EmbeddingSelector
                            options={this.embeddingOptions.map(opt => ({
                                value: opt.value,
                                label: opt.label,
                                description: opt.data.description,
                            }))}
                            selectedValue={this.selectedEmbedding.value}
                            onSelectionChange={this.onEmbeddingChange}
                            label="Embedding:"
                        />
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

                {/* Plot */}
                {this.plotComponent}
            </div>
        );
    }
}
