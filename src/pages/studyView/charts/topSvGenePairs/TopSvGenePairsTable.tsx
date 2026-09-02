import * as React from 'react';
import { observer } from 'mobx-react';
import { MobxPromise } from 'cbioportal-frontend-commons';
import { SvGenePairRow } from './svGenePairData';
import FixedHeaderTable from 'pages/studyView/table/FixedHeaderTable';
import { Column } from 'shared/components/lazyMobXTable/LazyMobXTable';
import { getFrequencyStr } from 'pages/studyView/StudyViewUtils';
import styles from 'pages/studyView/table/tables.module.scss';
import { EllipsisTextTooltip } from 'cbioportal-frontend-commons';

interface TopSvGenePairsTableProps {
    promise: MobxPromise<SvGenePairRow[]>;
    onSelectPair: (row: SvGenePairRow) => void;
    /** Gene-pair keys currently filtering the cohort, shown as selected rows. */
    selectedKeys?: string[];
    numberOfProfiledSamples?: number;
    width?: number;
    height?: number;
}

const GENE_PAIR_COL_WIDTH_RATIO = 0.6;
const SAMPLE_COUNT_COL_WIDTH_RATIO = 0.2;
const FREQ_COL_WIDTH_RATIO = 0.2;

const DEFAULT_WIDTH = 398;
const DEFAULT_HEIGHT = 350;

function buildColumns(
    onSelectPair: (row: SvGenePairRow) => void,
    numberOfProfiledSamples: number | undefined,
    tableWidth: number
): Column<SvGenePairRow>[] {
    const genePairWidth = Math.floor(tableWidth * GENE_PAIR_COL_WIDTH_RATIO);
    const countWidth = Math.floor(tableWidth * SAMPLE_COUNT_COL_WIDTH_RATIO);
    const freqWidth = Math.floor(tableWidth * FREQ_COL_WIDTH_RATIO);

    return [
        {
            name: 'Gene Pair',
            render: (row: SvGenePairRow) => (
                <div
                    className={styles.labelContent}
                    data-testid="sv-pair-row"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectPair(row)}
                >
                    <EllipsisTextTooltip text={row.uniqueKey} />
                </div>
            ),
            sortBy: (row: SvGenePairRow) => row.uniqueKey,
            defaultSortDirection: 'asc' as 'asc',
            filter: (
                row: SvGenePairRow,
                filterString: string,
                filterStringUpper: string
            ) => row.uniqueKey.toUpperCase().includes(filterStringUpper),
            width: genePairWidth,
        },
        {
            name: '# Samples',
            tooltip: <span>Number of samples with this gene pair fusion</span>,
            render: (row: SvGenePairRow) => (
                <span
                    className={styles.pullRight}
                    style={{ cursor: 'pointer', marginRight: 3 }}
                    onClick={() => onSelectPair(row)}
                >
                    {row.sampleCount.toLocaleString()}
                </span>
            ),
            sortBy: (row: SvGenePairRow) => row.sampleCount,
            defaultSortDirection: 'desc' as 'desc',
            filter: (row: SvGenePairRow, filterString: string) =>
                String(row.sampleCount).includes(filterString),
            width: countWidth,
        },
        {
            name: 'Freq',
            tooltip: (
                <span>Percentage of profiled samples with this gene pair</span>
            ),
            render: (row: SvGenePairRow) => {
                if (!numberOfProfiledSamples) {
                    return (
                        <span
                            className={styles.pullRight}
                            style={{ cursor: 'pointer', marginRight: 3 }}
                            onClick={() => onSelectPair(row)}
                        >
                            &mdash;
                        </span>
                    );
                }
                const pct = (row.sampleCount / numberOfProfiledSamples) * 100;
                return (
                    <span
                        className={styles.pullRight}
                        style={{ cursor: 'pointer', marginRight: 3 }}
                        onClick={() => onSelectPair(row)}
                    >
                        {getFrequencyStr(pct)}
                    </span>
                );
            },
            sortBy: (row: SvGenePairRow) => {
                if (!numberOfProfiledSamples) {
                    return 0;
                }
                return (row.sampleCount / numberOfProfiledSamples) * 100;
            },
            defaultSortDirection: 'desc' as 'desc',
            filter: (row: SvGenePairRow, filterString: string) => {
                if (!numberOfProfiledSamples) {
                    return false;
                }
                const pct = (row.sampleCount / numberOfProfiledSamples) * 100;
                return getFrequencyStr(pct).includes(filterString);
            },
            width: freqWidth,
        },
    ];
}

const TopSvGenePairsTable: React.FC<TopSvGenePairsTableProps> = observer(
    ({
        promise,
        onSelectPair,
        selectedKeys,
        numberOfProfiledSamples,
        width = DEFAULT_WIDTH,
        height = DEFAULT_HEIGHT,
    }) => {
        if (promise.isPending) {
            return <div style={{ padding: 4, color: '#999' }}>Loading…</div>;
        }

        const rows = (promise.result || []).slice(0, 15);

        if (rows.length === 0) {
            return (
                <div style={{ padding: 4, color: '#999' }}>
                    No structural variants.
                </div>
            );
        }

        const columns = buildColumns(
            onSelectPair,
            numberOfProfiledSamples,
            width
        );
        const selected = new Set(selectedKeys || []);

        return (
            <FixedHeaderTable
                data={rows}
                columns={columns}
                sortBy="# Samples"
                sortDirection={'desc' as 'desc'}
                width={width}
                height={height}
                isSelectedRow={(row: SvGenePairRow) =>
                    selected.has(row.uniqueKey)
                }
                numberOfSelectedRows={
                    rows.filter(r => selected.has(r.uniqueKey)).length
                }
                hideControls={true}
            />
        );
    }
);

export default TopSvGenePairsTable;
