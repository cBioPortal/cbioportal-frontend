import * as React from "react";
import {observer} from "mobx-react";
import autobind from "autobind-decorator";
import {MolecularProfile} from "../../shared/api/generated/CBioPortalAPI";
import {MakeMobxView} from "../../shared/components/MobxView";
import EnrichmentsDataSetDropdown from "../resultsView/enrichments/EnrichmentsDataSetDropdown";
import AlterationEnrichmentContainer from "../resultsView/enrichments/AlterationEnrichmentsContainer";
import Loader from "../../shared/components/loadingIndicator/LoadingIndicator";
import ErrorMessage from "../../shared/components/ErrorMessage";
import GroupComparisonStore from "./GroupComparisonStore";
import ExpressionEnrichmentContainer from "../resultsView/enrichments/ExpressionEnrichmentsContainer";

export interface IMRNAEnrichmentsProps {
    store: GroupComparisonStore
}

@observer
export default class MRNAEnrichments extends React.Component<IMRNAEnrichmentsProps, {}> {
    @autobind
    private onChangeProfile(m:MolecularProfile) {
        this.props.store.mRNAEnrichmentProfile = m;
    }

    readonly tabUI = MakeMobxView({
        await:()=>[
            this.props.store.mRNAEnrichmentData,
        ],
        forcePending:()=>!this.props.store.mRNAEnrichmentProfile,
        render:()=>{
            return (
                <div data-test="GroupComparisonMRNAEnrichments">
                    <EnrichmentsDataSetDropdown dataSets={this.props.store.mRNAEnrichmentProfiles} onChange={this.onChangeProfile}
                                                selectedValue={this.props.store.mRNAEnrichmentProfile!.molecularProfileId}/>
                    <ExpressionEnrichmentContainer data={this.props.store.mRNAEnrichmentData.result!}
                                                   alteredGroupName={this.props.store.enrichmentsGroup1!.name}
                                                   unalteredGroupName={this.props.store.enrichmentsGroup2!.name}
                                                   selectedProfile={this.props.store.mRNAEnrichmentProfile!}/>
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