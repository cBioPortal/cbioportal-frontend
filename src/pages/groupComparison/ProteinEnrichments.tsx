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
import {MakeEnrichmentsTabUI, getNumSamples} from "./GroupComparisonUtils";
import { remoteData } from "cbioportal-frontend-commons";
import _ from "lodash";

export interface IProteinEnrichmentsProps {
    store: GroupComparisonStore
}

@observer
export default class ProteinEnrichments extends React.Component<IProteinEnrichmentsProps, {}> {
    @autobind
    private onChangeProfile(m:MolecularProfile) {
        this.props.store.setProteinEnrichmentProfile(m);
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

    readonly tabUI = MakeEnrichmentsTabUI(()=>this.props.store, ()=>this.enrichmentsUI, "protein");

    readonly enrichmentsUI = MakeMobxView({
        await:()=>[
            this.props.store.proteinEnrichmentData,
            this.props.store.proteinEnrichmentProfile,
            this.enrichmentAnalysisGroups
        ],
        render:()=>{
            return (
                <div data-test="GroupComparisonProteinEnrichments">
                    <EnrichmentsDataSetDropdown dataSets={this.props.store.proteinEnrichmentProfiles} onChange={this.onChangeProfile}
                                                selectedValue={this.props.store.proteinEnrichmentProfile.result!.molecularProfileId}/>
                    <ExpressionEnrichmentContainer
                        data={this.props.store.proteinEnrichmentData.result!}
                        groups={this.enrichmentAnalysisGroups.result}
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