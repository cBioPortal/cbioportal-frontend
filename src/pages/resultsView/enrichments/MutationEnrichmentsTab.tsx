import * as React from 'react';
import { observer } from "mobx-react";
import { ResultsViewPageStore } from "../ResultsViewPageStore";
import { observable } from 'mobx';
import AlterationEnrichmentContainer from 'pages/resultsView/enrichments/AlterationEnrichmentsContainer';
import Loader from 'shared/components/loadingIndicator/LoadingIndicator';
import DataSetDropdown from 'pages/resultsView/enrichments/DataSetDropdown';
import { MolecularProfile } from 'shared/api/generated/CBioPortalAPI';
import autobind from 'autobind-decorator';

export interface IMutationEnrichmentsTabProps {
    store: ResultsViewPageStore
}

@observer
export default class MutationEnrichmentsTab extends React.Component<IMutationEnrichmentsTabProps, {}> {

    @autobind
    private onProfileChange(molecularProfile: MolecularProfile) {
        this.props.store.selectedEnrichmentMutationProfile = molecularProfile;
    }

    public render() {
        if (this.props.store.mutationEnrichmentData.isPending) {
            return <Loader isLoading={true} style={{ display:'inline-block', marginLeft:10, marginTop: 20 }} />;
        }

        return (
            <div>
                <DataSetDropdown dataSets={this.props.store.mutationEnrichmentProfiles.result!} onChange={this.onProfileChange}
                    selectedValue={JSON.stringify(this.props.store.selectedEnrichmentMutationProfile)} />
                <AlterationEnrichmentContainer data={this.props.store.mutationEnrichmentData.result!}
                    totalAlteredCount={this.props.store.alteredSampleKeys.result!.length}
                    totalUnalteredCount={this.props.store.unalteredSampleKeys.result!.length}
                    headerName={this.props.store.selectedEnrichmentMutationProfile.name}
                    store={this.props.store} />
            </div>
        );
    }
}
