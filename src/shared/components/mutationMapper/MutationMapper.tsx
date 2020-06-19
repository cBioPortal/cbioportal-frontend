import * as React from 'react';
import _ from 'lodash';
import autobind from 'autobind-decorator';
import { observer } from 'mobx-react';
import { action, computed } from 'mobx';
import classnames from 'classnames';
import {
    DataFilterType,
    FilterResetPanel,
    LollipopMutationPlot,
    MutationMapper as DefaultMutationMapper,
    onFilterOptionSelect,
    ProteinImpactTypeBadgeSelector,
    TrackDataStatus,
    TrackName,
    TrackSelector,
    TrackVisibility,
} from 'react-mutation-mapper';

import 'react-mutation-mapper/dist/styles.css';
import 'cbioportal-frontend-commons/dist/styles.css';
import 'react-table/react-table.css';

import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import StructureViewerPanel from 'shared/components/structureViewer/StructureViewerPanel';
import PubMedCache from 'shared/cache/PubMedCache';
import GenomeNexusCache from 'shared/cache/GenomeNexusCache';
import GenomeNexusMutationAssessorCache from 'shared/cache/GenomeNexusMutationAssessorCache';
import PdbHeaderCache from 'shared/cache/PdbHeaderCache';
import {
    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS,
    getColorForProteinImpactType,
} from 'shared/lib/MutationUtils';
import ProteinChainPanel from 'shared/components/proteinChainPanel/ProteinChainPanel';
import MutationMapperStore from './MutationMapperStore';
import {
    findProteinImpactTypeFilter,
    PROTEIN_IMPACT_TYPE_FILTER_ID,
} from './MutationMapperDataStore';
import WindowStore from '../window/WindowStore';

import styles from './mutationMapper.module.scss';

export interface IMutationMapperProps {
    store: MutationMapperStore;
    trackVisibility?: TrackVisibility;
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
}

@observer
export default class MutationMapper<
    P extends IMutationMapperProps
> extends DefaultMutationMapper<P> {
    @computed get trackDataStatus(): TrackDataStatus {
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
            _.isEmpty(this.props.store.hotspotsByPosition)
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

        let ptmDataStatus: 'pending' | 'error' | 'complete' | 'empty' = this
            .props.store.ptmData.status;

        if (
            ptmDataStatus === 'complete' &&
            (!this.props.store.ptmData.result ||
                this.props.store.ptmData.result.length === 0)
        ) {
            ptmDataStatus = 'empty';
        }

        return {
            [TrackName.OncoKB]: oncoKbDataStatus,
            [TrackName.CancerHotspots]: hotspotDataStatus,
            [TrackName.PTM]: ptmDataStatus,
            [TrackName.PDB]: alignmentDataStatus,
        };
    }

    @computed
    protected get windowWrapper() {
        return WindowStore;
    }

    @computed get is3dPanelOpen() {
        return this.trackVisibility[TrackName.PDB] === 'visible';
    }

    // No default implementation, child classes should override this
    // TODO provide a generic version of this? See ResultsViewMutationMapper.mutationRateSummary
    protected get mutationRateSummary(): JSX.Element | null {
        return null;
    }

    @computed get multipleMutationInfo(): string {
        const count = this.props.store.dataStore
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

    /**
     * Overriding the parent method to have a customized filter panel.
     */
    protected get mutationFilterPanel(): JSX.Element | null {
        return (
            <div>
                <div style={{ paddingBottom: 15, paddingTop: 15 }}>
                    <ProteinImpactTypeBadgeSelector
                        filter={this.proteinImpactTypeFilter}
                        counts={this.store.mutationCountsByProteinImpactType}
                        onSelect={this.onProteinImpactTypeSelect}
                    />
                </div>
            </div>
        );
    }

    protected get structureViewerPanel(): JSX.Element | null {
        return this.is3dPanelOpen ? (
            <StructureViewerPanel
                mutationDataStore={this.props.store.dataStore}
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
                onXAxisOffset={this.onXAxisOffset}
                geneWidth={this.geneWidth}
                tracks={this.tracks}
                trackVisibility={this.trackVisibility}
                trackDataStatus={this.trackDataStatus}
                onTrackVisibilityChange={this.onTrackVisibilityChange}
                getLollipopColor={getColorForProteinImpactType}
                filterResetPanel={
                    !this.props.store.dataStore.showingAllData &&
                    this.filterResetPanel !== null
                        ? this.filterResetPanel
                        : undefined
                }
            />
        );
    }

    @computed
    protected get tracks(): TrackName[] {
        const defaultTracks: TrackName[] = TrackSelector.defaultProps.tracks!;

        const conditionalTracks = [
            { name: TrackName.OncoKB, enabled: this.props.enableOncoKb },
            {
                name: TrackName.CancerHotspots,
                enabled: this.props.enableHotspot,
            },
        ];

        // default tracks minus the disabled ones
        return _.without(
            defaultTracks,
            ...conditionalTracks.filter(t => !t.enabled).map(t => t.name)
        );
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
        const dataStore = this.props.store.dataStore;

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

    @autobind
    @action
    protected close3dPanel() {
        this.trackVisibility[TrackName.PDB] = 'hidden';
    }

    @autobind
    @action
    protected toggle3dPanel() {
        if (this.is3dPanelOpen) {
            this.close3dPanel();
        } else {
            this.open3dPanel();
        }
    }

    @autobind
    @action
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

    @autobind
    @action
    protected onProteinImpactTypeSelect(
        selectedMutationTypeIds: string[],
        allValuesSelected: boolean
    ) {
        onFilterOptionSelect(
            selectedMutationTypeIds.map(v => v.toLowerCase()),
            allValuesSelected,
            this.store.dataStore,
            DataFilterType.PROTEIN_IMPACT_TYPE,
            PROTEIN_IMPACT_TYPE_FILTER_ID
        );
    }
}
