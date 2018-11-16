import * as React from 'react';
import { observer } from "mobx-react";
import { PatientSurvival } from "../../../shared/model/PatientSurvival";
import {action, computed, observable, runInAction} from "mobx";
import { Popover, Table } from 'react-bootstrap';
import styles from "./styles.module.scss";
import { sleep } from "../../../shared/lib/TimeUtils";
import * as _ from 'lodash';
import {
    VictoryChart, VictoryContainer, VictoryLine, VictoryTooltip,
    VictoryAxis, VictoryLegend, VictoryLabel, VictoryScatter, VictoryTheme, VictoryZoomContainer
} from 'victory';
import {
    getEstimates, getMedian, getLineData, getScatterData, getScatterDataWithOpacity, getStats, calculateLogRank,
    getDownloadContent, convertScatterDataToDownloadData, downSampling, GroupedScatterData, filterScatterData,
    SurvivalPlotFilters
} from "./SurvivalUtil";
import CBIOPORTAL_VICTORY_THEME from "../../../shared/theme/cBioPoralTheme";
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import {getPatientViewUrl} from "../../../shared/api/urls";
import DownloadControls from "../../../shared/components/downloadControls/DownloadControls";
import autobind from "autobind-decorator";
import {AnalysisGroup} from "../../studyView/StudyViewPageStore";
import {AbstractChart} from "../../studyView/charts/ChartContainer";
import {toSvgDomNodeWithLegend} from "../../studyView/StudyViewUtils";
import classnames from "classnames";
import {ClinicalAttribute} from "../../../shared/api/generated/CBioPortalAPI";
import DefaultTooltip from "../../../shared/components/defaultTooltip/DefaultTooltip";

export enum LegendLocation {
    TOOLTIP = "tooltip",
    CHART = "chart"
}

export interface ISurvivalChartProps {
    patientSurvivals:ReadonlyArray<PatientSurvival>;
    patientToAnalysisGroup:{[uniquePatientKey:string]:string};
    analysisGroups:ReadonlyArray<AnalysisGroup>; // identified by `value`
    analysisClinicalAttribute?:ClinicalAttribute;
    naPatientsHiddenInSurvival?:boolean;
    toggleSurvivalHideNAPatients?:()=>void;
    totalCasesHeader: string;
    statusCasesHeader: string;
    medianMonthsHeader: string;
    title: string;
    xAxisLabel: string;
    yAxisLabel: string;
    yLabelTooltip: string;
    xLabelWithEventTooltip: string;
    xLabelWithoutEventTooltip: string;
    fileName: string;
    showTable?: boolean;
    legendLocation?:LegendLocation;
    showLogRankPVal?:boolean;
    showDownloadButtons?: boolean;
    disableZoom?: boolean;
    styleOpts?: any; // see victory styles, and styleOptsDefaultProps for examples
    className?: string;
}

// Start to down sampling when there are more than 1000 dots in the plot.
const SURVIVAL_DOWN_SAMPLING_THRESHOLD = 1000;

@observer
export default class SurvivalChart extends React.Component<ISurvivalChartProps, {}> implements AbstractChart {

    @observable.ref tooltipModel: any;
    @observable scatterFilter: SurvivalPlotFilters;
    @observable highlightedCurve = "";
    // The denominator should be determined based on the plot width and height.
    private isTooltipHovered: boolean = false;
    private tooltipCounter: number = 0;
    private svgContainer: any;
    private styleOptsDefaultProps:any = {
        width: 900,
        height: 500,
        padding: {top: 20, bottom: 50, left: 60, right: 20},
        axis: {
            x: {
                axisLabel: {
                    padding: 35
                },
                grid: {opacity: 0}
            },
            y: {
                axisLabel: {
                    padding: 45, fill: "black"
                },
                grid: {opacity: 0}

            }
        },
        legend: {
            x: 600,
            y: 40
        }
    };

    private events = [{
        target: "data",
        eventHandlers: {
            onMouseOver: () => {
                return [
                    {
                        target: "data",
                        mutation: (props: any) => {
                            this.tooltipModel = props;
                            this.tooltipCounter++;
                            return { active: true };
                        }
                    }
                ];
            },
            onMouseOut: () => {
                return [
                    {
                        target: "data",
                        mutation: async () => {
                            await sleep(100);
                            if (!this.isTooltipHovered && this.tooltipCounter === 1) {
                                this.tooltipModel = null;
                            }
                            this.tooltipCounter--;
                            return { active: false };
                        }
                    }
                ];
            }
        }
    }];

    public toSVGDOMNode(): Element {
        return toSvgDomNodeWithLegend(this.svgContainer.firstChild, ".survivalChartDownloadLegend");
    }

    @computed
    get styleOpts() {
        let configurableOpts: any = _.merge({}, this.styleOptsDefaultProps, this.props.styleOpts);
        configurableOpts.padding.right = this.props.legendLocation === LegendLocation.CHART ? 300 : configurableOpts.padding.right;
        if (!this.props.styleOpts || !this.props.styleOpts.legend || this.props.styleOpts.legend.x === undefined) {
            // only set legend x if its not passed in
            configurableOpts.legend.x = configurableOpts.width - configurableOpts.padding.right;
        }
        return configurableOpts;
    }

    @computed
    get downSamplingDenominators() {
        return {
            x: this.styleOpts.width - this.styleOpts.padding.left - this.styleOpts.padding.right,
            y: this.styleOpts.height - this.styleOpts.padding.top - this.styleOpts.padding.bottom
        }
    }

    @computed get sortedGroupedSurvivals():{[groupValue:string]:PatientSurvival[]} {
        const patientToAnalysisGroup = this.props.patientToAnalysisGroup;
        const survivalsByAnalysisGroup = _.reduce(this.props.patientSurvivals, (map, nextSurv)=>{
            if (nextSurv.uniquePatientKey in patientToAnalysisGroup) {
                // only include this data if theres an analysis group (curve) to put it in
                const group = patientToAnalysisGroup[nextSurv.uniquePatientKey];
                map[group] = map[group] || [];
                map[group].push(nextSurv);
            }
            return map;
        }, {} as {[groupValue:string]:PatientSurvival[]});

        return _.mapValues(survivalsByAnalysisGroup, survivals=>survivals.sort((a,b)=>(a.months - b.months)));
    }

    @computed get estimates():{[groupValue:string]:number[]} {
        return _.mapValues(this.sortedGroupedSurvivals, survivals=>getEstimates(survivals));
    }

    @computed
    get unfilteredScatterData(): GroupedScatterData {
        // map through groups and generate plot data for each
        return _.mapValues(this.sortedGroupedSurvivals, (survivals, group)=>{
            const estimates = this.estimates[group];
            return {
                numOfCases: survivals.length,
                line: getLineData(survivals, estimates),
                scatterWithOpacity: getScatterDataWithOpacity(survivals, estimates),
                scatter: getScatterData(survivals, estimates)
            };
        });
    }

    // Only recalculate the scatter data based on the plot filter.
    // The filter is only available when user zooms in the plot.
    @computed
    get scatterData(): GroupedScatterData {
        return filterScatterData(this.unfilteredScatterData, this.scatterFilter, {
            xDenominator: this.downSamplingDenominators.x,
            yDenominator: this.downSamplingDenominators.y,
            threshold: SURVIVAL_DOWN_SAMPLING_THRESHOLD
        });
    }

    public static defaultProps: Partial<ISurvivalChartProps> = {
        showTable: true,
        disableZoom: false,
        legendLocation: LegendLocation.CHART,
        showLogRankPVal: true,
        showDownloadButtons: true,
    };

    constructor(props: ISurvivalChartProps) {
        super(props);
        this.tooltipMouseEnter = this.tooltipMouseEnter.bind(this);
        this.tooltipMouseLeave = this.tooltipMouseLeave.bind(this);
    }


    @computed get logRankTestPVal(): number | null {
        if (this.analysisGroupsWithData.length === 2) {
            // log rank test only makes sense with two groups
            return calculateLogRank(
                this.sortedGroupedSurvivals[this.analysisGroupsWithData[0].value],
                this.sortedGroupedSurvivals[this.analysisGroupsWithData[1].value]
            );
        } else {
            return null;
        }
    }

    @computed get victoryLegendData() {
        const data:any = [];
        if (this.props.legendLocation === LegendLocation.CHART) {
            for (const grp of this.analysisGroupsWithData) {
                data.push({
                    name: !!grp.legendText ? grp.legendText : grp.value,
                    symbol: { fill: grp.color, type: "square" }
                });
            }
        }
        if (this.props.showLogRankPVal && this.logRankTestPVal !== null) {
            data.push({
                name: `Logrank Test P-Value: ${toConditionalPrecision(this.logRankTestPVal, 3, 0.001)}`,
                symbol: { opacity: 0 }
            });
        }
        return data;
    }

    @computed get legendDataForDownload() {
        const data: any = this.analysisGroupsWithData.map(grp => ({
            name: !!grp.legendText ? grp.legendText : grp.value,
            symbol: { fill: grp.color, type: "square" }
        }));

        // add an indicator in case NA is excluded
        if (this.props.naPatientsHiddenInSurvival) {
            data.push({
                name: "* Patients with NA for any of the selected attributes are excluded",
                symbol: { opacity: 0 }
            });
        }

        return data;
    }

    private tooltipMouseEnter(): void {
        this.isTooltipHovered = true;
    }

    private tooltipMouseLeave(): void {
        this.isTooltipHovered = false;
        this.tooltipModel = null;
    }

    @autobind
    private getSvg() {
        return this.svgContainer.firstChild;
    }

    @autobind
    private getData() {
        const data = [];
        for (const group of this.analysisGroupsWithData) {
            data.push({
                scatterData:getScatterData(this.sortedGroupedSurvivals[group.value], this.estimates[group.value]),
                title: group.legendText !== undefined ? group.legendText : group.value
            });
        }
        return getDownloadContent(data, this.props.title);
    }

    @autobind
    private hoverCircleFillOpacity(datum:any, active:any) {
        if (active ||
            (this.isTooltipHovered && this.tooltipModel &&
            this.tooltipModel.datum.studyId === datum.studyId &&
                this.tooltipModel.datum.patientId === datum.patientId)) {
            return 0.3;
        } else {
            return 0;
        }
    }

    @computed get analysisGroupsWithData() {
        let analysisGroups = this.props.analysisGroups;
        // filter out groups with no data
        analysisGroups = analysisGroups.filter(grp=>((grp.value in this.scatterData) && (this.scatterData[grp.value].numOfCases > 0)));
        return analysisGroups;
    }

    @computed get scattersAndLines() {
        // sort highlighted group to the end to show its elements on top
        let analysisGroupsWithData = this.analysisGroupsWithData;
        analysisGroupsWithData = _.sortBy(analysisGroupsWithData, grp=>(this.highlightedCurve === grp.value ? 1 : 0));

        const lineElements = analysisGroupsWithData.map(grp=>(
            <VictoryLine key={grp.value} interpolation="stepAfter" data={this.scatterData[grp.value].line}
                        style={{data:{
                            stroke:grp.color,
                            strokeWidth: this.highlightedCurve === grp.value ? 4 : 1,
                            fill:"#000000",
                            fillOpacity:0
                        }}}
            />
        ));
        const scatterWithOpacityElements = analysisGroupsWithData.map(grp=>(
            <VictoryScatter key={grp.value} data={this.scatterData[grp.value].scatterWithOpacity}
                            symbol="plus" style={{ data: { fill: grp.color, opacity: (d:any) => d.opacity } }}
                            size={3} />
        ));
        const scatterElements = analysisGroupsWithData.map(grp=>(
            <VictoryScatter key={grp.value} data={this.scatterData[grp.value].scatter}
                            symbol="circle" style={{ data: { fill: grp.color, fillOpacity: this.hoverCircleFillOpacity} }}
                            size={10} events={this.events} />
        ));
        return lineElements.concat(scatterWithOpacityElements).concat(scatterElements);
    }

    @computed get legendForDownload() {
        // override the legend style without mutating the actual theme object
        const theme = _.cloneDeep(CBIOPORTAL_VICTORY_THEME);
        theme.legend.style.data = {
            type: "square",
            size: 5,
            strokeWidth: 0,
            stroke: "black"
        };

        return (
            <VictoryLegend
                x={0}
                y={this.styleOpts.height + 1}
                style={{
                    ...theme.legend.style,
                    title: { fontWeight: "bold" }
                }}
                title={this.props.title}
                rowGutter={-10}
                data={this.legendDataForDownload}
                groupComponent={<g className="survivalChartDownloadLegend" />}
            />
        );
    }

    @computed
    get chart() {
        return (
            <div className={this.props.className} data-test={'SurvivalChart'}>

                {this.props.showDownloadButtons &&
                <DownloadControls
                    dontFade={true}
                    filename={this.props.fileName}
                    buttons={["SVG", "PNG", "PDF", "Data"]}
                    getSvg={this.getSvg}
                    getData={this.getData}
                    style={{position:'absolute', zIndex: 10, right: 10}}
                    collapse={true}
                />
                }

                <VictoryChart containerComponent={<VictoryZoomContainer responsive={false}
                                                                        disable={this.props.disableZoom}
                                                                        onZoomDomainChange={_.debounce((domain: any) => {
                                                                            this.scatterFilter = domain as SurvivalPlotFilters;
                                                                        }, 1000)}
                                                                        containerRef={(ref: any) => this.svgContainer = ref}/>}
                              height={this.styleOpts.height} width={this.styleOpts.width}
                              padding={this.styleOpts.padding}
                              theme={CBIOPORTAL_VICTORY_THEME}
                              domainPadding={{x: [10, 50], y: [20, 20]}}>
                    <VictoryAxis style={this.styleOpts.axis.x} crossAxis={false} tickCount={11}
                                 label={this.props.xAxisLabel}/>
                    <VictoryAxis label={this.props.yAxisLabel} dependentAxis={true} tickFormat={(t: any) => `${t}%`}
                                 tickCount={11}
                                 style={this.styleOpts.axis.y} domain={[0, 100]} crossAxis={false}/>
                    {this.scattersAndLines}
                    {(this.victoryLegendData.length > 0) &&
                    <VictoryLegend x={this.styleOpts.legend.x} y={this.styleOpts.legend.y}
                                   data={this.victoryLegendData} />
                    }
                    {this.legendForDownload}
                </VictoryChart>
            </div>
        );
    }

    @computed get chartTooltip() {
        return (
            <div style={{maxWidth: 250}}>
                {this.analysisGroupsWithData.map(group=>(
                    <span
                        key={group.value}
                        style={{display:"inline-block", marginRight:12, fontWeight: this.highlightedCurve === group.value ? "bold" : "initial", cursor:"pointer"}}
                        onClick={()=>{ this.highlightedCurve = (this.highlightedCurve === group.value ? "" : group.value)}}
                    >
                        <div style={{width:10, height:10, display:"inline-block", backgroundColor:group.color, marginRight:5}}/>
                        {!!group.legendText ? group.legendText : group.value}
                    </span>
                ))}
                { this.props.toggleSurvivalHideNAPatients && (
                    <div className="checkbox"><label>
                        <input
                            type="checkbox"
                            checked={this.props.naPatientsHiddenInSurvival}
                            onClick={this.props.toggleSurvivalHideNAPatients}
                        /> Exclude patients with NA for any of the selected attributes.
                    </label></div>
                )}
            </div>
        );
    }

    @computed get tableRows() {
        return this.props.analysisGroups.map(grp=>(
            <tr>
                <td>{!!grp.legendText ? grp.legendText : grp.value}</td>
                {
                    getStats(this.sortedGroupedSurvivals[grp.value], this.estimates[grp.value]).map(stat =>
                        <td><b>{stat}</b></td>)
                }
            </tr>
        ));
    }

    public render() {
        if (this.props.patientSurvivals.length === 0) {
            return <div className={'alert alert-info'}>No data to plot.</div>;
        } else {
            return (

                <div>
                    { (this.props.legendLocation === LegendLocation.TOOLTIP) ? (
                        <DefaultTooltip
                            mouseEnterDelay={0}
                            mouseLeaveDelay={0.5}
                            placement="rightBottom"
                            overlay={this.chartTooltip}
                        >
                            {this.chart}
                        </DefaultTooltip>
                    ) : this.chart }
                    {this.tooltipModel &&
                        <Popover arrowOffsetTop={56} className={classnames("cbioportal-frontend", "cbioTooltip", styles.Tooltip)} positionLeft={this.tooltipModel.x + 10}
                                 { ...{container:this} }
                            positionTop={this.tooltipModel.y - 47}
                            onMouseEnter={this.tooltipMouseEnter} onMouseLeave={this.tooltipMouseLeave}>
                            <div>
                                Patient ID: <a href={getPatientViewUrl(this.tooltipModel.datum.studyId, this.tooltipModel.datum.patientId)} target="_blank">{this.tooltipModel.datum.patientId}</a><br />
                                {this.props.yLabelTooltip}: {(this.tooltipModel.datum.y).toFixed(2)}%<br />
                                {this.tooltipModel.datum.status ? this.props.xLabelWithEventTooltip :
                                    this.props.xLabelWithoutEventTooltip}
                                : {this.tooltipModel.datum.x.toFixed(2)} months {this.tooltipModel.datum.status ? "" :
                                "(censored)"}<br/>
                                {this.props.analysisClinicalAttribute && (
                                    <span>
                                        {this.props.analysisClinicalAttribute.displayName}: {this.props.patientToAnalysisGroup[this.tooltipModel.datum.uniquePatientKey]}
                                    </span>
                                )}
                            </div>
                        </Popover>
                    }
                    {this.props.showTable &&
                        <table className="table table-striped" style={{marginTop:20, width: '100%'}}>
                            <tbody>
                                <tr>
                                    <td />
                                    <td>{this.props.totalCasesHeader}</td>
                                    <td>{this.props.statusCasesHeader}</td>
                                    <td>{this.props.medianMonthsHeader}</td>
                                </tr>
                                {this.tableRows}
                            </tbody>
                        </table>
                    }
                </div>
            );
        }
    }
}