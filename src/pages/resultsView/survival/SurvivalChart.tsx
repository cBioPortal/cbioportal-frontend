import * as React from 'react';
import {observer} from "mobx-react";
import {PatientSurvival} from "../../../shared/model/PatientSurvival";
import {computed, observable} from "mobx";
import {Popover, Table} from 'react-bootstrap';
import styles from "./styles.module.scss";
import jStat from 'jStat';
import {sleep} from "../../../shared/lib/TimeUtils";
import {VictoryChart, VictoryContainer, VictoryLine, VictoryTooltip,
    VictoryAxis, VictoryLegend, VictoryLabel, VictoryScatter, VictoryTheme} from 'victory';
import SvgSaver from 'svgsaver';

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
}

export function getEstimates(patientSurvivals: PatientSurvival[]): number[] {

    let estimates: number[] = [];
    let previousEstimate: number = 1;
    patientSurvivals.forEach((patientSurvival, index) => {
        if (patientSurvival.status) {
            const atRisk = patientSurvivals.length - index;
            const estimate = previousEstimate * ((atRisk - 1) / atRisk);
            previousEstimate = estimate;
            estimates.push(estimate);
        } else {
            estimates.push(previousEstimate);
        }
    });
    return estimates;
}

export function getMedian(patientSurvivals: PatientSurvival[], estimates: number[]): string {

    let median: string = "NA";
    for (let i = 0; i < estimates.length; i++) {
        if (estimates[i] <= 0.5) {
            median = patientSurvivals[i].months.toString();
            break;
        }
    }
    return median;
}

export function getLineData(patientSurvivals: PatientSurvival[], estimates: number[]): any[] {

    let chartData: any[] = [];

    chartData.push({x: 0, y: 100});
    patientSurvivals.forEach((patientSurvival, index) => {
        chartData.push({x: patientSurvival.months, y: estimates[index] * 100})
    });

    return chartData;
}

export function getScatterData(patientSurvivals: PatientSurvival[], estimates: number[]): any[] {
    
        let chartData: any[] = [];

        patientSurvivals.forEach((patientSurvival, index) => {
            chartData.push({x: patientSurvival.months, y: estimates[index] * 100,
                patientId: patientSurvival.patientId, studyId: patientSurvival.studyId,
            status: patientSurvival.status});
        });
    
        return chartData;
    }

export function getScatterDataWithOpacity(patientSurvivals: PatientSurvival[], estimates: number[]): any[] {
    
        let scatterData = getScatterData(patientSurvivals, estimates);
        let chartData: any[] = [];
        let previousEstimate: number;

        patientSurvivals.forEach((patientSurvival, index) => {
            const estimate = estimates[index];
            let opacity: number = 1;
            if (previousEstimate && estimate !== previousEstimate) {
                opacity = 0;
            }
            previousEstimate = estimate;
            chartData.push({...scatterData[index], opacity: opacity});
        });
    
        return chartData;
    }

export function getStats(patientSurvivals: PatientSurvival[], estimates: number[]): [number, number, string] {

    return [patientSurvivals.length,
        patientSurvivals.filter(patientSurvival => patientSurvival.status === true).length,
        getMedian(patientSurvivals, estimates)];
}

export function calculateLogRank(alteredPatientSurvivals: PatientSurvival[],
                                 unalteredPatientSurvivals: PatientSurvival[]) : number {

    let alteredIndex = 0;
    let unalteredIndex = 0;
    let totalAlteredNumberOfFailure = 0;
    let totalExpectation = 0;
    let totalVariance = 0;

    while (alteredIndex < alteredPatientSurvivals.length && unalteredIndex < unalteredPatientSurvivals.length) {

        let alteredNumberOfFailure = 0;
        let unalteredNumberOfFailure = 0;
        const alteredAtRisk = alteredPatientSurvivals.length - alteredIndex;
        const unalteredAtRisk = unalteredPatientSurvivals.length - unalteredIndex;
        const alteredPatientSurvival = alteredPatientSurvivals[alteredIndex];
        const unalteredPatientSurvival = unalteredPatientSurvivals[unalteredIndex];

        if (alteredPatientSurvival.months < unalteredPatientSurvival.months ||
            alteredPatientSurvival.months === unalteredPatientSurvival.months) {
            if (alteredPatientSurvival.status) {
                alteredNumberOfFailure = 1;
            }
            alteredIndex += 1;
        }

        if (alteredPatientSurvival.months > unalteredPatientSurvival.months ||
            alteredPatientSurvival.months === unalteredPatientSurvival.months) {
            if (unalteredPatientSurvival.status) {
                unalteredNumberOfFailure = 1;
            }
            unalteredIndex += 1;
        }

        const numberOfFailures = alteredNumberOfFailure + unalteredNumberOfFailure;
        const atRisk = alteredAtRisk + unalteredAtRisk;
        const expectation = (alteredAtRisk / (atRisk)) * (numberOfFailures);
        const variance = (numberOfFailures * (atRisk - numberOfFailures) * alteredAtRisk * unalteredAtRisk) /
            ((atRisk * atRisk) * (atRisk - 1));

        totalAlteredNumberOfFailure += alteredNumberOfFailure;
        totalExpectation += expectation;
        totalVariance += variance;
    }

    const chiSquareScore = (totalAlteredNumberOfFailure - totalExpectation) *
        (totalAlteredNumberOfFailure - totalExpectation) / totalVariance;

    return 1 - jStat.chisquare.cdf(chiSquareScore, 1);
}

@observer
export default class SurvivalChart extends React.Component<ISurvivalChartProps, {}> {

    @observable tooltipModel: any;
    private isTooltipHovered: boolean = false;
    private tooltipCounter: number = 0;
    private alteredLegendText = 'Cases with Alteration(s) in Query Gene(s)';
    private unalteredLegendText = 'Cases without Alteration(s) in Query Gene(s)';
    private svgContainer:any;
    private svgsaver = new SvgSaver();

    constructor(props: ISurvivalChartProps) {
        super(props);
        this.tooltipMouseEnter = this.tooltipMouseEnter.bind(this);
        this.tooltipMouseLeave = this.tooltipMouseLeave.bind(this);
        this.downloadSvg = this.downloadSvg.bind(this);
        this.downloadPng = this.downloadPng.bind(this);
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

    public render() {

        const events = [{
            target: "data",
            eventHandlers: {
              onMouseOver: () => {
                return [
                  {
                    target: "data",
                    mutation: () => ({ active: true })
                  },
                  {
                    target: "labels",
                    mutation: (props:any) => { 
                        this.tooltipModel = props;
                        this.tooltipCounter++;
                    }
                  }
                ];
              },
              onMouseOut: () => {
                return [
                  {
                    target: "data",
                    mutation: () => ({ active: false })
                  },
                  {
                    target: "labels",
                    mutation: async () => {
                        await sleep(100);
                        if (!this.isTooltipHovered && this.tooltipCounter === 1) {
                            this.tooltipModel = null;
                        }
                        this.tooltipCounter--;
                    }
                  }
                ];
              }
            }
          }];

        return (
            
            <div className={styles.SurvivalChart}>
                <VictoryChart containerComponent={<VictoryContainer responsive={false} containerRef={(ref:any) => this.svgContainer = ref}/>}
                height={650} width={1150} padding={{top: 50, bottom: 50, left: 60, right: 300}} theme={VictoryTheme.material}>
                    <VictoryLabel x={50} y={15} text={this.props.title} style={{fontSize: 24}}/>
                    <VictoryAxis style={{ticks: {size: 8}, tickLabels: {padding: 2}, axisLabel: {padding: 35}, grid: {opacity: 0}}} 
                    crossAxis={false} tickCount={11} label={this.props.xAxisLabel}/>
                    <VictoryAxis label={this.props.yAxisLabel} dependentAxis={true} tickFormat={(t:any) => `${t}%`} tickCount={11}
                    style={{ticks: {size: 8}, tickLabels: {padding: 2}, axisLabel: {padding: 45}, grid: {opacity: 0}}} domain={[0, 100]} crossAxis={false}/>
                    <VictoryScatter data={getScatterDataWithOpacity(this.sortedAlteredPatientSurvivals, this.alteredEstimates)}
                    symbol="plus" style={{data: {fill: "red"}}} size={3}/>
                    <VictoryScatter data={getScatterDataWithOpacity(this.sortedUnalteredPatientSurvivals, this.unalteredEstimates)}
                    symbol="plus" style={{data: {fill: "blue"}}} size={3}/>
                    <VictoryLine interpolation="stepAfter" data={getLineData(this.sortedAlteredPatientSurvivals, this.alteredEstimates)}
                    style={{data: {stroke: "red", strokeWidth: 1}}}/>
                    <VictoryLine interpolation="stepAfter" data={getLineData(this.sortedUnalteredPatientSurvivals, this.unalteredEstimates)}
                    style={{data: {stroke: "blue", strokeWidth: 1}}}/>
                    <VictoryLegend x={850} y={40}
                    data={[
                        {name: this.alteredLegendText, symbol: { fill: "red", type: "square" }}, 
                        {name: this.unalteredLegendText, symbol: { fill: "blue", type: "square" }},
                        {name: `Logrank Test P-Value: ${this.logRank.toPrecision(3)}`, symbol: {opacity: 0}}]}/>
                </VictoryChart>
                {this.tooltipModel &&
                <Popover arrowOffsetTop={48} positionLeft={this.tooltipModel.x + 15}
                         positionTop={this.tooltipModel.y - 60}
                         onMouseEnter={this.tooltipMouseEnter} onMouseLeave={this.tooltipMouseLeave}>
                    <div className={styles.Tooltip}>
                        Patient ID: <a href={'/case.do#/patient?caseId=' + this.tooltipModel.datum.patientId + '&studyId=' +
                    this.tooltipModel.datum.studyId} target="_blank">{this.tooltipModel.datum.patientId}</a><br/>
                        {this.props.yLabelTooltip}: {(this.tooltipModel.datum.y).toFixed(2)}%<br/>
                        {this.tooltipModel.datum.status ? this.props.xLabelWithEventTooltip :
                            this.props.xLabelWithoutEventTooltip}
                            : {this.tooltipModel.datum.x.toFixed(2)} months {this.tooltipModel.datum.status ? "" :
                        "(censored)"}
                    </div>

                </Popover>
                }
                <div className={styles.SVG + ' cbioportal-frontend'}>
                    <a className={`btn btn-default btn-xs`} onClick={this.downloadSvg}>
                    SVG <i className="fa fa-cloud-download"/>
                    </a>
                </div>
                <div className={styles.PNG + ' cbioportal-frontend'}>
                    <a className={`btn btn-default btn-xs`} onClick={this.downloadPng}>
                    PNG <i className="fa fa-cloud-download"/>
                    </a>
                </div>
                <div className={styles.SurvivalTable}>
                    <Table bordered condensed striped>
                        <tbody>
                            <tr>
                                <td/>
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
                    </Table>
                </div>
            </div>
        );
    }
}
