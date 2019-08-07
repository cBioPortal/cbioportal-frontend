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
import {MakeEnrichmentsTabUI, getNumSamples} from "./GroupComparisonUtils";
import { remoteData } from "cbioportal-frontend-commons";
import _ from "lodash";

export interface IMRNAEnrichmentsProps {
    store: GroupComparisonStore
}

@observer
export default class MRNAEnrichments extends React.Component<IMRNAEnrichmentsProps, {}> {
    @autobind
    private onChangeProfile(m:MolecularProfile) {
        this.props.store.setMRNAEnrichmentProfile(m);
    }

    private readonly enrichmentAnalysisGroups = remoteData({
        await: () => [this.props.store.activeGroups],
        invoke: () => {
            const groups = this.props.store.activeGroups.result!.map(group => ({
                name: group.nameWithOrdinal,
                description: `samples in ${group.nameWithOrdinal}`,
                count: getNumSamples(group),
                color: group.color
            }));
            return Promise.resolve(groups);
        }
    });

    readonly tabUI = MakeEnrichmentsTabUI(()=>this.props.store, ()=>this.enrichmentsUI, "mRNA", true);

    readonly enrichmentsUI = MakeMobxView({
        await:()=>[
            this.props.store.mRNAEnrichmentData,
            this.props.store.mRNAEnrichmentProfile,
            this.enrichmentAnalysisGroups
        ],
        render:()=>{
            return (
                <div data-test="GroupComparisonMRNAEnrichments">
                    <EnrichmentsDataSetDropdown dataSets={this.props.store.mRNAEnrichmentProfiles} onChange={this.onChangeProfile}
                                                selectedValue={this.props.store.mRNAEnrichmentProfile.result!.molecularProfileId}/>
                    <ExpressionEnrichmentContainer
                        data={this.props.store.mRNAEnrichmentData.result!}
                        groups={this.enrichmentAnalysisGroups.result}
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