import * as React from 'react';
import {observer} from "mobx-react";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import DiscreteCNACache from "shared/cache/DiscreteCNACache";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import PmidCache from "shared/cache/PmidCache";
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
    pmidCache?:PmidCache;
}

@observer
export default class MutationMapper extends React.Component<IMutationMapperProps, {}>
{
    constructor(props: IMutationMapperProps) {
        super(props);
    }

    public render() {
        return (
            <div>
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
}