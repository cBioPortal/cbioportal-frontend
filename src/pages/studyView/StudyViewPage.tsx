import * as React from 'react';
import {inject, observer} from "mobx-react";
import styles from "./styles.module.scss";
import { MutatedGenesTable } from "./table/MutatedGenesTable";
import { CNAGenesTable } from "./table/CNAGenesTable";
import {ChartContainer, IChartContainerProps} from 'pages/studyView/charts/ChartContainer';
import SurvivalChart from "../resultsView/survival/SurvivalChart";
import { MSKTab, MSKTabs } from "../../shared/components/MSKTabs/MSKTabs";
import { StudyViewComponentLoader } from "./charts/StudyViewComponentLoader";
import { reaction } from 'mobx';
import { If } from 'react-if';
import {ChartMeta, ChartType, StudyViewPageStore, AnalysisGroup} from 'pages/studyView/StudyViewPageStore';
import SummaryHeader from 'pages/studyView/SummaryHeader';
import {Sample, Gene, SampleIdentifier, ClinicalAttribute} from 'shared/api/generated/CBioPortalAPI';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import {isSelected, mutationCountVsCnaTooltip} from "./StudyViewUtils";
import AppConfig from 'appConfig';
import MobxPromise from "mobxpromise";
import {CopyNumberGeneFilterElement} from "../../shared/api/generated/CBioPortalAPIInternal";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import {ClinicalDataTab} from "./tabs/ClinicalDataTab";
import setWindowVariable from "../../shared/lib/setWindowVariable";

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

        setWindowVariable("studyViewPageStore", this.store);

        this.handlers = {
            onUserSelection: (chartMeta: ChartMeta, values: string[]) => {
                this.store.updateClinicalDataEqualityFilters(chartMeta, values)
            },
            updateGeneFilters: (entrezGeneIds: number[]) => {
                this.store.updateGeneFilters(entrezGeneIds);
            },
            resetGeneFilter: (chartMeta: ChartMeta) => {
                this.store.resetGeneFilter();
            },
            resetCNAGeneFilter: (chartMeta: ChartMeta) => {
                this.store.resetCNAGeneFilter();
            },
            updateCNAGeneFilters: (filters:CopyNumberGeneFilterElement[]) => {
                this.store.updateCNAGeneFilters(filters);
            },
            onDeleteChart: (chartMeta: ChartMeta) => {
                this.store.resetFilterAndChangeChartVisibility(chartMeta, false);
            },
            updateCustomCasesFilter: (cases: SampleIdentifier[], keepCurrent?:boolean) => {
                this.store.updateCustomCasesFilter(cases, keepCurrent);
            },
            updateSelectedGenes:(query: SingleGeneQuery[], genesInQuery: Gene[])=>{
                this.store.updateSelectedGenes(query, genesInQuery);
            },
            resetCustomCasesFilter: () => {
                this.store.resetCustomCasesFilter();
            },
            clearCNAGeneFilter: () => {
                this.store.clearCNAGeneFilter();
            },
            clearGeneFilter: () => {
                this.store.clearGeneFilter();
            },
            clearCustomCasesFilter: () => {
                this.store.clearCustomCasesFilter();
            },
            clearAllFilters: () => {
                this.store.clearAllFilters();
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
        let props:Partial<IChartContainerProps> = {
            chartMeta: chartMeta,
            filters: [],
            onDeleteChart: this.handlers.onDeleteChart,
            analysisGroupsPossible:this.store.analysisGroupsPossible,
            setAnalysisGroupsSettings: (attribute:ClinicalAttribute, grps:ReadonlyArray<AnalysisGroup>)=>{
                this.store.updateAnalysisGroupsSettings(attribute, grps);
            },
        };
        switch (chartMeta.chartType) {
            case ChartType.PIE_CHART: {
                props.promise = this.store.studyViewClinicalDataCountsCache.get({
                    attribute: chartMeta.clinicalAttribute!,
                    filters: this.store.filters
                });
                props.filters = this.store.getClinicalDataFiltersByUniqueKey(chartMeta.uniqueKey);
                props.onUserSelection = this.handlers.onUserSelection;
                props.onResetSelection = this.handlers.onUserSelection;
                break;
            }
            case ChartType.TABLE: {
                props.filters = this.store.getClinicalDataFiltersByUniqueKey(chartMeta.uniqueKey);
                props.promise = this.store.studyViewClinicalDataCountsCache.get({
                    attribute: chartMeta.clinicalAttribute!,
                    filters: this.store.filters
                });
                props.onUserSelection = this.handlers.onUserSelection;
                props.onResetSelection = this.handlers.onUserSelection;
                break;
            }
            case ChartType.MUTATED_GENES_TABLE: {
                props.filters = this.store.getMutatedGenesTableFilters();
                props.promise = this.store.mutatedGeneData;
                props.onUserSelection = this.handlers.updateGeneFilters;
                props.onResetSelection = this.handlers.resetGeneFilter;
                props.selectedGenes=this.store.selectedGenes;
                props.onGeneSelect=this.store.onCheckGene;
                break;
            }
            case ChartType.CNA_GENES_TABLE: {
                props.filters = this.store.getCNAGenesTableFilters();
                props.promise = this.store.cnaGeneData;
                props.onUserSelection = this.handlers.updateCNAGeneFilters;
                props.onResetSelection = this.handlers.resetCNAGeneFilter;
                props.selectedGenes=this.store.selectedGenes;
                props.onGeneSelect=this.store.onCheckGene;
                break;
            }
            case ChartType.SURVIVAL: {
                props.promise = this.store.getSurvivalData(chartMeta);
                // only want to pass these in when necessary, otherwise charts will unnecessarily update when they change
                props.patientKeysWithNAInSelectedClinicalData = this.store.patientKeysWithNAInSelectedClinicalData;
                props.analysisGroupsSettings = this.store.analysisGroupsSettings;
                props.patientToAnalysisGroup = this.store.patientToAnalysisGroup;
                break;
            }
            case ChartType.SCATTER: {
                props.filters = this.store.getCustomCasesFilter();
                props.promise = this.store.mutationCountVsFractionGenomeAlteredData;
                props.selectedSamplesMap = this.store.selectedSamplesMap;
                props.selectedSamples = this.store.selectedSamples;
                props.onUserSelection = this.handlers.updateCustomCasesFilter;
                props.onResetSelection = this.handlers.resetCustomCasesFilter;
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
                             onTabClick={(id:string)=>this.handleTabChange(id)}
                             className="mainTabs">

                        <MSKTab key={0} id="summary" linkText="Summary">
                            <SummaryHeader
                                geneQuery={this.store.geneQueryStr}
                                selectedSamples={this.store.selectedSamples.result!}
                                updateCustomCasesFilter={this.handlers.updateCustomCasesFilter}
                                updateSelectedGenes={this.handlers.updateSelectedGenes}
                                studyWithSamples={this.store.studyWithSamples.result}
                                filter={this.store.filters}
                                attributesMetaSet={this.store.chartMetaSet}
                                user={AppConfig.userEmailAddress}
                                getClinicalData={this.store.getDownloadDataPromise}
                                onSubmitQuery={()=> this.store.onSubmitQuery()}
                                updateClinicalDataEqualityFilter={this.handlers.onUserSelection}
                                clearCNAGeneFilter={this.handlers.clearCNAGeneFilter}
                                clearGeneFilter={this.handlers.clearGeneFilter}
                                clearCustomCasesFilter={this.handlers.clearCustomCasesFilter}
                                clearAllFilters={this.handlers.clearAllFilters}
                            />
                            <div className={styles.studyViewFlexContainer}>
                                {this.store.initialClinicalDataCounts.isComplete &&
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
            return null;
        }
    }
}
