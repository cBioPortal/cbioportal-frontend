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
import {MakeEnrichmentsTabUI} from "./GroupComparisonUtils";

export interface IProteinEnrichmentsProps {
    store: GroupComparisonStore
}

@observer
export default class ProteinEnrichments extends React.Component<IProteinEnrichmentsProps, {}> {
    @autobind
    private onChangeProfile(m:MolecularProfile) {
        this.props.store.setProteinEnrichmentProfile(m);
    }

    readonly tabUI = MakeEnrichmentsTabUI(()=>this.props.store, ()=>this.enrichmentsUI);

    readonly enrichmentsUI = MakeMobxView({
        await:()=>[
            this.props.store.proteinEnrichmentData,
            this.props.store.proteinEnrichmentProfile,
            this.props.store.enrichmentsGroup1,
            this.props.store.enrichmentsGroup2
        ],
        render:()=>{
            const group1Name = this.props.store.enrichmentsGroup1.result!.nameWithOrdinal;
            const group2Name = this.props.store.enrichmentsGroup2.result!.nameWithOrdinal;
            return (
                <div data-test="GroupComparisonProteinEnrichments">
                    <EnrichmentsDataSetDropdown dataSets={this.props.store.proteinEnrichmentProfiles} onChange={this.onChangeProfile}
                                                selectedValue={this.props.store.proteinEnrichmentProfile.result!.molecularProfileId}/>
                    <ExpressionEnrichmentContainer data={this.props.store.proteinEnrichmentData.result!}
                                                   group1Name={group1Name}
                                                   group2Name={group2Name}
                                                   group1Description={`samples in ${group1Name}.`}
                                                   group2Description={`samples in ${group2Name}.`}
                                                   selectedProfile={this.props.store.proteinEnrichmentProfile.result!}
                                                   alteredVsUnalteredMode={false}
                    />
                </div>
            );
        },
        renderPending:()=><Loader center={true} isLoading={true} size={"big"}/>,
        renderError:()=><ErrorMessage/>
    });

    render() {
        return this.tabUI.component;
    }
}