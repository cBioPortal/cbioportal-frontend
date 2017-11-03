import * as React from "react";
import * as _ from 'lodash';
import {computed, observable} from "mobx";
import {observer} from "mobx-react";
import {MSKTabs, MSKTab} from "shared/components/MSKTabs/MSKTabs";
import {If, Then, Else} from 'react-if';
import {ThreeBounce} from 'better-react-spinkit';
import {CancerSummaryContent, ICancerTypeAlterationData} from './CancerSummaryContent';
import {ResultsViewPageStore} from "../../../pages/resultsView/ResultsViewPageStore";
import Loader from "../loadingIndicator/LoadingIndicator";

@observer
export default class CancerSummaryContainer extends React.Component<{ store: ResultsViewPageStore }, {}> {

    @observable private activeTab: string = "all";
    @observable private resultsViewPageWidth: number = 1150;
    private resultsViewPageContent: HTMLElement;

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

        const alterationCountsForCancerTypesByGene =
            this.props.store.getAlterationCountsForCancerTypesByGene(this.props.store.alterationsBySampleIdByGene.result!,
                this.props.store.samplesExtendedWithClinicalData.result!, false);

        const alterationCountsForCancerSubTypesByGene =
            this.props.store.getAlterationCountsForCancerTypesByGene(this.props.store.alterationsBySampleIdByGene.result!,
                this.props.store.samplesExtendedWithClinicalData.result!, true);

        const geneTabs = _.map(alterationCountsForCancerTypesByGene, (geneData, geneName: string) => {

            // count how many alterations there are across all cancer types for this gene
            const alterationCountAcrossCancerType = _.reduce(geneData,(count, alterationData:ICancerTypeAlterationData)=>{
                return count + alterationData.alterationTotal;
            },0);

            // if there are no alterations for this gene, grey out text
            const anchorStyle = (alterationCountAcrossCancerType === 0) ? { color:'#bbb' } : {};

            return (
                <MSKTab key={geneName} id={"summaryTab" + geneName} linkText={geneName} anchorStyle={anchorStyle}>
                    <CancerSummaryContent
                        dataByCancerSubType={alterationCountsForCancerSubTypesByGene[geneName]}
                        dataByCancerType={alterationCountsForCancerTypesByGene[geneName]}
                        gene={geneName}
                        width={this.resultsViewPageWidth}/>
                </MSKTab>
            )
        });

        // only add combined gene tab if there's more than one gene
        if (geneTabs.length > 1) {
            geneTabs.unshift(<MSKTab key="all" id="allGenes" linkText="All Queried Genes">
                <CancerSummaryContent gene={'all'} width={this.resultsViewPageWidth}
                                      dataByCancerSubType={this.props.store.getAlterationCountsForCancerTypesForAllGenes(this.props.store.alterationsBySampleIdByGene.result!, this.props.store.samplesExtendedWithClinicalData.result!, true)}
                                      dataByCancerType={this.props.store.getAlterationCountsForCancerTypesForAllGenes(this.props.store.alterationsBySampleIdByGene.result!, this.props.store.samplesExtendedWithClinicalData.result!, false)}

                />
            </MSKTab>)
        }
        return geneTabs;

    }

    public render() {

        const isComplete = this.props.store.samplesExtendedWithClinicalData.isComplete && this.props.store.alterationsBySampleIdByGene.isComplete;
        const isPending = this.props.store.samplesExtendedWithClinicalData.isPending && this.props.store.alterationsBySampleIdByGene.isPending;


        if (isComplete) {
            return (
                <div ref={(el: HTMLDivElement) => this.resultsViewPageContent = el}>
                    <MSKTabs onTabClick={this.handleTabClick}
                             enablePagination={true}
                             arrowStyle={{'line-height': .8}}
                             tabButtonStyle="pills"
                             activeTabId={this.activeTab} className="secondaryTabs">
                        {this.tabs}
                    </MSKTabs>
                </div>
            );
        } else if (isPending) {
            return <Loader isLoading={true}/>
        } else {
            // TODO: error!
            return null;
        }
    }
};
