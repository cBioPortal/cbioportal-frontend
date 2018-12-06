import * as React from "react";
import styles from "./styles.module.scss";
import {observer} from "mobx-react";
import {action, computed, observable} from "mobx";
import _ from "lodash";
import {ChartControls, ChartHeader} from "pages/studyView/chartHeader/ChartHeader";
import {
    AnalysisGroup,
    ChartMeta,
    ChartType,
    ClinicalDataCountWithColor,
    StudyViewPageStore
} from "pages/studyView/StudyViewPageStore";
import {DataBin} from "shared/api/generated/CBioPortalAPIInternal";
import PieChart from "pages/studyView/charts/pieChart/PieChart";
import {svgToPdfPromise} from "shared/lib/svgToPdfDownload";
import classnames from "classnames";
import ClinicalTable from "pages/studyView/table/ClinicalTable";
import MobxPromise from "mobxpromise";
import SurvivalChart, {LegendLocation} from "../../resultsView/survival/SurvivalChart";
import {MutatedGenesTable} from "../table/MutatedGenesTable";
import {CNAGenesTable} from "../table/CNAGenesTable";

import autobind from 'autobind-decorator';
import BarChart from "./barChart/BarChart";
import {CopyNumberGeneFilterElement} from "../../../shared/api/generated/CBioPortalAPIInternal";
import {
    getHeightByDimension,
    getTableHeightByDimension,
    getWidthByDimension,
    mutationCountVsCnaTooltip,
    MutationCountVsCnaYBinsMin
} from "../StudyViewUtils";
import {ClinicalAttribute} from "../../../shared/api/generated/CBioPortalAPI";
import {makeSurvivalChartData} from "./survival/StudyViewSurvivalUtils";
import StudyViewDensityScatterPlot from "./scatterPlot/StudyViewDensityScatterPlot";
import {ChartTypeEnum, STUDY_VIEW_CONFIG} from "../StudyViewConfig";
import LoadingIndicator from "../../../shared/components/loadingIndicator/LoadingIndicator";

export interface AbstractChart {
    toSVGDOMNode: () => Element;
}

export type ChartDownloadType = 'TSV' | 'SVG' | 'PDF' | 'PNG';

export interface IChartContainerDownloadProps {
    type: ChartDownloadType;
    initDownload?: () => Promise<string>;
}

export interface IChartContainerProps {
    chartMeta: ChartMeta;
    title: string;
    promise: MobxPromise<any>;
    filters: any;
    onValueSelection?: any;
    onDataBinSelection?: any;
    download?: IChartContainerDownloadProps[];
    onResetSelection?: any;
    onDeleteChart: (chartMeta: ChartMeta) => void;
    onChangeChartType: (chartMeta: ChartMeta, newChartType: ChartType) => void;
    onToggleLogScale?:any;
    logScaleChecked?:boolean;
    showLogScaleToggle?:boolean;
    selectedGenes?:any;
    onGeneSelect?:any;
    isNewlyAdded: (uniqueKey: string) => boolean;

    setAnalysisGroupsSettings: (attribute:ClinicalAttribute, grp:ReadonlyArray<AnalysisGroup>)=>void;
    analysisGroupsSettings:StudyViewPageStore["analysisGroupsSettings"];
    patientKeysWithNAInSelectedClinicalData?:MobxPromise<string[]>; // patients which have NA values for filtered clinical attributes
    analysisGroupsPossible?:boolean;
    patientToAnalysisGroup?:MobxPromise<{[uniquePatientKey:string]:string}>;
    sampleToAnalysisGroup?:MobxPromise<{[uniqueSampleKey:string]:string}>;
}

@observer
export class ChartContainer extends React.Component<IChartContainerProps, {}> {
    private chartHeaderHeight = 15;

    private handlers: any;
    private plot: AbstractChart;

    @observable mouseInChart: boolean = false;
    @observable placement: 'left' | 'right' = 'right';
    @observable chartType: ChartType;

    @observable newlyAdded = false;
    @observable naPatientsHiddenInSurvival = true; // only relevant for survival charts - whether cases with NA clinical value are shown

    constructor(props: IChartContainerProps) {
        super(props);

        this.chartType = this.props.chartMeta.chartType;

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
            onDataBinSelection: action((dataBins: DataBin[]) => {
                this.props.onDataBinSelection(this.props.chartMeta, dataBins);
            }),
            onToggleLogScale: action(() => {
                if (this.props.onToggleLogScale) {
                    this.props.onToggleLogScale(this.props.chartMeta);
                }
            }),
            updateCNAGeneFilters: action((filters: CopyNumberGeneFilterElement[]) => {
                this.props.onValueSelection(filters);
            }),
            updateGeneFilters: action((value: number[]) => {
                this.props.onValueSelection(value);
            }),
            onMouseEnterChart: action((event: React.MouseEvent<any>) => {
                this.placement = event.nativeEvent.x > 800 ? 'left' : 'right';
                this.mouseInChart = true;
            }),
            onMouseLeaveChart: action(() => {
                this.placement = 'right'
                this.mouseInChart = false;
            }),
            defaultDownload: {
                SVG: () => Promise.resolve((new XMLSerializer()).serializeToString(this.toSVGDOMNode())),
                PNG: () => Promise.resolve(this.toSVGDOMNode()),
                PDF: () => svgToPdfPromise(this.toSVGDOMNode())
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

    public toSVGDOMNode(): Element {
        if (this.plot) {
            // Get result of plot
            return this.plot.toSVGDOMNode();
        } else {
            return document.createElementNS("http://www.w3.org/2000/svg", "svg");
        }
    }

    @computed
    get hideLabel() {
        return this.chartType === ChartTypeEnum.TABLE;
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
                if (!_.isEqual(this.props.chartMeta.chartType, ChartTypeEnum.TABLE)) {
                    controls = {showPieIcon: true}
                }
                break;
            }
        }
        if (this.analysisGroupsPossible) {
            controls.showAnalysisGroupsIcon = true;
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
    get analysisGroupsPossible() {
        return !!this.props.analysisGroupsPossible &&
            (this.chartType === ChartTypeEnum.PIE_CHART || this.chartType === ChartTypeEnum.TABLE) &&
            !!this.props.chartMeta.clinicalAttribute;
    }

    @autobind
    @action
    setAnalysisGroups() {
        if (this.analysisGroupsPossible) {
            this.props.setAnalysisGroupsSettings(this.props.chartMeta.clinicalAttribute!, this.props.promise.result as ClinicalDataCountWithColor[]);
        }
    }

    @autobind
    @action
    toggleSurvivalHideNAPatients() {
        this.naPatientsHiddenInSurvival = !this.naPatientsHiddenInSurvival;
    }

    @computed get survivalChartData() {
        // need to put this in @computed instead of a remoteData, because in a remoteData any changes to props trigger
        //   a rerender with delay
        if (this.props.promise.isComplete && this.props.patientToAnalysisGroup && this.props.patientToAnalysisGroup.isComplete &&
            (!this.props.patientKeysWithNAInSelectedClinicalData || this.props.patientKeysWithNAInSelectedClinicalData.isComplete)) {
            const survivalData = _.find(this.props.promise.result!, (survivalPlot) => {
                return survivalPlot.id === this.props.chartMeta.uniqueKey;
            });
            return makeSurvivalChartData(
                survivalData.alteredGroup.concat(survivalData.unalteredGroup),
                this.props.analysisGroupsSettings.groups,
                this.props.patientToAnalysisGroup!.result!,
                this.naPatientsHiddenInSurvival,
                this.props.patientKeysWithNAInSelectedClinicalData && this.props.patientKeysWithNAInSelectedClinicalData.result!,
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
    get chart() {
        switch (this.chartType) {
            case ChartTypeEnum.PIE_CHART: {
                return ()=>(<PieChart
                    width={getWidthByDimension(this.props.chartMeta.dimension)}
                    height={getHeightByDimension(this.props.chartMeta.dimension, this.chartHeaderHeight)}
                    ref={this.handlers.ref}
                    onUserSelection={this.handlers.onValueSelection}
                    filters={this.props.filters}
                    data={this.props.promise.result}
                    active={this.mouseInChart}
                    placement={this.placement}
                    label={this.props.title}
                    labelDescription={this.props.chartMeta.description}
                    patientAttribute={this.props.chartMeta.patientAttribute}
                />);
            }
            case ChartTypeEnum.BAR_CHART: {
                return ()=>(
                    <BarChart
                        width={getWidthByDimension(this.props.chartMeta.dimension)}
                        height={getHeightByDimension(this.props.chartMeta.dimension, this.chartHeaderHeight)}
                        ref={this.handlers.ref}
                        onUserSelection={this.handlers.onDataBinSelection}
                        filters={this.props.filters}
                        data={this.props.promise.result}
                    />
                );
            }
            case ChartTypeEnum.TABLE: {
                return ()=>(<ClinicalTable
                    data={this.props.promise.result}
                    width={getWidthByDimension(this.props.chartMeta.dimension)}
                    height={getTableHeightByDimension(this.props.chartMeta.dimension, this.chartHeaderHeight)}
                    filters={this.props.filters}
                    onUserSelection={this.handlers.onValueSelection}
                    label={this.props.title}
                    labelDescription={this.props.chartMeta.description}
                    patientAttribute={this.props.chartMeta.patientAttribute}
                    showAddRemoveAllButtons={this.mouseInChart}
                />);
            }
            case ChartTypeEnum.MUTATED_GENES_TABLE: {
                return ()=>(
                    <MutatedGenesTable
                        promise={this.props.promise}
                        width={getWidthByDimension(this.props.chartMeta.dimension)}
                        height={getTableHeightByDimension(this.props.chartMeta.dimension, this.chartHeaderHeight)}
                        numOfSelectedSamples={100}
                        filters={this.props.filters}
                        onUserSelection={this.handlers.updateGeneFilters}
                        onGeneSelect={this.props.onGeneSelect}
                        selectedGenes={this.props.selectedGenes}
                    />
                );
            }
            case ChartTypeEnum.CNA_GENES_TABLE: {
                return ()=>(
                    <CNAGenesTable
                        promise={this.props.promise}
                        width={getWidthByDimension(this.props.chartMeta.dimension)}
                        height={getTableHeightByDimension(this.props.chartMeta.dimension, this.chartHeaderHeight)}
                        numOfSelectedSamples={100}
                        filters={this.props.filters}
                        onUserSelection={this.handlers.updateCNAGeneFilters}
                        onGeneSelect={this.props.onGeneSelect}
                        selectedGenes={this.props.selectedGenes}
                    />
                );
            }
            case ChartTypeEnum.SURVIVAL: {
                if (this.survivalChartData) {
                    const data = this.survivalChartData;
                    return ()=>(
                        <SurvivalChart ref={this.handlers.ref}
                                       patientSurvivals={data.patientSurvivals}
                                       patientToAnalysisGroup={data.patientToAnalysisGroup}
                                       analysisGroups={data.analysisGroups}
                                       analysisClinicalAttribute={this.props.analysisGroupsSettings.clinicalAttribute}
                                       naPatientsHiddenInSurvival={this.naPatientsHiddenInSurvival}
                                       showNaPatientsHiddenToggle={this.props.patientKeysWithNAInSelectedClinicalData!.result!.length > 0}
                                       toggleSurvivalHideNAPatients={this.toggleSurvivalHideNAPatients}
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
                                           width: getWidthByDimension(this.props.chartMeta.dimension),
                                           height: getHeightByDimension(this.props.chartMeta.dimension, this.chartHeaderHeight),
                                           legend: {
                                               x: 190,
                                               y: 12
                                           },
                                           axis: {
                                               y: {
                                                   axisLabel: {
                                                       padding: 40
                                                   }
                                               }
                                           }
                                       }}
                                       fileName="Overall_Survival"
                        />
                    );
                } else {
                    return null;
                }
            }
            case ChartTypeEnum.SCATTER: {
                return ()=>(
                    <div style={{overflow:"hidden", height:getHeightByDimension(this.props.chartMeta.dimension, this.chartHeaderHeight)}}>
                        {/* have to do all this weird positioning to decrease gap btwn chart and title, bc I cant do it from within Victory */}
                        {/* overflow: "hidden" because otherwise the large SVG (I have to make it larger to make the plot large enough to
                            decrease the gap) will cover the header controls and make them unclickable */}
                        <div style={{marginTop:-33}}>
                            <StudyViewDensityScatterPlot
                                ref={this.handlers.ref}
                                width={getWidthByDimension(this.props.chartMeta.dimension)}
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

    @computed get isAnalysisTarget() {
        return this.props.analysisGroupsSettings.clinicalAttribute &&
                this.props.chartMeta.clinicalAttribute &&
            (this.props.analysisGroupsSettings.clinicalAttribute.clinicalAttributeId === this.props.chartMeta.clinicalAttribute.clinicalAttributeId);
    }

    @computed get downloadTypes() {
        return _.reduce(this.props.download || [], (acc, next) => {
            //when the chart type is table only show TSV in download buttons
            if (!(this.chartType === ChartTypeEnum.TABLE && _.includes(['SVG', 'PDF'], next.type))) {
                acc.push({
                    type: next.type,
                    initDownload: next.initDownload ? next.initDownload : this.handlers.defaultDownload[next.type]
                });
            }
            return acc;
        }, [] as IChartContainerDownloadProps[]);
    }

    @computed
    get highlightChart() {
        return this.newlyAdded || this.isAnalysisTarget;
    }

    componentDidMount() {
        if (this.props.isNewlyAdded(this.props.chartMeta.uniqueKey)) {
            this.newlyAdded = true;
            setTimeout(() => this.newlyAdded = false, STUDY_VIEW_CONFIG.thresholds.chartHighlight);
        }
    }

    public render() {
        return (
            <div className={classnames(styles.chart, { [styles.highlight]: this.highlightChart})}
                 onMouseEnter={this.handlers.onMouseEnterChart}
                 onMouseLeave={this.handlers.onMouseLeaveChart}>
                <ChartHeader
                    height={this.chartHeaderHeight}
                    chartMeta={this.props.chartMeta}
                    title={this.props.title}
                    active={this.mouseInChart}
                    resetChart={this.handlers.resetFilters}
                    deleteChart={this.handlers.onDeleteChart}
                    toggleLogScale={this.handlers.onToggleLogScale}
                    hideLabel={this.hideLabel}
                    chartControls={this.chartControls}
                    changeChartType={this.changeChartType}
                    download={this.downloadTypes}
                    setAnalysisGroups={this.setAnalysisGroups}
                />
                <div className={classnames(this.props.promise.isPending  ? styles.studyViewAutoMargin : null, styles.studyViewLoadingIndicator)}>
                    {(this.props.promise.isPending) && (
                        <LoadingIndicator
                            isLoading={true}
                            center={true}
                        />
                    )}
                    {this.props.promise.isError && (<div>Error when loading data.</div>)}

                    <div style={{visibility: this.props.promise.isPending ? 'hidden' : 'visible'}}>
                        {this.chart && this.chart()}
                    </div>
                </div>
            </div>
        );
    }
}
