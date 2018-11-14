import * as React from 'react';
import { observer } from "mobx-react";
import {AlterationTypeConstants, ResultsViewPageStore} from "../ResultsViewPageStore";
import { observable } from 'mobx';
import ExpressionEnrichmentContainer from 'pages/resultsView/enrichments/ExpressionEnrichmentsContainer';
import Loader from 'shared/components/loadingIndicator/LoadingIndicator';
import EnrichmentsDataSetDropdown from 'pages/resultsView/enrichments/EnrichmentsDataSetDropdown';
import { MolecularProfile } from 'shared/api/generated/CBioPortalAPI';
import autobind from 'autobind-decorator';
import ErrorMessage from "../../../shared/components/ErrorMessage";

export interface IMRNAEnrichmentsTabProps {
    store: ResultsViewPageStore
}

@observer
export default class MRNAEnrichmentsTab extends React.Component<IMRNAEnrichmentsTabProps, {}> {

    @autobind
    private onProfileChange(molecularProfile: MolecularProfile) {
        this.props.store._selectedEnrichmentMRNAProfile = molecularProfile;
    }

    public render() {

        if (this.props.store.mRNAEnrichmentData.isPending) {
            return <Loader isLoading={true} center={true} size={"big"} />;
        } else if (this.props.store.mRNAEnrichmentData.isError) {
            return <ErrorMessage/>
        } else {

            return (
                <div data-test="MRNAEnrichmentsTab">
                    <EnrichmentsDataSetDropdown dataSets={this.props.store.mRNAEnrichmentProfiles} onChange={this.onProfileChange}
                        selectedValue={this.props.store.selectedEnrichmentMRNAProfile.molecularProfileId}
                        molecularProfileIdToProfiledSampleCount={this.props.store.molecularProfileIdToProfiledSampleCount.result!}/>
                    <ExpressionEnrichmentContainer data={this.props.store.mRNAEnrichmentData.result!}
                        selectedProfile={this.props.store.selectedEnrichmentMRNAProfile} store={this.props.store} />
                </div>
            );
        }
    }
}
