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
import { remoteData } from "cbioportal-frontend-commons";
import * as _ from "lodash";

export interface IMRNAEnrichmentsProps {
    store: GroupComparisonStore
}

@observer
export default class MRNAEnrichments extends React.Component<IMRNAEnrichmentsProps, {}> {
    @autobind
    private onChangeProfile(profileMap:{[studyId:string]:MolecularProfile}) {
        this.props.store.setMRNAEnrichmentProfileMap(profileMap);
    }

    private readonly mrnaEnrichmentAnalysisGroups = remoteData({
        await: () => [this.props.store.enrichmentAnalysisGroups],
        invoke: () => {
            return Promise.resolve(_.map(this.props.store.enrichmentAnalysisGroups.result, group => {
                return {
                    ...group,
                    description: `samples in ${group.name}`
                }
            }));
        }
    });

    readonly tabUI = MakeEnrichmentsTabUI(()=>this.props.store, ()=>this.enrichmentsUI, "mRNA", true, true, false);

    readonly enrichmentsUI = MakeMobxView({
        await:()=>[
            this.props.store.mRNAEnrichmentData,
            this.props.store.selectedmRNAEnrichmentProfileMap,
            this.mrnaEnrichmentAnalysisGroups,
            this.props.store.studies,
            this.props.store.sampleKeyToSample
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
                        groups={this.mrnaEnrichmentAnalysisGroups.result}
                        selectedProfile={selectedProfile}
                        alteredVsUnalteredMode={false}
                        sampleKeyToSample={this.props.store.sampleKeyToSample.result!}
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