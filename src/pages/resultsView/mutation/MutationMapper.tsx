import * as React from 'react';
import {observer} from "mobx-react";
import {observable} from "mobx";
import {Button, ButtonGroup} from 'react-bootstrap';
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import StructureViewerPanel from "shared/components/structureViewer/StructureViewerPanel";
import DiscreteCNACache from "shared/cache/DiscreteCNACache";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import PmidCache from "shared/cache/PmidCache";
import CancerTypeCache from "shared/cache/CancerTypeCache";
import MutationCountCache from "shared/cache/MutationCountCache";
import {IMyCancerGenomeData} from "shared/model/MyCancerGenome";
import PdbHeaderCache from "shared/cache/PdbHeaderCache";
import {MutationMapperStore} from "./MutationMapperStore";
import ResultsViewMutationTable from "./ResultsViewMutationTable";
import LollipopMutationPlot from "../../../shared/components/lollipopMutationPlot/LollipopMutationPlot";
import {computed} from "mobx";
import ProteinImpactTypePanel from "../../../shared/components/mutationTypePanel/ProteinImpactTypePanel";

export interface IMutationMapperProps {
    store: MutationMapperStore;
    studyId?: string;
    studyToCancerType?:{[studyId:string]:string};
    myCancerGenomeData?: IMyCancerGenomeData;
    discreteCNACache?:DiscreteCNACache;
    oncoKbEvidenceCache?:OncoKbEvidenceCache;
    cancerTypeCache?:CancerTypeCache;
    mutationCountCache?:MutationCountCache;
    pdbHeaderCache?: PdbHeaderCache;
    pmidCache?:PmidCache;
}

const MISSENSE_COLOR = "#008000";
const TRUNCATING_COLOR = "#000000";
const INFRAME_COLOR = "#8B4513";
const OTHER_COLOR = "#8B00C9";

@observer
export default class MutationMapper extends React.Component<IMutationMapperProps, {}>
{
    @observable protected is3dPanelOpen = false;
    private handlers:any;

    constructor(props: IMutationMapperProps) {
        super(props);

        this.open3dPanel = this.open3dPanel.bind(this);
        this.close3dPanel = this.close3dPanel.bind(this);
        this.handlers = {
            resetDataStore:()=>{
                this.props.store.dataStore.resetFilterAndSelection();
            },
        };
    }

    public render() {
        return (
            <div>
                {
                    (this.is3dPanelOpen) && (
                        // TODO this is a static instance for temporary testing purposes only.
                        // pdbId, chainId and residues should not be static...
                        <StructureViewerPanel
                            pdbId="3pxe"
                            chainId="B"
                            pdbHeaderCache={this.props.pdbHeaderCache}
                            onClose={this.close3dPanel}
                            residues={[
                                {
                                    positionRange: {
                                        start: {
                                            position: 122
                                        },
                                        end: {
                                            position: 122
                                        }
                                    },
                                    color: "#FF0000"
                                },
                                {
                                    positionRange: {
                                        start: {
                                            position: 1710
                                        },
                                        end: {
                                            position: 1710
                                        }
                                    },
                                    color: "#FF0000"
                                },
                                {
                                    positionRange: {
                                        start: {
                                            position: 1835
                                        },
                                        end: {
                                            position: 1835
                                        }
                                    },
                                    color: "#00FFFF"
                                },
                                {
                                    positionRange: {
                                        start: {
                                            position: 1815
                                        },
                                        end: {
                                            position: 1815
                                        }
                                    },
                                    color: "#00FF00",
                                    highlighted: true
                                }
                            ]}
                        />
                    )
                }

                <ButtonGroup className="pull-right">
                    <Button className="btn-sm" onClick={this.open3dPanel}>
                        3D Structure »
                    </Button>
                </ButtonGroup>

                <LoadingIndicator isLoading={this.props.store.mutationData.isPending || this.props.store.gene.isPending} />
                {
                    (this.props.store.mutationData.isComplete && this.props.store.gene.result) && (
                        <div>
                            <LollipopMutationPlot
                                dataStore={this.props.store.dataStore}
                                entrezGeneId={this.props.store.gene.result.entrezGeneId}
                                hugoGeneSymbol={this.props.store.gene.result.hugoGeneSymbol}
                                missenseColor={MISSENSE_COLOR}
                                inframeColor={INFRAME_COLOR}
                                truncatingColor={TRUNCATING_COLOR}
                                otherColor={OTHER_COLOR}
                            />
                            <div style={{marginLeft:"45px", marginTop:"5px", marginBottom:"10px"}}>
                                <ProteinImpactTypePanel
                                    dataStore={this.props.store.dataStore}
                                    missenseColor={MISSENSE_COLOR}
                                    inframeColor={INFRAME_COLOR}
                                    truncatingColor={TRUNCATING_COLOR}
                                    otherColor={OTHER_COLOR}
                                />
                            </div>
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
                            <ResultsViewMutationTable
                                studyId={this.props.studyId}
                                studyToCancerType={this.props.studyToCancerType}
                                discreteCNACache={this.props.discreteCNACache}
                                oncoKbEvidenceCache={this.props.oncoKbEvidenceCache}
                                pmidCache={this.props.pmidCache}
                                cancerTypeCache={this.props.cancerTypeCache}
                                mutationCountCache={this.props.mutationCountCache}
                                dataStore={this.props.store.dataStore}
                                myCancerGenomeData={this.props.myCancerGenomeData}
                                hotspots={this.props.store.indexedHotspotData}
                                cosmicData={this.props.store.cosmicData.result}
                                oncoKbData={this.props.store.oncoKbData.result}
                            />
                    </div>
                    )
                }
            </div>
        );
    }

    private open3dPanel() {
        this.is3dPanelOpen = true;
    }

    private close3dPanel() {
        this.is3dPanelOpen = false;
    }
}