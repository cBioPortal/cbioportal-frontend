import * as React from 'react';
import {observer} from "mobx-react";
import {observable} from "mobx";
import {Button, ButtonGroup} from 'react-bootstrap';
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import StructureViewerPanel from "shared/components/structureViewer/StructureViewerPanel";
import DiscreteCNACache from "shared/cache/DiscreteCNACache";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import PubMedCache from "shared/cache/PubMedCache";
import CancerTypeCache from "shared/cache/CancerTypeCache";
import MutationCountCache from "shared/cache/MutationCountCache";
import {IMyCancerGenomeData} from "shared/model/MyCancerGenome";
import {MutationMapperStore} from "./MutationMapperStore";
import ResultsViewMutationTable from "./ResultsViewMutationTable";
import LollipopMutationPlotWrapper from "../../../shared/components/lollipopMutationPlot/LollipopMutationPlot";

export interface IMutationMapperProps {
    store: MutationMapperStore;
    studyId?: string;
    studyToCancerType?:{[studyId:string]:string};
    myCancerGenomeData?: IMyCancerGenomeData;
    discreteCNACache?:DiscreteCNACache;
    oncoKbEvidenceCache?:OncoKbEvidenceCache;
    cancerTypeCache?:CancerTypeCache;
    mutationCountCache?:MutationCountCache;
    pubMedCache?:PubMedCache;
}

@observer
export default class MutationMapper extends React.Component<IMutationMapperProps, {}>
{
    @observable protected is3dPanelOpen = false;

    constructor(props: IMutationMapperProps) {
        super(props);

        this.open3dPanel = this.open3dPanel.bind(this);
        this.close3dPanel = this.close3dPanel.bind(this);
    }

    public render() {
        return (
            <div>
                {
                    (this.is3dPanelOpen) && (
                        <StructureViewerPanel
                            mutationDataStore={this.props.store.dataStore}
                            pdbChainDataStore={this.props.store.pdbChainDataStore}
                            pdbHeaderCache={this.props.pdbHeaderCache}
                            onClose={this.close3dPanel}
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
                            <LollipopMutationPlotWrapper
                                dataStore={this.props.store.dataStore}
                                entrezGeneId={this.props.store.gene.result.entrezGeneId}
                                hugoGeneSymbol={this.props.store.gene.result.hugoGeneSymbol}
                            />
                            <ResultsViewMutationTable
                                studyId={this.props.studyId}
                                studyToCancerType={this.props.studyToCancerType}
                                discreteCNACache={this.props.discreteCNACache}
                                oncoKbEvidenceCache={this.props.oncoKbEvidenceCache}
                                pubMedCache={this.props.pubMedCache}
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