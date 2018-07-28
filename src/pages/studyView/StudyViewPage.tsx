import * as React from 'react';
import {inject, observer} from "mobx-react";
import styles from "./styles.module.scss";
import {MutatedGenesTable} from "./table/MutatedGenesTable";
import {CNAGenesTable} from "./table/CNAGenesTable";
import {ChartContainer} from 'pages/studyView/charts/ChartContainer';
import {MSKTab, MSKTabs} from "../../shared/components/MSKTabs/MSKTabs";
import {ChartMeta, ChartType, StudyViewPageStore} from 'pages/studyView/StudyViewPageStore';
import {reaction} from 'mobx';
import {If} from 'react-if';
import SummaryHeader from 'pages/studyView/SummaryHeader';
import {SampleIdentifier} from 'shared/api/generated/CBioPortalAPI';
import StudyViewScatterPlot from "./charts/scatterPlot/StudyViewScatterPlot";
import {isSelected, mutationCountVsCnaTooltip} from "./StudyViewUtils";
import MobxPromise from "mobxpromise";

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
            {fireImmediately: true}
        );
    }

    renderAttributeChart = (chartMeta: ChartMeta) => {
        let promise: MobxPromise<any>;
        switch (chartMeta.chartType) {
            case ChartType.PIE_CHART: {
                promise = this.store.studyViewClinicalDataCountsCache.get({
                    attribute: chartMeta.clinicalAttribute!,
                    filters: this.store.filters
                });
                break;
            }
            case ChartType.TABLE: {
                promise = this.store.studyViewClinicalDataCountsCache.get({
                    attribute: chartMeta.clinicalAttribute!,
                    filters: this.store.filters
                });
                break;
            }
            case ChartType.SURVIVAL: {
                promise = this.store.getSurvivalData(chartMeta);
                break;
            }
            default:
                promise = this.store.survivalPlotData;
                break;
        }
        return (<ChartContainer
            chartMeta={chartMeta}
            onUserSelection={this.handlers.onUserSelection}
            key={chartMeta.uniqueKey}
            filter={this.store.filters}
            promise={promise}
            onDeleteChart={this.handlers.onDeleteChart}
        />)
    };

    render() {
        if (this.store.studies.isComplete) {
            return (
                <div className="studyView">
                    <div className="topBanner">
                        <div className="studyViewHeader">
                            <If condition={this.store.studies.result.length === 1}>
                                <div>
                                    <h3>{this.store.studies.result![0].name}</h3>
                                    <p dangerouslySetInnerHTML={{__html: this.store.studies.result![0].description}}></p>
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
                            <div className={styles.studyViewFlexContainer}>
                                {this.store.initialClinicalDataCounts.isComplete &&
                                this.store.visibleAttributes.map(this.renderAttributeChart)}
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
                                        isSelected={d => isSelected(d, this.store.selectedSamplesMap)}
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
