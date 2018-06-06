import * as React from 'react';
import {inject, observer} from "mobx-react";
import styles from "./styles.module.scss";
import {MutatedGenesTable} from "./table/MutatedGenesTable";
import {CNAGenesTable} from "./table/CNAGenesTable";
import {ChartContainer} from 'pages/studyView/charts/ChartContainer';
import SurvivalChart from "../resultsView/survival/SurvivalChart";
import {MSKTab, MSKTabs} from "../../shared/components/MSKTabs/MSKTabs";
import {StudyViewComponentLoader} from "./charts/StudyViewComponentLoader";
import { StudyViewPageStore, ClinicalDataType, SurvivalType, ChartMeta, ChartType } from 'pages/studyView/StudyViewPageStore';
import { reaction } from 'mobx';
const CheckedSelect = require("react-select-checked").CheckedSelect;

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
    private handlers:any;

    constructor(props: IStudyViewPageProps) {
        super();
        this.store = new StudyViewPageStore();

        this.handlers = {
            onUserSelection: (chartMeta : ChartMeta, values: string[])=> {
                this.store.updateClinicalDataEqualityFilters(chartMeta, values)
            },
            updateGeneFilter:(entrezGeneId: number)=>{
                this.store.updateGeneFilter(entrezGeneId);
            },
            updateCNAGeneFilter:(entrezGeneId: number, alteration: number)=> {
                this.store.updateCNAGeneFilter(entrezGeneId, alteration);
            },
            onDeleteChart:(uniqueKey:string)=>{
                this.store.changeChartVisibility(uniqueKey, false);
            },
            changeChartType: (uniqueKey: string, chartType: ChartType, updateDefaultType?:boolean)=> {
                this.store.changeChartType(uniqueKey, chartType, updateDefaultType)
            },
            onChangeSelectedClinicalChart:(options: {label: string; value: string;}[])=>{
                this.store.onChangeSelectedClinicalChart(options)
            } 
        }

        //TODO: this should be done by a module so that it can be reused on other pages
        reaction(
            () => props.routing.location.query,
            query => {
                if ('studyId' in query) {
                    this.store.studyId = query.studyId;
                    this.store.sampleAttrIds = ('sampleAttrIds' in query ? (query.sampleAttrIds  as string).split(",") : []);
                    this.store.patientAttrIds = ('patientAttrIds' in query ? (query.patientAttrIds as string).split(",") : []);
                }
            },
            {fireImmediately: true}
        );
    }

    renderAttributeChart = (chartMeta: ChartMeta) => {
        return (<ChartContainer
            chartMeta={chartMeta}
            onUserSelection={this.handlers.onUserSelection}
            key={chartMeta.uniqueKey}
            filter={this.store.filters}
            dataCache ={this.store.studyViewClinicalDataCountsCache}
            onDeleteChart={this.handlers.onDeleteChart}
            changeChartType={this.handlers.changeChartType}
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
                                   fileName="Overall_Survival"/>
                </StudyViewComponentLoader>
            </div>
        </div>
    }

    render() {
        let cancerStudy = this.store.studyMetaData.result!;
        return (
            <div className="studyView">
                <div className="topBanner">
                    {
                        this.store.studyMetaData.isComplete && (
                            <div className="studyViewHeader">
                                <h3>{cancerStudy.name}</h3>
                                <p dangerouslySetInnerHTML={{__html: cancerStudy.description}}></p>
                            </div>
                        )
                    }
                </div>
                <MSKTabs id="studyViewTabs" activeTabId={this.props.routing.location.query.tab}
                         className="mainTabs">

                    <MSKTab key={0} id="summaryTab" linkText="Summary">
                        <div style={{"width":"250px"}}>
                            <CheckedSelect
                                placeholder="Add clinical tracks.."
                                isLoading={this.store.initialized}
                                noResultsText={this.store.initialized ? "Loading..." : "No matching clinical tracks found"}
                                onChange={this.handlers.onChangeSelectedClinicalChart}
                                options={this.store.clinicalChartOptions}
                                value={this.store.selectedClinicalCharts}
                            />
                        </div>
                            <div className={styles.studyViewFlexContainer}>
                                {this.store.visibleAttributes.map(this.renderAttributeChart)}
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
                                />
                                <CNAGenesTable
                                    promise={this.store.cnaGeneData}
                                    numOfSelectedSamples={100}
                                    filters={this.store.getCNAGenesTableFilters()}
                                    toggleSelection={this.handlers.updateCNAGeneFilter}
                                />
                            </div>
                    </MSKTab>
                </MSKTabs>
            </div>
        )
    }
}
