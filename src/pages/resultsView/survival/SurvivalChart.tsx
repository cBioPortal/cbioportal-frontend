import * as React from 'react';
import {observer} from "mobx-react";
import {PatientSurvival} from "../../../shared/model/PatientSurvival";
import {Line} from 'react-chartjs-2';
import {computed, observable} from "mobx";
import {Popover, Table} from 'react-bootstrap';
import styles from "./styles.module.scss";
import {ChartPoint} from "chart.js";
import jStat from 'jStat';
import {sleep} from "../../../shared/lib/TimeUtils";

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

export function getChartData(patientSurvivals: PatientSurvival[], estimates: number[]): ChartPoint[] {

    let chartData: ChartPoint[] = [];

    chartData.push({x: 0, y: 100});
    patientSurvivals.forEach((patientSurvival, index) => {
        chartData.push({x: patientSurvival.months, y: estimates[index] * 100})
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
    private isTooltipHovered: boolean;
    @observable private pngAnchor = '';
    private alteredLegendText = 'Cases with Alteration(s) in Query Gene(s)';
    private unalteredLegendText = 'Cases without Alteration(s) in Query Gene(s)';

    constructor(props: ISurvivalChartProps) {
        super(props);
        this.tooltipMouseEnter = this.tooltipMouseEnter.bind(this);
        this.tooltipMouseLeave = this.tooltipMouseLeave.bind(this);
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

    data = {
        datasets: [
            {
                label: this.alteredLegendText,
                fill: false,
                borderColor: 'rgba(255, 0, 0, 1)',
                backgroundColor: 'rgba(255, 0, 0, 1)',
                pointBorderColor: 'rgba(255, 0, 0, 1)',
                data: getChartData(this.sortedAlteredPatientSurvivals, this.alteredEstimates)
            },
            {
                label: this.unalteredLegendText,
                fill: false,
                borderColor: 'rgba(0, 0, 255, 1)',
                backgroundColor: 'rgba(0, 0, 255, 1)',
                pointBorderColor: 'rgba(0, 0, 255, 1)',
                data: getChartData(this.sortedUnalteredPatientSurvivals, this.unalteredEstimates)
            }
        ]
    };

    options = {
        elements: {
            line: {
                stepped: true,
                borderWidth: 1
            },
            point: {
                pointStyle: 'cross',
                radius: 4,
                hoverRadius: 6,
                borderWidth: 2
            }
        },
        legend: {
            position: 'right',
            labels: {
                generateLabels:() => {
                    return [
                        {text: this.alteredLegendText, fillStyle: 'rgba(255, 0, 0, 1)', lineWidth: 0},
                        {text: this.unalteredLegendText, fillStyle: 'rgba(0, 0, 255, 1)', lineWidth: 0},
                        {text: 'Logrank Test P-Value: ' + this.logRank.toPrecision(3), fillStyle: 'rgba(0, 0, 0, 0)', lineWidth: 0}
                    ];
                }
            }
        },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    max: 100,
                    stepSize: 10,
                    callback: function(value: any) {
                        return value + '%';
                    }
                },
                scaleLabel: {
                    display: true,
                    labelString: this.props.yAxisLabel,
                    fontSize: 16
                },
                gridLines: {
                    drawOnChartArea: false
                }
            }],
            xAxes: [{
                type: 'linear',
                scaleLabel: {
                    display: true,
                    labelString: this.props.xAxisLabel,
                    fontSize: 16
                },
                gridLines: {
                    drawOnChartArea: false
                }
            }]
        },
        tooltips: {
            enabled: false,
            mode: 'nearest',
            custom: async (tooltipModel: any) => {
                if (tooltipModel.opacity === 0) {
                    await sleep(100);
                    if (!this.isTooltipHovered) {
                        this.tooltipModel = null;
                    }
                    return;
                }
                this.tooltipModel = tooltipModel;
            }
        },
        hover: {
            mode: 'nearest'
        },
        title: {
            display: true,
            text: this.props.title,
            fontSize: 24
        },
        animation: {
            onComplete: (animation: any) => {
                this.pngAnchor = animation.chart.toBase64Image();
            }
        }
    };

    public render() {

        let hoveredPatientSurvival: PatientSurvival | null = null;
        let hoveredEstimate: number | null = null;

        if (this.tooltipModel) {
            const dataPoint:any = this.tooltipModel.dataPoints[0];
            if (dataPoint.index > 0) {
                if (dataPoint.datasetIndex === 0) {
                    hoveredPatientSurvival = this.sortedAlteredPatientSurvivals[dataPoint.index - 1];
                    hoveredEstimate = this.alteredEstimates[dataPoint.index - 1];
                } else {
                    hoveredPatientSurvival = this.sortedUnalteredPatientSurvivals[dataPoint.index - 1];
                    hoveredEstimate = this.unalteredEstimates[dataPoint.index - 1];
                }
            }
        }

        return (
            <div className={styles.SurvivalChart}>
                <Line data={this.data} options={this.options}/>
                {this.tooltipModel && hoveredPatientSurvival && hoveredEstimate &&
                <Popover arrowOffsetTop={48} positionLeft={this.tooltipModel.caretX + 15}
                         positionTop={this.tooltipModel.caretY - 72}
                         onMouseEnter={this.tooltipMouseEnter} onMouseLeave={this.tooltipMouseLeave}>
                    <div className={styles.Tooltip}>
                        Patient ID: <a href={'/case.do#/patient?caseId=' + hoveredPatientSurvival.patientId + '&studyId=' +
                    hoveredPatientSurvival.studyId} target="_blank">{hoveredPatientSurvival.patientId}</a><br/>
                        {this.props.yLabelTooltip}: {(hoveredEstimate * 100).toFixed(2)}%<br/>
                        {hoveredPatientSurvival.status ? this.props.xLabelWithEventTooltip :
                            this.props.xLabelWithoutEventTooltip}
                            : {hoveredPatientSurvival.months.toFixed(2)} months {hoveredPatientSurvival.status ? "" :
                        "(censored)"}
                    </div>

                </Popover>
                }
                <div className={styles.PNG + ' cbioportal-frontend'}>
                    <a className={`btn btn-default btn-xs ${this.pngAnchor ? '': ' disabled'}`}
                       href={this.pngAnchor} download="cBioPortalSurvival.png">PNG <i className="fa fa-cloud-download"/>
                    </a>
                </div>
                <div className={styles.SurvivalTable}>
                    <Table bordered condensed striped>
                        <thead>
                            <tr>
                                <th/>
                                <th>{this.props.totalCasesHeader}</th>
                                <th>{this.props.statusCasesHeader}</th>
                                <th>{this.props.medianMonthsHeader}</th>
                            </tr>
                        </thead>
                        <tbody>
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
