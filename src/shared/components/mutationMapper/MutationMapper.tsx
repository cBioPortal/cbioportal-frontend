import * as React from 'react';
import _ from 'lodash';
import { action, computed, makeObservable } from 'mobx';
import classnames from 'classnames';
import {
    applyDataFilters,
    DataFilterType,
    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS,
    FilterResetPanel,
    getColorForProteinImpactType,
    groupDataByGroupFilters,
    LollipopMutationPlot,
    MutationMapper as DefaultMutationMapper,
    onFilterOptionSelect,
    ProteinImpactTypeBadgeSelector,
    TrackDataStatus,
    TrackName,
    TrackVisibility,
} from 'react-mutation-mapper';

import 'react-mutation-mapper/dist/styles.css';
import 'react-table/react-table.css';

import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import StructureViewerPanel from 'shared/components/structureViewer/StructureViewerPanel';
import PubMedCache from 'shared/cache/PubMedCache';
import GenomeNexusCache from 'shared/cache/GenomeNexusCache';
import GenomeNexusMutationAssessorCache from 'shared/cache/GenomeNexusMutationAssessorCache';
import PdbHeaderCache from 'shared/cache/PdbHeaderCache';
import {
    ANNOTATED_PROTEIN_IMPACT_FILTER_TYPE,
    ANNOTATED_PROTEIN_IMPACT_TYPE_FILTER_ID,
    createAnnotatedProteinImpactTypeFilter,
} from 'shared/lib/MutationUtils';
import ProteinChainPanel from 'shared/components/proteinChainPanel/ProteinChainPanel';
import MutationMapperStore from './MutationMapperStore';
import MutationMapperDataStore, {
    findProteinImpactTypeFilter,
    PROTEIN_IMPACT_TYPE_FILTER_ID,
} from './MutationMapperDataStore';
import WindowStore from '../window/WindowStore';

import styles from './mutationMapper.module.scss';
import { ProteinImpactType } from 'cbioportal-frontend-commons';
import { AnnotatedMutation } from 'pages/resultsView/ResultsViewPageStore';
import DriverAnnotationProteinImpactTypeBadgeSelector from 'pages/resultsView/mutation/DriverAnnotationProteinImpactTypeBadgeSelector';
import { PtmSource } from 'cbioportal-utils';
import { getServerConfig } from 'config/config';

export interface IMutationMapperProps {
    store: MutationMapperStore;
    isPutativeDriver?: (mutation: Partial<AnnotatedMutation>) => boolean;
    trackVisibility?: TrackVisibility;
    columnVisibility?: { [columnId: string]: boolean };
    storeColumnVisibility?: (
        columnVisibility:
            | {
                  [columnId: string]: boolean;
              }
            | undefined
    ) => void;
    showPlotYMaxSlider?: boolean;
    showPlotLegendToggle?: boolean;
    showPlotDownloadControls?: boolean;
    mutationTable?: JSX.Element;
    pubMedCache?: PubMedCache;
    showTranscriptDropDown?: boolean;
    showOnlyAnnotatedTranscriptsInDropdown?: boolean;
    filterMutationsBySelectedTranscript?: boolean;
    mainLoadingIndicator?: JSX.Element;
    geneSummaryLoadingIndicator?: JSX.Element;
    studyId?: string;
    pdbHeaderCache?: PdbHeaderCache;
    genomeNexusCache?: GenomeNexusCache;
    genomeNexusMutationAssessorCache?: GenomeNexusMutationAssessorCache;
    generateGenomeNexusHgvsgUrl: (hgvsg: string) => string;
    onTranscriptChange?: (transcript: string) => void;
    onClickSettingMenu?: (visible: boolean) => void;
    onOncoKbIconToggle?: (mergeIcons: boolean) => void;
    compactStyle?: boolean;
    mergeOncoKbIcons?: boolean; // TODO add server config param for this as well?

    // server config properties
    genomeNexusUrl?: string;
    oncoKbPublicApiUrl?: string;
    isoformOverrideSource?: string;
    myGeneInfoUrlTemplate?: string;
    uniprotIdUrlTemplate?: string;
    transcriptSummaryUrlTemplate?: string;
    enableOncoKb?: boolean;
    enableGenomeNexus?: boolean;
    enableHotspot?: boolean;
    enableMyCancerGenome?: boolean;
    enableCivic?: boolean;
    ptmSources?: string[];
}

export default class MutationMapper<
    P extends IMutationMapperProps
> extends DefaultMutationMapper<P> {
    constructor(props: P) {
        super(props);
        makeObservable(this);
    }

    protected legendColorCodes = (
        <div style={{ maxWidth: 700, marginTop: 5 }}>
            <strong style={{ color: '#2153AA' }}>Color Codes</strong>
            <p>
                Mutation diagram circles are colored with respect to the
                corresponding mutation types. In case of different mutation
                types at a single position, color of the circle is determined
                with respect to the most frequent mutation type.
            </p>
            <br />
            <div>
                Mutation types and corresponding color codes are as follows:
                <ul>
                    <li>
                        <strong
                            style={{
                                color:
                                    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.missenseColor,
                            }}
                        >
                            Missense Mutations
                        </strong>
                        {this.props.isPutativeDriver !== undefined && (
                            <span>(putative driver)</span>
                        )}
                    </li>
                    {this.props.isPutativeDriver !== undefined && (
                        <li>
                            <strong
                                style={{
                                    color:
                                        DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.missenseVusColor,
                                }}
                            >
                                Missense Mutations
                            </strong>
                            {this.props.isPutativeDriver !== undefined && (
                                <span>(unknown significance)</span>
                            )}
                        </li>
                    )}
                    <li>
                        <strong
                            style={{
                                color:
                                    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.truncatingColor,
                            }}
                        >
                            Truncating Mutations
                        </strong>
                        {this.props.isPutativeDriver !== undefined && (
                            <span>(putative driver)</span>
                        )}
                        : Nonsense, Nonstop, Frameshift deletion, Frameshift
                        insertion, Splice site
                    </li>
                    {this.props.isPutativeDriver !== undefined && (
                        <li>
                            <strong
                                style={{
                                    color:
                                        DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.truncatingVusColor,
                                }}
                            >
                                Truncating Mutations
                            </strong>
                            {this.props.isPutativeDriver !== undefined && (
                                <span>(unknown significance)</span>
                            )}
                            : Nonsense, Nonstop, Frameshift deletion, Frameshift
                            insertion, Splice site
                        </li>
                    )}
                    <li>
                        <strong
                            style={{
                                color:
                                    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.inframeColor,
                            }}
                        >
                            Inframe Mutations
                        </strong>
                        {this.props.isPutativeDriver !== undefined && (
                            <span>(putative driver)</span>
                        )}
                        : Inframe deletion, Inframe insertion
                    </li>
                    {this.props.isPutativeDriver !== undefined && (
                        <li>
                            <strong
                                style={{
                                    color:
                                        DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.inframeVusColor,
                                }}
                            >
                                Inframe Mutations
                            </strong>
                            {this.props.isPutativeDriver !== undefined && (
                                <span>(unknown significance)</span>
                            )}
                            : Inframe deletion, Inframe insertion
                        </li>
                    )}
                    <li>
                        <strong
                            style={{
                                color:
                                    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.spliceColor,
                            }}
                        >
                            Splice Mutations
                        </strong>
                        {this.props.isPutativeDriver !== undefined && (
                            <span>(putative driver)</span>
                        )}
                    </li>
                    {this.props.isPutativeDriver !== undefined && (
                        <li>
                            <strong
                                style={{
                                    color:
                                        DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.spliceVusColor,
                                }}
                            >
                                Splice Mutations
                            </strong>
                            {this.props.isPutativeDriver !== undefined && (
                                <span>(unknown significance)</span>
                            )}
                        </li>
                    )}
                    <li>
                        <strong
                            style={{
                                color:
                                    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.fusionColor,
                            }}
                        >
                            Fusion Mutations
                        </strong>
                    </li>
                    <li>
                        <strong
                            style={{
                                color:
                                    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS.otherColor,
                            }}
                        >
                            Other Mutations
                        </strong>
                        : All other types of mutations
                    </li>
                </ul>
            </div>
        </div>
    );

    protected getTrackDataStatus(): TrackDataStatus {
        let oncoKbDataStatus: 'pending' | 'error' | 'complete' | 'empty' = this
            .props.store.oncoKbData.status;

        if (
            oncoKbDataStatus === 'complete' &&
            _.isEmpty(this.props.store.oncoKbDataByProteinPosStart)
        ) {
            oncoKbDataStatus = 'empty';
        }

        let hotspotDataStatus: 'pending' | 'error' | 'complete' | 'empty' = this
            .props.store.indexedHotspotData.status;

        if (
            hotspotDataStatus === 'complete' &&
            // TODO temporary workaround for initial load time, and filtering performance
            //  the this.props.store.hotspotsByPosition seems very costly,
            //  we can re-enable it if we can optimize the function
            // _.isEmpty(this.props.store.hotspotsByPosition)
            _.isEmpty(this.props.store.indexedHotspotData.result)
        ) {
            hotspotDataStatus = 'empty';
        }

        let alignmentDataStatus:
            | 'pending'
            | 'error'
            | 'complete'
            | 'empty' = this.props.store.alignmentData.status;

        if (
            alignmentDataStatus === 'complete' &&
            this.props.store.pdbChainDataStore.allData.length === 0
        ) {
            alignmentDataStatus = 'empty';
        }

        const ptmDataStatus: 'pending' | 'error' | 'complete' | 'empty' = this
            .props.store.ptmData.status;

        let dbPtmDataStatus:
            | 'pending'
            | 'error'
            | 'complete'
            | 'empty' = ptmDataStatus;
        let uniprotPtmDataStatus:
            | 'pending'
            | 'error'
            | 'complete'
            | 'empty' = ptmDataStatus;

        if (ptmDataStatus === 'complete') {
            if (!this.props.store.ptmData.result) {
                dbPtmDataStatus = 'empty';
                uniprotPtmDataStatus = 'empty';
            } else {
                if (
                    this.props.store.ptmData.result.filter(
                        d => d.source === PtmSource.dbPTM
                    ).length === 0
                ) {
                    dbPtmDataStatus = 'empty';
                }
                if (
                    this.props.store.ptmData.result.filter(
                        d => d.source === PtmSource.Uniprot
                    ).length === 0
                ) {
                    uniprotPtmDataStatus = 'empty';
                }
            }
        }

        let uniprotTopologyDataStatus:
            | 'pending'
            | 'error'
            | 'complete'
            | 'empty' = this.props.store.uniprotTopologyData.status;
        if (uniprotTopologyDataStatus === 'complete') {
            if (this.props.store.uniprotTopologyData.result?.length === 0) {
                uniprotTopologyDataStatus = 'empty';
            }
        }

        return {
            [TrackName.OncoKB]: oncoKbDataStatus,
            [TrackName.CancerHotspots]: hotspotDataStatus,
            [TrackName.dbPTM]: dbPtmDataStatus,
            [TrackName.UniprotPTM]: uniprotPtmDataStatus,
            [TrackName.PDB]: alignmentDataStatus,
            [TrackName.Exon]: 'complete',
            [TrackName.UniprotTopology]: uniprotTopologyDataStatus,
        };
    }

    protected getWindowWrapper() {
        return WindowStore;
    }

    @computed get is3dPanelOpen() {
        return this.trackVisibility[TrackName.PDB] === 'visible';
    }

    // No default implementation, child classes should override this
    // TODO provide a generic version of this? See ResultsViewMutationMapper.mutationRateSummary
    protected getMutationRateSummary(): JSX.Element | null {
        return null;
    }

    @computed get multipleMutationInfo(): string {
        const count = (this.props.store.dataStore as MutationMapperDataStore)
            .duplicateMutationCountInMultipleSamples;
        const mutationsLabel = count === 1 ? 'mutation' : 'mutations';

        return count > 0
            ? `: includes ${count} duplicate ${mutationsLabel} in patients with multiple samples`
            : '';
    }

    @computed get itemsLabelPlural(): string {
        return `Mutations${this.multipleMutationInfo}`;
    }

    @computed
    public get proteinImpactTypeFilter() {
        return findProteinImpactTypeFilter(this.store.dataStore.dataFilters);
    }

    @computed get annotatedProteinImpactTypeFilter() {
        return this.store.dataStore.dataFilters.find(
            filter => filter.type === ANNOTATED_PROTEIN_IMPACT_FILTER_TYPE
        );
    }

    /**
     * Overriding the parent method to have a customized filter panel.
     */
    protected get mutationFilterPanel(): JSX.Element | null {
        return (
            <div>
                {this.props.isPutativeDriver ? (
                    <div
                        style={{
                            paddingBottom: this.props.compactStyle ? 5 : 15,
                        }}
                    >
                        <DriverAnnotationProteinImpactTypeBadgeSelector
                            filter={this.proteinImpactTypeFilter}
                            counts={this.mutationCountsByProteinImpactType}
                            onSelect={this.onProteinImpactTypeSelect}
                            onClickSettingMenu={this.props.onClickSettingMenu}
                            annotatedProteinImpactTypeFilter={
                                this.annotatedProteinImpactTypeFilter
                            }
                        />
                    </div>
                ) : (
                    <div
                        style={{
                            paddingBottom: 15,
                            paddingTop: 15,
                        }}
                    >
                        <ProteinImpactTypeBadgeSelector
                            filter={this.proteinImpactTypeFilter}
                            counts={this.mutationCountsByProteinImpactType}
                            onSelect={this.onProteinImpactTypeSelect}
                        />
                    </div>
                )}
            </div>
        );
    }

    protected groupDataByProteinImpactType(sortedFilteredData: any[]) {
        const filters = Object.values(ProteinImpactType).map(value => ({
            group: value,
            filter: {
                type: DataFilterType.PROTEIN_IMPACT_TYPE,
                values: [value],
            },
        }));

        // Use customized filter for putative driver annotation
        const groupedData = groupDataByGroupFilters(
            filters,
            sortedFilteredData,
            createAnnotatedProteinImpactTypeFilter(this.props.isPutativeDriver)
        );

        return _.keyBy(groupedData, d => d.group);
    }

    @computed
    protected get mutationsGroupedByProteinImpactType() {
        // there are two types of filters (with putative driver, without putative driver)
        const filtersWithoutProteinImpactTypeFilter = this.store.dataStore.dataFilters.filter(
            f =>
                f.type !== DataFilterType.PROTEIN_IMPACT_TYPE &&
                f.type !== ANNOTATED_PROTEIN_IMPACT_FILTER_TYPE
        );

        // apply filters excluding the protein impact type filters
        // this prevents number of unchecked protein impact types from being counted as zero
        let sortedFilteredData = applyDataFilters(
            this.store.dataStore.allData,
            filtersWithoutProteinImpactTypeFilter,
            this.store.dataStore.applyFilter
        );

        // also apply lazy mobx table search filter
        sortedFilteredData = sortedFilteredData.filter(m =>
            (this.store
                .dataStore as MutationMapperDataStore).applyLazyMobXTableFilter(
                m
            )
        );

        return this.groupDataByProteinImpactType(sortedFilteredData);
    }

    @computed
    public get mutationCountsByProteinImpactType(): {
        [proteinImpactType: string]: number;
    } {
        const map: { [proteinImpactType: string]: number } = {};

        Object.keys(this.mutationsGroupedByProteinImpactType).forEach(
            proteinImpactType => {
                const g = this.mutationsGroupedByProteinImpactType[
                    proteinImpactType
                ];
                map[g.group] = g.data.length;
            }
        );
        return map;
    }

    protected get structureViewerPanel(): JSX.Element | null {
        return this.is3dPanelOpen ? (
            <StructureViewerPanel
                mutationDataStore={
                    this.props.store.dataStore as MutationMapperDataStore
                }
                pdbChainDataStore={this.props.store.pdbChainDataStore}
                pdbAlignmentIndex={this.props.store.indexedAlignmentData}
                pdbHeaderCache={this.props.pdbHeaderCache}
                residueMappingCache={this.props.store.residueMappingCache}
                uniprotId={this.props.store.uniprotId.result}
                onClose={this.close3dPanel}
                {...DEFAULT_PROTEIN_IMPACT_TYPE_COLORS}
            />
        ) : null;
    }

    protected get mutationPlot(): JSX.Element | null {
        return (
            <LollipopMutationPlot
                store={this.props.store}
                pubMedCache={this.props.pubMedCache}
                mutationAlignerCache={this.mutationAlignerCache}
                onXAxisOffset={this.onXAxisOffset}
                geneWidth={this.geneWidth}
                tracks={this.tracks}
                trackVisibility={this.trackVisibility}
                trackDataStatus={this.trackDataStatus}
                onTrackVisibilityChange={this.onTrackVisibilityChange}
                getLollipopColor={mutations =>
                    getColorForProteinImpactType(
                        mutations,
                        undefined,
                        undefined,
                        this.props.isPutativeDriver
                    )
                }
                isPutativeDriver={this.props.isPutativeDriver}
                filterResetPanel={
                    !(this.props.store.dataStore as MutationMapperDataStore)
                        .showingAllData && this.filterResetPanel !== null
                        ? this.filterResetPanel
                        : undefined
                }
                legend={this.legendColorCodes}
                showDownloadControls={
                    !getServerConfig().skin_hide_download_controls
                }
            />
        );
    }

    @computed
    protected get tracks(): TrackName[] {
        const tracks: TrackName[] = [];

        if (this.props.enableHotspot) {
            tracks.push(TrackName.CancerHotspots);
        }

        if (this.props.enableOncoKb) {
            tracks.push(TrackName.OncoKB);
        }

        if (this.props.ptmSources) {
            if (this.props.ptmSources.includes(PtmSource.dbPTM)) {
                tracks.push(TrackName.dbPTM);
            }
            if (this.props.ptmSources.includes(PtmSource.Uniprot)) {
                tracks.push(TrackName.UniprotPTM);
            }
        } else {
            tracks.push(TrackName.dbPTM);
        }
        tracks.push(TrackName.Exon);
        tracks.push(TrackName.UniprotTopology);
        tracks.push(TrackName.PDB);

        return tracks;
    }

    protected get proteinChainPanel(): JSX.Element | null {
        return this.is3dPanelOpen ? (
            <ProteinChainPanel
                store={this.props.store}
                pdbHeaderCache={this.props.pdbHeaderCache}
                geneWidth={this.geneWidth}
                geneXOffset={this.lollipopPlotGeneX}
                maxChainsHeight={200}
            />
        ) : null;
    }

    protected get view3dButton(): JSX.Element | null {
        return (
            <button
                className="btn btn-default btn-sm"
                disabled={
                    this.props.store.pdbChainDataStore.allData.length === 0
                }
                onClick={this.toggle3dPanel}
                data-test="view3DStructure"
            >
                View 3D Structure
            </button>
        );
    }

    protected get filterResetPanel(): JSX.Element | null {
        const dataStore = this.props.store.dataStore as MutationMapperDataStore;

        return (
            <FilterResetPanel
                resetFilters={() => dataStore.resetFilters()}
                filterInfo={`Showing ${dataStore.tableData.length} of ${dataStore.allData.length} mutations.`}
                className={classnames(
                    'alert',
                    'alert-success',
                    styles.filterResetPanel
                )}
                buttonClass="btn btn-default btn-xs"
            />
        );
    }

    protected get isMutationTableDataLoading() {
        // Child classes should override this method
        return false;
    }

    protected get mutationTableComponent(): JSX.Element | null {
        // Child classes should override this method to return an instance of MutationTable
        return null;
    }

    public render() {
        return (
            <div>
                {this.structureViewerPanel}

                <LoadingIndicator
                    center={true}
                    size="big"
                    isLoading={this.isLoading}
                />
                {!this.isLoading && (
                    <div>
                        <div style={{ display: 'flex' }}>
                            <div
                                className="borderedChart"
                                style={{ marginRight: 10 }}
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
                        <hr style={{ marginTop: 20 }} />
                        {this.mutationTable}
                    </div>
                )}
            </div>
        );
    }

    @action
    protected open3dPanel() {
        this.trackVisibility[TrackName.PDB] = 'visible';
    }

    @action.bound
    protected close3dPanel() {
        this.trackVisibility[TrackName.PDB] = 'hidden';
    }

    @action.bound
    protected toggle3dPanel() {
        if (this.is3dPanelOpen) {
            this.close3dPanel();
        } else {
            this.open3dPanel();
        }
    }

    @action.bound
    protected onTrackVisibilityChange(selectedTrackNames: string[]) {
        // 3D panel is toggled to open
        if (
            this.trackVisibility[TrackName.PDB] === 'hidden' &&
            selectedTrackNames.includes(TrackName.PDB)
        ) {
            this.open3dPanel();
        }
        // 3D panel is toggled to close
        else if (
            this.trackVisibility[TrackName.PDB] === 'visible' &&
            !selectedTrackNames.includes(TrackName.PDB)
        ) {
            this.close3dPanel();
        }

        // clear visibility
        Object.keys(this.trackVisibility).forEach(
            trackName => (this.trackVisibility[trackName] = 'hidden')
        );

        // reset visibility values for the visible ones
        selectedTrackNames.forEach(
            trackName => (this.trackVisibility[trackName] = 'visible')
        );
    }

    @action.bound
    protected onProteinImpactTypeSelect(
        selectedMutationTypeIds: string[],
        allValuesSelected: boolean
    ) {
        // use different filters when putative driver annotation setting changes
        onFilterOptionSelect(
            selectedMutationTypeIds.map(v => v.toLowerCase()),
            allValuesSelected,
            this.store.dataStore,
            this.props.isPutativeDriver === undefined
                ? DataFilterType.PROTEIN_IMPACT_TYPE
                : ANNOTATED_PROTEIN_IMPACT_FILTER_TYPE,
            this.props.isPutativeDriver === undefined
                ? PROTEIN_IMPACT_TYPE_FILTER_ID
                : ANNOTATED_PROTEIN_IMPACT_TYPE_FILTER_ID
        );
    }
}
