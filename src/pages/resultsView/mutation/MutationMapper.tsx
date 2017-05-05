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

export interface IMutationMapperProps {
    store: MutationMapperStore;
    studyId?: string;
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
                <LoadingIndicator isLoading={this.props.store.mutationData.isPending} />
                {
                    (this.props.store.mutationData.isComplete) && (
                        <ResultsViewMutationTable
                            studyId={this.props.studyId}
                            discreteCNACache={this.props.discreteCNACache}
                            oncoKbEvidenceCache={this.props.oncoKbEvidenceCache}
                            pmidCache={this.props.pmidCache}
                            cancerTypeCache={this.props.cancerTypeCache}
                            mutationCountCache={this.props.mutationCountCache}
                            data={this.props.store.processedMutationData}
                            myCancerGenomeData={this.props.myCancerGenomeData}
                            hotspots={this.props.store.indexedHotspotData}
                            cosmicData={this.props.store.cosmicData.result}
                            oncoKbData={this.props.store.oncoKbData.result}
                        />
                    )
                }
            </div>
        );
    }
}