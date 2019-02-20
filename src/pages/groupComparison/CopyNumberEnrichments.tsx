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
import { ENRICHMENTS_NOT_2_GROUPS_MSG } from "./GroupComparisonUtils";

export interface ICopyNumberEnrichmentsProps {
    store: GroupComparisonStore
}

@observer
export default class CopyNumberEnrichments extends React.Component<ICopyNumberEnrichmentsProps, {}> {
    @autobind
    private onChangeProfile(m:MolecularProfile) {
        this.props.store.setCopyNumberEnrichmentProfile(m);
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
            this.props.store.copyNumberHomdelEnrichmentData,
            this.props.store.copyNumberAmpEnrichmentData,
            this.props.store.copyNumberEnrichmentProfile,
            this.props.store.enrichmentsGroup1,
            this.props.store.enrichmentsGroup2
        ],
        render:()=>{
            return (
                <div data-test="GroupComparisonCopyNumberEnrichments">
                    <EnrichmentsDataSetDropdown dataSets={this.props.store.copyNumberEnrichmentProfiles} onChange={this.onChangeProfile}
                                                selectedValue={this.props.store.copyNumberEnrichmentProfile.result!.molecularProfileId}/>
                    <AlterationEnrichmentContainer data={this.props.store.copyNumberHomdelEnrichmentData.result!}
                                                totalAlteredCount={this.props.store.enrichmentsGroup1.result!.sampleIdentifiers.length}
                                                totalUnalteredCount={this.props.store.enrichmentsGroup2.result!.sampleIdentifiers.length}
                                                alteredGroupName={this.props.store.enrichmentsGroup1.result!.name}
                                                unalteredGroupName={this.props.store.enrichmentsGroup2.result!.name}
                                                selectedProfile={this.props.store.copyNumberEnrichmentProfile.result!}
                                                headerName={"Deep Deletion - " + this.props.store.copyNumberEnrichmentProfile.result!.name}
                                                alterationType="a deep deletion"/>
                    <hr />
                    <AlterationEnrichmentContainer data={this.props.store.copyNumberAmpEnrichmentData.result!}
                                                totalAlteredCount={this.props.store.enrichmentsGroup1.result!.sampleIdentifiers.length}
                                                totalUnalteredCount={this.props.store.enrichmentsGroup2.result!.sampleIdentifiers.length}
                                                alteredGroupName={this.props.store.enrichmentsGroup1.result!.name}
                                                unalteredGroupName={this.props.store.enrichmentsGroup2.result!.name}
                                                selectedProfile={this.props.store.copyNumberEnrichmentProfile.result!}
                                                headerName={"Amplification - " + this.props.store.copyNumberEnrichmentProfile.result!.name}
                                                alterationType="an amplification"
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