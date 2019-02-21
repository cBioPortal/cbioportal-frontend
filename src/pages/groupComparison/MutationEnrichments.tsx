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
import { ENRICHMENTS_NOT_2_GROUPS_MSG } from "./GroupComparisonUtils";

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
        await:()=>{
            if (this.props.store.activeComparisonGroups.isComplete &&
                this.props.store.activeComparisonGroups.result.length !== 2) {
                // dont bother loading data for and computing enrichments UI if its not valid situation for it
                return [this.props.store.activeComparisonGroups];
            } else {
                return [this.props.store.activeComparisonGroups, this.enrichmentsUI];
            }
        },
        render:()=>{
            if (this.props.store.activeComparisonGroups.result!.length !== 2) {
                return <span>{ENRICHMENTS_NOT_2_GROUPS_MSG(this.props.store.activeComparisonGroups.result!.length > 2)}</span>;
            } else {
                return this.enrichmentsUI.component;
            }
        },
        renderPending:()=><Loader isLoading={true} center={true} size={"big"}/>,
        renderError:()=><ErrorMessage/>
    });

    readonly enrichmentsUI = MakeMobxView({
        await:()=>[
            this.props.store.mutationEnrichmentData,
            this.props.store.mutationEnrichmentProfile,
            this.props.store.enrichmentsGroup1,
            this.props.store.enrichmentsGroup2,
            this.props.store.activeComparisonGroups
        ],
        render:()=>{
            const group1Name = this.props.store.enrichmentsGroup1.result!.name;
            const group2Name = this.props.store.enrichmentsGroup2.result!.name;
            return (
                <div data-test="GroupComparisonMutationEnrichments">
                    <EnrichmentsDataSetDropdown dataSets={this.props.store.mutationEnrichmentProfiles} onChange={this.onChangeProfile}
                                                selectedValue={this.props.store.mutationEnrichmentProfile.result!.molecularProfileId}/>
                    <AlterationEnrichmentContainer data={this.props.store.mutationEnrichmentData.result!}
                                                   totalGroup1Count={this.props.store.enrichmentsGroup1.result!.sampleIdentifiers.length}
                                                   totalGroup2Count={this.props.store.enrichmentsGroup2.result!.sampleIdentifiers.length}
                                                   group1Name={group1Name}
                                                   group2Name={group2Name}
                                                   group1Description={`in ${group1Name} that have a mutation in the listed gene.`}
                                                   group2Description={`in ${group2Name} that have a mutation in the listed gene.`}
                                                   selectedProfile={this.props.store.mutationEnrichmentProfile.result!}
                                                   headerName={this.props.store.mutationEnrichmentProfile.result!.name}
                                                   showMutexTendencyInTable={false}
                    />
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