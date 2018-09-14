import * as React from 'react';
import {inject, observer} from "mobx-react";
import styles from "./styles.module.scss";
import {ChartContainer, IChartContainerProps} from 'pages/studyView/charts/ChartContainer';
import { MSKTab, MSKTabs } from "../../shared/components/MSKTabs/MSKTabs";
import {reaction, observable, runInAction} from 'mobx';
import { If } from 'react-if';
import {ChartMeta, ChartType, DataBinMethodConstants, StudyViewPageStore, AnalysisGroup} from 'pages/studyView/StudyViewPageStore';
import SummaryHeader from 'pages/studyView/SummaryHeader';
import {Gene, SampleIdentifier, ClinicalAttribute} from 'shared/api/generated/CBioPortalAPI';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import AppConfig from 'appConfig';
import {ClinicalDataIntervalFilterValue, DataBin} from "shared/api/generated/CBioPortalAPIInternal";
import {CopyNumberGeneFilterElement} from "../../shared/api/generated/CBioPortalAPIInternal";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import {ClinicalDataTab} from "./tabs/ClinicalDataTab";
import setWindowVariable from "../../shared/lib/setWindowVariable";
import * as _ from 'lodash';
import ErrorBox from 'shared/components/errorBox/ErrorBox';
import {stringListToSet} from "../../shared/lib/StringUtils";

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

    @observable showErrorMessage = true;

    constructor(props: IStudyViewPageProps) {
        super();
        this.store = new StudyViewPageStore();

        setWindowVariable("studyViewPageStore", this.store);

        this.handlers = {
            onValueSelection: (chartMeta: ChartMeta, values: string[]) => {
                this.store.updateClinicalDataEqualityFilters(chartMeta, values);
            },
            onDataBinSelection: (chartMeta: ChartMeta, dataBins: DataBin[]) => {
                this.store.updateClinicalDataIntervalFilters(chartMeta, dataBins);
            },
            onUpdateIntervalFilters: (chartMeta: ChartMeta, values: ClinicalDataIntervalFilterValue[]) => {
                this.store.updateClinicalDataIntervalFiltersByValues(chartMeta, values);
            },
            onToggleLogScale: (chartMeta: ChartMeta) => {
                this.store.toggleLogScale(chartMeta);
            },
            addGeneFilters: (entrezGeneIds: number[]) => {
                this.store.addGeneFilters(entrezGeneIds);
            },
            resetGeneFilter: (chartMeta: ChartMeta) => {
                this.store.resetGeneFilter();
            },
            resetCNAGeneFilter: (chartMeta: ChartMeta) => {
                this.store.resetCNAGeneFilter();
            },
            addCNAGeneFilters: (filters:CopyNumberGeneFilterElement[]) => {
                this.store.addCNAGeneFilters(filters);
            },
            onDeleteChart: (chartMeta: ChartMeta) => {
                // reset analysis groups settings if theyre based on this chart
                if (this.store.analysisGroupsSettings.clinicalAttribute &&
                        chartMeta.clinicalAttribute &&
                        chartMeta.clinicalAttribute.clinicalAttributeId === this.store.analysisGroupsSettings.clinicalAttribute.clinicalAttributeId) {
                    this.store.clearAnalysisGroupsSettings();
                }

                this.store.resetFilterAndChangeChartVisibility(chartMeta, false);
            },
            updateChartSampleIdentifierFilter: (uniqueKey:string, cases: SampleIdentifier[], keepCurrent?:boolean) => {
                this.store.updateChartSampleIdentifierFilter(uniqueKey, cases, keepCurrent);
            },
            updateSelectedGenes:(query: SingleGeneQuery[], genesInQuery: Gene[])=>{
                this.store.updateSelectedGenes(query, genesInQuery);
            },
            clearCNAGeneFilter: () => {
                this.store.clearCNAGeneFilter();
            },
            clearGeneFilter: () => {
                this.store.clearGeneFilter();
            },
            clearChartSampleIdentifierFilter: (chartMeta: ChartMeta) => {
                this.store.clearChartSampleIdentifierFilter(chartMeta);
            },
            clearAllFilters: () => {
                this.store.clearAllFilters();
            },
            updateChartsVisibility: (visibleChartIds: string[]) => {
                this.store.updateChartsVisibility(visibleChartIds);
            }

        }

        //TODO: this should be done by a module so that it can be reused on other pages
        reaction(
            () => props.routing.location.query,
            query => {
                let newStudyIds:string[]|null = null;
                if ('studyId' in query) {
                    newStudyIds = (query.studyId as string).split(",");
                }
                if ('id' in query) {
                    newStudyIds = (query.id as string).split(",");
                }
                if (newStudyIds !== null) {
                    const newStudyIdsMap = stringListToSet(newStudyIds);
                    const existingStudyIdsMap = stringListToSet(this.store.studyIds);
                    if (!_.isEqual(newStudyIdsMap, existingStudyIdsMap)) {
                        // if new study ids in routing location, update store
                        runInAction(()=>{
                            this.store.studyIds = newStudyIds!;
                            this.store.sampleAttrIds = ('sampleAttrIds' in query ? (query.sampleAttrIds as string).split(",") : []);
                            this.store.patientAttrIds = ('patientAttrIds' in query ? (query.patientAttrIds as string).split(",") : []);
                        });
                    }
                }
            },
            {fireImmediately: true}
        );
    }

    renderAttributeChart = (chartMeta: ChartMeta) => {
        const props:Partial<IChartContainerProps> = {
            chartMeta: chartMeta,
            title: chartMeta.displayName,
            filters: [],
            onDeleteChart: this.handlers.onDeleteChart,
            analysisGroupsPossible:this.store.analysisGroupsPossible,
            setAnalysisGroupsSettings: (attribute:ClinicalAttribute, grps:ReadonlyArray<AnalysisGroup>)=>{
                this.store.updateAnalysisGroupsSettings(attribute, grps);
            },
            analysisGroupsSettings: this.store.analysisGroupsSettings
        };

        switch (chartMeta.chartType) {
            case ChartType.PIE_CHART: {
                props.promise = this.store.studyViewClinicalDataCountsCache.get({
                    attribute: chartMeta.clinicalAttribute!,
                    filters: this.store.filters
                });
                props.filters = this.store.getClinicalDataFiltersByUniqueKey(chartMeta.uniqueKey);
                props.onValueSelection = this.handlers.onValueSelection;
                props.onResetSelection = this.handlers.onValueSelection;
                props.download = [
                    {
                        initDownload: () => this.store.getClinicalData(chartMeta),
                        type: 'TSV'
                    }, {
                        type: 'SVG'
                    }, {
                        type: 'PDF'
                    }
                ];
                break;
            }
            case ChartType.BAR_CHART: {
                props.promise = this.store.studyViewClinicalDataBinCountsCache.get({
                    attribute: chartMeta.clinicalAttribute!,
                    filters: this.store.filters,
                    disableLogScale: this.store.isLogScaleDisabled(chartMeta.uniqueKey),
                    method: DataBinMethodConstants.STATIC // TODO this.barChartFilters.length > 0 ? 'STATIC' : 'DYNAMIC' (not trivial when multiple filters involved)
                });
                props.filters = this.store.getClinicalDataIntervalFiltersByUniqueKey(chartMeta.uniqueKey);
                props.onDataBinSelection = this.handlers.onDataBinSelection;
                props.onResetSelection = this.handlers.onDataBinSelection;
                props.onToggleLogScale = this.handlers.onToggleLogScale;
                props.showLogScaleToggle = this.store.isLogScaleToggleVisible(
                    chartMeta.uniqueKey, props.promise.result);
                props.logScaleChecked = this.store.isLogScaleChecked(chartMeta.uniqueKey);
                props.download = [
                    {
                        initDownload: () => this.store.getClinicalData(chartMeta),
                        type: 'TSV'
                    }, {
                        type: 'SVG'
                    }, {
                        type: 'PDF'
                    }
                ];
                break;
            }
            case ChartType.TABLE: {
                props.filters = this.store.getClinicalDataFiltersByUniqueKey(chartMeta.uniqueKey);
                props.promise = this.store.studyViewClinicalDataCountsCache.get({
                    attribute: chartMeta.clinicalAttribute!,
                    filters: this.store.filters
                });
                props.onValueSelection = this.handlers.onValueSelection;
                props.onResetSelection = this.handlers.onValueSelection;
                props.download = [
                    {
                        // TODO implement a proper data download function
                        initDownload: () => Promise.resolve("NA"),
                        type: 'TSV'
                    }
                ];
                break;
            }
            case ChartType.MUTATED_GENES_TABLE: {
                props.filters = this.store.getMutatedGenesTableFilters();
                props.promise = this.store.mutatedGeneData;
                props.onValueSelection = this.handlers.addGeneFilters;
                props.onResetSelection = this.handlers.resetGeneFilter;
                props.selectedGenes=this.store.selectedGenes;
                props.onGeneSelect=this.store.onCheckGene;
                props.title = props.title + ( !this.store.molecularProfileSampleCounts.isComplete || this.store.molecularProfileSampleCounts.result === undefined ? '' : ` (${this.store.molecularProfileSampleCounts.result.numberOfMutationProfiledSamples} profiled samples)`),
                props.download = [
                    {
                        // TODO implement a proper data download function
                        initDownload: () => this.store.getMutatedGenesDownloadData(),
                        type: 'TSV'
                    }
                ];
                break;
            }
            case ChartType.CNA_GENES_TABLE: {
                props.filters = this.store.getCNAGenesTableFilters();
                props.promise = this.store.cnaGeneData;
                props.onValueSelection = this.handlers.addCNAGeneFilters;
                props.onResetSelection = this.handlers.resetCNAGeneFilter;
                props.selectedGenes=this.store.selectedGenes;
                props.onGeneSelect=this.store.onCheckGene;
                props.title = props.title + ( !this.store.molecularProfileSampleCounts.isComplete || this.store.molecularProfileSampleCounts.result === undefined ? '' : ` (${this.store.molecularProfileSampleCounts.result.numberOfCNAProfiledSamples} profiled samples)`),
                props.download = [
                    {
                        // TODO implement a proper data download function
                        initDownload: () => this.store.getGenesCNADownloadData(),
                        type: 'TSV'
                    }
                ];
                break;
            }
            case ChartType.SURVIVAL: {
                props.promise = this.store.survivalPlotData;
                props.download = [
                    {
                        initDownload: () => this.store.getSurvivalDownloadData(chartMeta),
                        type: 'TSV'
                    }
                ];
                // only want to pass these in when necessary, otherwise charts will unnecessarily update when they change
                props.patientKeysWithNAInSelectedClinicalData = this.store.patientKeysWithNAInSelectedClinicalData;
                props.patientToAnalysisGroup = this.store.patientToAnalysisGroup;
                break;
            }
            case ChartType.SCATTER: {
                props.filters = this.store.getChartSampleIdentifiersFilter(props.chartMeta?props.chartMeta.uniqueKey:'');
                props.promise = this.store.mutationCountVsFractionGenomeAlteredData;
                props.selectedSamplesMap = this.store.selectedSamplesMap;
                props.selectedSamples = this.store.selectedSamples;
                props.onValueSelection = (cases: SampleIdentifier[], keepCurrent?:boolean)=>{
                    this.handlers.updateChartSampleIdentifierFilter(props.chartMeta?props.chartMeta.uniqueKey:'',cases,keepCurrent);
                }
                props.onResetSelection = ()=>{
                    this.handlers.updateChartSampleIdentifierFilter(props.chartMeta?props.chartMeta.uniqueKey:'',[]);
                }
                props.sampleToAnalysisGroup = this.store.sampleToAnalysisGroup;
                break;
            }
            default:
                break;
        }
        return <ChartContainer key={chartMeta.uniqueKey} {...(props as any)}/>;
    };

    private handleTabChange(id: string) {
        this.props.routing.updateRoute({ tab: id });
    }

    render() {
        if (
            this.store.queriedSampleIdentifiers.isComplete &&
            this.store.invalidSampleIds.isComplete &&
            _.isEmpty(this.store.unknownQueriedIds) &&
            !_.isEmpty(this.store.queriedStudies)
            ) {
            return (
                <div className="studyView">
                    <div className="topBanner">
                        <div className="studyViewHeader">
                            <If condition={this.store.queriedStudies.length === 1}>
                                <div>
                                    <h3>{this.store.queriedStudies![0].name}</h3>
                                    <p dangerouslySetInnerHTML={{ __html: this.store.queriedStudies![0].description }}></p>
                                </div>
                            </If>
                            {/*TDOD: currently show as Multiple Studies but should be shandles properly, i.e as in production*/}
                            <If condition={this.store.queriedStudies!.length > 1}>
                                <h3>Multiple Studies</h3>
                            </If>
                        </div>
                    </div>
                    <MSKTabs id="studyViewTabs" activeTabId={this.props.routing.location.query.tab}
                             onTabClick={(id:string)=>this.handleTabChange(id)}
                             className="mainTabs"
                    >

                        <MSKTab key={0} id="summary" linkText="Summary">
                            {
                                this.store.invalidSampleIds.result.length > 0 &&
                                this.showErrorMessage &&
                                <div>
                                    <div className="alert alert-danger">
                                        <button type="button" className="close" onClick={(event) => this.showErrorMessage = false}>&times;</button>
                                        The following sample(s) might have been deleted/updated with the recent data updates
                                        <br />

                                        <ul style={{ listStyle: "none", padding: "10px",     maxHeight: "300px", overflowY: "scroll"}}>
                                            {this.store.invalidSampleIds.result.map(sample => <li>{sample.studyId + ':' + sample.sampleId}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            }
                            <SummaryHeader
                                geneQuery={this.store.geneQueryStr}
                                selectedSamples={this.store.selectedSamples.result!}
                                updateCustomCasesFilter={(cases: SampleIdentifier[], keepCurrent?:boolean)=>{
                                    this.handlers.updateChartSampleIdentifierFilter('customFilters',cases,keepCurrent);
                                }}
                                updateSelectedGenes={this.handlers.updateSelectedGenes}
                                studyWithSamples={this.store.studyWithSamples.result}
                                filter={this.store.userSelections}
                                attributesMetaSet={this.store.chartMetaSet}
                                user={AppConfig.userEmailAddress}
                                getClinicalData={this.store.getDownloadDataPromise}
                                onSubmitQuery={()=> this.store.onSubmitQuery()}
                                updateClinicalDataEqualityFilter={this.handlers.onValueSelection}
                                updateClinicalDataIntervalFilter={this.handlers.onUpdateIntervalFilters}
                                clearCNAGeneFilter={this.handlers.clearCNAGeneFilter}
                                clearGeneFilter={this.handlers.clearGeneFilter}
                                clearChartSampleIdentifierFilter={this.handlers.clearChartSampleIdentifierFilter}
                                clearAllFilters={this.handlers.clearAllFilters}
                                clinicalAttributesWithCountPromise={this.store.clinicalAttributesWithCount}
                                visibleAttributeIds={this.store.visibleAttributes}
                                onChangeChartsVisibility={this.handlers.updateChartsVisibility}
                            />
                            <div className={styles.studyViewFlexContainer}>
                                {this.store.initialClinicalDataCounts.isComplete &&
                                this.store.initialClinicalDataBins.isComplete &&
                                this.store.visibleAttributes.map(this.renderAttributeChart)}

                            </div>
                        </MSKTab>
                        <MSKTab key={1} id={"clinicalData"} linkText={"Clinical Data"}>
                            <If condition={this.store.getDataForClinicalDataTab.isPending}>
                                <LoadingIndicator
                                    isLoading={!!this.store.getDataForClinicalDataTab.isPending}
                                />
                            </If>
                            <If condition={this.store.getDataForClinicalDataTab.isError}>
                                <div>Error when loading data.</div>
                            </If>
                            <If condition={this.store.getDataForClinicalDataTab.isComplete}>
                                <ClinicalDataTab
                                    data={this.store.getDataForClinicalDataTab.result}
                                    clinicalAttributes={this.store.clinicalAttributes.result}
                                    selectedSamples={this.store.selectedSamples.result!}
                                />
                            </If>
                        </MSKTab>
                    </MSKTabs>
                </div>
            )
        } else {
            //TODO: update with loading
            if(this.store.filteredVirtualStudies.isComplete && !_.isEmpty(this.store.unknownQueriedIds)) {
                return (
                    <div style={{ margin: "0px auto", maxWidth: "50%", fontSize: "16px" }}>
                        <ErrorBox error={Error(`Unknown/Unauthorized studies ${this.store.unknownQueriedIds.join(', ')}`)} />
                    </div>
                )
            }
            return null;
        }
    }
}
