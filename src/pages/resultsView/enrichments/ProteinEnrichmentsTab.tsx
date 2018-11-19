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

export interface IProteinEnrichmentsTabProps {
    store: ResultsViewPageStore
}

@observer
export default class ProteinEnrichmentsTab extends React.Component<IProteinEnrichmentsTabProps, {}> {

    @autobind
    private onProfileChange(molecularProfile: MolecularProfile) {
        this.props.store._selectedEnrichmentProteinProfile = molecularProfile;
    }

    public render() {

        if (this.props.store.proteinEnrichmentData.isPending) {
            return <Loader isLoading={true} center={true} size={"big"} />;
        } else if (this.props.store.proteinEnrichmentData.isError) {
            return <ErrorMessage/>
        } else {

            return (
                <div>
                    <EnrichmentsDataSetDropdown dataSets={this.props.store.proteinEnrichmentProfiles} onChange={this.onProfileChange}
                        selectedValue={this.props.store.selectedEnrichmentProteinProfile.molecularProfileId}
                        molecularProfileIdToProfiledSampleCount={this.props.store.molecularProfileIdToProfiledSampleCount.result!}/>
                    <ExpressionEnrichmentContainer data={this.props.store.proteinEnrichmentData.result!}
                        selectedProfile={this.props.store.selectedEnrichmentProteinProfile} store={this.props.store} />
                </div>
            );
        }
    }
}
