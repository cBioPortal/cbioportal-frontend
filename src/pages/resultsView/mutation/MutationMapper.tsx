import * as React from 'react';
import {observer} from "mobx-react";
import {Button, ButtonGroup} from 'react-bootstrap';
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import StructureViewerPanel from "shared/components/structureViewer/StructureViewerPanel";
import DiscreteCNACache from "shared/cache/DiscreteCNACache";
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

export interface IMutationMapperConfig {
    showCivic?: boolean;
    showHotspot?: boolean;
    showMyCancerGenome?: boolean;
    showOncoKB?: boolean;
}

export interface IMutationMapperProps {
    store: MutationMapperStore;
    config: IMutationMapperConfig;
    studyId?: string;
    myCancerGenomeData?: IMyCancerGenomeData;
    discreteCNACache?:DiscreteCNACache;
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
        return (
            <div>
                {this.props.store.gene.result && this.props.store.gene.result.length > 0 && (
                    <h4>{this.props.store.gene.result.hugoGeneSymbol}</h4>
                )}
            </div>
        );
    }

    @computed get mutationRateSummary():JSX.Element|null {
        if (this.props.store.gene.result &&
            this.props.store.gene.result.length > 0 &&
            this.props.store.patientIds.result &&
            this.props.store.patientIds.result.length > 0 &&
            this.props.store.mutationData.isComplete &&
            this.props.store.mutationData.result.length > 0 &&
            this.props.store.mskImpactGermlineConsentedPatientIds.result &&
            this.props.store.mskImpactGermlineConsentedPatientIds.isComplete) {
            return <MutationRateSummary
                        hugoGeneSymbol={this.props.store.gene.result.hugoGeneSymbol}
                        mutations={this.props.store.mutationData.result}
                        patientIds={this.props.store.patientIds.result}
                        mskImpactGermlineConsentedPatientIds={this.props.store.mskImpactGermlineConsentedPatientIds.result}
                    />
        } else {
            return null;
        }
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
                            pdbPositionMappingCache={this.props.store.pdbPositionMappingCache}
                            onClose={this.close3dPanel}
                            {...DEFAULT_PROTEIN_IMPACT_TYPE_COLORS}
                        />
                    )
                }

                <LoadingIndicator isLoading={this.props.store.mutationData.isPending || this.props.store.gene.isPending} />
                {
                    (this.props.store.mutationData.isComplete && this.props.store.gene.result) && (
                        <div>
                            <LoadingIndicator isLoading={this.props.store.pfamGeneData.isPending} />
                            { (!this.props.store.pfamGeneData.isPending) && (
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

                                <div>
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
                                    studyId={this.props.studyId}
                                    sampleIdToTumorType={this.props.store.sampleIdToTumorType}
                                    discreteCNACache={this.props.discreteCNACache}
                                    oncoKbEvidenceCache={this.props.oncoKbEvidenceCache}
                                    pubMedCache={this.props.pubMedCache}
                                    mutationCountCache={this.props.mutationCountCache}
                                    dataStore={this.props.store.dataStore}
                                    myCancerGenomeData={this.props.myCancerGenomeData}
                                    hotspots={this.props.store.indexedHotspotData}
                                    cosmicData={this.props.store.cosmicData.result}
                                    oncoKbData={this.props.store.oncoKbData}
                                    civicGenes={this.props.store.civicGenes.result}
                                    civicVariants={this.props.store.civicVariants.result}
                                    enableOncoKb={this.props.config.showOncoKB}
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
