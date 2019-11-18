import * as React from "react";
import styles from "./styles.module.scss";
import {observer} from "mobx-react";
import {action, computed, observable} from "mobx";
import _ from "lodash";
import {ChartControls, ChartHeader} from "pages/studyView/chartHeader/ChartHeader";
import {StudyViewPageStore, SurvivalType} from "pages/studyView/StudyViewPageStore";
import {ClinicalDataBin, StudyViewFilter} from "shared/api/generated/CBioPortalAPIInternal";
import PieChart from "pages/studyView/charts/pieChart/PieChart";
import classnames from "classnames";
import ClinicalTable from "pages/studyView/table/ClinicalTable";
import MobxPromise from "mobxpromise";
import SurvivalChart, {LegendLocation} from "../../resultsView/survival/SurvivalChart";

import autobind from 'autobind-decorator';
import BarChart from "./barChart/BarChart";
import {
    ChartMeta,
    ChartType,
    ClinicalDataCountSummary,
    getHeightByDimension,
    getTableHeightByDimension,
    getWidthByDimension,
    mutationCountVsCnaTooltip,
    MutationCountVsCnaYBinsMin,
    UniqueKey,
    NumericalGroupComparisonType
} from "../StudyViewUtils";
import {GenePanel} from "../../../shared/api/generated/CBioPortalAPI";
import {makeSurvivalChartData} from "./survival/StudyViewSurvivalUtils";
import StudyViewDensityScatterPlot from "./scatterPlot/StudyViewDensityScatterPlot";
import {ChartDimension, ChartTypeEnum, STUDY_VIEW_CONFIG} from "../StudyViewConfig";
import LoadingIndicator from "../../../shared/components/loadingIndicator/LoadingIndicator";
import {DataType, DownloadControlsButton} from "../../../public-lib/components/downloadControls/DownloadControls";
import {MAX_GROUPS_IN_SESSION} from "../../groupComparison/GroupComparisonUtils";
import {Modal} from "react-bootstrap";
import MobxPromiseCache from "shared/lib/MobxPromiseCache";
import WindowStore from "shared/components/window/WindowStore";
import Timer = NodeJS.Timer;
import {GeneTableColumnKey, GeneTable} from "pages/studyView/table/GeneTable";

export interface AbstractChart {
    toSVGDOMNode: () => Element;
}

export type ChartDownloadType = 'TSV' | 'SVG' | 'PDF' | 'PNG';

export interface IChartContainerDownloadProps {
    type: ChartDownloadType;
    initDownload?: () => Promise<string>;
}

const COMPARISON_CHART_TYPES:ChartType[] = [ChartTypeEnum.PIE_CHART, ChartTypeEnum.TABLE, ChartTypeEnum.BAR_CHART];

export interface IChartContainerProps {
    chartMeta: ChartMeta;
    chartType: ChartType;
    store: StudyViewPageStore;
    dimension: ChartDimension;
    title: string;
    promise: MobxPromise<any>;
    filters: any;
    studyViewFilters:StudyViewFilter;
    setComparisonConfirmationModal:StudyViewPageStore["setComparisonConfirmationModal"];
    onValueSelection?: any;
    onDataBinSelection?: any;
    getData?: ((dataType?: DataType)=>Promise<string|null>) | ((dataType?:DataType)=>string);
    downloadTypes?:DownloadControlsButton[];
    onResetSelection?: any;
    onDeleteChart: (chartMeta: ChartMeta) => void;
    onChangeChartType: (chartMeta: ChartMeta, newChartType: ChartType) => void;
    onToggleLogScale?:any;
    logScaleChecked?:boolean;
    showLogScaleToggle?:boolean;
    selectedGenes?:any;
    cancerGenes:number[];
    onGeneSelect?:any;
    isNewlyAdded: (uniqueKey: string) => boolean;
    cancerGeneFilterEnabled: boolean;
    filterByCancerGenes?: boolean;
    onChangeCancerGeneFilter?: (filtered: boolean) => void;
    openComparisonPage:(params:{
        chartMeta: ChartMeta,
        categorizationType?: NumericalGroupComparisonType,
        clinicalAttributeValues?:{ value:string, color:string }[]
    })=>void;
    analysisGroupsSettings:StudyViewPageStore["analysisGroupsSettings"];
    patientToAnalysisGroup?:MobxPromise<{[uniquePatientKey:string]:string}>;
    sampleToAnalysisGroup?:MobxPromise<{[uniqueSampleKey:string]:string}>;
    genePanelCache: MobxPromiseCache<{ genePanelId: string }, GenePanel>;
}

@observer
export class ChartContainer extends React.Component<IChartContainerProps, {}> {
    private chartHeaderHeight = 20;

    private handlers: any;
    private plot: AbstractChart;

    private mouseLeaveTimeout:Timer;

    @observable mouseInChart: boolean = false;
    @observable placement: 'left' | 'right' = 'right';
    @observable chartType: ChartType;

    @observable newlyAdded = false;

    constructor(props: IChartContainerProps) {
        super(props);

        this.chartType = this.props.chartType;

        this.handlers = {
            ref: (plot: AbstractChart) => {
                this.plot = plot;
            },
            resetFilters: action(() => {
                this.props.onResetSelection(this.props.chartMeta, []);
            }),
            onValueSelection: action((values: string[]) => {
                this.props.onValueSelection(this.props.chartMeta, values);
            }),
            onDataBinSelection: action((dataBins: ClinicalDataBin[]) => {
                this.props.onDataBinSelection(this.props.chartMeta, dataBins);
            }),
            onToggleLogScale: action(() => {
                if (this.props.onToggleLogScale) {
                    this.props.onToggleLogScale(this.props.chartMeta);
                }
            }),
            onMouseEnterChart: action((event: React.MouseEvent<any>) => {
                if (this.mouseLeaveTimeout) {
                    clearTimeout(this.mouseLeaveTimeout);
                }
                this.placement = event.nativeEvent.x > WindowStore.size.width - 400 ? 'left' : 'right';
                this.mouseInChart = true;
            }),
            onMouseLeaveChart: action(() => {
                this.mouseLeaveTimeout = setTimeout(() => {
                    this.placement = 'right';
                    this.mouseInChart = false;
                }, 100);
            }),
            defaultDownload: {
                SVG: () => Promise.resolve((new XMLSerializer()).serializeToString(this.toSVGDOMNode())),
                PNG: () => Promise.resolve(this.toSVGDOMNode()),
                PDF: () => Promise.resolve(this.toSVGDOMNode())
            },
            onChangeChartType: (newChartType: ChartType) => {
                this.mouseInChart = false;
                this.props.onChangeChartType(this.props.chartMeta, newChartType)
            },
            onDeleteChart: () => {
                this.props.onDeleteChart(this.props.chartMeta);
            }
        };
    }

    public toSVGDOMNode(): SVGElement {
        if (this.plot) {
            // Get result of plot
            return this.plot.toSVGDOMNode() as SVGElement;
        } else {
            return document.createElementNS("http://www.w3.org/2000/svg", "svg");
        }
    }

    @computed
    get chartControls(): ChartControls {
        let controls:Partial<ChartControls> = {};
        switch (this.chartType) {
            case ChartTypeEnum.BAR_CHART: {
                controls = {
                    showLogScaleToggle: this.props.showLogScaleToggle,
                    logScaleChecked: this.props.logScaleChecked
                };
                break;
            }
            case ChartTypeEnum.PIE_CHART: {
                controls = {showTableIcon: true}
                break;
            }
            case ChartTypeEnum.TABLE: {
                controls = {showPieIcon: true}
                break;
            }
        }
        if (this.comparisonPagePossible) {
            controls.showComparisonPageIcon = true;
        }
        return {
            ...controls,
            showResetIcon: this.props.filters && this.props.filters.length > 0
        } as ChartControls;
    }

    @autobind
    @action
    changeChartType(chartType: ChartType) {
        this.chartType = chartType;
        this.handlers.onChangeChartType(chartType);
    }

    @computed
    get comparisonPagePossible() {
        const validChart = (!!this.props.chartMeta.clinicalAttribute ||
            this.props.chartMeta.uniqueKey === UniqueKey.CANCER_STUDIES);

        return validChart &&
            this.props.promise.isComplete &&
            this.props.promise.result!.length > 1 &&
            (COMPARISON_CHART_TYPES.indexOf(this.props.chartType) > -1);
    }

    @autobind
    @action
    openComparisonPage(categorizationType?:NumericalGroupComparisonType) {
        if (this.comparisonPagePossible) {
            switch (this.props.chartType) {
                case ChartTypeEnum.PIE_CHART:
                case ChartTypeEnum.TABLE:
                    const openComparison = ()=>this.props.openComparisonPage({
                        chartMeta: this.props.chartMeta,
                        clinicalAttributeValues:(this.props.promise.result! as ClinicalDataCountSummary[]),
                    });
                    const values = (this.props.promise.result! as ClinicalDataCountSummary[]);
                    if (values.length > MAX_GROUPS_IN_SESSION) {
                        this.props.setComparisonConfirmationModal((hideModal)=>{
                            return (
                                <Modal show={true} onHide={()=>{}} backdrop="static">
                                    <Modal.Body>
                                        Group comparisons are limited to 20 groups.
                                        Click OK to compare the 20 largest groups in this chart.
                                        Or, select up to 20 specific groups in the chart to compare.
                                    </Modal.Body>
                                    <Modal.Footer>
                                        <button className="btn btn-md btn-primary" onClick={()=>{ openComparison(); hideModal(); }}>
                                            OK
                                        </button>
                                        <button className="btn btn-md btn-default" onClick={hideModal}>
                                            Cancel
                                        </button>
                                    </Modal.Footer>
                                </Modal>
                            );
                        });
                    } else {
                        openComparison();
                    }
                    break;
                case ChartTypeEnum.BAR_CHART:
                    this.props.openComparisonPage({
                        chartMeta: this.props.chartMeta,
                        categorizationType
                    });
                    break;
            }
        }
    }

    @computed get survivalChartData() {
        // need to put this in @computed instead of a remoteData, because in a remoteData any changes to props trigger
        //   a rerender with delay
        if (this.props.promise.isComplete && this.props.patientToAnalysisGroup && this.props.patientToAnalysisGroup.isComplete) {
            const survival:SurvivalType = _.find(this.props.promise.result!, (survivalPlot) => {
                return survivalPlot.id === this.props.chartMeta.uniqueKey;
            });
            return  makeSurvivalChartData(survival.survivalData,
                this.props.analysisGroupsSettings.groups,
                this.props.patientToAnalysisGroup!.result!
            );
        } else {
            return undefined;
        }
    };

    // Scatter plot has a weird height setting.
    getScatterPlotHeight() {
        return STUDY_VIEW_CONFIG.layout.grid.h * 2 - this.chartHeaderHeight + 33;
    }

    @computed
    get borderWidth() {
        return this.highlightChart ? 2 : 1;
    }

    @computed
    get chart() {
        const {BAR_CHART, SURVIVAL, CNA_GENES_TABLE, TABLE, SCATTER, PIE_CHART, MUTATED_GENES_TABLE, FUSION_GENES_TABLE} = ChartTypeEnum;
        switch (this.chartType) {
            case PIE_CHART: {
                return ()=>(<PieChart
                    width={getWidthByDimension(this.props.dimension, this.borderWidth)}
                    height={getHeightByDimension(this.props.dimension, this.chartHeaderHeight)}
                    ref={this.handlers.ref}
                    onUserSelection={this.handlers.onValueSelection}
                    filters={this.props.filters}
                    data={this.props.promise.result}
                    placement={this.placement}
                    label={this.props.title}
                    labelDescription={this.props.chartMeta.description}
                    patientAttribute={this.props.chartMeta.patientAttribute}
                />);
            }
            case BAR_CHART: {
                return ()=>(
                    <BarChart
                        width={getWidthByDimension(this.props.dimension, this.borderWidth)}
                        height={getHeightByDimension(this.props.dimension, this.chartHeaderHeight)}
                        ref={this.handlers.ref}
                        onUserSelection={this.handlers.onDataBinSelection}
                        filters={this.props.filters}
                        data={this.props.promise.result}
                    />
                );
            }
            case TABLE: {
                return ()=>(<ClinicalTable
                    data={this.props.promise.result}
                    width={getWidthByDimension(this.props.dimension, this.borderWidth)}
                    height={getTableHeightByDimension(this.props.dimension, this.chartHeaderHeight)}
                    filters={this.props.filters}
                    onUserSelection={this.handlers.onValueSelection}
                    labelDescription={this.props.chartMeta.description}
                    patientAttribute={this.props.chartMeta.patientAttribute}
                    showAddRemoveAllButtons={this.mouseInChart}
                />);
            }
            case MUTATED_GENES_TABLE: {
                return ()=>(
                    <GeneTable
                        tableType={'mutation'}
                        promise={this.props.promise}
                        width={getWidthByDimension(this.props.dimension, this.borderWidth)}
                        height={getTableHeightByDimension(this.props.dimension, this.chartHeaderHeight)}
                        numOfSelectedSamples={100}
                        filters={this.props.filters}
                        onUserSelection={this.props.onValueSelection}
                        onGeneSelect={this.props.onGeneSelect}
                        selectedGenes={this.props.selectedGenes}
                        genePanelCache={this.props.genePanelCache}
                        cancerGeneFilterEnabled={this.props.cancerGeneFilterEnabled}
                        filterByCancerGenes={this.props.filterByCancerGenes!}
                        onChangeCancerGeneFilter={this.props.onChangeCancerGeneFilter!}
                        columns={[
                            {columnKey: GeneTableColumnKey.GENE},
                            {columnKey: GeneTableColumnKey.NUMBER_MUTATIONS},
                            {columnKey: GeneTableColumnKey.NUMBER},
                            {columnKey: GeneTableColumnKey.FREQ},
                        ]}

                        defaultSortBy={GeneTableColumnKey.FREQ}
                    />
                );
            }
            case FUSION_GENES_TABLE: {
                return () => (
                    <GeneTable
                        tableType={'fusion'}
                        promise={this.props.promise}
                        width={getWidthByDimension(this.props.dimension, this.borderWidth)}
                        height={getTableHeightByDimension(this.props.dimension, this.chartHeaderHeight)}
                        numOfSelectedSamples={100}
                        filters={this.props.filters}
                        onUserSelection={this.props.onValueSelection}
                        onGeneSelect={this.props.onGeneSelect}
                        selectedGenes={this.props.selectedGenes}
                        genePanelCache={this.props.genePanelCache}
                        cancerGeneFilterEnabled={this.props.cancerGeneFilterEnabled}
                        filterByCancerGenes={this.props.filterByCancerGenes!}
                        onChangeCancerGeneFilter={this.props.onChangeCancerGeneFilter!}
                        columns={[
                            {columnKey: GeneTableColumnKey.GENE},
                            {columnKey: GeneTableColumnKey.NUMBER_FUSIONS},
                            {columnKey: GeneTableColumnKey.NUMBER},
                            {columnKey: GeneTableColumnKey.FREQ},
                        ]}
                        defaultSortBy={GeneTableColumnKey.FREQ}
                    />
                );
            }
            case CNA_GENES_TABLE: {
                return ()=>(
                    <GeneTable
                        tableType={'cna'}
                        promise={this.props.promise}
                        width={getWidthByDimension(this.props.dimension, this.borderWidth)}
                        height={getTableHeightByDimension(this.props.dimension, this.chartHeaderHeight)}
                        numOfSelectedSamples={100}
                        filters={this.props.filters}
                        onUserSelection={this.props.onValueSelection}
                        onGeneSelect={this.props.onGeneSelect}
                        selectedGenes={this.props.selectedGenes}
                        genePanelCache={this.props.genePanelCache}
                        cancerGeneFilterEnabled={this.props.cancerGeneFilterEnabled}
                        filterByCancerGenes={this.props.filterByCancerGenes!}
                        onChangeCancerGeneFilter={this.props.onChangeCancerGeneFilter!}
                        columns={[
                            {columnKey: GeneTableColumnKey.GENE, columnWidthRatio: 0.25},
                            {columnKey: GeneTableColumnKey.CYTOBAND, columnWidthRatio: 0.25},
                            {columnKey: GeneTableColumnKey.CNA, columnWidthRatio: 0.14},
                            {columnKey: GeneTableColumnKey.NUMBER, columnWidthRatio: 0.18},
                            {columnKey: GeneTableColumnKey.FREQ, columnWidthRatio: 0.18}
                        ]}
                        defaultSortBy={GeneTableColumnKey.FREQ}
                    />
                );
            }
            case SURVIVAL: {
                if (this.survivalChartData) {
                    const data = this.survivalChartData;
                    return ()=>(
                        <SurvivalChart ref={this.handlers.ref}
                                       patientSurvivals={data.patientSurvivals}
                                       patientToAnalysisGroups={data.patientToAnalysisGroups}
                                       analysisGroups={data.analysisGroups}
                                       legendLocation={LegendLocation.TOOLTIP}
                                       title={this.props.title}
                                       xAxisLabel="Months Survival"
                                       yAxisLabel="Surviving"
                                       totalCasesHeader="Number of Cases, Total"
                                       statusCasesHeader="Number of Cases, Deceased"
                                       medianMonthsHeader="Median Months Survival"
                                       yLabelTooltip="Survival estimate"
                                       xLabelWithEventTooltip="Time of death"
                                       xLabelWithoutEventTooltip="Time of last observation"
                                       showDownloadButtons={false}
                                       disableZoom={true}
                                       showTable={false}
                                       styleOpts={{
                                           width: getWidthByDimension(this.props.dimension, this.borderWidth),
                                           height: getHeightByDimension(this.props.dimension, this.chartHeaderHeight),
                                           tooltipXOffset:10,
                                           tooltipYOffset:-58,
                                           pValue: {
                                               x:getWidthByDimension(this.props.dimension, this.borderWidth)-10,
                                               y:30,
                                               textAnchor:"end"
                                           },
                                           axis: {
                                               y: {
                                                   axisLabel: {
                                                       padding: 40
                                                   }
                                               }
                                           }
                                       }}
                                       fileName={this.props.title.replace(' ', '_')}
                        />
                    );
                } else {
                    return null;
                }
            }
            case SCATTER: {
                return ()=>(
                    <div style={{overflow:"hidden", height:getHeightByDimension(this.props.dimension, this.chartHeaderHeight)}}>
                        {/* have to do all this weird positioning to decrease gap btwn chart and title, bc I cant do it from within Victory */}
                        {/* overflow: "hidden" because otherwise the large SVG (I have to make it larger to make the plot large enough to
                            decrease the gap) will cover the header controls and make them unclickable */}
                        <div style={{marginTop:-33}}>
                            <StudyViewDensityScatterPlot
                                ref={this.handlers.ref}
                                width={getWidthByDimension(this.props.dimension, this.borderWidth)}
                                height={this.getScatterPlotHeight()}
                                yBinsMin={MutationCountVsCnaYBinsMin}
                                onSelection={this.props.onValueSelection}
                                selectionBounds={(this.props.filters && this.props.filters.length > 0) ? this.props.filters[0] : undefined}
                                data={this.props.promise.result.bins}
                                xBinSize={this.props.promise.result.xBinSize}
                                yBinSize={this.props.promise.result.yBinSize}
                                isLoading={this.props.promise.isPending}

                                axisLabelX="Fraction of copy number altered genome"
                                axisLabelY="# of mutations"
                                tooltip={mutationCountVsCnaTooltip}
                            />
                        </div>
                    </div>
                );
            }
            default:
                return null;
        }
    }

    @computed get loadingPromises() {
        const ret = [this.props.promise];
        return ret;
    }

    @computed
    get highlightChart() {
        return this.newlyAdded;
    }

    componentDidMount() {
        if (this.props.isNewlyAdded(this.props.chartMeta.uniqueKey)) {
            this.newlyAdded = true;
            setTimeout(() => this.newlyAdded = false, STUDY_VIEW_CONFIG.thresholds.chartHighlight);
        }
    }

    componentWillReceiveProps(nextProps: Readonly<IChartContainerProps>, nextContext: any): void {
        if (nextProps.chartType !== this.chartType) {
            this.chartType = nextProps.chartType;
        }
    }

    public render() {
        return (
            <div className={classnames(styles.chart, { [styles.highlight]: this.highlightChart})}
                 data-test={`chart-container-${this.props.chartMeta.uniqueKey}`}
                 onMouseEnter={this.handlers.onMouseEnterChart}
                 onMouseLeave={this.handlers.onMouseLeaveChart}>
                <ChartHeader
                    height={this.chartHeaderHeight}
                    chartMeta={this.props.chartMeta}
                    chartType={this.props.chartType}
                    store={this.props.store}
                    title={this.props.title}
                    active={this.mouseInChart}
                    resetChart={this.handlers.resetFilters}
                    deleteChart={this.handlers.onDeleteChart}
                    toggleLogScale={this.handlers.onToggleLogScale}
                    chartControls={this.chartControls}
                    changeChartType={this.changeChartType}
                    getSVG={()=>Promise.resolve(this.toSVGDOMNode())}
                    getData={this.props.getData}
                    downloadTypes={this.props.downloadTypes}
                    openComparisonPage={this.openComparisonPage}
                    placement={this.placement}
                />
                <div style={{display: 'flex', flexGrow: 1, margin: 'auto', alignItems: 'center'}}>
                    {(this.props.promise.isPending) && (
                        <LoadingIndicator
                            isLoading={true}
                            className={styles.chartLoader}
                        />
                    )}
                    {this.props.promise.isError && (<div>Error when loading data.</div>)}

                    {(!this.props.chartMeta.renderWhenDataChange || this.props.promise.isComplete) &&
                    <div style={{visibility: this.props.promise.isPending ? 'hidden' : 'visible', display: 'flex'}}>
                        {this.chart && this.chart()}
                    </div>
                    }
                </div>
            </div>
        );
    }
}
