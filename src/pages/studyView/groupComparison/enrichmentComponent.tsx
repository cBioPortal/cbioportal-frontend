import * as React from 'react';
import { observer } from "mobx-react";
import { ResultsViewPageStore } from "../../resultsView/ResultsViewPageStore";
import { MSKTabs, MSKTab } from 'shared/components/MSKTabs/MSKTabs';
import { observable, computed } from 'mobx';
import MutationEnrichmentsTab from 'pages/resultsView/enrichments/MutationEnrichmentsTab';
import CopyNumberEnrichmentsTab from 'pages/resultsView/enrichments/CopyNumberEnrichmentsTab';
import MRNAEnrichmentsTab from 'pages/resultsView/enrichments/MRNAEnrichmentsTab';
import ProteinEnrichmentsTab from 'pages/resultsView/enrichments/ProteinEnrichmentsTab';
import Loader from 'shared/components/loadingIndicator/LoadingIndicator';
import autobind from 'autobind-decorator';
import OqlStatusBanner from "../../../shared/components/oqlStatusBanner/OqlStatusBanner";
import { Group } from "../studyViewPageStore";
import { getAlterationScatterData, getAlterationRowData } from 'pages/resultsView/enrichments/EnrichmentsUtil';
import { AlterationEnrichmentRow } from 'shared/model/AlterationEnrichmentRow';
import MiniScatterChart from 'pages/resultsView/enrichments/MiniScatterChart';
import { MolecularProfile } from 'shared/api/generated/CBioPortalAPI';
import { ExpressionEnrichment } from 'shared/api/generated/CBioPortalAPIInternal';
import { getExpressionRowData, getExpressionScatterData } from 'pages/resultsView/enrichments/EnrichmentsUtil';
import { ExpressionEnrichmentRow } from 'shared/model/ExpressionEnrichmentRow';
import MobxPromise from 'mobxpromise';

export interface IEnrichmentsTabProps {
    mutationData: any[];
    cnaData: any[];
    mrnaData: ExpressionEnrichment[];
    proteinData: any[];
}

@observer
export default class EnrichmentComponent extends React.Component<IEnrichmentsTabProps, {}> {

    @observable currentTabId:string;
    @observable clickedGeneHugo: string;
    @observable clickedGeneEntrez: number;
    @observable selectedGenes: string[]|null;

    @computed get mrnaEnrichmentData(): ExpressionEnrichmentRow[] {
        const data = getExpressionRowData(this.props.mrnaData, []);
        return getExpressionScatterData(data, []);
    }

    @autobind
    private handleTabChange(id: string) {
            this.currentTabId = id;
    }

    @autobind
    private onGeneNameClick(hugoGeneSymbol: string, entrezGeneId: number) {
        this.clickedGeneHugo = hugoGeneSymbol;
        this.clickedGeneEntrez = entrezGeneId;
    }

    @autobind
    private onSelection(hugoGeneSymbols: string[]) {
        this.selectedGenes = hugoGeneSymbols;
    }

    @autobind
    private onSelectionCleared() {
        this.selectedGenes = null;
    }

    public render() {

        // if (this.props.store.alteredSampleKeys.isPending || this.props.store.unalteredSampleKeys.isPending) {
        //     return <Loader isLoading={true} />;
        // }
        //
        // if (this.props.store.alteredSampleKeys.result!.length === 0 || this.props.store.unalteredSampleKeys.result!.length === 0) {
        //     return <div>No alteration in selected samples, therefore could not perform this calculation.</div>;
        //
        //
        // if (this.props.store.mutationEnrichmentProfiles.isPending ||
        //     this.props.store.copyNumberEnrichmentProfiles.isPending ||
        //     this.props.store.mRNAEnrichmentProfiles.isPending ||
        //     this.props.store.proteinEnrichmentProfiles.isPending) {
        //     return <Loader isLoading={true} />;
        //

        return (
            <div>
                <MSKTabs activeTabId={this.currentTabId} onTabClick={this.handleTabChange} className="secondaryTabs">
                    {<MSKTab id="mutations" linkText="Mutations">
                        <MiniScatterChart data={this.props.mutationData}
                            xAxisLeftLabel="Under-expressed" xAxisRightLabel="Over-expressed" xAxisDomain={Math.ceil(Math.abs(-1.0859402772394695))}
                            xAxisTickValues={null} onGeneNameClick={this.onGeneNameClick} onSelection={this.onSelection}
                            onSelectionCleared={this.onSelectionCleared}/>
                    </MSKTab>}
                    {<MSKTab id="copynumber" linkText="Copy Number">
                        <MiniScatterChart data={this.props.cnaData}
                            xAxisLeftLabel="Under-expressed" xAxisRightLabel="Over-expressed" xAxisDomain={Math.ceil(Math.abs(-1.0859402772394695))}
                            xAxisTickValues={null} onGeneNameClick={this.onGeneNameClick} onSelection={this.onSelection}
                            onSelectionCleared={this.onSelectionCleared}/>
                    </MSKTab>}
                    {<MSKTab id="mrna" linkText="mRNA">
                        { this.props.mrnaData != undefined && <MiniScatterChart data={this.mrnaEnrichmentData}
                            xAxisLeftLabel="Under-expressed" xAxisRightLabel="Over-expressed" xAxisDomain={Math.ceil(Math.abs(-1.0859402772394695))}
                            xAxisTickValues={null} onGeneNameClick={this.onGeneNameClick} onSelection={this.onSelection}
                            onSelectionCleared={this.onSelectionCleared}/>}
                    </MSKTab>}
                    {<MSKTab id="protein" linkText="Protein">
                        <MiniScatterChart data={this.props.proteinData}
                            xAxisLeftLabel="Under-expressed" xAxisRightLabel="Over-expressed" xAxisDomain={Math.ceil(Math.abs(-1.0859402772394695))}
                            xAxisTickValues={null} onGeneNameClick={this.onGeneNameClick} onSelection={this.onSelection}
                            onSelectionCleared={this.onSelectionCleared}/>
                    </MSKTab>}
                </MSKTabs>
            </div>
        );
    }
}
