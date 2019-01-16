import * as React from "react";
import {observer} from "mobx-react";
import {ResultsViewPageStore} from "../resultsView/ResultsViewPageStore";
import GroupComparisonStore from "./GroupComparisonStore";
import {MolecularProfile} from "../../shared/api/generated/CBioPortalAPI";
import {computed} from "mobx";
import {remoteData} from "../../shared/api/remoteData";
import {makeEnrichmentDataPromise} from "../resultsView/ResultsViewPageStoreUtils";
import internalClient from "../../shared/api/cbioportalInternalClientInstance";
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
        this.props.store.mutationEnrichmentProfile = m;
    }

    readonly tabUI = MakeMobxView({
        await:()=>[
            this.props.store.mutationEnrichmentData,
        ],
        forcePending:()=>!this.props.store.mutationEnrichmentProfile,
        render:()=>{
            return (
                <div data-test="GroupComparisonMutationEnrichments">
                    <EnrichmentsDataSetDropdown dataSets={this.props.store.mutationEnrichmentProfiles} onChange={this.onChangeProfile}
                                                selectedValue={this.props.store.mutationEnrichmentProfile!.molecularProfileId}/>
                    <AlterationEnrichmentContainer data={this.props.store.mutationEnrichmentData.result!}
                                                   totalAlteredCount={this.props.store.enrichmentsGroup1!.sampleIdentifiers.length}
                                                   totalUnalteredCount={this.props.store.enrichmentsGroup2!.sampleIdentifiers.length}
                                                   alteredGroupName={this.props.store.enrichmentsGroup1!.name}
                                                   unalteredGroupName={this.props.store.enrichmentsGroup2!.name}
                                                   selectedProfile={this.props.store.mutationEnrichmentProfile!}
                                                   headerName={this.props.store.mutationEnrichmentProfile!.name}
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