import { FunctionComponent } from 'react';
import _ from 'lodash';
import * as React from 'react';

type SummaryStatisticsTableProps = {
    data: any[];
    labels: string[];
    scatterData: any[];
    showTable: boolean;
};

export const SummaryStatisticsTable: FunctionComponent<SummaryStatisticsTableProps> = (
    props: SummaryStatisticsTableProps
) => {
    const headers =
        props.labels.length === 1 ? (
            <th colSpan={2}>{props.labels[0]}</th>
        ) : (
            [<th />, props.labels.map(label => <th colSpan={1}>{label}</th>)]
        );
    return (
        <div>
            <h3>Boxplot summary</h3>
            <table
                className="table table-striped"
                style={{ minWidth: '400px' }}
            >
                <thead>
                    <tr>{headers}</tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Maximum</td>
                        {props.data.map((d, index) => (
                            <td key={index}>{_.round(d.max, 2)}</td>
                        ))}
                    </tr>
                    <tr>
                        <td>75% (q3)</td>
                        {props.data.map((d, index) => (
                            <td key={index}>{_.round(d.q3, 2)}</td>
                        ))}
                    </tr>
                    <tr>
                        <td>Median</td>
                        {props.data.map((d, index) => (
                            <td key={index}>{_.round(d.median, 2)}</td>
                        ))}
                    </tr>
                    <tr>
                        <td>25% (q1)</td>
                        {props.data.map((d, index) => (
                            <td key={index}>{_.round(d.q1, 2)}</td>
                        ))}
                    </tr>
                    <tr>
                        <td>Minimum</td>
                        {props.data.map((d, index) => (
                            <td key={index}>{_.round(d.min, 2)}</td>
                        ))}
                    </tr>
                </tbody>
            </table>
            {props.showTable && (
                <>
                    <h3>Scatter plot summary</h3>
                    <table
                        className="table table-striped"
                        style={{ minWidth: '400px' }}
                    >
                        <thead>
                            <tr>{headers}</tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Minimum</td>
                                {props.scatterData.map((d, index) => {
                                    const scatterValues = d.data.map(
                                        (x: any) => x.value
                                    );
                                    return (
                                        <td key={index}>
                                            {Math.min(...scatterValues)}
                                        </td>
                                    );
                                })}
                            </tr>
                            <tr>
                                <td>Maximum</td>
                                {props.scatterData.map((d, index) => {
                                    const scatterValues = d.data.map(
                                        (x: any) => x.value
                                    );
                                    return (
                                        <td key={index}>
                                            {Math.max(...scatterValues)}
                                        </td>
                                    );
                                })}
                            </tr>
                            <tr>
                                <td>Median</td>
                                {props.scatterData.map((d, index) => {
                                    const scatterValues = d.data.map(
                                        (x: any) => x.value
                                    );
                                    scatterValues.sort(
                                        (a: number, b: number) => a - b
                                    );
                                    const mid = Math.floor(
                                        scatterValues.length / 2
                                    );
                                    const median =
                                        scatterValues.length % 2 !== 0
                                            ? scatterValues[mid]
                                            : (scatterValues[mid - 1] +
                                                  scatterValues[mid]) /
                                              2;
                                    return <td key={index}>{median}</td>;
                                })}
                            </tr>
                            <tr>
                                <td>Mean</td>
                                {props.scatterData.map((d, index) => {
                                    const scatterValues = d.data.map(
                                        (x: any) => x.value
                                    );
                                    const total = scatterValues.reduce(
                                        (sum: number, value: number) =>
                                            sum + value,
                                        0
                                    );
                                    const mean = total / scatterValues.length;
                                    return <td key={index}>{mean}</td>;
                                })}
                            </tr>
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};
