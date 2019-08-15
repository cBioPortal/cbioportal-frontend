import * as React from 'react';
import { observer } from "mobx-react";
import { ResultsViewPageStore } from "../ResultsViewPageStore";
import ExpressionEnrichmentContainer from 'pages/resultsView/enrichments/ExpressionEnrichmentsContainer';
import Loader from 'shared/components/loadingIndicator/LoadingIndicator';
import EnrichmentsDataSetDropdown from 'pages/resultsView/enrichments/EnrichmentsDataSetDropdown';
import { MolecularProfile } from 'shared/api/generated/CBioPortalAPI';
import autobind from 'autobind-decorator';
import ErrorMessage from "../../../shared/components/ErrorMessage";
import { makeUniqueColorGetter } from 'shared/components/plots/PlotUtils';
import { remoteData } from 'public-lib';
import { MakeMobxView } from 'shared/components/MobxView';

export interface IProteinEnrichmentsTabProps {
    store: ResultsViewPageStore
}

@observer
export default class ProteinEnrichmentsTab extends React.Component<IProteinEnrichmentsTabProps, {}> {

    @autobind
    private onProfileChange(profileMap:{[studyId:string]:MolecularProfile}) {
        this.props.store.setProteinEnrichmentProfile(profileMap);
    }

    private readonly enrichmentAnalysisGroups = remoteData({
        await: () => [this.props.store.unalteredSampleKeys],
        invoke: () => {
            const uniqueColorGetter = makeUniqueColorGetter();
            const groups = [{
                name: "Altered group",
                description: "samples that have alterations in the query gene(s).",
                nameOfEnrichmentDirection: "Over-expressed",
                count: this.props.store.alteredSampleKeys.result!.length,
                color: uniqueColorGetter()
            }, {
                name: "Unaltered group",
                description: "samples that do not have alterations in the query gene(s).",
                nameOfEnrichmentDirection: "Under-expressed",
                count: this.props.store.unalteredSampleKeys.result!.length,
                color: uniqueColorGetter()
            }];
            return Promise.resolve(groups);
        }
    });
    
    readonly tabUI = MakeMobxView({
        await: () => [this.props.store.studies,  this.props.store.proteinEnrichmentData, this.props.store.selectedProteinEnrichmentProfileMap, this.enrichmentAnalysisGroups],
        render: () => {
            // since protein enrichments tab is enabled only for one study, selectedProteinEnrichmentProfileMap
            // would contain only one key.
            const studyIds = Object.keys(this.props.store.selectedProteinEnrichmentProfileMap.result!);
            const selectedProfile = this.props.store.selectedProteinEnrichmentProfileMap.result![studyIds[0]];
            return (
                <div>
                    <EnrichmentsDataSetDropdown
                        dataSets={this.props.store.proteinEnrichmentProfiles}
                        onChange={this.onProfileChange}
                        selectedProfileByStudyId={this.props.store.selectedProteinEnrichmentProfileMap.result!}
                        molecularProfileIdToProfiledSampleCount={this.props.store.molecularProfileIdToProfiledSampleCount}
                        studies={this.props.store.studies.result!}
                    />
                    <ExpressionEnrichmentContainer
                        data={this.props.store.proteinEnrichmentData.result!}
                        groups={this.enrichmentAnalysisGroups.result}
                        selectedProfile={selectedProfile}
                        store={this.props.store} />
                </div>
            );
        },
        renderPending: () => <Loader isLoading={true} center={true} size={"big"}/>,
        renderError: ()=> <ErrorMessage/>
    });

    public render() {
        return this.tabUI.component;
    }
}
