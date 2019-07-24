import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import {TableProps} from "react-table";

import {DefaultPubMedCache} from "./cache/DefaultPubMedCache";
import FilterResetPanel from "./component/FilterResetPanel";
import {MobxCache} from "./model/MobxCache";
import {Mutation} from "./model/Mutation";
import MutationMapperStore from "./model/MutationMapperStore";
import DefaultMutationMapperStore from "./store/DefaultMutationMapperStore";
import {initDefaultTrackVisibility} from "./util/TrackUtils";
import {getDefaultWindowInstance} from "./util/DefaultWindowInstance";
import {DataTableColumn} from "./DataTable";
import DefaultMutationRateSummary, {MutationRate} from "./DefaultMutationRateSummary";
import DefaultMutationTable from "./DefaultMutationTable";
import GeneSummary from "./GeneSummary";
import LollipopMutationPlot from "./LollipopMutationPlot";
import {TrackDataStatus, TrackName, TrackVisibility} from "./TrackSelector";

export type MutationMapperProps = {
    hugoSymbol?: string;
    data?: Partial<Mutation>[];
    store?: MutationMapperStore;
    windowWrapper?: {size: {width: number, height: number}};
    trackVisibility?: TrackVisibility;
    tracks?: TrackName[];
    customMutationTableColumns?: DataTableColumn<Mutation>[];
    customMutationTableProps?: Partial<TableProps<Mutation>>;
    showPlotYMaxSlider?: boolean;
    showPlotLegendToggle?: boolean;
    showPlotDownloadControls?: boolean;
    mutationTable?: JSX.Element;
    mutationRates?: MutationRate[];
    pubMedCache?: MobxCache;
    // TODO annotateMutations?: boolean;
    genomeNexusUrl?: string;
    showTranscriptDropDown?: boolean;
    showOnlyAnnotatedTranscriptsInDropdown?: boolean;
    filterMutationsBySelectedTranscript?: boolean;
    isoformOverrideSource?: string;
    mainLoadingIndicator?: JSX.Element;
    geneSummaryLoadingIndicator?: JSX.Element;
    getLollipopColor?: (mutations: Mutation[]) => string;
    getMutationCount?: (mutation: Partial<Mutation>) => number;
    onXAxisOffset?: (offset:number) => void;
    onTrackVisibilityChange?: (selectedTrackIds: string[]) => void;
};

@observer
export default class MutationMapper<P extends MutationMapperProps = MutationMapperProps> extends React.Component<P, {}>
{
    public static defaultProps: Partial<MutationMapperProps> = {
        showOnlyAnnotatedTranscriptsInDropdown: false,
        showTranscriptDropDown: false,
        filterMutationsBySelectedTranscript: false,
    };

    @observable
    private _trackVisibility: TrackVisibility | undefined;

    @observable
    protected lollipopPlotGeneX: number | undefined;

    @computed
    protected get geneWidth()
    {
        if (this.lollipopPlotGeneX) {
            return this.windowWrapper.size.width * 0.7 - this.lollipopPlotGeneX;
        }
        else {
            return 666;
        }
    }

    @computed
    protected get trackVisibility(): TrackVisibility
    {
        if (this.props.trackVisibility) {
            return this.props.trackVisibility!;
        }
        else {
            if (!this._trackVisibility) {
                this._trackVisibility = initDefaultTrackVisibility();
            }

            return this._trackVisibility;
        }
    }

    protected get trackDataStatus(): TrackDataStatus
    {
        // TODO dummy method for now: move the implementation from cbioportal-frontend
        return {};
    }

    @computed
    protected get store(): MutationMapperStore
    {
        return this.props.store ? this.props.store! : new DefaultMutationMapperStore(
            {
                // TODO entrezGeneId: ???, -> we need entrezGeneId to display uniprot id
                hugoGeneSymbol: this.props.hugoSymbol ? this.props.hugoSymbol! : ""
            },
            {
                isoformOverrideSource: this.props.isoformOverrideSource,
                filterMutationsBySelectedTranscript: this.props.filterMutationsBySelectedTranscript,
                genomeNexusUrl: this.props.genomeNexusUrl,
                getMutationCount: this.props.getMutationCount
            },
            () => (this.props.data || []) as Mutation[]);
    }

    protected get pubMedCache() {
        return this.props.pubMedCache || new DefaultPubMedCache();
    }

    @computed
    protected get windowWrapper(): {size: {width: number, height: number}} {
        return this.props.windowWrapper ? this.props.windowWrapper! : getDefaultWindowInstance();
    }

    // TODO for this we need to implement data table items label first
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

    protected get mutationTableComponent(): JSX.Element | null
    {
        return this.props.mutationTable ? this.props.mutationTable! : (
            <DefaultMutationTable
                dataStore={this.store.dataStore}
                columns={this.props.customMutationTableColumns}
                reactTableProps={this.props.customMutationTableProps}
                hotspotData={this.store.indexedHotspotData}
                oncoKbData={this.store.oncoKbData}
                oncoKbCancerGenes={this.store.oncoKbCancerGenes}
                oncoKbEvidenceCache={this.store.oncoKbEvidenceCache}
                pubMedCache={this.pubMedCache}
            />
        );
    }

    protected get mutationPlot(): JSX.Element | null
    {
        return (
            <LollipopMutationPlot
                store={this.store}
                pubMedCache={this.pubMedCache}
                geneWidth={this.geneWidth}
                trackVisibility={this.trackVisibility}
                tracks={this.props.tracks}
                showYMaxSlider={this.props.showPlotYMaxSlider}
                showLegendToggle={this.props.showPlotLegendToggle}
                showDownloadControls={this.props.showPlotDownloadControls}
                trackDataStatus={this.trackDataStatus}
                onXAxisOffset={this.onXAxisOffset}
                onTrackVisibilityChange={this.props.onTrackVisibilityChange}
                getMutationCount={this.props.getMutationCount}
                getLollipopColor={this.props.getLollipopColor}
            />
        );
    }

    protected get geneSummary(): JSX.Element | null
    {
        return (
            <GeneSummary
                hugoGeneSymbol={this.store.gene.hugoGeneSymbol}
                uniprotId={this.store.uniprotId.result}
                showDropDown={!!this.props.showTranscriptDropDown}
                showOnlyAnnotatedTranscriptsInDropdown={!!this.props.showOnlyAnnotatedTranscriptsInDropdown}
                transcriptsByTranscriptId={this.store.transcriptsByTranscriptId}
                canonicalTranscript={this.store.canonicalTranscript}
                loadingIndicator={this.props.geneSummaryLoadingIndicator}
                activeTranscript={this.store.activeTranscript}
                indexedVariantAnnotations={this.store.indexedVariantAnnotations}
                transcriptsWithAnnotations={this.store.transcriptsWithAnnotations}
                transcriptsWithProteinLength={this.store.transcriptsWithProteinLength}
                mutationsByTranscriptId={this.store.mutationsByTranscriptId}
                onTranscriptChange={this.handleTranscriptChange}
            />
        );
    }

    protected get mutationRateSummary(): JSX.Element | null
    {
        return this.props.mutationRates ? <DefaultMutationRateSummary rates={this.props.mutationRates!} /> : null;
    }

    protected get isFiltered() {
        return this.store.dataStore.selectionFilters.length > 0 || this.store.dataStore.dataFilters.length > 0;
    }

    protected get isMutationTableDataLoading()
    {
        // Child classes should override this method
        return false;
    }

    protected get filterResetPanel(): JSX.Element | null
    {
        const dataStore = this.store.dataStore;
        const tableData = dataStore.sortedFilteredSelectedData.length > 0 ?
            dataStore.sortedFilteredSelectedData : dataStore.sortedFilteredData;
        const allData = dataStore.allData;

        return (
            <FilterResetPanel
                mutationsShown={`${tableData.length}/${allData.length}`}
                resetFilters={this.resetFilters}
            />
        )
    }

    protected get mutationTable(): JSX.Element | null
    {
        return (
            <span>
                {this.mutationTableComponent}
            </span>
        );
    }

    protected get proteinChainPanel(): JSX.Element | null
    {
        // TODO move the implementation from cbioportal-frontend
        return null;
    }

    protected get mutationFilterPanel(): JSX.Element | null
    {
        // TODO move the implementation from cbioportal-frontend
        return null;
    }

    protected get view3dButton(): JSX.Element | null
    {
        // TODO move the implementation from cbioportal-frontend
        return null;
    }

    protected get isMutationPlotDataLoading() {
        return this.store.pfamDomainData.isPending;
    }

    protected get isLoading() {
        return this.store.mutationData.isPending || this.isMutationPlotDataLoading || this.isMutationTableDataLoading;
    }

    protected get loadingIndicator() {
        return this.props.mainLoadingIndicator || <i className="fa fa-spinner fa-pulse fa-2x" />;
    }

    public render()
    {
        return this.isLoading ? this.loadingIndicator : (
            <div>
                {this.isFiltered && this.filterResetPanel}
                <div style={{ display:'flex' }}>
                    <div className="borderedChart" style={{ marginRight: "1rem" }}>
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
    protected handleTranscriptChange(transcriptId: string)
    {
        this.store.activeTranscript = transcriptId;
        // TODO this.close3dPanel();
    }

    @action.bound
    protected onXAxisOffset(offset: number) {
        if (this.props.onXAxisOffset) {
            this.props.onXAxisOffset(offset);
        }
        else {
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
