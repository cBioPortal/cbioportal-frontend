import * as React from "react";
import {observer} from "mobx-react";
import GroupComparisonStore from "./GroupComparisonStore";
import {MolecularProfile} from "../../shared/api/generated/CBioPortalAPI";
import Loader from "../../shared/components/loadingIndicator/LoadingIndicator";
import ErrorMessage from "../../shared/components/ErrorMessage";
import EnrichmentsDataSetDropdown from "../resultsView/enrichments/EnrichmentsDataSetDropdown";
import AlterationEnrichmentContainer from "../resultsView/enrichments/AlterationEnrichmentsContainer";
import autobind from "autobind-decorator";
import {MakeMobxView} from "../../shared/components/MobxView";

export interface IMutationEnrichmentsProps {
    store: GroupComparisonStore
}

@observer
export default class MutationEnrichments extends React.Component<IMutationEnrichmentsProps, {}> {

    @autobind
    private onChangeProfile(m:MolecularProfile) {
        this.props.store.setMutationEnrichmentProfile(m);
    }

    readonly tabUI = MakeMobxView({
        await:()=>[
            this.props.store.mutationEnrichmentData,
            this.props.store.mutationEnrichmentProfile,
            this.props.store.enrichmentsGroup1,
            this.props.store.enrichmentsGroup2
        ],
        render:()=>{
            return (
                <div data-test="GroupComparisonMutationEnrichments">
                    <EnrichmentsDataSetDropdown dataSets={this.props.store.mutationEnrichmentProfiles} onChange={this.onChangeProfile}
                                                selectedValue={this.props.store.mutationEnrichmentProfile.result!.molecularProfileId}/>
                    <AlterationEnrichmentContainer data={this.props.store.mutationEnrichmentData.result!}
                                                   totalAlteredCount={this.props.store.enrichmentsGroup1.result!.sampleIdentifiers.length}
                                                   totalUnalteredCount={this.props.store.enrichmentsGroup2.result!.sampleIdentifiers.length}
                                                   alteredGroupName={this.props.store.enrichmentsGroup1.result!.name}
                                                   unalteredGroupName={this.props.store.enrichmentsGroup2.result!.name}
                                                   selectedProfile={this.props.store.mutationEnrichmentProfile.result!}
                                                   headerName={this.props.store.mutationEnrichmentProfile.result!.name}
                                                   alterationType="a mutation"/>
                </div>
            );
        },
        renderPending:()=><Loader isLoading={true} center={true} size={"big"}/>,
        renderError:()=><ErrorMessage/>
    });

    render() {
        return this.tabUI.component;
    }
}