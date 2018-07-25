import * as React from 'react';
import {observer} from "mobx-react";
import {computed, action, observable} from "mobx";

import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import StructureViewerPanel from "shared/components/structureViewer/StructureViewerPanel";
import GenomeNexusEnrichmentCache from "shared/cache/GenomeNexusEnrichment";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import PubMedCache from "shared/cache/PubMedCache";
import {IMyCancerGenomeData} from "shared/model/MyCancerGenome";
import PdbHeaderCache from "shared/cache/PdbHeaderCache";
import {DEFAULT_PROTEIN_IMPACT_TYPE_COLORS} from "shared/lib/MutationUtils";
import LollipopMutationPlot from "shared/components/lollipopMutationPlot/LollipopMutationPlot";
import ProteinImpactTypePanel from "shared/components/mutationTypePanel/ProteinImpactTypePanel";
import ProteinChainPanel from "shared/components/proteinChainPanel/ProteinChainPanel";

import MutationMapperStore from "./MutationMapperStore";

// Anything from App config will be included in mutation mapper config
export interface IMutationMapperConfig {
    userEmailAddress?:string;
    showCivic?: boolean;
    showHotspot?: boolean;
    showMyCancerGenome?: boolean;
    showOncoKB?: boolean;
    showGenomeNexus?: boolean;
    isoformOverrideSource?: string;
}

export interface IMutationMapperProps {
    store: MutationMapperStore;
    config: IMutationMapperConfig;
    studyId?: string;
    myCancerGenomeData?: IMyCancerGenomeData;
    genomeNexusEnrichmentCache?:GenomeNexusEnrichmentCache;
    oncoKbEvidenceCache?:OncoKbEvidenceCache;
    pdbHeaderCache?: PdbHeaderCache;
    pubMedCache?:PubMedCache;
}

@observer
export default class MutationMapper<P extends IMutationMapperProps> extends React.Component<P, {}>
{
    @observable protected is3dPanelOpen = false;
    @observable protected lollipopPlotGeneX = 0;
    @observable protected geneWidth = 665;

    protected handlers:any;

    constructor(props: P) {
        super(props);

        this.open3dPanel = this.open3dPanel.bind(this);
        this.close3dPanel = this.close3dPanel.bind(this);
        this.toggle3dPanel = this.toggle3dPanel.bind(this);
        this.handlers = {
            resetDataStore:()=>{
                this.props.store.dataStore.resetFilterAndSelection();
            },
            onXAxisOffset:action((offset:number)=>{this.lollipopPlotGeneX = offset;})
        };
    }

    @computed get geneSummary():JSX.Element {
        const hugoGeneSymbol = this.props.store.gene.hugoGeneSymbol;
        const uniprotId = this.props.store.uniprotId.result;
        const transcriptId = this.props.store.canonicalTranscript.result &&
            this.props.store.canonicalTranscript.result.transcriptId;

        return (
            <div style={{'paddingBottom':10}}>
                <h4>{hugoGeneSymbol}</h4>
                <div className={this.props.store.uniprotId.result ? '' : 'invisible'}>
                    <span data-test="GeneSummaryUniProt">{'UniProt: '}
                        <a
                            href={`http://www.uniprot.org/uniprot/${uniprotId}`}
                            target="_blank"
                        >
                            {uniprotId}
                        </a>
                    </span>
                </div>
                <div className={this.props.store.canonicalTranscript.result ? '' : 'invisible'}>
                    <span>Transcript: </span>
                    <a
                        href={`http://grch37.ensembl.org/homo_sapiens/Transcript/Summary?t=${transcriptId}`}
                        target="_blank"
                    >
                        {transcriptId}
                    </a>
                </div>
            </div>
        );
    }

    // No default implementation, child classes should override this
    // TODO provide a generic version of this? See ResultsViewMutationMapper.mutationRateSummary
    get mutationRateSummary():JSX.Element|null {
        return null;
    }

    @computed get multipleMutationInfo(): string {
        const count = this.props.store.dataStore.duplicateMutationCountInMultipleSamples;
        const mutationsLabel = count === 1 ? "mutation" : "mutations";

        return count > 0 ? `: includes ${count} duplicate ${mutationsLabel} in patients with multiple samples` : "";
    }

    @computed get itemsLabelPlural(): string {
        return `Mutations${this.multipleMutationInfo}`;
    }

    protected structureViewerPanel(): JSX.Element|null
    {
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
        ): null;
    }

    protected mutationPlot(): JSX.Element|null
    {
        return (
            <LollipopMutationPlot
                store={this.props.store}
                onXAxisOffset={this.handlers.onXAxisOffset}
                geneWidth={this.geneWidth}
                {...DEFAULT_PROTEIN_IMPACT_TYPE_COLORS}
            />
        );
    }

    protected proteinChainPanel(): JSX.Element|null
    {
        return (
            <ProteinChainPanel
                store={this.props.store}
                pdbHeaderCache={this.props.pdbHeaderCache}
                geneWidth={this.geneWidth}
                geneXOffset={this.lollipopPlotGeneX}
                maxChainsHeight={200}
            />
        );
    }


    protected proteinImpactTypePanel(): JSX.Element|null
    {
        return (
            <div>
                <ProteinImpactTypePanel
                    dataStore={this.props.store.dataStore}
                    {...DEFAULT_PROTEIN_IMPACT_TYPE_COLORS}
                />
            </div>
        );
    }

    protected view3dButton(): JSX.Element|null
    {
        return (
            <button
                className="btn btn-default btn-sm"
                disabled={this.props.store.pdbChainDataStore.allData.length === 0}
                onClick={this.toggle3dPanel}
                data-test="view3DStructure"
            >
                View 3D Structure
            </button>
        );
    }

    protected filterResetPanel(): JSX.Element|null
    {
        return (
            <div style={{marginTop:"5px", marginBottom:"5px"}}>
                <span style={{color:"red", fontSize:"14px", fontFamily:"verdana,arial,sans-serif"}}>
                    <span>Current view shows filtered results. Click </span>
                    <a style={{cursor:"pointer"}} onClick={this.handlers.resetDataStore}>here</a>
                    <span> to reset all filters.</span>
                </span>
            </div>
        );
    }

    protected mutationTableComponent(): JSX.Element|null
    {
        // Child classes should override this method to return an instance of MutationTable
        return null;
    }

    protected mutationTable(): JSX.Element|null
    {
        return (
            <span>
                {this.mutationTableComponent()}
            </span>
        );
    }

    public render() {

        return (
            <div>
                {this.structureViewerPanel()}

                <LoadingIndicator isLoading={this.props.store.mutationData.isPending} />
                {
                    (!this.props.store.mutationData.isPending) && (
                    <div>
                        <LoadingIndicator isLoading={this.props.store.pfamDomainData.isPending} />
                        { (!this.props.store.pfamDomainData.isPending) && (
                        <div style={{ display:'flex' }}>
                            <div className="borderedChart" style={{ marginRight:10 }}>
                                {this.mutationPlot()}
                                {this.proteinChainPanel()}
                            </div>

                            <div className="mutationMapperMetaColumn">
                                {this.geneSummary}
                                {this.mutationRateSummary}
                                {this.proteinImpactTypePanel()}
                                {this.view3dButton()}
                            </div>
                        </div>
                        ) }
                        <hr style={{ marginTop:20 }} />

                            {!this.props.store.dataStore.showingAllData &&
                                this.filterResetPanel()
                            }
                            {this.mutationTable()}
                        </div>
                    )
                }
            </div>
        );
    }

    protected toggle3dPanel() {
        if (this.is3dPanelOpen) {
            this.close3dPanel();
        } else {
            this.open3dPanel();
        }
    }

    protected open3dPanel() {
        this.is3dPanelOpen = true;
        this.props.store.pdbChainDataStore.selectFirstChain();
    }

    protected close3dPanel() {
        this.is3dPanelOpen = false;
        this.props.store.pdbChainDataStore.selectUid();
    }
}
