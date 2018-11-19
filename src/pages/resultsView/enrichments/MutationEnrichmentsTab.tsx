import * as React from 'react';
import { observer } from "mobx-react";
import { ResultsViewPageStore } from "../ResultsViewPageStore";
import { observable } from 'mobx';
import AlterationEnrichmentContainer from 'pages/resultsView/enrichments/AlterationEnrichmentsContainer';
import Loader from 'shared/components/loadingIndicator/LoadingIndicator';
import EnrichmentsDataSetDropdown from 'pages/resultsView/enrichments/EnrichmentsDataSetDropdown';
import { MolecularProfile } from 'shared/api/generated/CBioPortalAPI';
import autobind from 'autobind-decorator';
import ErrorMessage from "../../../shared/components/ErrorMessage";

export interface IMutationEnrichmentsTabProps {
    store: ResultsViewPageStore
}

@observer
export default class MutationEnrichmentsTab extends React.Component<IMutationEnrichmentsTabProps, {}> {

    @autobind
    private onProfileChange(molecularProfile: MolecularProfile) {
        this.props.store._selectedEnrichmentMutationProfile = molecularProfile;
    }

    public render() {
        if (this.props.store.mutationEnrichmentData.isPending) {
            return <Loader isLoading={true} center={true} size={"big"}/>;
        } else if (this.props.store.mutationEnrichmentData.isError) {
            return <ErrorMessage/>;
        } else {

            return (
                <div data-test="MutationEnrichmentsTab">
                    <EnrichmentsDataSetDropdown dataSets={this.props.store.mutationEnrichmentProfiles} onChange={this.onProfileChange}
                        selectedValue={this.props.store.selectedEnrichmentMutationProfile.molecularProfileId}
                        molecularProfileIdToProfiledSampleCount={this.props.store.molecularProfileIdToProfiledSampleCount.result!}/>
                    <AlterationEnrichmentContainer data={this.props.store.mutationEnrichmentData.result!}
                        totalAlteredCount={this.props.store.alteredSampleKeys.result!.length}
                        totalUnalteredCount={this.props.store.unalteredSampleKeys.result!.length}
                        headerName={this.props.store.selectedEnrichmentMutationProfile.name}
                        store={this.props.store} alterationType="a mutation"/>
                </div>
            );
        }
    }
}
