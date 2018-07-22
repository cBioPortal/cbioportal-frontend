import * as React from 'react';
import {inject, observer} from "mobx-react";
import styles from "./styles.module.scss";
import {MutatedGenesTable} from "./table/MutatedGenesTable";
import {CNAGenesTable} from "./table/CNAGenesTable";
import {ChartContainer} from 'pages/studyView/charts/ChartContainer';
import SurvivalChart from "../resultsView/survival/SurvivalChart";
import {MSKTab, MSKTabs} from "../../shared/components/MSKTabs/MSKTabs";
import {StudyViewComponentLoader} from "./charts/StudyViewComponentLoader";
import {ChartMeta, StudyViewPageStore, SurvivalType} from 'pages/studyView/StudyViewPageStore';
import {reaction} from 'mobx';
import {If} from 'react-if';
import SummaryHeader from 'pages/studyView/SummaryHeader';
import {SampleIdentifier} from 'shared/api/generated/CBioPortalAPI';
import StudyViewScatterPlot from "./charts/scatterPlot/StudyViewScatterPlot";
import {isSelected, mutationCountVsCnaTooltip} from "./StudyViewUtils";
import ReactGridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

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
            updateCustomCasesFilter: (cases: SampleIdentifier[]) => {
                this.store.updateCustomCasesFilter(cases);
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
        // Using custom component inside of the GridLayout creates too many chaos as mentioned here
        // https://github.com/STRML/react-grid-layout/issues/299
        // Option 1:    Always create div wrapper out of your custom component, but this solves all the issues.
        // Option 2:    Expose style, className in your component and apply all the properties in your component
        //              first division tag. And remember, you component has to use div as first child.
        //              This solution only works with grid layout, not resizing.
        // Decided to go with option 1 due to following reasons:
        // 1.   The ChartContainer will be used to include all charts in the study view.
        //      Then across the study page, there should be only one place to include ChartContainer component.
        // 2.   The maintainer of RGL repo currently not actively accepts pull requests. So we don't know when the
        //      issue will be solved.

        return (
            <div
                key={chartMeta.uniqueKey}
                className={styles.studyViewChartContainer}
            >
                <ChartContainer
                    chartMeta={chartMeta}
                    onUserSelection={this.handlers.onUserSelection}
                    key={chartMeta.uniqueKey}
                    filter={this.store.filters}
                    dataCache={this.store.studyViewClinicalDataCountsCache}
                    onDeleteChart={this.handlers.onDeleteChart}
                />
            </div>)
    };

    renderSurvivalPlot = (data: SurvivalType) => {
        return <div key={data.id} className={styles.studyViewSurvivalPlot}>
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
                                selectedSamples={this.store.selectedSamples.result!}
                                updateCustomCasesFilter={this.handlers.updateCustomCasesFilter}/>
                            {this.store.initialClinicalDataCounts.isComplete && (
                                <ReactGridLayout className="layout"
                                                 style={{width: this.store.containerWidth}}
                                                 width={this.store.containerWidth}
                                                 cols={this.store.studyViewPageLayoutProps.cols}
                                                 rowHeight={this.store.studyViewPageLayoutProps.rowHeight}
                                                 layout={this.store.studyViewPageLayoutProps.layout}
                                                 draggableHandle={'.fa-arrows'}>
                                    {this.store.visibleAttributes.map(this.renderAttributeChart)}
                                </ReactGridLayout>
                            )}
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
                                {this.store.mutationCountVsFractionGenomeAlteredData.isComplete && (
                                    <StudyViewScatterPlot
                                        width={500}
                                        height={500}
                                        onSelection={this.handlers.updateCustomCasesFilter}
                                        data={this.store.mutationCountVsFractionGenomeAlteredData.result}
                                        isLoading={this.store.selectedSamples.isPending}
                                        isSelected={d=>isSelected(d, this.store.selectedSamplesMap)}
                                        selectedFill="#ff0000"
                                        unselectedFill="#0000ff"
                                        axisLabelX="Fraction of copy number altered genome"
                                        axisLabelY="# of mutations"
                                        title="Mutation Count vs. CNA"
                                        tooltip={mutationCountVsCnaTooltip}
                                    />
                                )}
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
