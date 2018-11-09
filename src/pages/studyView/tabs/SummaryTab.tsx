import * as React from 'react';
import styles from "./studySummaryTabStyles.module.scss";
import {ChartContainer, IChartContainerProps} from 'pages/studyView/charts/ChartContainer';
import { observable } from 'mobx';
import {
    ChartMeta,
    ChartType,
    ChartTypeEnum,
    DataBinMethodConstants,
    StudyViewPageStore,
    AnalysisGroup,
    CUSTOM_CHART_KEYS,
    UniqueKey
} from 'pages/studyView/StudyViewPageStore';
import {Gene, SampleIdentifier, ClinicalAttribute} from 'shared/api/generated/CBioPortalAPI';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import AppConfig from 'appConfig';
import {ClinicalDataIntervalFilterValue, DataBin, CopyNumberGeneFilterElement} from "shared/api/generated/CBioPortalAPIInternal";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import * as _ from 'lodash';
import ReactGridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { observer } from 'mobx-react';
import {ServerConfigHelpers} from "../../../config/config";
import UserSelections from "../UserSelections";

export interface IStudySummaryTabProps {
    store: StudyViewPageStore
}

// making this an observer (mobx-react) causes this component to re-render any time
// there is a change to any observable value which is referenced in its render method.
// Even if this value is referenced deep within some helper method
@observer
export class StudySummaryTab extends React.Component<IStudySummaryTabProps, {}> {

    private store: StudyViewPageStore;
    private handlers: any;

    @observable showErrorMessage = true;

    constructor(props: IStudySummaryTabProps) {
        super();
        this.store = props.store;

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
            removeGeneFilter: (entrezGeneId:number) => {
                this.store.removeGeneFilter(entrezGeneId);
            },
            resetGeneFilter: (chartMeta: ChartMeta) => {
                this.store.resetGeneFilter();
            },
            resetCNAGeneFilter: (chartMeta: ChartMeta) => {
                this.store.resetCNAGeneFilter();
            },
            removeCNAGeneFilter: (filter:CopyNumberGeneFilterElement) => {
                this.store.removeCNAGeneFilters(filter);
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
            onChangeChartType: (chartMeta: ChartMeta, newChartType: ChartType) => {
                this.store.changeChartType(chartMeta, newChartType);
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
            setCustomChartFilters: (chartMeta: ChartMeta, values: string[]) => {
                this.store.setCustomChartFilters(chartMeta, values);
            },
        }
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
            case ChartTypeEnum.PIE_CHART: {

                //if the chart is one of the custom charts then get the appropriate promise
                if (_.includes(CUSTOM_CHART_KEYS, chartMeta.uniqueKey)) {
                    props.filters = this.store.getCustomChartFilters(props.chartMeta ? props.chartMeta.uniqueKey : '');
                    props.onValueSelection = this.handlers.setCustomChartFilters;
                    props.onResetSelection = this.handlers.setCustomChartFilters;

                    if (chartMeta.uniqueKey === UniqueKey.SAMPLES_PER_PATIENT) {
                        props.promise = this.store.samplesPerPatientData;
                    } else if (chartMeta.uniqueKey === UniqueKey.WITH_MUTATION_DATA) {
                        props.promise = this.store.withMutationData;
                    } else if (chartMeta.uniqueKey === UniqueKey.WITH_CNA_DATA) {
                        props.promise = this.store.withCnaData;
                    }
                } else {
                    props.promise = this.store.getClinicalDataCount(chartMeta);
                    props.filters = this.store.getClinicalDataFiltersByUniqueKey(chartMeta.uniqueKey);
                    props.onValueSelection = this.handlers.onValueSelection;
                    props.onResetSelection = this.handlers.onValueSelection;
                }
                props.onChangeChartType = this.handlers.onChangeChartType;
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
            case ChartTypeEnum.BAR_CHART: {
                props.promise = this.store.getClinicalDataBin(chartMeta);
                props.filters = this.store.getClinicalDataIntervalFiltersByUniqueKey(chartMeta.uniqueKey);
                props.onDataBinSelection = this.handlers.onDataBinSelection;
                props.onResetSelection = this.handlers.onDataBinSelection;
                props.onToggleLogScale = this.handlers.onToggleLogScale;
                props.showLogScaleToggle = this.store.isLogScaleToggleVisible(
                    chartMeta.uniqueKey, props.promise!.result);
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
            case ChartTypeEnum.TABLE: {
                props.filters = this.store.getClinicalDataFiltersByUniqueKey(chartMeta.uniqueKey);
                props.promise = this.store.getClinicalDataCount(chartMeta);
                props.onValueSelection = this.handlers.onValueSelection;
                props.onResetSelection = this.handlers.onValueSelection;
                props.onChangeChartType = this.handlers.onChangeChartType;
                props.download = [
                    {
                        initDownload: () => this.store.getClinicalData(chartMeta),
                        type: 'TSV'
                    }
                ];
                break;
            }
            case ChartTypeEnum.MUTATED_GENES_TABLE: {
                props.filters = this.store.getMutatedGenesTableFilters();
                props.promise = this.store.mutatedGeneData;
                props.onValueSelection = this.handlers.addGeneFilters;
                props.onResetSelection = this.handlers.resetGeneFilter;
                props.selectedGenes=this.store.selectedGenes;
                props.onGeneSelect=this.store.onCheckGene;
                props.title = props.title + ( !this.store.molecularProfileSampleCounts.isComplete || this.store.molecularProfileSampleCounts.result === undefined ? '' : ` (${this.store.molecularProfileSampleCounts.result.numberOfMutationProfiledSamples} profiled samples)`),
                props.download = [
                    {
                        initDownload: () => this.store.getMutatedGenesDownloadData(),
                        type: 'TSV'
                    }
                ];
                break;
            }
            case ChartTypeEnum.CNA_GENES_TABLE: {
                props.filters = this.store.getCNAGenesTableFilters();
                props.promise = this.store.cnaGeneData;
                props.onValueSelection = this.handlers.addCNAGeneFilters;
                props.onResetSelection = this.handlers.resetCNAGeneFilter;
                props.selectedGenes=this.store.selectedGenes;
                props.onGeneSelect=this.store.onCheckGene;
                props.title = props.title + ( !this.store.molecularProfileSampleCounts.isComplete || this.store.molecularProfileSampleCounts.result === undefined ? '' : ` (${this.store.molecularProfileSampleCounts.result.numberOfCNAProfiledSamples} profiled samples)`),
                props.download = [
                    {
                        initDownload: () => this.store.getGenesCNADownloadData(),
                        type: 'TSV'
                    }
                ];
                break;
            }
            case ChartTypeEnum.SURVIVAL: {
                props.promise = this.store.survivalPlotData;
                props.download = [
                    {
                        initDownload: () => this.store.getSurvivalDownloadData(chartMeta),
                        type: 'TSV'
                    }, {
                        type: 'SVG'
                    }, {
                        type: 'PDF'
                    }
                ];
                // only want to pass these in when necessary, otherwise charts will unnecessarily update when they change
                props.patientKeysWithNAInSelectedClinicalData = this.store.patientKeysWithNAInSelectedClinicalData;
                props.patientToAnalysisGroup = this.store.patientToAnalysisGroup;
                break;
            }
            case ChartTypeEnum.SCATTER: {
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
                props.download = [
                    {
                        initDownload: () => this.store.getScatterDownloadData(chartMeta),
                        type: 'TSV'
                    }, {
                        type: 'SVG'
                    }, {
                        type: 'PDF'
                    }
                ];

                break;
            }
            default:
                break;
        }

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
        <div key={chartMeta.uniqueKey}>
            <ChartContainer key={chartMeta.uniqueKey} {...(props as any)}/>
        </div>);
    };

    render() {
        return (
            <div>
                <LoadingIndicator isLoading={this.store.defaultVisibleAttributes.isPending} size={"big"} center={true}/>
                {
                    this.store.invalidSampleIds.result.length > 0 &&
                    this.showErrorMessage &&
                    <div>
                        <div className="alert alert-danger">
                            <button type="button" className="close" onClick={(event) => this.showErrorMessage = false}>&times;</button>
                            The following sample(s) might have been deleted/updated with the recent data updates
                            <br />

                            <ul style={{ listStyle: "none", padding: "10px", maxHeight: "300px", overflowY: "scroll" }}>
                                {this.store.invalidSampleIds.result.map(sample => <li>{sample.studyId + ':' + sample.sampleId}</li>)}
                            </ul>
                        </div>
                    </div>
                }

                <UserSelections
                    filter={this.props.store.userSelections}
                    attributesMetaSet={this.props.store.chartMetaSet}
                    updateClinicalDataEqualityFilter={this.props.store.updateClinicalDataEqualityFilters}
                    updateClinicalDataIntervalFilter={this.props.store.updateClinicalDataIntervalFiltersByValues}
                    removeGeneFilter={this.props.store.removeGeneFilter}
                    removeCNAGeneFilter={this.props.store.removeCNAGeneFilters}
                    clearCNAGeneFilter={this.props.store.clearCNAGeneFilter}
                    clearGeneFilter={this.props.store.clearGeneFilter}
                    removeWithMutationDataFilter={this.props.store.removeWithMutationDataFilter}
                    removeWithCNADataFilter={this.props.store.removeWithCNADataFilter}
                    clearChartSampleIdentifierFilter={this.props.store.clearChartSampleIdentifierFilter}
                    clearAllFilters={this.props.store.clearAllFilters}
                />
                <div className={styles.studyViewFlexContainer}>
                    {this.store.defaultVisibleAttributes.isComplete && (
                        <ReactGridLayout className="layout"
                                            style={{ width: this.store.containerWidth }}
                                            width={this.store.containerWidth}
                                            cols={this.store.studyViewPageLayoutProps.cols}
                                            rowHeight={this.store.studyViewPageLayoutProps.rowHeight}
                                            layout={this.store.studyViewPageLayoutProps.layout}
                                            margin={[5, 5]}
                                            useCSSTransforms={false}
                                            draggableHandle={'.fa-arrows'}>
                            {this.store.visibleAttributes.map(this.renderAttributeChart)}
                        </ReactGridLayout>
                    )}

                </div>
            </div>
        )
    }
}
