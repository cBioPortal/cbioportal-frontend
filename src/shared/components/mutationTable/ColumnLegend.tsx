import * as React from 'react';
import styles from './columnLegend.module.scss';

export interface IColumnLegendCategory {
    value: string;
    label?: React.ReactNode;
    description?: React.ReactNode;
    swatch?: React.ReactNode;
}

export interface IColumnLegendProps {
    description: React.ReactNode;
    // values of the column, listed with their definitions
    categories?: IColumnLegendCategory[];
}

/**
 * Column header tooltip: a description of the column and a legend of its
 * values. Counts per value are shown in the column filter menus.
 */
const ColumnLegend: React.FunctionComponent<IColumnLegendProps> = props => (
    <div className={styles.columnLegend} data-test="column-legend">
        <div className={styles.description}>{props.description}</div>
        {props.categories && props.categories.length > 0 && (
            <table className={styles.breakdown}>
                <tbody>
                    {props.categories.map(c => (
                        <tr
                            key={c.value}
                            data-test={`column-legend-row-${c.value}`}
                        >
                            <td className={styles.swatch}>{c.swatch}</td>
                            <td>
                                <div className={styles.value}>
                                    {c.label || c.value}
                                </div>
                                {c.description && (
                                    <div className={styles.valueDescription}>
                                        {c.description}
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
    </div>
);

export default ColumnLegend;
