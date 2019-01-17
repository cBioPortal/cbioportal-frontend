import * as React from "react";
import {observer} from "mobx-react";
import EnrichmentsDataSetDropdown from "../resultsView/enrichments/EnrichmentsDataSetDropdown";
import AlterationEnrichmentContainer from "../resultsView/enrichments/AlterationEnrichmentsContainer";
import GroupComparisonStore from "./GroupComparisonStore";
import autobind from "autobind-decorator";
import {MolecularProfile} from "../../shared/api/generated/CBioPortalAPI";
import {MakeMobxView} from "../../shared/components/MobxView";
import Loader from "../../shared/components/loadingIndicator/LoadingIndicator";
import ErrorMessage from "../../shared/components/ErrorMessage";

export interface ICopyNumberEnrichmentsProps {
    store: GroupComparisonStore
}

@observer
export default class CopyNumberEnrichments extends React.Component<ICopyNumberEnrichmentsProps, {}> {
    @autobind
    private onChangeProfile(m:MolecularProfile) {
        this.props.store.copyNumberEnrichmentProfile = m;
    }

    readonly tabUI = MakeMobxView({
        await:()=>[
            this.props.store.copyNumberHomdelEnrichmentData,
            this.props.store.copyNumberAmpEnrichmentData
        ],
        forcePending:()=>!this.props.store.copyNumberEnrichmentProfile,
        render:()=>{
            return (
                <div data-test="GroupComparisonCopyNumberEnrichments">
                    <EnrichmentsDataSetDropdown dataSets={this.props.store.copyNumberEnrichmentProfiles} onChange={this.onChangeProfile}
                                                selectedValue={this.props.store.copyNumberEnrichmentProfile!.molecularProfileId}/>
                    <AlterationEnrichmentContainer data={this.props.store.copyNumberHomdelEnrichmentData.result!}
                                                   totalAlteredCount={this.props.store.enrichmentsGroup1!.sampleIdentifiers.length}
                                                   totalUnalteredCount={this.props.store.enrichmentsGroup2!.sampleIdentifiers.length}
                                                   alteredGroupName={this.props.store.enrichmentsGroup1!.name}
                                                   unalteredGroupName={this.props.store.enrichmentsGroup2!.name}
                                                   selectedProfile={this.props.store.copyNumberEnrichmentProfile!}
                                                   headerName={"Deep Deletion - " + this.props.store.copyNumberEnrichmentProfile!.name}
                                                   alterationType="a deep deletion"/>
                    <hr />
                    <AlterationEnrichmentContainer data={this.props.store.copyNumberAmpEnrichmentData.result!}
                                                   totalAlteredCount={this.props.store.enrichmentsGroup1!.sampleIdentifiers.length}
                                                   totalUnalteredCount={this.props.store.enrichmentsGroup2!.sampleIdentifiers.length}
                                                   alteredGroupName={this.props.store.enrichmentsGroup1!.name}
                                                   unalteredGroupName={this.props.store.enrichmentsGroup2!.name}
                                                   selectedProfile={this.props.store.copyNumberEnrichmentProfile!}
                                                   headerName={"Amplification - " + this.props.store.copyNumberEnrichmentProfile!.name}
                                                   alterationType="an amplification"/>
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