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
import { ENRICHMENTS_TOO_MANY_GROUPS_MSG, ENRICHMENTS_TOO_MANY_STUDIES_MSG } from "./GroupComparisonUtils";

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
            const ret = [this.props.store.activeComparisonGroups, this.props.store.activeStudyIds];
            if ((this.props.store.activeComparisonGroups.isComplete &&
                this.props.store.activeComparisonGroups.result.length > 2) ||
                (this.props.store.activeStudyIds.isComplete && this.props.store.activeStudyIds.result.length > 1)) {
                // dont bother loading data for and computing enrichments UI if its not valid situation for it
                return ret;
            } else {
                return [this.props.store.activeComparisonGroups, this.enrichmentsUI];
            }
        },
        render:()=>{
            if (this.props.store.activeComparisonGroups.result!.length > 2) {
                return <span>{ENRICHMENTS_TOO_MANY_GROUPS_MSG}</span>;
            } else if (this.props.store.activeStudyIds.result!.length > 1) {
                return <span>{ENRICHMENTS_TOO_MANY_STUDIES_MSG("protein")}</span>;
            } else {
                return this.enrichmentsUI.component;
            }
        },
        renderPending:()=><Loader isLoading={true} center={true} size={"big"}/>,
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
            return (
                <div data-test="GroupComparisonProteinEnrichments">
                    <EnrichmentsDataSetDropdown dataSets={this.props.store.proteinEnrichmentProfiles} onChange={this.onChangeProfile}
                                                selectedValue={this.props.store.proteinEnrichmentProfile.result!.molecularProfileId}/>
                    <ExpressionEnrichmentContainer data={this.props.store.proteinEnrichmentData.result!}
                                                   alteredGroupName={this.props.store.enrichmentsGroup1.result!.name}
                                                   unalteredGroupName={this.props.store.enrichmentsGroup2.result!.name}
                                                   selectedProfile={this.props.store.proteinEnrichmentProfile.result!}/>
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