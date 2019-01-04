import * as React from 'react';
import { observer } from "mobx-react";
import { ResultsViewPageStore } from "../ResultsViewPageStore";
import { MSKTabs, MSKTab } from 'shared/components/MSKTabs/MSKTabs';
import { observable } from 'mobx';
import MutationEnrichmentsTab from 'pages/resultsView/enrichments/MutationEnrichmentsTab';
import CopyNumberEnrichmentsTab from 'pages/resultsView/enrichments/CopyNumberEnrichmentsTab';
import MRNAEnrichmentsTab from 'pages/resultsView/enrichments/MRNAEnrichmentsTab';
import ProteinEnrichmentsTab from 'pages/resultsView/enrichments/ProteinEnrichmentsTab';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import autobind from 'autobind-decorator';
import OqlStatusBanner from "../../../shared/components/oqlStatusBanner/OqlStatusBanner";

export interface IEnrichmentsTabProps {
    store: ResultsViewPageStore
}

@observer
export default class EnrichmentsTab extends React.Component<IEnrichmentsTabProps, {}> {

    @observable currentTabId:string;

    @autobind
    private handleTabChange(id: string) {
            this.currentTabId = id;
    }

    public render() {

        if (this.props.store.alteredSampleKeys.isPending || this.props.store.unalteredSampleKeys.isPending) {
            return <LoadingIndicator isLoading={true} center={true} size={"big"} />;
        }

        if (this.props.store.alteredSampleKeys.result!.length === 0) {
            return <div className={'alert alert-info'}>No queried samples are altered, therefore this calculation cannot be performed.</div>;
        }

        if (this.props.store.unalteredSampleKeys.result!.length === 0) {
            return <div className={'alert alert-info'}>All queried samples are altered, therefore this calculation cannot be performed.</div>;
        }

        if (this.props.store.mutationEnrichmentProfiles.isPending ||
            this.props.store.copyNumberEnrichmentProfiles.isPending ||
            this.props.store.mRNAEnrichmentProfiles.isPending ||
            this.props.store.proteinEnrichmentProfiles.isPending) {
            return <LoadingIndicator isLoading={true} center={true} size={"big"} />;
        }

        return (
            <div data-test="enrichmentsTabDiv">
                <div className={"tabMessageContainer"}>
                    <OqlStatusBanner className="enrichments-oql-status-banner" store={this.props.store} tabReflectsOql={true}/>
                </div>
                <MSKTabs activeTabId={this.currentTabId} onTabClick={this.handleTabChange} className="secondaryTabs">
                    {(this.props.store.mutationEnrichmentProfiles.result!.length > 0) && <MSKTab id="mutations" linkText="Mutations">
                        <MutationEnrichmentsTab store={this.props.store}/>
                    </MSKTab>}
                    {(this.props.store.copyNumberEnrichmentProfiles.result!.length > 0) && <MSKTab id="copynumber" linkText="Copy-number">
                        <CopyNumberEnrichmentsTab store={this.props.store}/>
                    </MSKTab>}
                    {(this.props.store.mRNAEnrichmentProfiles.result!.length > 0) && <MSKTab id="mrna" linkText="mRNA">
                        <MRNAEnrichmentsTab store={this.props.store}/>
                    </MSKTab>}
                    {(this.props.store.proteinEnrichmentProfiles.result!.length > 0) && <MSKTab id="protein" linkText="Protein">
                        <ProteinEnrichmentsTab store={this.props.store}/>
                    </MSKTab>}
                </MSKTabs>
            </div>
        );
    }
}
