import * as React from "react";
import styles from "./styles.module.scss";
import {observer} from "mobx-react";
import {action, computed, observable} from "mobx";
import _ from "lodash";
import {StudyViewComponentLoader} from "./StudyViewComponentLoader";
import {ChartControls, ChartHeader} from "pages/studyView/chartHeader/ChartHeader";
import {
    AnalysisGroup,
    ChartMeta,
    ChartType,
    ClinicalDataCountWithColor,
    StudyViewPageStore
} from "pages/studyView/StudyViewPageStore";
import fileDownload from "react-file-download";
import PieChart from "pages/studyView/charts/pieChart/PieChart";
import svgToPdfDownload from "shared/lib/svgToPdfDownload";
import classnames from "classnames";
import ClinicalTable from "pages/studyView/table/ClinicalTable";
import {bind} from "bind-decorator";
import MobxPromise from "mobxpromise";
import SurvivalChart, {LegendLocation} from "../../resultsView/survival/SurvivalChart";
import {MutatedGenesTable} from "../table/MutatedGenesTable";
import {CNAGenesTable} from "../table/CNAGenesTable";
import StudyViewScatterPlot from "./scatterPlot/StudyViewScatterPlot";
import {CopyNumberGeneFilterElement} from "../../../shared/api/generated/CBioPortalAPIInternal";
import {makeMutationCountVsCnaTooltip} from "../StudyViewUtils";
import {ClinicalAttribute} from "../../../shared/api/generated/CBioPortalAPI";
import {remoteData} from "../../../shared/api/remoteData";
import {makeSurvivalChartData} from "./survival/StudyViewSurvivalUtils";

export interface AbstractChart {
    downloadData: () => string;
    toSVGDOMNode: () => Element
}

export interface IChartContainerProps {
    chartMeta: ChartMeta;
    promise: MobxPromise<any>;
    filters: any;
    onUserSelection?: any;
    onResetSelection?: any;
    onDeleteChart: (chartMeta: ChartMeta) => void;
    selectedGenes?:any;
    onGeneSelect?:any;
    selectedSamplesMap?: any;
    selectedSamples?: any;

    setAnalysisGroupsSettings: (attribute:ClinicalAttribute, grp:ReadonlyArray<AnalysisGroup>)=>void;
    analysisGroupsSettings:StudyViewPageStore["analysisGroupsSettings"];
    patientKeysWithNAInSelectedClinicalData?:MobxPromise<string[]>; // patients which have NA values for filtered clinical attributes
    analysisGroupsPossible?:boolean;
    patientToAnalysisGroup?:MobxPromise<{[uniquePatientKey:string]:string}>;
    sampleToAnalysisGroup?:MobxPromise<{[uniqueSampleKey:string]:string}>;
}

@observer
export class ChartContainer extends React.Component<IChartContainerProps, {}> {

    private handlers: any;
    private plot: AbstractChart;

    @observable mouseInChart: boolean = false;
    @observable placement: 'left' | 'right' = 'right';
    @observable chartType: ChartType

    @observable naPatientsHiddenInSurvival = true; // only relevant for survival charts - whether cases with NA clinical value are shown

    @computed
    get fileName() {
        return this.props.chartMeta.displayName.replace(/[ \t]/g, '_');
    }

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
            onUserSelection: action((values: string[]) => {
                this.props.onUserSelection(this.props.chartMeta, values);
            }),
            updateCNAGeneFilters: action((filters: CopyNumberGeneFilterElement[]) => {
                this.props.onUserSelection(filters);
            }),
            updateGeneFilters: action((value: number[]) => {
                this.props.onUserSelection(value);
            }),
            onMouseEnterChart: action((event: React.MouseEvent<any>) => {
                this.placement = event.nativeEvent.x > 800 ? 'left' : 'right';
                this.mouseInChart = true;
            }),
            onMouseLeaveChart: action(() => {
                this.placement = 'right'
                this.mouseInChart = false;
            }),
            handleDownloadDataClick: () => {
                let firstLine = this.props.chartMeta.displayName + '\tCount'
                fileDownload(firstLine + '\n' + this.plot.downloadData(), this.fileName);

            },
            handleSVGClick: () => {
                fileDownload((new XMLSerializer()).serializeToString(this.toSVGDOMNode()), `${this.fileName}.svg`);
            },
            handlePDFClick: () => {
                svgToPdfDownload(`${this.fileName}.pdf`, this.toSVGDOMNode());
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
    get chartWidth() {
        let chartWidth = styles.chartWidthTwo;
        if (this.chartType === ChartType.PIE_CHART) {
            chartWidth = styles.chartWidthOne;
        }
        return chartWidth;
    }

    @computed
    get chartHeight() {
        let chartHeight = styles.chartHeightTwo;
        if (this.chartType === ChartType.PIE_CHART) {
            chartHeight = styles.chartHeightOne;
        }
        return chartHeight;
    }

    @computed
    get hideLabel() {
        return this.chartType === ChartType.TABLE;
    }

    @computed
    get chartControls(): ChartControls {
        let controls:Partial<ChartControls> = {};
        switch (this.chartType) {
            case ChartType.PIE_CHART: {
                controls = {showTableIcon: true}
                break;
            }
            case ChartType.TABLE: {
                if (!_.isEqual(this.props.chartMeta.chartType, ChartType.TABLE)) {
                    controls = {showPieIcon: true}
                }
                break;
            }
        }
        if (this.analysisGroupsPossible) {
            controls.showAnalysisGroupsIcon = true;
        }
        return {...controls, showResetIcon: this.props.filters && this.props.filters.length > 0} as ChartControls;
    }

    @bind
    @action
    changeChartType(chartType: ChartType) {
        this.chartType = chartType;
    }


    @computed
    get analysisGroupsPossible() {
        return !!this.props.analysisGroupsPossible &&
            (this.chartType === ChartType.PIE_CHART || this.chartType === ChartType.TABLE) &&
            !!this.props.chartMeta.clinicalAttribute;
    }

    @bind
    @action
    setAnalysisGroups() {
        if (this.analysisGroupsPossible) {
            this.props.setAnalysisGroupsSettings(this.props.chartMeta.clinicalAttribute!, this.props.promise.result as ClinicalDataCountWithColor[]);
        }
    }

    @bind
    @action
    toggleSurvivalHideNAPatients() {
        this.naPatientsHiddenInSurvival = !this.naPatientsHiddenInSurvival;
    }

    readonly survivalChartData = remoteData({
        // patientToAnalysisGroup assumed defined, since we're calling survivalChartData
        await:()=>[this.props.promise, this.props.patientToAnalysisGroup!],
        invoke:()=>{
            return Promise.resolve(
                makeSurvivalChartData(
                    this.props.promise.result!.alteredGroup.concat(this.props.promise.result!.unalteredGroup),
                    this.props.analysisGroupsSettings.groups,
                    this.props.patientToAnalysisGroup!.result!,
                    this.naPatientsHiddenInSurvival,
                    this.props.patientKeysWithNAInSelectedClinicalData,
                )
            );
        }
    });

    @computed
    get chart() {
        switch (this.chartType) {
            case ChartType.PIE_CHART: {
                return (<PieChart
                    ref={this.handlers.ref}
                    onUserSelection={this.handlers.onUserSelection}
                    filters={this.props.filters}
                    data={this.props.promise.result}
                    active={this.mouseInChart}
                    placement={this.placement}
                />)
            }
            case ChartType.TABLE: {
                return (<ClinicalTable
                    data={this.props.promise.result}
                    filters={this.props.filters}
                    onUserSelection={this.handlers.onUserSelection}
                    label={this.props.chartMeta.displayName}
                />)
            }
            case ChartType.MUTATED_GENES_TABLE: {
                return (
                    <MutatedGenesTable
                        promise={this.props.promise}
                        numOfSelectedSamples={100}
                        filters={this.props.filters}
                        onUserSelection={this.handlers.updateGeneFilters}
                        onGeneSelect={this.props.onGeneSelect}
                        selectedGenes={this.props.selectedGenes}
                    />
                );
            }
            case ChartType.CNA_GENES_TABLE: {
                return (
                    <CNAGenesTable
                        promise={this.props.promise}
                        numOfSelectedSamples={100}
                        filters={this.props.filters}
                        onUserSelection={this.handlers.updateCNAGeneFilters}
                        onGeneSelect={this.props.onGeneSelect}
                        selectedGenes={this.props.selectedGenes}
                    />
                );
            }
            case ChartType.SURVIVAL: {
                if (this.survivalChartData.isComplete) {
                    // this.survivalChartData should be complete at this point, barring transient race-condition-caused errors, because of loadingPromises and StudyViewComponentLoader (see render())
                    return (
                        <SurvivalChart patientSurvivals={this.survivalChartData.result!.patientSurvivals}
                                       patientToAnalysisGroup={this.survivalChartData.result!.patientToAnalysisGroup}
                                       analysisGroups={this.survivalChartData.result!.analysisGroups}
                                       analysisClinicalAttribute={this.props.analysisGroupsSettings.clinicalAttribute}
                                       naPatientsHiddenInSurvival={this.naPatientsHiddenInSurvival}
                                       toggleSurvivalHideNAPatients={this.toggleSurvivalHideNAPatients}
                                       legendLocation={LegendLocation.TOOLTIP}
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
                                       styleOpts={{
                                           width: 400,
                                           height: 380,
                                           legend: {
                                               x: 190,
                                               y: 12
                                           }
                                       }}
                                       fileName="Overall_Survival"/>
                    );
                } else {
                    return null;
                }
            }
            case ChartType.SCATTER: {
                // sampleToAnalysisGroup is complete because of loadingPromises and StudyViewComponentLoader
                return (
                    <StudyViewScatterPlot
                        width={400}
                        height={380}
                        onSelection={this.props.onUserSelection}
                        data={this.props.promise.result}
                        isLoading={this.props.selectedSamples.isPending}

                        sampleToAnalysisGroup={this.props.sampleToAnalysisGroup!.result!}
                        analysisGroups={this.props.analysisGroupsSettings.groups}
                        analysisClinicalAttribute={this.props.analysisGroupsSettings.clinicalAttribute}

                        axisLabelX="Fraction of copy number altered genome"
                        axisLabelY="# of mutations"
                        tooltip={this.mutationCountVsCnaTooltip}
                    />
                )
            }
            default:
                return null;
        }
    }

    @computed get mutationCountVsCnaTooltip() {
        return makeMutationCountVsCnaTooltip(this.props.sampleToAnalysisGroup!.result, this.props.analysisGroupsSettings.clinicalAttribute);
    }

    @computed get loadingPromises() {
        const ret = [this.props.promise];
        switch (this.chartType) {
            case ChartType.SURVIVAL:
                ret.push(this.survivalChartData);
                break;
            case ChartType.SCATTER:
                ret.push(this.props.sampleToAnalysisGroup!);
                break;
        }
        return ret;
    }

    @computed get isAnalysisTarget() {
        return this.props.analysisGroupsSettings.clinicalAttribute &&
                this.props.chartMeta.clinicalAttribute &&
            (this.props.analysisGroupsSettings.clinicalAttribute.clinicalAttributeId === this.props.chartMeta.clinicalAttribute.clinicalAttributeId);
    }

    public render() {
        return (
            <div className={classnames(styles.chart, this.chartWidth, this.chartHeight, { [styles.analysisTarget]:this.isAnalysisTarget })}
                 onMouseEnter={this.handlers.onMouseEnterChart}
                 onMouseLeave={this.handlers.onMouseLeaveChart}>
                <ChartHeader
                    chartMeta={this.props.chartMeta}
                    active={this.mouseInChart}
                    resetChart={this.handlers.resetFilters}
                    deleteChart={this.handlers.onDeleteChart}
                    hideLabel={this.hideLabel}
                    chartControls={this.chartControls}
                    changeChartType={this.changeChartType}
                    setAnalysisGroups={this.setAnalysisGroups}
                />
                <StudyViewComponentLoader promises={this.loadingPromises}>
                    {this.chart}
                </StudyViewComponentLoader>
            </div>
        );
    }
}
