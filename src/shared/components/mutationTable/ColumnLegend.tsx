import * as React from 'react';
import { observer } from 'mobx-react';
import _ from 'lodash';
import { Mutation } from 'cbioportal-ts-api-client';
import styles from './columnLegend.module.scss';

/**
 * Supplies the rows currently shown in the table (after filtering), so that
 * column header legends can summarize the values in the column.
 */
export type ColumnLegendRowsGetter = () => Mutation[][];

export const ColumnLegendRowsContext = React.createContext<
    ColumnLegendRowsGetter | undefined
>(undefined);

export interface IColumnLegendCategory {
    value: string;
    label?: React.ReactNode;
    description?: React.ReactNode;
    swatch?: React.ReactNode;
}

type LegendValue = string | number | null | undefined;

export interface IColumnLegendProps {
    description: React.ReactNode;
    // known values of the column, listed in this order with their definitions
    categories?: IColumnLegendCategory[];
    // values of a row, one per counted unit (e.g. one per sample in the
    // patient view); enables the per-value breakdown
    getCategoryValues?: (row: Mutation[]) => LegendValue[];
    // numeric values of a row, one per counted unit; enables a numeric summary
    getNumericValues?: (row: Mutation[]) => LegendValue[];
    // value that empty categorical values are counted under
    missingValue?: string;
    // list known categories that have no values in the table (default true);
    // when false, all values are ordered by count
    showEmptyCategories?: boolean;
    // order values by their (numeric) value instead of by count
    sortByValue?: boolean;
    maxCategories?: number;
}

const DEFAULT_MAX_CATEGORIES = 10;

export type CategoryCount = {
    value: string;
    count: number;
    category?: IColumnLegendCategory;
};

export function countCategories(
    rows: Mutation[][],
    getValues: (row: Mutation[]) => LegendValue[],
    categories: IColumnLegendCategory[] = [],
    missingValue = 'NA'
): { counts: CategoryCount[]; total: number } {
    const valueToCount: { [value: string]: number } = {};
    let total = 0;
    for (const row of rows) {
        for (const v of getValues(row)) {
            const value =
                v === null || v === undefined || v === ''
                    ? missingValue
                    : String(v);
            valueToCount[value] = (valueToCount[value] || 0) + 1;
            total++;
        }
    }

    const knownValues = new Set(categories.map(c => c.value));
    const known: CategoryCount[] = categories.map(category => ({
        value: category.value,
        count: valueToCount[category.value] || 0,
        category,
    }));
    const other: CategoryCount[] = _.sortBy(
        Object.keys(valueToCount)
            .filter(value => !knownValues.has(value))
            .map(value => ({ value, count: valueToCount[value] })),
        [(c: CategoryCount) => -c.count, (c: CategoryCount) => c.value]
    );

    return { counts: [...known, ...other], total };
}

// sort keys: numbers first in numeric order, then other values alphabetically
const VALUE_SORT_KEYS = [
    (c: CategoryCount) => (isNaN(Number(c.value)) ? 1 : 0),
    (c: CategoryCount) => (isNaN(Number(c.value)) ? 0 : Number(c.value)),
    (c: CategoryCount) => c.value,
];

export type NumericSummary = {
    count: number;
    missing: number;
    // undefined when no unit has a value
    min?: number;
    median?: number;
    max?: number;
};

export function summarizeNumbers(
    rows: Mutation[][],
    getValues: (row: Mutation[]) => LegendValue[]
): NumericSummary | undefined {
    const values: number[] = [];
    let missing = 0;
    for (const row of rows) {
        for (const v of getValues(row)) {
            const n = typeof v === 'number' ? v : parseFloat(v as string);
            if (v === null || v === undefined || v === '' || isNaN(n)) {
                missing++;
            } else {
                values.push(n);
            }
        }
    }
    if (values.length === 0) {
        return missing > 0 ? { count: 0, missing } : undefined;
    }
    values.sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    const median =
        values.length % 2 === 0
            ? (values[mid - 1] + values[mid]) / 2
            : values[mid];
    return {
        count: values.length,
        missing,
        min: values[0],
        median,
        max: values[values.length - 1],
    };
}

function formatNumber(n: number) {
    return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2);
}

function formatPercent(count: number, total: number) {
    if (total === 0 || count === 0) {
        return '0%';
    }
    const pct = (100 * count) / total;
    return pct < 1 ? '<1%' : `${Math.round(pct)}%`;
}

function unitLabel(units: number, rows: number) {
    const mutations = `${rows.toLocaleString()} mutation${
        rows === 1 ? '' : 's'
    }`;
    return units === rows
        ? mutations
        : `${units.toLocaleString()} sample-level values across ${mutations}`;
}

const CategoryBreakdown: React.FunctionComponent<{
    counts: CategoryCount[];
    total: number;
    maxCategories: number;
}> = ({ counts, total, maxCategories }) => {
    // known categories are always listed; other values fill the remaining rows
    const knownCount = counts.filter(c => c.category).length;
    const other = counts.filter(c => !c.category);
    const hidden = other.slice(Math.max(maxCategories - knownCount, 0));
    const hiddenValues = new Set(hidden.map(c => c.value));
    const shown = counts.filter(c => !hiddenValues.has(c.value));
    const maxCount = _.max(counts.map(c => c.count)) || 1;

    return (
        <table className={styles.breakdown} data-test="column-legend-breakdown">
            <tbody>
                {shown.map(c => (
                    <tr
                        key={c.value}
                        className={c.count === 0 ? styles.empty : undefined}
                        data-test={`column-legend-row-${c.value}`}
                    >
                        <td className={styles.swatch}>
                            {c.category && c.category.swatch}
                        </td>
                        <td>
                            <div className={styles.value}>
                                {(c.category && c.category.label) || c.value}
                            </div>
                            {c.category && c.category.description && (
                                <div className={styles.valueDescription}>
                                    {c.category.description}
                                </div>
                            )}
                        </td>
                        <td className={styles.count}>
                            {c.count.toLocaleString()}
                        </td>
                        <td className={styles.percent}>
                            {formatPercent(c.count, total)}
                        </td>
                        <td className={styles.barCell}>
                            <div
                                className={styles.bar}
                                style={{
                                    width: `${(100 * c.count) / maxCount}%`,
                                }}
                            />
                        </td>
                    </tr>
                ))}
                {hidden.length > 0 && (
                    <tr className={styles.more}>
                        <td />
                        <td>
                            {hidden.length} more value
                            {hidden.length === 1 ? '' : 's'}
                        </td>
                        <td className={styles.count}>
                            {_.sumBy(hidden, c => c.count).toLocaleString()}
                        </td>
                        <td className={styles.percent}>
                            {formatPercent(
                                _.sumBy(hidden, c => c.count),
                                total
                            )}
                        </td>
                        <td />
                    </tr>
                )}
            </tbody>
        </table>
    );
};

const NumericBreakdown: React.FunctionComponent<{
    summary: NumericSummary;
}> = ({ summary }) => (
    <table className={styles.breakdown} data-test="column-legend-summary">
        <tbody>
            {summary.count > 0 && (
                <>
                    <tr>
                        <td>Median</td>
                        <td className={styles.count}>
                            {formatNumber(summary.median!)}
                        </td>
                    </tr>
                    <tr>
                        <td>Range</td>
                        <td className={styles.count}>
                            {formatNumber(summary.min!)} –{' '}
                            {formatNumber(summary.max!)}
                        </td>
                    </tr>
                </>
            )}
            {summary.missing > 0 && (
                <tr>
                    <td>No value</td>
                    <td className={styles.count}>
                        {summary.missing.toLocaleString()}
                    </td>
                </tr>
            )}
        </tbody>
    </table>
);

const StaticCategories: React.FunctionComponent<{
    categories: IColumnLegendCategory[];
}> = ({ categories }) => (
    <table className={styles.breakdown}>
        <tbody>
            {categories.map(c => (
                <tr key={c.value}>
                    <td className={styles.swatch}>{c.swatch}</td>
                    <td>
                        <div className={styles.value}>{c.label || c.value}</div>
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
);

/**
 * Column header tooltip: a description of the column, a legend of its known
 * values and, when the table rows are available, a breakdown of the values
 * currently in the table.
 */
const ColumnLegend: React.FunctionComponent<IColumnLegendProps> = observer(
    props => {
        const getRows = React.useContext(ColumnLegendRowsContext);
        const rows = getRows ? getRows() : undefined;

        let body: React.ReactNode = null;
        if (rows && rows.length > 0 && props.getCategoryValues) {
            const { counts: allCounts, total } = countCategories(
                rows,
                props.getCategoryValues,
                props.categories,
                props.missingValue
            );
            const counts =
                props.showEmptyCategories === false
                    ? _.sortBy(
                          allCounts.filter(c => c.count > 0),
                          props.sortByValue ? VALUE_SORT_KEYS : [c => -c.count]
                      )
                    : allCounts;
            body = (
                <>
                    <div className={styles.breakdownTitle}>
                        In this table ({unitLabel(total, rows.length)}):
                    </div>
                    <CategoryBreakdown
                        counts={counts}
                        total={total}
                        maxCategories={
                            props.maxCategories || DEFAULT_MAX_CATEGORIES
                        }
                    />
                </>
            );
        } else if (rows && rows.length > 0 && props.getNumericValues) {
            const summary = summarizeNumbers(rows, props.getNumericValues);
            body = summary && (
                <>
                    <div className={styles.breakdownTitle}>
                        In this table (
                        {unitLabel(
                            summary.count + summary.missing,
                            rows.length
                        )}
                        ):
                    </div>
                    <NumericBreakdown summary={summary} />
                </>
            );
            if (props.categories && props.categories.length > 0) {
                body = (
                    <>
                        <StaticCategories categories={props.categories} />
                        {body}
                    </>
                );
            }
        } else if (props.categories && props.categories.length > 0) {
            body = <StaticCategories categories={props.categories} />;
        }

        return (
            <div className={styles.columnLegend} data-test="column-legend">
                <div className={styles.description}>{props.description}</div>
                {body}
            </div>
        );
    }
);

export default ColumnLegend;
