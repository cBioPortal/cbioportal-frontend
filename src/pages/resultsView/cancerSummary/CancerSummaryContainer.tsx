import * as React from "react";
import * as _ from 'lodash';
import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import {MSKTabs, MSKTab} from "shared/components/MSKTabs/MSKTabs";
import {If, Then, Else} from 'react-if';
import {ThreeBounce} from 'better-react-spinkit';
import {CancerSummaryContent, IAlterationData} from './CancerSummaryContent';
import {
    ExtendedAlteration, ExtendedSample,
    ResultsViewPageStore
} from "../ResultsViewPageStore";
import Loader from "../../../shared/components/loadingIndicator/LoadingIndicator";
import {CancerStudy, Gene} from "../../../shared/api/generated/CBioPortalAPI";
import './styles.scss';
import {
    getAlterationCountsForCancerTypesByGene,
    getAlterationCountsForCancerTypesForAllGenes
} from "../../../shared/lib/alterationCountHelpers";

interface ICancerSummaryContainerProps {

    samplesExtendedWithClinicalData:ExtendedSample[];
    alterationsByGeneBySampleKey:{[hugoGeneSymbol:string]:{ [uniquSampleKey:string]:ExtendedAlteration[] }};
    studies:CancerStudy[];
    studyMap:{ [studyId:string]:CancerStudy };
    genes:Gene[];

};


@observer
export default class CancerSummaryContainer extends React.Component<ICancerSummaryContainerProps, {}> {

    @observable private activeTab: string = "all";
    @observable private resultsViewPageWidth: number = 1150;
    @observable private groupAlterationsBy_userSelection: keyof ExtendedSample;

    private resultsViewPageContent: HTMLElement;

    constructor() {
        super();
        this.handleTabClick = this.handleTabClick.bind(this);
        this.pivotData = this.pivotData.bind(this);
        this.mapStudyIdToShortName = this.mapStudyIdToShortName.bind(this);
    }

    private handleTabClick(id: string) {
        this.activeTab = id;
    }

    private get defaultTabId(): string {
        return 'all';
    }

    public pivotData(str: keyof ExtendedSample){
        this.groupAlterationsBy_userSelection = str;
    }

    public get groupAlterationsBy(): keyof ExtendedSample {
        if (this.groupAlterationsBy_userSelection === undefined) {
            if (this.props.studies.length > 1) {
                return 'studyId';
            } else {
                const cancerTypes = _.chain(this.props.samplesExtendedWithClinicalData)
                    .map((sample:ExtendedSample)=>sample.cancerType)
                    .uniq().value();
                return (cancerTypes.length === 1) ? 'cancerTypeDetailed' : 'cancerType';
            }
        } else {
            return this.groupAlterationsBy_userSelection;
        }
    }

    // this is used to map study id to study shortname
    private mapStudyIdToShortName(str: string){
            if (str in this.props.studyMap) {
                return this.props.studyMap[str].shortName;
            } else {
                return str;
            }
    }

    @computed
    private get tabs() {

        // if we're grouping by cancer study, we need to use study shortName property instead of studyId
        const labelTransformer = (this.groupAlterationsBy === 'studyId') ? this.mapStudyIdToShortName : undefined;

        const alterationCountsForCancerTypesByGene =
            getAlterationCountsForCancerTypesByGene(this.props.alterationsByGeneBySampleKey,
                this.props.samplesExtendedWithClinicalData, this.groupAlterationsBy);

        const geneTabs = _.map(this.props.genes, (gene:Gene) => {
            const geneData = alterationCountsForCancerTypesByGene[gene.hugoGeneSymbol];
            // count how many alterations there are across all cancer types for this gene
            const alterationCountAcrossCancerType = _.reduce(geneData,(count, alterationData:IAlterationData)=>{
                return count + alterationData.alterationTotal;
            },0);

            // if there are no alterations for this gene, grey out text
            const anchorStyle = (alterationCountAcrossCancerType === 0) ? { color:'#bbb' } : undefined;

            return (
                <MSKTab key={gene.hugoGeneSymbol} id={"summaryTab" + gene.hugoGeneSymbol} linkText={gene.hugoGeneSymbol} {...{anchorStyle}}>
                    <CancerSummaryContent
                        groupedAlterationData={alterationCountsForCancerTypesByGene[gene.hugoGeneSymbol]}
                        groupAlterationsBy={this.groupAlterationsBy}
                        gene={gene.hugoGeneSymbol}
                        labelTransformer={labelTransformer}
                        handlePivotChange={this.pivotData}
                        width={this.resultsViewPageWidth}/>
                </MSKTab>
            )
        });

        // only add combined gene tab if there's more than one gene
        if (geneTabs.length > 1) {
            const groupedAlterationDataForAllGenes = getAlterationCountsForCancerTypesForAllGenes(
                this.props.alterationsByGeneBySampleKey,
                this.props.samplesExtendedWithClinicalData,
                this.groupAlterationsBy);
            geneTabs.unshift(<MSKTab key="all" id="allGenes" linkText="All Queried Genes">
                <CancerSummaryContent gene={'all'}
                                      width={this.resultsViewPageWidth}
                                      groupedAlterationData={groupedAlterationDataForAllGenes}
                                      handlePivotChange={this.pivotData}
                                      labelTransformer={labelTransformer}
                                      groupAlterationsBy={this.groupAlterationsBy}
                />
            </MSKTab>)
        }
        return geneTabs;

    }

    public render() {
        return <div ref={(el: HTMLDivElement) => this.resultsViewPageContent = el} data-test="cancerTypeSummaryWrapper">
                <MSKTabs onTabClick={this.handleTabClick}
                         enablePagination={true}
                         unmountOnHide={true}
                         arrowStyle={{'line-height': .8}}
                         tabButtonStyle="pills"
                         activeTabId={this.activeTab} className="secondaryTabs">
                    {this.tabs}
                </MSKTabs>
            </div>
    }
};
