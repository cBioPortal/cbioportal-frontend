import { action, computed, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { ReactNode } from 'react';
import { TableProps } from 'react-table';

import { DefaultPubMedCache } from '../../cache/DefaultPubMedCache';
import { FilterResetPanel } from './FilterResetPanel';
import { DataFilter } from '../../model/DataFilter';
import { ApplyFilterFn, FilterApplier } from '../../model/FilterApplier';
import { LollipopPlotControlsConfig } from '../../model/LollipopPlotControlsConfig';
import { MobxCache } from '../../model/MobxCache';
import { Mutation } from '../../model/Mutation';
import { MutationMapperDataFetcher } from '../../model/MutationMapperDataFetcher';
import { MutationMapperStore } from '../../model/MutationMapperStore';
import { DefaultLollipopPlotControlsConfig } from '../../store/DefaultLollipopPlotControlsConfig';
import DefaultMutationMapperStore from '../../store/DefaultMutationMapperStore';
import { initDefaultTrackVisibility } from '../../util/TrackUtils';
import { getDefaultWindowInstance } from '../../util/DefaultWindowInstance';
import { ColumnSortDirection, DataTableColumn } from '../dataTable/DataTable';
import DefaultMutationRateSummary, {
    MutationRate,
} from './DefaultMutationRateSummary';
import DefaultMutationTable from '../mutationTable/DefaultMutationTable';
import GeneSummary from './GeneSummary';
import LollipopMutationPlot from '../lollipopMutationPlot/LollipopMutationPlot';
import { DEFAULT_MUTATION_COLUMNS } from '../mutationTable/MutationColumnHelper';
import {
    TrackDataStatus,
    TrackName,
    TrackVisibility,
} from '../track/TrackSelector';

export type MutationMapperProps = {
    hugoSymbol?: string;
    entrezGeneId?: number;
    data?: Partial<Mutation>[];
    store?: MutationMapperStore;
    lollipopPlotControlsConfig?: LollipopPlotControlsConfig;
    windowWrapper?: { size: { width: number; height: number } };
    trackVisibility?: TrackVisibility;
    tracks?: TrackName[];
    showTrackSelector?: boolean;
    mutationTableColumns?: DataTableColumn<Partial<Mutation>>[];
    customMutationTableProps?: Partial<TableProps<Partial<Mutation>>>;
    showFilterResetPanel?: boolean;
    showPlotYAxis?: boolean;
    showPlotYMaxSlider?: boolean;
    showPlotLegendToggle?: boolean;
    showPlotDownloadControls?: boolean;
    plotYMaxFractionDigits?: number;
    plotYMaxLabelPostfix?: string;
    plotTopYAxisSymbol?: string;
    plotBottomYAxisSymbol?: string;
    plotTopYAxisDefaultMax?: number;
    plotTopYAxisDefaultMin?: number;
    plotBottomYAxisDefaultMax?: number;
    plotBottomYAxisDefaultMin?: number;
    plotYAxisLabelPadding?: number;
    plotLollipopTooltipCountInfo?: (
        count: number,
        mutations?: Partial<Mutation>[]
    ) => JSX.Element;
    plotVizHeight?: number;
    customControls?: JSX.Element;
    mutationTable?: JSX.Element;
    mutationTableInitialSortColumn?: string;
    mutationTableInitialSortDirection?: ColumnSortDirection;
    mutationRates?: MutationRate[];
    pubMedCache?: MobxCache;
    // TODO annotateMutations?: boolean;
    dataFetcher?: MutationMapperDataFetcher;
    genomeNexusUrl?: string;
    oncoKbUrl?: string;
    enableOncoKb?: boolean;
    enableCivic?: boolean;
    cachePostMethodsOnClients?: boolean;
    apiCacheLimit?: number;
    showTranscriptDropDown?: boolean;
    showOnlyAnnotatedTranscriptsInDropdown?: boolean;
    filterMutationsBySelectedTranscript?: boolean;
    transcriptSummaryUrlTemplate?: string;
    isoformOverrideSource?: string;
    annotationFields?: string[];
    mainLoadingIndicator?: JSX.Element;
    geneSummaryLoadingIndicator?: JSX.Element;
    getLollipopColor?: (mutations: Partial<Mutation>[]) => string;
    getMutationCount?: (mutation: Partial<Mutation>) => number;
    getTumorType?: (mutation: Partial<Mutation>) => string;
    onXAxisOffset?: (offset: number) => void;
    onTrackVisibilityChange?: (selectedTrackIds: string[]) => void;

    dataFilters?: DataFilter[];
    selectionFilters?: DataFilter[];
    highlightFilters?: DataFilter[];
    groupFilters?: { group: string; filter: DataFilter }[];
    filterAppliersOverride?: { [filterType: string]: ApplyFilterFn };
    filterApplier?: FilterApplier;
};

export function initDefaultMutationMapperStore(props: MutationMapperProps) {
    return new DefaultMutationMapperStore(
        {
            entrezGeneId: props.entrezGeneId, // entrezGeneId is required to display uniprot id
            hugoGeneSymbol: props.hugoSymbol ? props.hugoSymbol! : '',
        },
        {
            annotationFields: props.annotationFields,
            isoformOverrideSource: props.isoformOverrideSource,
            filterMutationsBySelectedTranscript:
                props.filterMutationsBySelectedTranscript,
            genomeNexusUrl: props.genomeNexusUrl,
            oncoKbUrl: props.oncoKbUrl,
            enableCivic: props.enableCivic,
            enableOncoKb: props.enableOncoKb,
            cachePostMethodsOnClients: props.cachePostMethodsOnClients,
            apiCacheLimit: props.apiCacheLimit,
            getMutationCount: props.getMutationCount,
            getTumorType: props.getTumorType,
            dataFetcher: props.dataFetcher,
            filterApplier: props.filterApplier,
            filterAppliersOverride: props.filterAppliersOverride,
            dataFilters: props.dataFilters,
            selectionFilters: props.selectionFilters,
            highlightFilters: props.highlightFilters,
            groupFilters: props.groupFilters,
        },
        () => (props.data || []) as Mutation[]
    );
}

@observer
export default class MutationMapper<
    P extends MutationMapperProps = MutationMapperProps
> extends React.Component<P, {}> {
    public static defaultProps: Partial<MutationMapperProps> = {
        showFilterResetPanel: true,
        showOnlyAnnotatedTranscriptsInDropdown: false,
        showTranscriptDropDown: false,
        enableCivic: true,
        enableOncoKb: true,
        filterMutationsBySelectedTranscript: false,
        cachePostMethodsOnClients: true,
    };

    @observable
    private _trackVisibility: TrackVisibility | undefined;

    @observable
    protected lollipopPlotGeneX: number | undefined;

    @computed
    protected get geneWidth(): number {
        if (this.lollipopPlotGeneX) {
            return this.windowWrapper.size.width * 0.7 - this.lollipopPlotGeneX;
        } else {
            return 666;
        }
    }

    @computed
    protected get trackVisibility(): TrackVisibility {
        if (this.props.trackVisibility) {
            return this.props.trackVisibility!;
        } else {
            if (!this._trackVisibility) {
                this._trackVisibility = initDefaultTrackVisibility();
            }

            return this._trackVisibility;
        }
    }

    protected get trackDataStatus(): TrackDataStatus {
        // TODO dummy method for now: move the implementation from cbioportal-frontend
        return {};
    }

    @computed
    protected get plotTopYAxisSymbol(): string | undefined {
        return this.props.plotTopYAxisSymbol;
    }

    @computed
    protected get plotYMaxLabelPostfix(): string | undefined {
        return this.props.plotYMaxLabelPostfix;
    }

    @computed
    protected get plotBottomYAxisSymbol(): string | undefined {
        return this.props.plotBottomYAxisSymbol;
    }

    @computed
    protected get plotTopYAxisDefaultMax(): number | undefined {
        return this.props.plotTopYAxisDefaultMax;
    }

    @computed
    protected get plotTopYAxisDefaultMin(): number | undefined {
        return this.props.plotTopYAxisDefaultMin;
    }

    @computed
    protected get plotBottomYAxisDefaultMax(): number | undefined {
        return this.props.plotBottomYAxisDefaultMax;
    }

    @computed
    protected get plotBottomYAxisDefaultMin(): number | undefined {
        return this.props.plotBottomYAxisDefaultMin;
    }

    @computed
    protected get store(): MutationMapperStore {
        return this.props.store
            ? this.props.store!
            : initDefaultMutationMapperStore(this.props);
    }

    @computed
    protected get lollipopPlotControlsConfig(): LollipopPlotControlsConfig {
        return this.props.lollipopPlotControlsConfig
            ? this.props.lollipopPlotControlsConfig!
            : new DefaultLollipopPlotControlsConfig();
    }

    protected get pubMedCache(): MobxCache {
        return this.props.pubMedCache
            ? this.props.pubMedCache!
            : new DefaultPubMedCache();
    }

    @computed
    protected get windowWrapper(): { size: { width: number; height: number } } {
        return this.props.windowWrapper
            ? this.props.windowWrapper!
            : getDefaultWindowInstance();
    }

    protected get mutationTableInfo(): JSX.Element | undefined {
        // TODO implement default
        // @computed
        // get multipleMutationInfo(): string {
        //     const count = this.store.dataStore.duplicateMutationCountInMultipleSamples;
        //     const mutationsLabel = count === 1 ? "mutation" : "mutations";
        //
        //     return count > 0 ? `: includes ${count} duplicate ${mutationsLabel} in patients with multiple samples` : "";
        // }
        //
        // @computed get itemsLabelPlural(): string {
        //     return `Mutations${this.multipleMutationInfo}`;
        // }

        return undefined;
    }

    protected get mutationTableComponent(): JSX.Element | null {
        if (this.props.mutationTable) {
            return this.props.mutationTable!;
        } else {
            let columns: DataTableColumn<
                Partial<Mutation>
            >[] = DEFAULT_MUTATION_COLUMNS;
            if (this.props.mutationTableColumns) {
                columns = this.props.mutationTableColumns!;
            }

            return (
                <DefaultMutationTable
                    dataStore={this.store.dataStore}
                    columns={columns}
                    initialSortColumn={
                        this.props.mutationTableInitialSortColumn
                    }
                    initialSortDirection={
                        this.props.mutationTableInitialSortDirection
                    }
                    reactTableProps={this.props.customMutationTableProps}
                    hotspotData={this.store.indexedHotspotData}
                    oncoKbData={this.store.oncoKbData}
                    oncoKbCancerGenes={this.store.oncoKbCancerGenes}
                    myCancerGenomeData={this.store.myCancerGenomeData}
                    enableCivic={this.props.enableCivic}
                    civicGenes={this.store.civicGenes}
                    civicVariants={this.store.civicVariants}
                    indexedMyVariantInfoAnnotations={
                        this.store.indexedMyVariantInfoAnnotations
                    }
                    indexedVariantAnnotations={
                        this.store.indexedVariantAnnotations
                    }
                    pubMedCache={this.pubMedCache}
                    info={this.mutationTableInfo}
                />
            );
        }
    }

    protected get mutationPlot(): JSX.Element | null {
        return (
            <LollipopMutationPlot
                store={this.store}
                controlsConfig={this.lollipopPlotControlsConfig}
                pubMedCache={this.pubMedCache}
                geneWidth={this.geneWidth}
                vizHeight={this.props.plotVizHeight}
                trackVisibility={this.trackVisibility}
                customControls={this.customControls}
                tracks={this.props.tracks}
                showYMaxSlider={this.props.showPlotYMaxSlider}
                showLegendToggle={this.props.showPlotLegendToggle}
                showDownloadControls={this.props.showPlotDownloadControls}
                filterResetPanel={
                    this.props.showFilterResetPanel &&
                    this.isFiltered &&
                    this.filterResetPanel
                        ? this.filterResetPanel
                        : undefined
                }
                trackDataStatus={this.trackDataStatus}
                showTrackSelector={this.props.showTrackSelector}
                onXAxisOffset={this.onXAxisOffset}
                onTrackVisibilityChange={this.props.onTrackVisibilityChange}
                getMutationCount={this.props.getMutationCount}
                getLollipopColor={this.props.getLollipopColor}
                yMaxLabelPostfix={this.plotYMaxLabelPostfix}
                yMaxFractionDigits={this.props.plotYMaxFractionDigits}
                yAxisLabelPadding={this.props.plotYAxisLabelPadding}
                showYAxis={this.props.showPlotYAxis}
                topYAxisSymbol={this.plotTopYAxisSymbol}
                bottomYAxisSymbol={this.plotBottomYAxisSymbol}
                topYAxisDefaultMax={this.plotTopYAxisDefaultMax}
                topYAxisDefaultMin={this.plotBottomYAxisDefaultMin}
                bottomYAxisDefaultMax={this.plotBottomYAxisDefaultMax}
                bottomYAxisDefaultMin={this.plotBottomYAxisDefaultMin}
                lollipopTooltipCountInfo={
                    this.props.plotLollipopTooltipCountInfo
                }
            />
        );
    }

    protected get customControls(): JSX.Element | undefined {
        return this.props.customControls;
    }

    protected get geneSummary(): JSX.Element | null {
        return (
            <GeneSummary
                hugoGeneSymbol={this.store.gene.hugoGeneSymbol}
                uniprotId={this.store.uniprotId.result}
                showDropDown={!!this.props.showTranscriptDropDown}
                showOnlyAnnotatedTranscriptsInDropdown={
                    !!this.props.showOnlyAnnotatedTranscriptsInDropdown
                }
                transcriptsByTranscriptId={this.store.transcriptsByTranscriptId}
                canonicalTranscript={this.store.canonicalTranscript}
                loadingIndicator={this.props.geneSummaryLoadingIndicator}
                activeTranscript={this.store.activeTranscript}
                indexedVariantAnnotations={this.store.indexedVariantAnnotations}
                transcriptsWithAnnotations={
                    this.store.transcriptsWithAnnotations
                }
                transcriptsWithProteinLength={
                    this.store.transcriptsWithProteinLength
                }
                mutationsByTranscriptId={this.store.mutationsByTranscriptId}
                transcriptSummaryUrlTemplate={
                    this.props.transcriptSummaryUrlTemplate
                }
                onTranscriptChange={this.handleTranscriptChange}
            />
        );
    }

    @computed
    protected get mutationRates(): MutationRate[] | undefined {
        return this.props.mutationRates;
    }

    protected get mutationRateSummary(): JSX.Element | null {
        return this.mutationRates ? (
            <DefaultMutationRateSummary rates={this.mutationRates!} />
        ) : null;
    }

    protected get isFiltered(): boolean {
        return (
            this.store.dataStore.selectionFilters.length > 0 ||
            this.store.dataStore.dataFilters.length > 0
        );
    }

    protected get isMutationTableDataLoading(): boolean {
        // Child classes should override this method
        return false;
    }

    protected get filterResetPanel(): JSX.Element | null {
        const dataStore = this.store.dataStore;
        const tableData =
            dataStore.sortedFilteredSelectedData.length > 0
                ? dataStore.sortedFilteredSelectedData
                : dataStore.sortedFilteredData;
        const allData = dataStore.allData;

        return (
            <FilterResetPanel
                filterInfo={`Showing ${tableData.length} of ${allData.length} mutations.`}
                resetFilters={this.resetFilters}
            />
        );
    }

    protected get mutationTable(): JSX.Element | null {
        return <span>{this.mutationTableComponent}</span>;
    }

    protected get proteinChainPanel(): JSX.Element | null {
        // TODO move the implementation from cbioportal-frontend
        return null;
    }

    protected get mutationFilterPanel(): JSX.Element | null {
        // TODO move the implementation from cbioportal-frontend
        return null;
    }

    protected get view3dButton(): JSX.Element | null {
        // TODO move the implementation from cbioportal-frontend
        return null;
    }

    protected get isMutationPlotDataLoading(): boolean {
        return this.store.pfamDomainData.isPending;
    }

    protected get isLoading(): boolean {
        return (
            this.store.mutationData.isPending ||
            this.isMutationPlotDataLoading ||
            this.isMutationTableDataLoading
        );
    }

    protected get loadingIndicator(): JSX.Element {
        return this.props.mainLoadingIndicator ? (
            this.props.mainLoadingIndicator!
        ) : (
            <i className="fa fa-spinner fa-pulse fa-2x" />
        );
    }

    public render(): ReactNode {
        return this.isLoading ? (
            this.loadingIndicator
        ) : (
            <div>
                <div style={{ display: 'flex' }}>
                    <div
                        className="borderedChart"
                        style={{ marginRight: '1rem' }}
                    >
                        {this.mutationPlot}
                        {this.proteinChainPanel}
                    </div>
                    <div className="mutationMapperMetaColumn">
                        {this.geneSummary}
                        {this.mutationRateSummary}
                        {this.mutationFilterPanel}
                        {this.view3dButton}
                    </div>
                </div>
                {this.mutationTable}
            </div>
        );
    }

    @action.bound
    protected handleTranscriptChange(transcriptId: string) {
        this.store.activeTranscript = transcriptId;
        // TODO this.close3dPanel();
    }

    @action.bound
    protected onXAxisOffset(offset: number) {
        if (this.props.onXAxisOffset) {
            this.props.onXAxisOffset(offset);
        } else {
            this.lollipopPlotGeneX = offset;
        }
    }

    @action.bound
    protected resetFilters() {
        this.store.dataStore.clearDataFilters();
        this.store.dataStore.clearSelectionFilters();
        this.store.dataStore.clearHighlightFilters();
    }
}
