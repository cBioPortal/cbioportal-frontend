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
import { AlterationContainerType } from './EnrichmentsUtil';
import {makeUniqueColorGetter} from "shared/components/plots/PlotUtils";

export interface IMutationEnrichmentsTabProps {
    store: ResultsViewPageStore
}

@observer
export default class MutationEnrichmentsTab extends React.Component<IMutationEnrichmentsTabProps, {}> {

    private uniqueColorGetter = makeUniqueColorGetter();

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
                        molecularProfileIdToProfiledSampleCount={this.props.store.molecularProfileIdToProfiledSampleCount}/>
                    <AlterationEnrichmentContainer data={this.props.store.mutationEnrichmentData.result!}
                        headerName={this.props.store.selectedEnrichmentMutationProfile.name}
                        store={this.props.store}
                        groups={[
                            {
                                name: "Altered group",
                                description: "Number (percentage) of samples that have alterations in the query gene(s) that also have a mutation in the listed gene.",
                                nameOfEnrichmentDirection: "Co-occurrence",
                                count: this.props.store.alteredSampleKeys.result!.length,
                                color:this.uniqueColorGetter(),
                            }, {
                                name: "Unaltered group",
                                description: "Number (percentage) of samples that do not have alterations in the query gene(s) that have a mutation in the listed gene.",
                                nameOfEnrichmentDirection: "Mutual exclusivity",
                                count: this.props.store.unalteredSampleKeys.result!.length,
                                color:this.uniqueColorGetter(),
                            }
                        ]}
                        containerType={AlterationContainerType.MUTATION}
                        />
                </div>
            );
        }
    }
}
