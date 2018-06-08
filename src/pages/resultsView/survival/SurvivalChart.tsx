import * as React from 'react';
import { observer } from "mobx-react";
import { PatientSurvival } from "../../../shared/model/PatientSurvival";
import { computed, observable } from "mobx";
import { Popover, Table } from 'react-bootstrap';
import styles from "./styles.module.scss";
import { sleep } from "../../../shared/lib/TimeUtils";
import * as _ from 'lodash';
import {
    VictoryChart, VictoryContainer, VictoryLine, VictoryTooltip,
    VictoryAxis, VictoryLegend, VictoryLabel, VictoryScatter, VictoryTheme
} from 'victory';
import SvgSaver from 'svgsaver';
import fileDownload from 'react-file-download';
import {
    getEstimates, getMedian, getLineData, getScatterData, getScatterDataWithOpacity, getStats, calculateLogRank,
    getDownloadContent, convertScatterDataToDownloadData
} from "./SurvivalUtil";
import CBIOPORTAL_VICTORY_THEME from "../../../shared/theme/cBioPoralTheme";
import { toConditionalPrecision } from 'shared/lib/NumberUtils';

export interface ISurvivalChartProps {
    alteredPatientSurvivals: PatientSurvival[];
    unalteredPatientSurvivals: PatientSurvival[];
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
    showLegend?: boolean;
    showDownloadButtons?: boolean;
    styleOpts?: ConfigurableSurvivalChartStyleOpts;
}

export type ConfigurableSurvivalChartStyleOpts = {
    width?: number,
    height?: number,
}

@observer
export default class SurvivalChart extends React.Component<ISurvivalChartProps, {}> {

    @observable tooltipModel: any;
    private isTooltipHovered: boolean = false;
    private tooltipCounter: number = 0;
    private alteredLegendText = 'Cases with Alteration(s) in Query Gene(s)';
    private unalteredLegendText = 'Cases without Alteration(s) in Query Gene(s)';
    private svgContainer: any;
    private svgsaver = new SvgSaver();
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

    @computed
    get styleOpts() {
        let configurableOpts: any = _.merge({}, this.styleOptsDefaultProps, this.props.styleOpts);
        configurableOpts.padding.right = this.props.showLegend ? 300 : configurableOpts.padding.right;
        configurableOpts.legend.x = configurableOpts.width - configurableOpts.padding.right;
        return configurableOpts;
    }

    public static defaultProps: Partial<ISurvivalChartProps> = {
        showTable: true,
        showLegend: true,
        showDownloadButtons: true
    };

    constructor(props: ISurvivalChartProps) {
        super(props);
        this.tooltipMouseEnter = this.tooltipMouseEnter.bind(this);
        this.tooltipMouseLeave = this.tooltipMouseLeave.bind(this);
        this.downloadSvg = this.downloadSvg.bind(this);
        this.downloadPng = this.downloadPng.bind(this);
        this.downloadData = this.downloadData.bind(this);
    }

    @computed get sortedAlteredPatientSurvivals(): PatientSurvival[] {
        return this.props.alteredPatientSurvivals.sort((a, b) => a.months - b.months);
    }

    @computed get sortedUnalteredPatientSurvivals(): PatientSurvival[] {
        return this.props.unalteredPatientSurvivals.sort((a, b) => a.months - b.months);
    }

    @computed get alteredEstimates(): number[] {
        return getEstimates(this.sortedAlteredPatientSurvivals);
    }

    @computed get unalteredEstimates(): number[] {
        return getEstimates(this.sortedUnalteredPatientSurvivals);
    }

    @computed get logRank(): number {
        return calculateLogRank(this.sortedAlteredPatientSurvivals, this.sortedUnalteredPatientSurvivals);
    }

    private tooltipMouseEnter(): void {
        this.isTooltipHovered = true;
    }

    private tooltipMouseLeave(): void {
        this.isTooltipHovered = false;
        this.tooltipModel = null;
    }

    private downloadSvg() {
        this.svgsaver.asSvg(this.svgContainer.firstChild, this.props.fileName + '.svg');
    }

    private downloadPng() {
        this.svgsaver.asPng(this.svgContainer.firstChild, this.props.fileName + '.png');
    }

    private downloadData() {
        fileDownload(getDownloadContent(getScatterData(this.sortedAlteredPatientSurvivals, this.alteredEstimates),
            getScatterData(this.sortedUnalteredPatientSurvivals, this.unalteredEstimates), this.props.title,
            this.alteredLegendText, this.unalteredLegendText), this.props.fileName + '.txt');
    }

    public render() {

        const events = [{
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

        return (

            <div className="posRelative" style={{width: (this.styleOpts.width + 20)}}>

                <div className="borderedChart" data-test={'SurvivalChart'} style={{width: '100%'}}>

                    {this.props.showDownloadButtons &&
                        <div className="btn-group" style={{position:'absolute', zIndex:10, right: 10 }} role="group">
                            <button className={`btn btn-default btn-xs`} onClick={this.downloadSvg}>
                                SVG <i className="fa fa-cloud-download" />
                            </button>
                            <button className={`btn btn-default btn-xs`} onClick={this.downloadPng}>
                                PNG <i className="fa fa-cloud-download" />
                            </button>
                            <button className={`btn btn-default btn-xs`} onClick={this.downloadData}>
                                Data <i className="fa fa-cloud-download" />
                            </button>
                        </div>
                    }

                    <VictoryChart containerComponent={<VictoryContainer responsive={false}
                                                                        containerRef={(ref: any) => this.svgContainer = ref}/>}
                                  height={this.styleOpts.height} width={this.styleOpts.width} padding={this.styleOpts.padding}
                                  theme={CBIOPORTAL_VICTORY_THEME}>
                        <VictoryAxis style={this.styleOpts.axis.x} crossAxis={false} tickCount={11} label={this.props.xAxisLabel}/>
                        <VictoryAxis label={this.props.yAxisLabel} dependentAxis={true} tickFormat={(t: any) => `${t}%`}
                                     tickCount={11}
                                     style={this.styleOpts.axis.y} domain={[0, 100]} crossAxis={false}/>
                        <VictoryLine interpolation="stepAfter"
                                     data={getLineData(this.sortedAlteredPatientSurvivals, this.alteredEstimates)}
                                     style={{data: {stroke: "red", strokeWidth: 1}}}/>
                        <VictoryLine interpolation="stepAfter"
                                     data={getLineData(this.sortedUnalteredPatientSurvivals, this.unalteredEstimates)}
                                     style={{data: {stroke: "blue", strokeWidth: 1}}}/>
                        <VictoryScatter data={getScatterDataWithOpacity(this.sortedAlteredPatientSurvivals, this.alteredEstimates)}
                            symbol="plus" style={{ data: { fill: "red", opacity: (d:any) => d.opacity } }} size={3} />
                        <VictoryScatter data={getScatterDataWithOpacity(this.sortedUnalteredPatientSurvivals, this.unalteredEstimates)}
                            symbol="plus" style={{ data: { fill: "blue", opacity: (d:any) => d.opacity } }} size={3} />
                        <VictoryScatter data={getScatterData(this.sortedAlteredPatientSurvivals, this.alteredEstimates)}
                            symbol="circle" style={{ data: { fill: "red", fillOpacity: (datum: any, active: any) => active ? 0.3 : 0 } }} size={10} events={events} />
                        <VictoryScatter data={getScatterData(this.sortedUnalteredPatientSurvivals, this.unalteredEstimates)}
                            symbol="circle" style={{ data: { fill: "blue", fillOpacity: (datum: any, active: any) => active ? 0.3 : 0 } }} size={10} events={events} />
                        {this.props.showLegend &&
                            <VictoryLegend x={this.styleOpts.legend.x} y={this.styleOpts.legend.y}
                                data={[
                                    { name: this.alteredLegendText, symbol: { fill: "red", type: "square" } },
                                    { name: this.unalteredLegendText, symbol: { fill: "blue", type: "square" } },
                                    { name: `Logrank Test P-Value: ${toConditionalPrecision(this.logRank, 3, 0.001)}`, symbol: { opacity: 0 } }]} />
                        }
                    </VictoryChart>
                </div>
                {this.tooltipModel &&
                    <Popover arrowOffsetTop={56} className={styles.Tooltip} positionLeft={this.tooltipModel.x + 15}
                             { ...{container:this} }
                        positionTop={this.tooltipModel.y - 60}
                        onMouseEnter={this.tooltipMouseEnter} onMouseLeave={this.tooltipMouseLeave}>
                        <div>
                            Patient ID: <a href={'/case.do#/patient?caseId=' + this.tooltipModel.datum.patientId + '&studyId=' +
                                this.tooltipModel.datum.studyId} target="_blank">{this.tooltipModel.datum.patientId}</a><br />
                            {this.props.yLabelTooltip}: {(this.tooltipModel.datum.y).toFixed(2)}%<br />
                            {this.tooltipModel.datum.status ? this.props.xLabelWithEventTooltip :
                                this.props.xLabelWithoutEventTooltip}
                            : {this.tooltipModel.datum.x.toFixed(2)} months {this.tooltipModel.datum.status ? "" :
                                "(censored)"}
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
                            <tr>
                                <td>{this.alteredLegendText}</td>
                                {
                                    getStats(this.sortedAlteredPatientSurvivals, this.alteredEstimates).map(stat =>
                                        <td><b>{stat}</b></td>)
                                }
                            </tr>
                            <tr>
                                <td>{this.unalteredLegendText}</td>
                                {
                                    getStats(this.sortedUnalteredPatientSurvivals, this.unalteredEstimates).map(stat =>
                                        <td><b>{stat}</b></td>)
                                }
                            </tr>
                        </tbody>
                    </table>
                }
            </div>
        );
    }
}