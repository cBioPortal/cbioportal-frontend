import * as React from "react";
import {observer} from "mobx-react";
import autobind from "autobind-decorator";
import {MolecularProfile} from "../../shared/api/generated/CBioPortalAPI";
import {MakeMobxView} from "../../shared/components/MobxView";
import EnrichmentsDataSetDropdown from "../resultsView/enrichments/EnrichmentsDataSetDropdown";
import LoadingIndicator from "../../shared/components/loadingIndicator/LoadingIndicator";
import ErrorMessage from "../../shared/components/ErrorMessage";
import GroupComparisonStore from "./GroupComparisonStore";
import ExpressionEnrichmentContainer from "../resultsView/enrichments/ExpressionEnrichmentsContainer";
import {MakeEnrichmentsTabUI} from "./GroupComparisonUtils";

export interface IMRNAEnrichmentsProps {
    store: GroupComparisonStore
}

@observer
export default class MRNAEnrichments extends React.Component<IMRNAEnrichmentsProps, {}> {
    @autobind
    private onChangeProfile(m:MolecularProfile) {
        this.props.store.setMRNAEnrichmentProfile(m);
    }

    readonly tabUI = MakeEnrichmentsTabUI(()=>this.props.store, ()=>this.enrichmentsUI, "mRNA");

    readonly enrichmentsUI = MakeMobxView({
        await:()=>[
            this.props.store.mRNAEnrichmentData,
            this.props.store.mRNAEnrichmentProfile,
            this.props.store.enrichmentsGroup1,
            this.props.store.enrichmentsGroup2
        ],
        render:()=>{
            const group1 = this.props.store.enrichmentsGroup1.result!;
            const group2 = this.props.store.enrichmentsGroup2.result!;
            return (
                <div data-test="GroupComparisonMRNAEnrichments">
                    <EnrichmentsDataSetDropdown dataSets={this.props.store.mRNAEnrichmentProfiles} onChange={this.onChangeProfile}
                                                selectedValue={this.props.store.mRNAEnrichmentProfile.result!.molecularProfileId}/>
                    <ExpressionEnrichmentContainer data={this.props.store.mRNAEnrichmentData.result!}
                                                   group1Name={group1.nameWithOrdinal}
                                                   group2Name={group2.nameWithOrdinal}
                                                   group1Description={`samples in ${group1.nameWithOrdinal}.`}
                                                   group2Description={`samples in ${group2.nameWithOrdinal}.`}
                                                   group1Color={group1.color}
                                                   group2Color={group2.color}
                                                   selectedProfile={this.props.store.mRNAEnrichmentProfile.result!}
                                                   alteredVsUnalteredMode={false}
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