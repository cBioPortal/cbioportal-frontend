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
import { ENRICHMENTS_NOT_2_GROUPS_MSG, ENRICHMENTS_TOO_MANY_STUDIES_MSG } from "./GroupComparisonUtils";

export interface IProteinEnrichmentsProps {
    store: GroupComparisonStore
}

@observer
export default class ProteinEnrichments extends React.Component<IProteinEnrichmentsProps, {}> {
    @autobind
    private onChangeProfile(m:MolecularProfile) {
        this.props.store.setProteinEnrichmentProfile(m);
    }

    readonly tabUI = MakeMobxView({
        await:()=>{
            const ret = [this.props.store.activeGroups, this.props.store.activeStudyIds];
            if ((this.props.store.activeGroups.isComplete &&
                this.props.store.activeGroups.result.length !== 2) ||
                (this.props.store.activeStudyIds.isComplete && this.props.store.activeStudyIds.result.length > 1)) {
                // dont bother loading data for and computing enrichments UI if its not valid situation for it
                return ret;
            } else {
                return [this.props.store.activeGroups, this.enrichmentsUI];
            }
        },
        render:()=>{
            if (this.props.store.activeGroups.result!.length !== 2) {
                return <span>{ENRICHMENTS_NOT_2_GROUPS_MSG(this.props.store.activeGroups.result!.length > 2)}</span>;
            } else if (this.props.store.activeStudyIds.result!.length > 1) {
                return <span>{ENRICHMENTS_TOO_MANY_STUDIES_MSG("protein")}</span>;
            } else {
                return this.enrichmentsUI.component;
            }
        },
        renderPending:()=><Loader center={true} isLoading={true} size={"big"}/>,
        renderError:()=><ErrorMessage/>
    });

    readonly enrichmentsUI = MakeMobxView({
        await:()=>[
            this.props.store.proteinEnrichmentData,
            this.props.store.proteinEnrichmentProfile,
            this.props.store.enrichmentsGroup1,
            this.props.store.enrichmentsGroup2
        ],
        render:()=>{
            const group1Name = this.props.store.enrichmentsGroup1.result!.name;
            const group2Name = this.props.store.enrichmentsGroup2.result!.name;
            return (
                <div data-test="GroupComparisonProteinEnrichments">
                    <EnrichmentsDataSetDropdown dataSets={this.props.store.proteinEnrichmentProfiles} onChange={this.onChangeProfile}
                                                selectedValue={this.props.store.proteinEnrichmentProfile.result!.molecularProfileId}/>
                    <ExpressionEnrichmentContainer data={this.props.store.proteinEnrichmentData.result!}
                                                   group1Name={this.props.store.enrichmentsGroup1.result!.name}
                                                   group2Name={this.props.store.enrichmentsGroup2.result!.name}
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