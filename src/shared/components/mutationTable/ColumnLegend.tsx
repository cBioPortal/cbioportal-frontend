import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { IAnnotation } from 'react-mutation-mapper';
import styles from './columnLegend.module.scss';

/**
 * Gives column header legends access to the table they belong to, so they can
 * summarize the rows currently shown (after filtering) and filter the table.
 */
export interface IColumnLegendTable {
    getRows: () => Mutation[][];
    getFilterString?: () => string;
    setFilterString?: (filterString: string) => void;
    getAnnotation?: (mutation: Mutation) => IAnnotation;
}

export const ColumnLegendTableContext = React.createContext<
    IColumnLegendTable | undefined
>(undefined);

/**
 * False on the first render and true right after it has been painted, so a
 * tooltip can show up immediately and compute its counts afterwards.
 */
export function useDeferredRender(): boolean {
    const [ready, setReady] = React.useState(false);
    React.useEffect(() => {
        const timeout = window.setTimeout(() => setReady(true), 0);
        return () => window.clearTimeout(timeout);
    }, []);
    return ready;
}

export const ColumnLegendLoading: React.FunctionComponent = () => (
    <div className={styles.loading} data-test="column-legend-loading">
        <i className="fa fa-spinner fa-pulse" /> Counting the mutations in this
        table…
    </div>
);

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
