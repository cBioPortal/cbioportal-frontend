import * as React from "react";
import {observer} from "mobx-react";
import autobind from "autobind-decorator";
import {MolecularProfile} from "../../shared/api/generated/CBioPortalAPI";
import {MakeMobxView} from "../../shared/components/MobxView";
import EnrichmentsDataSetDropdown from "../resultsView/enrichments/EnrichmentsDataSetDropdown";
import ExpressionEnrichmentContainer from "../resultsView/enrichments/ExpressionEnrichmentsContainer";
import Loader from "../../shared/components/loadingIndicator/LoadingIndicator";
import ErrorMessage from "../../shared/components/ErrorMessage";
import GroupComparisonStore from "./GroupComparisonStore";

export interface IProteinEnrichmentsProps {
    store: GroupComparisonStore
}

@observer
export default class ProteinEnrichments extends React.Component<IProteinEnrichmentsProps, {}> {
    @autobind
    private onChangeProfile(m:MolecularProfile) {
        this.props.store.proteinEnrichmentProfile = m;
    }

    readonly tabUI = MakeMobxView({
        await:()=>[
            this.props.store.proteinEnrichmentData,
        ],
        forcePending:()=>!this.props.store.proteinEnrichmentProfile,
        render:()=>{
            return (
                <div data-test="GroupComparisonProteinEnrichments">
                    <EnrichmentsDataSetDropdown dataSets={this.props.store.proteinEnrichmentProfiles} onChange={this.onChangeProfile}
                                                selectedValue={this.props.store.proteinEnrichmentProfile!.molecularProfileId}/>
                    <ExpressionEnrichmentContainer data={this.props.store.proteinEnrichmentData.result!}
                                                   alteredGroupName={this.props.store.enrichmentsGroup1!.name}
                                                   unalteredGroupName={this.props.store.enrichmentsGroup2!.name}
                                                   selectedProfile={this.props.store.proteinEnrichmentProfile!}/>
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