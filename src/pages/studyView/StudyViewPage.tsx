import * as React from 'react';
import { inject, observer } from "mobx-react";
import styles from "./styles.module.scss";
import { MutatedGenesTable } from "./table/MutatedGenesTable";
import { CNAGenesTable } from "./table/CNAGenesTable";
import { ChartContainer } from 'pages/studyView/charts/ChartContainer';
import SurvivalChart from "../resultsView/survival/SurvivalChart";
import { MSKTab, MSKTabs } from "../../shared/components/MSKTabs/MSKTabs";
import { StudyViewComponentLoader } from "./charts/StudyViewComponentLoader";
import { StudyViewPageStore, SurvivalType, ChartMeta } from 'pages/studyView/StudyViewPageStore';
import { reaction } from 'mobx';
import { If } from 'react-if';
import SummaryHeader from 'pages/studyView/SummaryHeader';
import { Sample, Gene } from 'shared/api/generated/CBioPortalAPI';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';

export interface IStudyViewPageProps {
    routing: any;
}

// making this an observer (mobx-react) causes this component to re-render any time
// there is a change to any observable value which is referenced in its render method. 
// Even if this value is referenced deep within some helper method
@inject('routing')
@observer
export default class StudyViewPage extends React.Component<IStudyViewPageProps, {}> {

    private store: StudyViewPageStore;
    private queryInput: HTMLInputElement;
    private handlers: any;

    constructor(props: IStudyViewPageProps) {
        super();
        this.store = new StudyViewPageStore();

        this.handlers = {
            onUserSelection: (chartMeta: ChartMeta, values: string[]) => {
                this.store.updateClinicalDataEqualityFilters(chartMeta, values)
            },
            updateGeneFilter: (entrezGeneId: number) => {
                this.store.updateGeneFilter(entrezGeneId);
            },
            updateCNAGeneFilter: (entrezGeneId: number, alteration: number) => {
                this.store.updateCNAGeneFilter(entrezGeneId, alteration);
            },
            onDeleteChart: (uniqueKey: string) => {
                this.store.changeChartVisibility(uniqueKey, false);
            },
            updateCustomCasesFilter: (cases: Sample[]) => {
                this.store.updateCustomCasesFilter(cases);
            },
            updateSelectedGenes:(query: SingleGeneQuery[], genesInQuery: Gene[])=>{
                this.store.updateSelectedGenes(query, genesInQuery);
            }
        }

        //TODO: this should be done by a module so that it can be reused on other pages
        reaction(
            () => props.routing.location.query,
            query => {
                if ('studyId' in query) {
                    this.store.studyIds = (query.studyId as string).split(",");
                }
                if ('id' in query) {
                    this.store.studyIds = (query.id as string).split(",");
                }
                if (this.store.studyIds) {
                    this.store.sampleAttrIds = ('sampleAttrIds' in query ? (query.sampleAttrIds as string).split(",") : []);
                    this.store.patientAttrIds = ('patientAttrIds' in query ? (query.patientAttrIds as string).split(",") : []);
                }
            },
            { fireImmediately: true }
        );
    }

    renderAttributeChart = (chartMeta: ChartMeta) => {
        return (<ChartContainer
            chartMeta={chartMeta}
            onUserSelection={this.handlers.onUserSelection}
            key={chartMeta.uniqueKey}
            filter={this.store.filters}
            dataCache={this.store.studyViewClinicalDataCountsCache}
            onDeleteChart={this.handlers.onDeleteChart}
        />)
    };

    renderSurvivalPlot = (data: SurvivalType) => {
        return <div className={styles.studyViewSurvivalPlot}>
            <div className={styles.studyViewSurvivalPlotTitle}>{data.title}</div>
            <div className={styles.studyViewSurvivalPlotBody}>
                <StudyViewComponentLoader promise={this.store.survivalPlotData}>
                    <SurvivalChart alteredPatientSurvivals={data.alteredGroup}
                        unalteredPatientSurvivals={data.unalteredGroup}
                        title={'test'}
                        xAxisLabel="Months Survival"
                        yAxisLabel="Surviving"
                        totalCasesHeader="Number of Cases, Total"
                        statusCasesHeader="Number of Cases, Deceased"
                        medianMonthsHeader="Median Months Survival"
                        yLabelTooltip="Survival estimate"
                        xLabelWithEventTooltip="Time of death"
                        xLabelWithoutEventTooltip="Time of last observation"
                        showDownloadButtons={false}
                        showTable={false}
                        showLegend={false}
                        styleOpts={{
                            width: 450,
                            height: 300
                        }}
                        fileName="Overall_Survival" />
                </StudyViewComponentLoader>
            </div>
        </div>
    }

    render() {
        if (this.store.studies.isComplete) {
            return (
                <div className="studyView">
                    <div className="topBanner">
                        <div className="studyViewHeader">
                            <If condition={this.store.studies.result.length === 1}>
                                <div>
                                    <h3>{this.store.studies.result![0].name}</h3>
                                    <p dangerouslySetInnerHTML={{ __html: this.store.studies.result![0].description }}></p>
                                </div>
                            </If>
                            {/*TDOD: currently show as Multiple Studies but should be shandles properly, i.e as in production*/}
                            <If condition={this.store.studies.result!.length > 1}>
                                <h3>Multiple Studies</h3>
                            </If>
                        </div>
                    </div>
                    <MSKTabs id="studyViewTabs" activeTabId={this.props.routing.location.query.tab}
                        className="mainTabs">

                        <MSKTab key={0} id="summaryTab" linkText="Summary">
                            <SummaryHeader
                                geneQuery={this.store.geneQueryStr}
                                selectedSamples={this.store.selectedSamples.result!}
                                updateCustomCasesFilter={this.handlers.updateCustomCasesFilter}
                                updateSelectedGenes={this.handlers.updateSelectedGenes}
                            />
                            <div className={styles.studyViewFlexContainer}>
                                {this.store.initialClinicalDataCounts.isComplete && 
                                    this.store.visibleAttributes.map(this.renderAttributeChart)}
                            </div>
                            <div className={styles.studyViewFlexContainer}>
                                {this.store.survivalPlotData.result.map(this.renderSurvivalPlot)}
                            </div>
                            <div className={styles.studyViewFlexContainer}>
                                <MutatedGenesTable
                                    promise={this.store.mutatedGeneData}
                                    numOfSelectedSamples={100}
                                    filters={this.store.getMutatedGenesTableFilters()}
                                    toggleSelection={this.handlers.updateGeneFilter}
                                    selectedGenes={this.store.selectedGenes}
                                    onGeneSelect={this.store.onCheckGene}
                                />
                                <CNAGenesTable
                                    promise={this.store.cnaGeneData}
                                    numOfSelectedSamples={100}
                                    filters={this.store.getCNAGenesTableFilters()}
                                    toggleSelection={this.handlers.updateCNAGeneFilter}
                                    selectedGenes={this.store.selectedGenes}
                                    onGeneSelect={this.store.onCheckGene}
                                />
                            </div>
                        </MSKTab>
                    </MSKTabs>
                </div>
            )
        } else {
            //TODO: update with loading
            return null;
        }

    }
}
