import * as React from 'react';
import { observer } from "mobx-react";
import { ResultsViewPageStore } from "../ResultsViewPageStore";
import { observable } from 'mobx';
import AlterationEnrichmentContainer from 'pages/resultsView/enrichments/AlterationEnrichmentsContainer';
import Loader from 'shared/components/loadingIndicator/LoadingIndicator';
import EnrichmentsDataSetDropdown from 'pages/resultsView/enrichments/EnrichmentsDataSetDropdown';
import { MolecularProfile } from 'shared/api/generated/CBioPortalAPI';
import autobind from 'autobind-decorator';
import {getMobxPromiseGroupStatus} from "../../../shared/lib/getMobxPromiseGroupStatus";
import ErrorMessage from "../../../shared/components/ErrorMessage";

export interface ICopyNumberEnrichmentsTabProps {
    store: ResultsViewPageStore
}

@observer
export default class CopyNumberEnrichmentsTab extends React.Component<ICopyNumberEnrichmentsTabProps, {}> {

    @autobind
    private onProfileChange(molecularProfile: MolecularProfile) {
        this.props.store._selectedEnrichmentCopyNumberProfile = molecularProfile;
    }

    public render() {

        switch (getMobxPromiseGroupStatus(this.props.store.copyNumberHomdelEnrichmentData, this.props.store.copyNumberAmpEnrichmentData)) {
            case "pending":
                return <Loader isLoading={true} center={true} size={"big"} />;
            case "error":
                return <ErrorMessage/>;
            case "complete":
            default:
                return (
                    <div>
                        <EnrichmentsDataSetDropdown dataSets={this.props.store.copyNumberEnrichmentProfiles} onChange={this.onProfileChange}
                                                    selectedValue={this.props.store.selectedEnrichmentCopyNumberProfile.molecularProfileId}
                                                    molecularProfileIdToProfiledSampleCount={this.props.store.molecularProfileIdToProfiledSampleCount.result!}/>
                        <AlterationEnrichmentContainer data={this.props.store.copyNumberHomdelEnrichmentData.result!}
                                                       totalAlteredCount={this.props.store.alteredSampleKeys.result!.length}
                                                       totalUnalteredCount={this.props.store.unalteredSampleKeys.result!.length}
                                                       headerName={"Deep Deletion - " + this.props.store.selectedEnrichmentCopyNumberProfile.name}
                                                       store={this.props.store} alterationType="a deep deletion"/>
                        <hr />
                        <AlterationEnrichmentContainer data={this.props.store.copyNumberAmpEnrichmentData.result!}
                                                       totalAlteredCount={this.props.store.alteredSampleKeys.result!.length}
                                                       totalUnalteredCount={this.props.store.unalteredSampleKeys.result!.length}
                                                       headerName={"Amplification - " + this.props.store.selectedEnrichmentCopyNumberProfile.name}
                                                       store={this.props.store} alterationType="an amplification"/>
                    </div>
                );
        }
    }
}
