import { FunctionComponent } from 'react';
import * as React from 'react';
import { IMultipleCategoryBarPlotData } from 'shared/components/plots/MultipleCategoryBarPlot';

type CategoryTableProps = {
    data: IMultipleCategoryBarPlotData[];
    labels: string[];
};

export const CategoryTable: FunctionComponent<CategoryTableProps> = (
    props: CategoryTableProps
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
                {props.data.map(d => (
                    <tr>
                        <td>{d.minorCategory}</td>
                        {d.counts.map(c => (
                            <td>{c.count}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
