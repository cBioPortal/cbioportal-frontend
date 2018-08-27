import * as React from 'react';
import {inject, observer} from "mobx-react";
import styles from "./styles.module.scss";
import { MutatedGenesTable } from "./table/MutatedGenesTable";
import { CNAGenesTable } from "./table/CNAGenesTable";
import { ChartContainer } from 'pages/studyView/charts/ChartContainer';
import SurvivalChart from "../resultsView/survival/SurvivalChart";
import { MSKTab, MSKTabs } from "../../shared/components/MSKTabs/MSKTabs";
import { StudyViewComponentLoader } from "./charts/StudyViewComponentLoader";
import { reaction } from 'mobx';
import { If } from 'react-if';
import {ChartMeta, ChartType, StudyViewPageStore, SurvivalAnalysisGroup} from 'pages/studyView/StudyViewPageStore';
import SummaryHeader from 'pages/studyView/SummaryHeader';
import {Sample, Gene, SampleIdentifier, ClinicalAttribute} from 'shared/api/generated/CBioPortalAPI';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import StudyViewScatterPlot from "./charts/scatterPlot/StudyViewScatterPlot";
import {isSelected, mutationCountVsCnaTooltip} from "./StudyViewUtils";
import AppConfig from 'appConfig';
import MobxPromise from "mobxpromise";
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
            updateGeneFilter: (entrezGeneId: number) => {
                this.store.updateGeneFilter(entrezGeneId);
            },
            resetGeneFilter: (chartMeta: ChartMeta) => {
                this.store.resetGeneFilter();
            },
            resetCNAGeneFilter: (chartMeta: ChartMeta) => {
                this.store.resetCNAGeneFilter();
            },
            updateCNAGeneFilter: (entrezGeneId: number, alteration: number) => {
                this.store.updateCNAGeneFilter(entrezGeneId, alteration);
            },
            onDeleteChart: (chartMeta: ChartMeta) => {
                this.store.resetFilterAndChangeChartVisibility(chartMeta, false);
            },
            updateCustomCasesFilter: (cases: SampleIdentifier[]) => {
                this.store.updateCustomCasesFilter(cases);
            },
            updateSelectedGenes:(query: SingleGeneQuery[], genesInQuery: Gene[])=>{
                this.store.updateSelectedGenes(query, genesInQuery);
            },
            resetCustomCasesFilter: () => {
                this.store.resetCustomCasesFilter();
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
        let props:any = {
            chartMeta: chartMeta,
            filters: [],
            onDeleteChart: this.handlers.onDeleteChart,
            survivalAnalysisPossible:this.store.survivalAnalysisPossible,
            setSurvivalAnalysisSettings: (attribute:ClinicalAttribute, grps:ReadonlyArray<SurvivalAnalysisGroup>)=>{
                this.store.updateSurvivalAnalysisSettings(attribute, grps);
            }
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
                props.onUserSelection = this.handlers.updateGeneFilter;
                props.onResetSelection = this.handlers.resetGeneFilter;
                props.selectedGenes=this.store.selectedGenes;
                props.onGeneSelect=this.store.onCheckGene;
                break;
            }
            case ChartType.CNA_GENES_TABLE: {
                props.filters = this.store.getCNAGenesTableFilters();
                props.promise = this.store.cnaGeneData;
                props.onUserSelection = this.handlers.updateCNAGeneFilter;
                props.onResetSelection = this.handlers.resetCNAGeneFilter;
                props.selectedGenes=this.store.selectedGenes;
                props.onGeneSelect=this.store.onCheckGene;
                break;
            }
            case ChartType.SURVIVAL: {
                props.promise = this.store.getSurvivalData(chartMeta);
                // only want to pass these in when necessary, otherwise charts will unnecessarily update when they change
                props.survivalAnalysisSettings = this.store.survivalAnalysisSettings;
                props.patientToSurvivalAnalysisGroup = this.store.patientToSurvivalAnalysisGroup;
                props.patientKeysWithNAInSelectedClinicalData = this.store.patientKeysWithNAInSelectedClinicalData;
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
        return <ChartContainer key={chartMeta.uniqueKey} {...props}/>;
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
                                geneQuery={this.store.geneQueryStr}
                                selectedSamples={this.store.selectedSamples.result!}
                                updateCustomCasesFilter={this.handlers.updateCustomCasesFilter}
                                updateSelectedGenes={this.handlers.updateSelectedGenes}
                                studyWithSamples={this.store.studyWithSamples.result}
                                filter={this.store.filters}
                                attributeNamesSet={this.store.attributeNamesSet}
                                user={AppConfig.userEmailAddress}
                            />
                            <div className={styles.studyViewFlexContainer}>
                                {this.store.initialClinicalDataCounts.isComplete &&
                                this.store.visibleAttributes.map(this.renderAttributeChart)}
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
