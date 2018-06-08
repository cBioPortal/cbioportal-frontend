import * as React from 'react';
import { observer } from "mobx-react";
import { ResultsViewPageStore } from "../ResultsViewPageStore";
import { observable } from 'mobx';
import ExpressionEnrichmentContainer from 'pages/resultsView/enrichments/ExpressionEnrichmentsContainer';
import Loader from 'shared/components/loadingIndicator/LoadingIndicator';
import EnrichmentsDataSetDropdown from 'pages/resultsView/enrichments/EnrichmentsDataSetDropdown';
import { MolecularProfile } from 'shared/api/generated/CBioPortalAPI';
import autobind from 'autobind-decorator';

export interface IProteinEnrichmentsTabProps {
    store: ResultsViewPageStore
}

@observer
export default class ProteinEnrichmentsTab extends React.Component<IProteinEnrichmentsTabProps, {}> {

    @autobind
    private onProfileChange(molecularProfile: MolecularProfile) {
        this.props.store.selectedEnrichmentProteinProfile = molecularProfile;
    }

    public render() {

        if (this.props.store.proteinEnrichmentData.isPending) {
            return <Loader isLoading={true} style={{ display:'inline-block', marginLeft:10, marginTop: 20 }} />;
        }

        return (
            <div>
                <EnrichmentsDataSetDropdown dataSets={this.props.store.proteinEnrichmentProfiles.result!} onChange={this.onProfileChange}
                    selectedValue={this.props.store.selectedEnrichmentProteinProfile.molecularProfileId} 
                    molecularProfileIdToProfiledSampleCount={this.props.store.molecularProfileIdToProfiledSampleCount.result!}/>
                <ExpressionEnrichmentContainer data={this.props.store.proteinEnrichmentData.result!}
                    selectedProfile={this.props.store.selectedEnrichmentProteinProfile} store={this.props.store} />
            </div>
        );
    }
}
