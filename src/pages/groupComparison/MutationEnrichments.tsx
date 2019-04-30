import * as React from "react";
import {observer} from "mobx-react";
import GroupComparisonStore from "./GroupComparisonStore";
import {MolecularProfile} from "../../shared/api/generated/CBioPortalAPI";
import LoadingIndicator from "../../shared/components/loadingIndicator/LoadingIndicator";
import ErrorMessage from "../../shared/components/ErrorMessage";
import EnrichmentsDataSetDropdown from "../resultsView/enrichments/EnrichmentsDataSetDropdown";
import AlterationEnrichmentContainer from "../resultsView/enrichments/AlterationEnrichmentsContainer";
import autobind from "autobind-decorator";
import {MakeMobxView} from "../../shared/components/MobxView";
import {getNumSamples, MakeEnrichmentsTabUI} from "./GroupComparisonUtils";

export interface IMutationEnrichmentsProps {
    store: GroupComparisonStore
}

@observer
export default class MutationEnrichments extends React.Component<IMutationEnrichmentsProps, {}> {

    @autobind
    private onChangeProfile(m:MolecularProfile) {
        this.props.store.setMutationEnrichmentProfile(m);
    }

    readonly tabUI = MakeEnrichmentsTabUI(()=>this.props.store, ()=>this.enrichmentsUI);

    readonly enrichmentsUI = MakeMobxView({
        await:()=>[
            this.props.store.mutationEnrichmentData,
            this.props.store.mutationEnrichmentProfile,
            this.props.store.enrichmentsGroup1,
            this.props.store.enrichmentsGroup2,
        ],
        render:()=>{
            const group1Name = this.props.store.enrichmentsGroup1.result!.name;
            const group2Name = this.props.store.enrichmentsGroup2.result!.name;
            return (
                <div data-test="GroupComparisonMutationEnrichments">
                    <EnrichmentsDataSetDropdown dataSets={this.props.store.mutationEnrichmentProfiles} onChange={this.onChangeProfile}
                                                selectedValue={this.props.store.mutationEnrichmentProfile.result!.molecularProfileId}/>
                    <AlterationEnrichmentContainer data={this.props.store.mutationEnrichmentData.result!}
                                                   totalGroup1Count={getNumSamples(this.props.store.enrichmentsGroup1.result!)}
                                                   totalGroup2Count={getNumSamples(this.props.store.enrichmentsGroup2.result!)}
                                                   group1Name={group1Name}
                                                   group2Name={group2Name}
                                                   group1Description={`in ${group1Name} that have a mutation in the listed gene.`}
                                                   group2Description={`in ${group2Name} that have a mutation in the listed gene.`}
                                                   alteredVsUnalteredMode={false}
                                                   selectedProfile={this.props.store.mutationEnrichmentProfile.result!}
                                                   headerName={this.props.store.mutationEnrichmentProfile.result!.name}
                    />
                </div>
            );
        },
        renderPending:()=><LoadingIndicator center={true} isLoading={true} size={"big"}/>,
        renderError:()=><ErrorMessage/>
    });

    render() {
        return this.tabUI.component;
    }
}