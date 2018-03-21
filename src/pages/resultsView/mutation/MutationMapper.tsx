import * as React from 'react';
import {observer} from "mobx-react";
import {Button, ButtonGroup} from 'react-bootstrap';
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import StructureViewerPanel from "shared/components/structureViewer/StructureViewerPanel";
import DiscreteCNACache from "shared/cache/DiscreteCNACache";
import GenomeNexusEnrichmentCache from "shared/cache/GenomeNexusEnrichment";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import PubMedCache from "shared/cache/PubMedCache";
import CancerTypeCache from "shared/cache/CancerTypeCache";
import MutationCountCache from "shared/cache/MutationCountCache";
import {IMyCancerGenomeData} from "shared/model/MyCancerGenome";
import PdbHeaderCache from "shared/cache/PdbHeaderCache";
import {DEFAULT_PROTEIN_IMPACT_TYPE_COLORS} from "shared/lib/MutationUtils";
import {MutationMapperStore} from "./MutationMapperStore";
import ResultsViewMutationTable from "./ResultsViewMutationTable";
import LollipopMutationPlot from "../../../shared/components/lollipopMutationPlot/LollipopMutationPlot";
import ProteinImpactTypePanel from "../../../shared/components/mutationTypePanel/ProteinImpactTypePanel";
import ProteinChainPanel from "../../../shared/components/proteinChainPanel/ProteinChainPanel";
import {computed, action, observable} from "mobx";
import MutationRateSummary from "pages/resultsView/mutation/MutationRateSummary";

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
    discreteCNACache?:DiscreteCNACache;
    genomeNexusEnrichmentCache?:GenomeNexusEnrichmentCache;
    oncoKbEvidenceCache?:OncoKbEvidenceCache;
    cancerTypeCache?:CancerTypeCache;
    mutationCountCache?:MutationCountCache;
    pdbHeaderCache?: PdbHeaderCache;
    pubMedCache?:PubMedCache;
}

@observer
export default class MutationMapper extends React.Component<IMutationMapperProps, {}>
{
    @observable protected is3dPanelOpen = false;
    @observable lollipopPlotGeneX:number = 0;
    @observable geneWidth:number = 665;

    private handlers:any;

    constructor(props: IMutationMapperProps) {
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
                    <span>UniProt: </span>
                    <a
                        href={`http://www.uniprot.org/uniprot/${uniprotId}`}
                        target="_blank"
                    >
                        {uniprotId}
                    </a>
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

    @computed get mutationRateSummary():JSX.Element|null {
        // TODO we should not be even calculating mskImpactGermlineConsentedPatientIds for studies other than msk impact
        if (this.props.store.germlineConsentedSamples.result &&
            this.props.store.mutationData.isComplete &&
            this.props.store.mutationData.result.length > 0) {
            return (
                <MutationRateSummary
                    hugoGeneSymbol={this.props.store.gene.hugoGeneSymbol}
                    molecularProfileIdToMolecularProfile={this.props.store.molecularProfileIdToMolecularProfile}
                    mutations={this.props.store.mutationData.result}
                    samples={this.props.store.samples.result!}
                    germlineConsentedSamples={this.props.store.germlineConsentedSamples}
                />
            );
        } else {
            return null;
        }
    }

    @computed get multipleMutationInfo(): string {
        const count = this.props.store.dataStore.duplicateMutationCountInMultipleSamples;
        const mutationsLabel = count === 1 ? "mutation" : "mutations";

        return count > 0 ? `: includes ${count} duplicate ${mutationsLabel} in patients with multiple samples` : "";
    }

    @computed get itemsLabelPlural(): string {
        return `Mutations${this.multipleMutationInfo}`;
    }

    public render() {

        return (
            <div>
                {
                    (this.is3dPanelOpen) && (
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
                    )
                }

                <LoadingIndicator isLoading={this.props.store.mutationData.isPending} />
                {
                    (!this.props.store.mutationData.isPending) && (
                    <div>
                        <LoadingIndicator isLoading={this.props.store.pfamDomainData.isPending} />
                        { (!this.props.store.pfamDomainData.isPending) && (
                        <div style={{ display:'flex' }}>
                            <div className="borderedChart" style={{ marginRight:10 }}>

                                <LollipopMutationPlot
                                    store={this.props.store}
                                    onXAxisOffset={this.handlers.onXAxisOffset}
                                    geneWidth={this.geneWidth}
                                    {...DEFAULT_PROTEIN_IMPACT_TYPE_COLORS}
                                />
                                <ProteinChainPanel
                                    store={this.props.store}
                                    pdbHeaderCache={this.props.pdbHeaderCache}
                                    geneWidth={this.geneWidth}
                                    geneXOffset={this.lollipopPlotGeneX}
                                    maxChainsHeight={200}
                                />
                            </div>

                            <div className="mutationMapperMetaColumn">
                                {this.geneSummary}

                                {this.mutationRateSummary}

                                <div>
                                    <ProteinImpactTypePanel
                                        dataStore={this.props.store.dataStore}
                                        {...DEFAULT_PROTEIN_IMPACT_TYPE_COLORS}
                                    />
                                </div>

                                <button
                                    className="btn btn-default btn-sm"
                                    disabled={this.props.store.pdbChainDataStore.allData.length === 0}
                                    onClick={this.toggle3dPanel}
                                >
                                    View 3D Structure
                                </button>
                            </div>
                        </div>
                        ) }
                        <hr style={{ marginTop:20 }} />

                            {!this.props.store.dataStore.showingAllData &&
                                (<div style={{
                                    marginTop:"5px",
                                    marginBottom:"5px"
                                }}>
                                    <span style={{color:"red", fontSize:"14px", fontFamily:"verdana,arial,sans-serif"}}>
                                        <span>Current view shows filtered results. Click </span>
                                        <a style={{cursor:"pointer"}} onClick={this.handlers.resetDataStore}>here</a>
                                        <span> to reset all filters.</span>
                                    </span>
                                </div>)
                            }
                            <LoadingIndicator
                                isLoading={
                                    this.props.store.clinicalDataForSamples.isPending ||
                                    this.props.store.studiesForSamplesWithoutCancerTypeClinicalData.isPending
                                }
                            />
                            {!this.props.store.clinicalDataForSamples.isPending &&
                            !this.props.store.studiesForSamplesWithoutCancerTypeClinicalData.isPending && (
                                <ResultsViewMutationTable
                                    uniqueSampleKeyToTumorType={this.props.store.uniqueSampleKeyToTumorType}
                                    oncoKbAnnotatedGenes={this.props.store.oncoKbAnnotatedGenes}
                                    discreteCNACache={this.props.discreteCNACache}
                                    studyIdToStudy={this.props.store.studyIdToStudy.result}
                                    genomeNexusEnrichmentCache={this.props.genomeNexusEnrichmentCache}
                                    molecularProfileIdToMolecularProfile={this.props.store.molecularProfileIdToMolecularProfile.result}
                                    oncoKbEvidenceCache={this.props.oncoKbEvidenceCache}
                                    pubMedCache={this.props.pubMedCache}
                                    mutationCountCache={this.props.mutationCountCache}
                                    dataStore={this.props.store.dataStore}
                                    itemsLabelPlural={this.itemsLabelPlural}
                                    downloadDataFetcher={this.props.store.downloadDataFetcher}
                                    myCancerGenomeData={this.props.myCancerGenomeData}
                                    hotspotData={this.props.store.indexedHotspotData}
                                    cosmicData={this.props.store.cosmicData.result}
                                    oncoKbData={this.props.store.oncoKbData}
                                    civicGenes={this.props.store.civicGenes}
                                    civicVariants={this.props.store.civicVariants}
                                    userEmailAddress={this.props.config.userEmailAddress}
                                    enableOncoKb={this.props.config.showOncoKB}
                                    enableFunctionalImpact={this.props.config.showGenomeNexus}
                                    enableHotspot={this.props.config.showHotspot}
                                    enableMyCancerGenome={this.props.config.showMyCancerGenome}
                                    enableCivic={this.props.config.showCivic}
                                />
                            )}
                        </div>
                    )
                }
            </div>
        );
    }

    private toggle3dPanel() {
        if (this.is3dPanelOpen) {
            this.close3dPanel();
        } else {
            this.open3dPanel();
        }
    }

    private open3dPanel() {
        this.is3dPanelOpen = true;
        this.props.store.pdbChainDataStore.selectFirstChain();
    }

    private close3dPanel() {
        this.is3dPanelOpen = false;
        this.props.store.pdbChainDataStore.selectUid();
    }
}
