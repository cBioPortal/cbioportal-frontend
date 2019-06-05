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
import { AlterationContainerType } from './EnrichmentsUtil';
import {makeUniqueColorGetter} from "shared/components/plots/PlotUtils";

export interface ICopyNumberEnrichmentsTabProps {
    store: ResultsViewPageStore
}

@observer
export default class CopyNumberEnrichmentsTab extends React.Component<ICopyNumberEnrichmentsTabProps, {}> {

    private uniqueColorGetter = makeUniqueColorGetter();

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
                                                    molecularProfileIdToProfiledSampleCount={this.props.store.molecularProfileIdToProfiledSampleCount}/>
                        <AlterationEnrichmentContainer data={this.props.store.copyNumberHomdelEnrichmentData.result!}
                            groups={[
                                {
                                    name: "Altered group",
                                    description: "Number (percentage) of samples that have alterations in the query gene(s) that also have a deep deletion in the listed gene.",
                                    nameOfEnrichmentDirection: "Co-occurrence",
                                    count: this.props.store.alteredSampleKeys.result!.length,
                                    color: this.uniqueColorGetter()
                                }, {
                                    name: "Unaltered group",
                                    description: "Number (percentage) of samples that do not have alterations in the query gene(s) that have a deep deletion in the listed gene.",
                                    nameOfEnrichmentDirection: "Mutual exclusivity",
                                    count: this.props.store.unalteredSampleKeys.result!.length,
                                    color: this.uniqueColorGetter()
                                }
                            ]}
                            headerName={"Deep Deletion - " + this.props.store.selectedEnrichmentCopyNumberProfile.name}
                            store={this.props.store}
                            containerType={AlterationContainerType.COPY_NUMBER} />
                        <hr />
                        <AlterationEnrichmentContainer data={this.props.store.copyNumberAmpEnrichmentData.result!}
                            groups={[
                                {
                                    name: "Altered group",
                                    description: "Number (percentage) of samples that have alterations in the query gene(s) that also have an amplification in the listed gene.",
                                    nameOfEnrichmentDirection: "Co-occurrence",
                                    count: this.props.store.alteredSampleKeys.result!.length
                                }, {
                                    name: "Unaltered group",
                                    description: "Number (percentage) of samples that do not have alterations in the query gene(s) that have an amplification in the listed gene.",
                                    nameOfEnrichmentDirection: "Mutual exclusivity",
                                    count: this.props.store.unalteredSampleKeys.result!.length
                                }
                            ]}
                            headerName={"Amplification - " + this.props.store.selectedEnrichmentCopyNumberProfile.name}
                            store={this.props.store}
                            containerType={AlterationContainerType.COPY_NUMBER} />
                    </div>
                );
        }
    }
}
