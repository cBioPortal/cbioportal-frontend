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

export interface IProteinEnrichmentsTabProps {
    store: ResultsViewPageStore
}

@observer
export default class ProteinEnrichmentsTab extends React.Component<IProteinEnrichmentsTabProps, {}> {

    @autobind
    private onProfileChange(molecularProfile: MolecularProfile) {
        this.props.store._selectedEnrichmentProteinProfile = molecularProfile;
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

    public render() {

        if (this.props.store.proteinEnrichmentData.isPending || this.enrichmentAnalysisGroups.isPending) {
            return <Loader isLoading={true} center={true} size={"big"} />;
        } else if (this.props.store.proteinEnrichmentData.isError || this.enrichmentAnalysisGroups.isError) {
            return <ErrorMessage />
        } else {
            return (
                <div>
                    <EnrichmentsDataSetDropdown dataSets={this.props.store.proteinEnrichmentProfiles} onChange={this.onProfileChange}
                        selectedValue={this.props.store.selectedEnrichmentProteinProfile.molecularProfileId}
                        molecularProfileIdToProfiledSampleCount={this.props.store.molecularProfileIdToProfiledSampleCount} />
                    <ExpressionEnrichmentContainer data={this.props.store.proteinEnrichmentData.result!}
                        groups={this.enrichmentAnalysisGroups.result}
                        selectedProfile={this.props.store.selectedEnrichmentProteinProfile} store={this.props.store} />
                </div>
            );
        }
    }
}
