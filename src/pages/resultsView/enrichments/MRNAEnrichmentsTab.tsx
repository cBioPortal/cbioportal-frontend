import * as React from 'react';
import { observer } from "mobx-react";
import { ResultsViewPageStore } from "../ResultsViewPageStore";
import { observable } from 'mobx';
import ExpressionEnrichmentContainer from 'pages/resultsView/enrichments/ExpressionEnrichmentsContainer';
import Loader from 'shared/components/loadingIndicator/LoadingIndicator';
import EnrichmentsDataSetDropdown from 'pages/resultsView/enrichments/EnrichmentsDataSetDropdown';
import { MolecularProfile } from 'shared/api/generated/CBioPortalAPI';
import autobind from 'autobind-decorator';

export interface IMRNAEnrichmentsTabProps {
    store: ResultsViewPageStore
}

@observer
export default class MRNAEnrichmentsTab extends React.Component<IMRNAEnrichmentsTabProps, {}> {

    @autobind
    private onProfileChange(molecularProfile: MolecularProfile) {
        this.props.store.selectedEnrichmentMRNAProfile = molecularProfile;
    }

    public render() {

        if (this.props.store.mRNAEnrichmentData.isPending) {
            return <Loader isLoading={true} style={{ display:'inline-block', marginLeft:10, marginTop: 20 }}/>;
        }

        return (
            <div data-test="MRNAEnrichmentsTab">
                <EnrichmentsDataSetDropdown dataSets={this.props.store.mRNAEnrichmentProfiles.result!} onChange={this.onProfileChange}
                    selectedValue={this.props.store.selectedEnrichmentMRNAProfile.molecularProfileId} 
                    molecularProfileIdToProfiledSampleCount={this.props.store.molecularProfileIdToProfiledSampleCount.result!}/>
                <ExpressionEnrichmentContainer data={this.props.store.mRNAEnrichmentData.result!}
                    selectedProfile={this.props.store.selectedEnrichmentMRNAProfile} store={this.props.store} />
            </div>
        );
    }
}
