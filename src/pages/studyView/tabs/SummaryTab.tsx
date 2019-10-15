import * as React from 'react';
import styles from "./studySummaryTabStyles.module.scss";
import chartHeaderStyles from "../chartHeader/styles.module.scss";
import {ChartContainer, IChartContainerProps} from 'pages/studyView/charts/ChartContainer';
import {observable} from 'mobx';
import {CopyNumberAlterationIdentifier, GeneIdentifier, StudyViewPageStore} from 'pages/studyView/StudyViewPageStore';
import {SampleIdentifier} from 'shared/api/generated/CBioPortalAPI';
import {
    ClinicalDataIntervalFilterValue,
    CopyNumberGeneFilterElement,
    DataBin,
    RectangleBounds
} from "shared/api/generated/CBioPortalAPIInternal";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import ReactGridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {observer} from 'mobx-react';
import {ChartTypeEnum, STUDY_VIEW_CONFIG} from "../StudyViewConfig";
import ProgressIndicator, {IProgressIndicatorItem} from "../../../shared/components/progressIndicator/ProgressIndicator";
import autobind from 'autobind-decorator';
import LabeledCheckbox from "../../../shared/components/labeledCheckbox/LabeledCheckbox";
import {DataType} from "public-lib/components/downloadControls/DownloadControls";
import {ChartMeta, ChartType} from "../StudyViewUtils";


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
        super(props);
        this.store = props.store;

        this.handlers = {
            onValueSelection: (chartMeta: ChartMeta, values: string[]) => {
                this.store.updateClinicalDataEqualityFilters(chartMeta, values);
            },
            onDataBinSelection: (chartMeta: ChartMeta, dataBins: DataBin[]) => {
                this.store.updateClinicalDataIntervalFilters(chartMeta, dataBins);
            },
            onToggleLogScale: (chartMeta: ChartMeta) => {
                this.store.toggleLogScale(chartMeta);
            },
            onDeleteChart: (chartMeta: ChartMeta) => {
                this.store.resetFilterAndChangeChartVisibility(chartMeta, false);
            },
            onChangeChartType: (chartMeta: ChartMeta, newChartType: ChartType) => {
                this.store.changeChartType(chartMeta, newChartType);
            },
            updateMutationCountVsCNAFilter:(bounds:RectangleBounds)=>{
                this.store.setMutationCountVsCNAFilter(bounds);
            },
            isNewlyAdded:(uniqueKey: string) => {
                return this.store.isNewlyAdded(uniqueKey);
            },
            setCustomChartFilters: (chartMeta: ChartMeta, values: string[]) => {
                this.store.setCustomChartFilters(chartMeta, values);
            },
            onLayoutChange: (layout: ReactGridLayout.Layout[]) => {
                this.store.updateCurrentGridLayout(layout);
            },
        }
    }

    renderAttributeChart = (chartMeta: ChartMeta) => {
        const props:Partial<IChartContainerProps> = {
            chartMeta: chartMeta,
            chartType: this.props.store.chartsType.get(chartMeta.uniqueKey),
            store: this.props.store,
            dimension: this.store.chartsDimension.get(chartMeta.uniqueKey),
            openComparisonPage: this.store.openComparisonPage,
            title: chartMeta.displayName,
            filters: [],
            onDeleteChart: this.handlers.onDeleteChart,
            isNewlyAdded: this.handlers.isNewlyAdded,
            studyViewFilters: this.store.filters,
            analysisGroupsSettings: this.store.analysisGroupsSettings,
            cancerGeneFilterEnabled: this.store.oncokbCancerGeneFilterEnabled,
            setComparisonConfirmationModal: this.store.setComparisonConfirmationModal
        };

        const {BAR_CHART, SURVIVAL, CNA_GENES_TABLE, TABLE, SCATTER, PIE_CHART, MUTATED_GENES_TABLE, FUSION_GENES_TABLE} = ChartTypeEnum;
        switch (this.store.chartsType.get(chartMeta.uniqueKey)) {
            case PIE_CHART: {

                //if the chart is one of the custom charts then get the appropriate promise
                if(this.store.isCustomChart(chartMeta.uniqueKey)) {
                    props.filters = this.store.getCustomChartFilters(props.chartMeta!.uniqueKey);
                    props.onValueSelection = this.handlers.setCustomChartFilters;
                    props.onResetSelection = this.handlers.setCustomChartFilters;
                    props.promise = this.store.getCustomChartDataCount(chartMeta);
                } else {
                    props.promise = this.store.getClinicalDataCount(chartMeta);
                    props.filters = this.store.getClinicalDataFiltersByUniqueKey(chartMeta.uniqueKey);
                    props.onValueSelection = this.handlers.onValueSelection;
                    props.onResetSelection = this.handlers.onValueSelection;
                }
                props.onChangeChartType = this.handlers.onChangeChartType;
                props.getData = (dataType?: DataType) => this.store.getPieChartDataDownload(chartMeta, dataType);
                props.downloadTypes = ["Summary Data", "Full Data", "SVG", "PDF"];
                break;
            }
            case BAR_CHART: {
                props.promise = this.store.getClinicalDataBin(chartMeta);
                props.filters = this.store.getClinicalDataIntervalFiltersByUniqueKey(chartMeta.uniqueKey);
                props.onDataBinSelection = this.handlers.onDataBinSelection;
                props.onResetSelection = this.handlers.onDataBinSelection;
                props.onToggleLogScale = this.handlers.onToggleLogScale;
                props.showLogScaleToggle = this.store.isLogScaleToggleVisible(
                    chartMeta.uniqueKey, props.promise!.result);
                props.logScaleChecked = this.store.isLogScaleChecked(chartMeta.uniqueKey);
                props.getData = () => this.store.getClinicalData(chartMeta);
                props.downloadTypes = ["Data", "SVG", "PDF"];
                break;
            }
            case TABLE: {
                if (this.store.isCustomChart(chartMeta.uniqueKey)) {
                    props.filters = this.store.getCustomChartFilters(props.chartMeta!.uniqueKey);
                    props.onValueSelection = this.handlers.setCustomChartFilters;
                    props.onResetSelection = this.handlers.setCustomChartFilters;
                    props.promise = this.store.getCustomChartDataCount(chartMeta);
                } else {
                    props.filters = this.store.getClinicalDataFiltersByUniqueKey(chartMeta.uniqueKey);
                    props.promise = this.store.getClinicalDataCount(chartMeta);
                    props.onValueSelection = this.handlers.onValueSelection;
                    props.onResetSelection = this.handlers.onValueSelection;
                }
                props.onChangeChartType = this.handlers.onChangeChartType;
                props.getData = () => this.store.getClinicalData(chartMeta);
                props.downloadTypes = ["Data"];
                break;
            }
            case MUTATED_GENES_TABLE: {
                props.filters = this.store.getMutatedGenesTableFilters();
                props.promise = this.store.mutatedGeneTableRowData;
                props.onValueSelection = this.store.addGeneFilters;
                props.onResetSelection = this.store.resetMutatedGeneFilter;
                props.selectedGenes=this.store.selectedGenes;
                props.onGeneSelect=this.store.onCheckGene;
                props.title = props.title + ( !this.store.molecularProfileSampleCounts.isComplete || this.store.molecularProfileSampleCounts.result === undefined ? '' : ` (${this.store.molecularProfileSampleCounts.result.numberOfMutationProfiledSamples} profiled samples)`),
                props.getData = () => this.store.getMutatedGenesDownloadData();
                props.genePanelCache = this.store.genePanelCache;
                props.downloadTypes = ["Data"];
                props.filterByCancerGenes= this.store.filterMutatedGenesTableByCancerGenes;
                props.onChangeCancerGeneFilter = this.store.updateMutatedGenesTableByCancerGenesFilter;
                break;
            }
            case FUSION_GENES_TABLE: {
                props.filters = this.store.getFusionGenesTableFilters();
                props.promise = this.store.fusionGeneTableRowData;
                props.onValueSelection = this.store.addFusionGeneFilters;
                props.onResetSelection = this.store.resetFusionGeneFilter;
                props.selectedGenes=this.store.selectedGenes;
                props.onGeneSelect=this.store.onCheckGene;
                props.title = props.title + ( !this.store.molecularProfileSampleCounts.isComplete || this.store.molecularProfileSampleCounts.result === undefined ? '' : ` (${this.store.molecularProfileSampleCounts.result.numberOfMutationProfiledSamples} profiled samples)`),
                props.getData = () => this.store.getFusionGenesDownloadData();
                props.genePanelCache = this.store.genePanelCache;
                props.downloadTypes = ["Data"];
                props.filterByCancerGenes= this.store.filterFusionGenesTableByCancerGenes;
                props.onChangeCancerGeneFilter = this.store.updateFusionGenesTableByCancerGenesFilter;
                break;
            }
            case CNA_GENES_TABLE: {
                props.filters = this.store.getCNAGenesTableFilters();
                props.promise = this.store.cnaGeneTableRowData;
                props.onValueSelection = this.store.addCNAGeneFilters;
                props.onResetSelection = this.handlers.resetCNAGeneFilter;
                props.selectedGenes=this.store.selectedGenes;
                props.onGeneSelect=this.store.onCheckGene;
                props.title = props.title + ( !this.store.molecularProfileSampleCounts.isComplete || this.store.molecularProfileSampleCounts.result === undefined ? '' : ` (${this.store.molecularProfileSampleCounts.result.numberOfCNAProfiledSamples} profiled samples)`),
                props.getData = () => this.store.getGenesCNADownloadData();
                props.genePanelCache = this.store.genePanelCache;
                props.downloadTypes = ["Data"];
                props.filterByCancerGenes= this.store.filterCNAGenesTableByCancerGenes;
                props.onChangeCancerGeneFilter = this.store.updateCNAGenesTableByCancerGenesFilter
                break;
            }
            case SURVIVAL: {
                props.promise = this.store.survivalPlotData;
                props.getData = () => this.store.getSurvivalDownloadData(chartMeta);
                props.patientToAnalysisGroup = this.store.patientToAnalysisGroup;
                props.downloadTypes = ["Data", "SVG", "PDF"];
                break;
            }
            case SCATTER: {
                if (this.store.getMutationCountVsCNAFilter()) {
                    props.filters = [this.store.getMutationCountVsCNAFilter()];
                }
                props.promise = this.store.mutationCountVsCNADensityData;
                props.onValueSelection = (bounds:RectangleBounds)=>{
                    this.handlers.updateMutationCountVsCNAFilter(bounds);
                }
                props.onResetSelection = ()=>{
                    this.handlers.resetMutationCountVsCNAFilter();
                }
                props.sampleToAnalysisGroup = this.store.sampleToAnalysisGroup;
                props.getData = () => this.store.getScatterDownloadData();
                props.downloadTypes = ["Data", "SVG", "PDF"];
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

    @autobind
    getProgressItems(elapsedSecs:number): IProgressIndicatorItem[] {
        return [{
            label: 'Loading meta information',
            promises: [this.store.defaultVisibleAttributes, this.store.mutationProfiles, this.store.cnaProfiles]
        }, {
            label: 'Loading clinical data' + (elapsedSecs > 2 ? ' - this can take several seconds' : ''),
            promises: [this.store.initialVisibleAttributesClinicalDataBinCountData, this.store.initialVisibleAttributesClinicalDataCountData]
        }];
    }

    render() {
        const numberOfMutationProfiledSamples : number | undefined = this.props.store.molecularProfileSampleCounts.isComplete ? this.props.store.molecularProfileSampleCounts.result.numberOfMutationProfiledSamples : undefined;
        const numberOfCNAProfiledSamples : number | undefined = this.props.store.molecularProfileSampleCounts.isComplete ? this.props.store.molecularProfileSampleCounts.result.numberOfCNAProfiledSamples : undefined;
        return (
            <div>

                <div className="secondaryNavigation">
                    <div className={styles.quickFilters}>
                        <strong>Quick Filters:</strong>

                        <LoadingIndicator
                            isLoading={this.props.store.molecularProfileSampleCounts.isPending || this.props.store.molecularProfileSampleCounts.isPending}/>

                        {this.props.store.mutationProfiles.result.length > 0 && (
                            <div data-test="with-mutation-data">
                                {this.props.store.molecularProfileSampleCounts.isComplete && (
                                    <LabeledCheckbox
                                        inputProps={{className: styles.selectedInfoCheckbox}}
                                        checked={!!this.props.store.filters.withMutationData}
                                        onChange={this.props.store.toggleWithMutationDataFilter}
                                        disabled={this.props.store.molecularProfileSampleCounts.result.numberOfMutationProfiledSamples === undefined}
                                    >
                                        {numberOfMutationProfiledSamples === undefined ? '0 samples' : numberOfMutationProfiledSamples.toLocaleString() + (numberOfMutationProfiledSamples === 1 ? " sample" : " samples")} with mutation data
                                    </LabeledCheckbox>
                                )}
                            </div>
                        )}

                        {this.props.store.cnaProfiles.result.length > 0 && (
                            <div data-test="with-cna-data">
                                {this.props.store.molecularProfileSampleCounts.isComplete && (
                                    <LabeledCheckbox
                                        inputProps={{className: styles.selectedInfoCheckbox}}
                                        checked={!!this.props.store.filters.withCNAData}
                                        onChange={this.props.store.toggleWithCNADataFilter}
                                        disabled={this.props.store.molecularProfileSampleCounts.result.numberOfCNAProfiledSamples === undefined}
                                    >
                                        {numberOfCNAProfiledSamples === undefined ? '0 samples' : numberOfCNAProfiledSamples.toLocaleString() + (numberOfCNAProfiledSamples === 1 ? " sample" : " samples")} with CNA data
                                    </LabeledCheckbox>
                                )}
                            </div>
                        )}

                    </div>
                </div>

                <LoadingIndicator isLoading={this.store.loadingInitialDataForSummaryTab} size={"big"} center={true}>
                    <ProgressIndicator getItems={this.getProgressItems} show={this.store.loadingInitialDataForSummaryTab} sequential={false}/>
                </LoadingIndicator>

                {
                    this.store.invalidSampleIds.result.length > 0 &&
                    this.showErrorMessage &&
                    <div>
                        <div className="alert alert-danger">
                            <button type="button" className="close"
                                    onClick={(event) => this.showErrorMessage = false}>&times;</button>
                            The following sample(s) might have been deleted/updated with the recent data updates
                            <br />

                            <ul style={{ listStyle: "none", padding: "10px", maxHeight: "300px", overflowY: "scroll" }}>
                                {this.store.invalidSampleIds.result.map(sample => <li>{sample.studyId + ':' + sample.sampleId}</li>)}
                            </ul>
                        </div>
                    </div>
                }
                {
                    this.store.showSettingRestoreMsg &&
                    <div>
                        <div className="alert alert-info">
                            <button type="button" className="close"
                                    onClick={() => {
                                        this.store.hideRestoreSettingsMsg = true;
                                    }
                                   }>&times;</button>
                            Your previously saved layout preferences have been applied.
                            <button className='btn btn-primary btn-sm'
                                    onClick={() => {
                                        this.store.hideRestoreSettingsMsg = true;
                                    }}
                                    style={{marginLeft: '10px'}}>Keep Saved Layout
                            </button>

                            <button className='btn btn-primary btn-sm'
                                    onClick={() => {
                                        this.store.hideRestoreSettingsMsg = true;
                                        this.store.undoUserSettings();
                                    }}
                                    style={{marginLeft: '10px'}}>Revert to Previous Layout
                            </button>
                        </div>
                    </div>

                }

                {!this.store.loadingInitialDataForSummaryTab &&
                <div data-test="summary-tab-content">
                    <div className={styles.studyViewFlexContainer}>
                        {this.store.defaultVisibleAttributes.isComplete && (
                            <ReactGridLayout className="layout"
                                             style={{width: this.store.containerWidth}}
                                             width={this.store.containerWidth}
                                             cols={this.store.studyViewPageLayoutProps.cols}
                                             rowHeight={this.store.studyViewPageLayoutProps.grid.h}
                                             layout={this.store.studyViewPageLayoutProps.layout}
                                             margin={[STUDY_VIEW_CONFIG.layout.gridMargin.x, STUDY_VIEW_CONFIG.layout.gridMargin.y]}
                                             useCSSTransforms={false}
                                             draggableHandle={`.${chartHeaderStyles.draggable}`}
                                             onLayoutChange={this.handlers.onLayoutChange} >
                                {this.store.visibleAttributes.map(this.renderAttributeChart)}
                            </ReactGridLayout>
                        )}

                    </div>

                </div>
                }
            </div>
        )
    }
}
