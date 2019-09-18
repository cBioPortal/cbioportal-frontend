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

export interface IMRNAEnrichmentsProps {
    store: GroupComparisonStore
}

@observer
export default class MRNAEnrichments extends React.Component<IMRNAEnrichmentsProps, {}> {
    @autobind
    private onChangeProfile(profileMap:{[studyId:string]:MolecularProfile}) {
        this.props.store.setMRNAEnrichmentProfileMap(profileMap);
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

    readonly tabUI = MakeEnrichmentsTabUI(()=>this.props.store, ()=>this.enrichmentsUI, "mRNA", true, true, false);

    readonly enrichmentsUI = MakeMobxView({
        await:()=>[
            this.props.store.mRNAEnrichmentData,
            this.props.store.selectedmRNAEnrichmentProfileMap,
            this.enrichmentAnalysisGroups,
            this.props.store.studies
        ],
        render:()=>{
            // since mRNA enrichments tab is enabled only for one study, selectedProteinEnrichmentProfileMap
            // would contain only one key.
            const studyIds = Object.keys(this.props.store.selectedmRNAEnrichmentProfileMap.result!);
            const selectedProfile = this.props.store.selectedmRNAEnrichmentProfileMap.result![studyIds[0]];
            return (
                <div data-test="GroupComparisonMRNAEnrichments">
                    <EnrichmentsDataSetDropdown
                        dataSets={this.props.store.mRNAEnrichmentProfiles}
                        onChange={this.onChangeProfile}
                        selectedProfileByStudyId={this.props.store.selectedmRNAEnrichmentProfileMap.result!}
                        alwaysShow={true}
                        studies={this.props.store.studies.result!}
                    />
                    <ExpressionEnrichmentContainer
                        data={this.props.store.mRNAEnrichmentData.result!}
                        groups={this.enrichmentAnalysisGroups.result}
                        selectedProfile={selectedProfile}
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