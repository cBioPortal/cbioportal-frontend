import { FunctionComponent } from 'react';
import _ from 'lodash';
import * as React from 'react';

type SummaryStatisticsTableProps = { data: any[]; labels: string[] };

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
        <table className="table table-striped" style={{ minWidth: '400px' }}>
            <thead>
                <tr>{headers}</tr>
            </thead>
            <tbody>
                <tr>
                    <td>Maximum</td>
                    {props.data.map(d => (
                        <td>{_.round(d.max, 2)}</td>
                    ))}
                </tr>
                <tr>
                    <td>75% (q3)</td>
                    {props.data.map(d => (
                        <td>{_.round(d.q3, 2)}</td>
                    ))}
                </tr>
                <tr>
                    <td>Median</td>
                    {props.data.map(d => (
                        <td>{_.round(d.median, 2)}</td>
                    ))}
                </tr>
                <tr>
                    <td>25% (q1)</td>
                    {props.data.map(d => (
                        <td>{_.round(d.q1, 2)}</td>
                    ))}
                </tr>
                <tr>
                    <td>Minimum</td>
                    {props.data.map(d => (
                        <td>{_.round(d.min, 2)}</td>
                    ))}
                </tr>
            </tbody>
        </table>
    );
};
