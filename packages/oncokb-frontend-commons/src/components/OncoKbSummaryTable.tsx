import classnames from 'classnames';
import * as React from 'react';
import ReactTable, { Column } from 'react-table';

import Tooltip from 'rc-tooltip';
import { calcProteinChangeSortValue } from 'cbioportal-utils';

import {
    defaultSortMethod,
    defaultStringArraySortMethod,
} from 'cbioportal-utils';
import { OncoKbOccurrenceList } from './OncoKbOccurrenceList';
import {
    OncoKbLevelSummary,
    OncoKbLevelSummaryList,
} from './OncoKbLevelSummaryList';
import { LEVELS } from '../util/OncoKbUtils';

export type OncoKbSummaryTableProps = {
    usingPublicOncoKbInstance: boolean;
    data: OncoKbSummary[];
    initialSortColumn?: string;
    initialSortDirection?: 'asc' | 'desc';
    initialItemsPerPage?: number;
};

export type OncoKbSummary = {
    count: number;
    setting?: 'Germline' | 'Somatic';
    alteration: string;
    proteinChange?: string;
    clinicalImplication: string[];
    // Per study cancer type sample counts shown in the Occurrence column, with
    // the `count` field above acting as the total across cancer types.
    cancerTypeCounts: { cancerType: string; count: number }[];
    // Highest OncoKB sensitive (therapeutic) level for the alteration and every
    // cancer type associated with that level.
    highestSensitiveLevel?: OncoKbLevelSummary;
    // Highest OncoKB resistance level, shown alongside the sensitive level when
    // present, with its own associated cancer types.
    highestResistanceLevel?: OncoKbLevelSummary;
};

// Rank a summary's level by OncoKB level order (higher LEVELS.all index = higher
// level). Used to sort rows by their overall highest level.
function levelSortValue(summary: OncoKbSummary): number {
    const levels = [
        summary.highestSensitiveLevel,
        summary.highestResistanceLevel,
    ]
        .filter((s): s is OncoKbLevelSummary => !!s)
        .map(s => LEVELS.all.indexOf(s.level));
    return levels.length > 0 ? Math.max(...levels) : -1;
}

export const OncoKbSummaryTable: React.FunctionComponent<OncoKbSummaryTableProps> = (
    props: OncoKbSummaryTableProps
) => {
    const defaultProps = {
        data: [],
        initialSortColumn: 'count',
        initialSortDirection: 'desc',
        initialItemsPerPage: 10,
    };

    function getColumns(): Column[] {
        let columns: Column[] = [
            {
                id: 'setting',
                accessor: 'setting',
                Header: 'Setting',
                maxWidth: 65,
                style: { textAlign: 'center' },
                Cell: (props: { original: OncoKbSummary }) => (
                    <span
                        style={
                            // Match the mutation table, which renders germline
                            // in red; somatic stays the default text color.
                            props.original.setting === 'Germline'
                                ? { color: 'red' }
                                : undefined
                        }
                    >
                        {props.original.setting}
                    </span>
                ),
            },
            {
                id: 'alteration',
                accessor: 'alteration',
                Header: 'Alteration',
                minWidth: 150,
                style: { textAlign: 'center' },
                Cell: (props: { original: OncoKbSummary }) => {
                    const { alteration, proteinChange } = props.original;
                    const showProteinChange =
                        proteinChange && proteinChange !== alteration;
                    const proteinChangeDisplay =
                        proteinChange && !proteinChange.startsWith('p.')
                            ? `p.${proteinChange}`
                            : proteinChange;
                    return (
                        <span>
                            {alteration}
                            {showProteinChange
                                ? ` (${proteinChangeDisplay})`
                                : ''}
                        </span>
                    );
                },
                sortMethod: (a: string, b: string) =>
                    defaultSortMethod(
                        calcProteinChangeSortValue(a),
                        calcProteinChangeSortValue(b)
                    ),
            },
            {
                id: 'count',
                accessor: 'count',
                Header: 'Occurrence',
                minWidth: 150,
                style: { whiteSpace: 'normal', textAlign: 'center' },
                Cell: (props: { original: OncoKbSummary }) => {
                    const { count, cancerTypeCounts } = props.original;
                    // Without a per cancer type breakdown (e.g. the public
                    // OncoKB instance) fall back to the plain total count.
                    if (!cancerTypeCounts || cancerTypeCounts.length === 0) {
                        return <span>{count}</span>;
                    }
                    return (
                        <OncoKbOccurrenceList
                            total={count}
                            cancerTypeCounts={cancerTypeCounts}
                        />
                    );
                },
            },
            {
                id: 'clinicalImplication',
                accessor: 'clinicalImplication',
                Header: 'Implication',
                style: { textAlign: 'center' },
                Cell: (props: { original: OncoKbSummary }) => (
                    <span>{props.original.clinicalImplication.join(', ')}</span>
                ),
                sortMethod: defaultStringArraySortMethod,
                minWidth: 120,
            },
        ];
        if (!props.usingPublicOncoKbInstance) {
            columns.push({
                id: 'level',
                // Sort by the row's overall highest level (across sensitive and
                // resistance); rows without any level sort lowest.
                accessor: levelSortValue,
                Header: 'Highest level across all cancer types',
                sortable: false,
                // Rank numerically by the precomputed level sort value. Used
                // only as the secondary default sort, so the header stays
                // non-clickable.
                sortMethod: (a: number, b: number) => a - b,
                style: { whiteSpace: 'normal' },
                // Let the header wrap onto a second line instead of being
                // truncated with an ellipsis when the column is narrow (e.g.
                // when no row has level data).
                headerStyle: { whiteSpace: 'normal' },
                Cell: (props: { original: OncoKbSummary }) => (
                    <OncoKbLevelSummaryList
                        highestSensitiveLevel={
                            props.original.highestSensitiveLevel
                        }
                        highestResistanceLevel={
                            props.original.highestResistanceLevel
                        }
                    />
                ),
                // react-table's default column minWidth is 100; give this
                // column 2 extra pixels.
                minWidth: 102,
            });
        }
        return columns;
    }

    const {
        data,
        initialSortColumn,
        initialSortDirection,
        initialItemsPerPage,
    } = props;

    const showPagination =
        data.length >
        (props.initialItemsPerPage || defaultProps.initialItemsPerPage);

    // Default to highest occurrence first, then break ties by highest OncoKB
    // level. The level tiebreaker only applies when the level column is shown
    // (hidden for the public OncoKB instance) and isn't already the primary.
    const primarySortId = initialSortColumn || defaultProps.initialSortColumn;
    const defaultSorted = [
        {
            id: primarySortId,
            desc: initialSortDirection
                ? initialSortDirection === 'desc'
                : defaultProps.initialSortDirection === 'desc',
        },
    ];
    if (!props.usingPublicOncoKbInstance && primarySortId !== 'level') {
        defaultSorted.push({ id: 'level', desc: true });
    }

    return (
        <div
            className={classnames(
                'cbioportal-frontend',
                'default-track-tooltip-table'
            )}
        >
            <ReactTable
                data={data}
                columns={getColumns()}
                defaultSorted={defaultSorted}
                defaultPageSize={
                    data.length > initialItemsPerPage!
                        ? initialItemsPerPage
                        : data.length
                }
                showPagination={showPagination}
                showPaginationTop={true}
                showPaginationBottom={false}
                className="-striped -highlight"
                previousText="<"
                nextText=">"
            />
        </div>
    );
};
