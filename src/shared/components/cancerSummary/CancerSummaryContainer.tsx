import * as React from "react";
import * as _ from 'lodash';
import {computed, observable} from "mobx";
import {observer} from "mobx-react";
import {MSKTabs, MSKTab} from "shared/components/MSKTabs/MSKTabs";
import {If, Then, Else} from 'react-if';
import {ThreeBounce} from 'better-react-spinkit';
import {CancerSummaryContent} from './CancerSummaryContent';
import {ResultsViewPageStore} from "../../../pages/resultsView/ResultsViewPageStore";
import Loader from "../loadingIndicator/LoadingIndicator";

const anchorStyle = {
    'font-size': '12px',
    'padding-left': '6px',
    'padding-right': '6px',
    'padding-top': '10px',
    'padding-bottom': '10px',
    'cursor': 'pointer',
    'line-height': .8
}


@observer
export default class CancerSummaryContainer extends React.Component<{store: ResultsViewPageStore},{}> {

    @observable private activeTab: string = "all";

    constructor() {
        super();
        this.handleTabClick = this.handleTabClick.bind(this);
    }

    private handleTabClick(id: string) {
        this.activeTab = id;
    }

    private get defaultTabId(): string {
        return 'all';
    }

    @computed
    private get tabs() {

        return _.map(this.props.store.alterationCountsForCancerTypesByGene.result, (geneData, geneName) => (
            <MSKTab key={geneName} id={"summaryTab" + geneName} linkText={geneName} anchorStyle={anchorStyle}>
                <CancerSummaryContent data={geneData} gene={this.activeTab}/>
            </MSKTab>
        ));
    }

    public render() {

        if (this.props.store.alterationCountsForCancerTypesForAllGenes.isComplete &&
            this.props.store.alterationCountsForCancerTypesByGene.isComplete) {
            return (
                <div>
                    <MSKTabs onTabClick={this.handleTabClick}
                             enablePagination={true}
                             arrowStyle={{'line-height':.8}}
                             tabButtonStyle="pills"
                             activeTabId={this.activeTab} className="secondaryTabs">
                        <MSKTab key="all" id="allGenes" linkText="All Queried Genes" anchorStyle={anchorStyle}>
                            <CancerSummaryContent gene={this.activeTab}
                                data={this.props.store.alterationCountsForCancerTypesForAllGenes.result}/>
                        </MSKTab>
                        {this.tabs}
                    </MSKTabs>
                </div>
            );
        } else if (this.props.store.alterationCountsForCancerTypesForAllGenes.isPending) {
            return <Loader isLoading={true}/>
        } else {
            // TODO: error!
            return null;
        }
    }
};
