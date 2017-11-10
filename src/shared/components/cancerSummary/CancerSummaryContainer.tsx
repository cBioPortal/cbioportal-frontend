import * as React from "react";
import * as _ from 'lodash';
import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import {MSKTabs, MSKTab} from "shared/components/MSKTabs/MSKTabs";
import {If, Then, Else} from 'react-if';
import {ThreeBounce} from 'better-react-spinkit';
import {CancerSummaryContent, IAlterationData} from './CancerSummaryContent';
import {ExtendedSample, ResultsViewPageStore} from "../../../pages/resultsView/ResultsViewPageStore";
import Loader from "../loadingIndicator/LoadingIndicator";

@observer
export default class CancerSummaryContainer extends React.Component<{ store: ResultsViewPageStore }, {}> {

    @observable private activeTab: string = "all";
    @observable private resultsViewPageWidth: number = 1150;
    @observable private groupAlterationsBy: keyof ExtendedSample = 'studyId';

    private resultsViewPageContent: HTMLElement;

    constructor() {
        super();
        this.handleTabClick = this.handleTabClick.bind(this);
        this.pivotData = this.pivotData.bind(this);
    }

    private handleTabClick(id: string) {
        this.activeTab = id;
    }

    private get defaultTabId(): string {
        return 'all';
    }

    public pivotData(str: keyof ExtendedSample){
        this.groupAlterationsBy = str;
    }

    @computed
    private get tabs() {

        const alterationCountsForCancerTypesByGene =
            this.props.store.getAlterationCountsForCancerTypesByGene(this.props.store.alterationsBySampleIdByGene.result!,
                this.props.store.samplesExtendedWithClinicalData.result!, this.groupAlterationsBy);

        // const alterationCountsForCancerSubTypesByGene =
        //     this.props.store.getAlterationCountsForCancerTypesByGene(this.props.store.alterationsBySampleIdByGene.result!,
        //         this.props.store.samplesExtendedWithClinicalData.result!, this.groupAlterationsBy);

        const geneTabs = _.map(alterationCountsForCancerTypesByGene, (geneData, geneName: string) => {

            // count how many alterations there are across all cancer types for this gene
            const alterationCountAcrossCancerType = _.reduce(geneData,(count, alterationData:IAlterationData)=>{
                return count + alterationData.alterationTotal;
            },0);

            // if there are no alterations for this gene, grey out text
            const anchorStyle = (alterationCountAcrossCancerType === 0) ? { color:'#bbb' } : {};

            return (
                <MSKTab key={geneName} id={"summaryTab" + geneName} linkText={geneName} anchorStyle={anchorStyle}>
                    <CancerSummaryContent
                        groupedAlterationData={alterationCountsForCancerTypesByGene[geneName]}
                        groupAlterationsBy={this.groupAlterationsBy}
                        gene={geneName}
                        handlePivotChange={this.pivotData}
                        width={this.resultsViewPageWidth}/>
                </MSKTab>
            )
        });

        // only add combined gene tab if there's more than one gene
        if (geneTabs.length > 1) {
            const groupedAlterationDataForAllGenes = this.props.store.getAlterationCountsForCancerTypesForAllGenes(
                this.props.store.alterationsBySampleIdByGene.result!,
                this.props.store.samplesExtendedWithClinicalData.result!,
                this.groupAlterationsBy);
            geneTabs.unshift(<MSKTab key="all" id="allGenes" linkText="All Queried Genes">
                <CancerSummaryContent gene={'all'}
                                      width={this.resultsViewPageWidth}
                                      groupedAlterationData={groupedAlterationDataForAllGenes}
                                      handlePivotChange={this.pivotData}
                                      groupAlterationsBy={this.groupAlterationsBy}
                />
            </MSKTab>)
        }
        return geneTabs;

    }

    public render() {

        const isComplete = this.props.store.samplesExtendedWithClinicalData.isComplete && this.props.store.alterationsBySampleIdByGene.isComplete;
        const isPending = this.props.store.samplesExtendedWithClinicalData.isPending && this.props.store.alterationsBySampleIdByGene.isPending;

        if (isComplete) {

            // if we have no groupby value, then we need to choose a default
            if (this.groupAlterationsBy === undefined) {
                if (this.props.store.studies.result.length > 1) {
                    this.groupAlterationsBy = 'studyId';
                } else {
                    const cancerTypes = _.chain(this.props.store.samplesExtendedWithClinicalData.result)
                        .map((sample:ExtendedSample)=>sample.cancerType)
                        .uniq().value();
                    this.groupAlterationsBy = (cancerTypes.length === 1) ? 'cancerTypeDetailed' : 'cancerType';
                }
            }


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
