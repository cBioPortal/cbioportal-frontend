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
import Plot from 'react-plotly.js';

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

export function getStats(patientSurvivals: PatientSurvival[], estimates: number[]): [number, number, string] {

    return [patientSurvivals.length,
        patientSurvivals.filter(patientSurvival => patientSurvival.status === true).length,
        getMedian(patientSurvivals, estimates)];
}

export function calculateLogRank(alteredPatientSurvivals: PatientSurvival[],
                                 unalteredPatientSurvivals: PatientSurvival[]): number {

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

export function getMarkerOpacities(estimates: number[]): number[] {

    let markerOpacities: number[] = [0];
    let previousData: number = 100;
    estimates.map((estimate: number) => {
        if (estimate !== previousData) {
            markerOpacities.push(0);
        } else {
            markerOpacities.push(1);
        }
        previousData = estimate;
    });

    return markerOpacities;
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

    @computed get alteredMarkerOpacities(): number[] {
        return getMarkerOpacities(this.alteredEstimates);
    }

    @computed get unalteredMarkerOpacities(): number[] {
        return getMarkerOpacities(this.unalteredEstimates);
    }

    private tooltipMouseEnter(): void {
        this.isTooltipHovered = true;
    }

    private tooltipMouseLeave(): void {
        this.isTooltipHovered = false;
        this.tooltipModel = null;
    }

    private onHover(data: any): void {

        console.log(data);
    }

    public render() {

        return (
            <div className={styles.SurvivalChart}>
                <Plot
                    data={[
                        {
                            type: 'scatter',
                            mode: 'lines+markers',
                            x: [0].concat(this.sortedAlteredPatientSurvivals.map(p => p.months)),
                            y: [100].concat(this.alteredEstimates.map(a => a*100)),
                            line: {shape: 'hv', width: 1},
                            marker: {color: 'red', symbol: 'cross', opacity: this.alteredMarkerOpacities},
                            name: this.alteredLegendText
                        },
                        {
                            type: 'scatter',
                            line: {shape: 'hv', width: 1},
                            mode: 'lines+markers',
                            x: [0].concat(this.sortedUnalteredPatientSurvivals.map(p => p.months)),
                            y: [100].concat(this.unalteredEstimates.map(a => a*100)),
                            marker: {color: 'blue', symbol: 'cross', opacity: this.unalteredMarkerOpacities},
                            name: this.unalteredLegendText
                        }
                    ]}

                    layout={{
                        width: 1159,
                        height: 579,
                        title: this.props.title,
                        hovermode: 'closest',
                        xaxis: {
                            showgrid: false
                        },
                        yaxis: {
                            showgrid: false
                        }
                    }}

                    onHover={this.onHover}
                />
                <div className={styles.LogRank}>Logrank Test P-Value: {this.logRank.toPrecision(3)}</div>
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
