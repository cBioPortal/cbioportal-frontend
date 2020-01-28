import classnames from 'classnames';
import { computed } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import ReactTable, { Column } from 'react-table';

import {
    calcProteinChangeSortValue,
    EllipsisTextTooltip,
} from 'cbioportal-frontend-commons';

import {
    defaultSortMethod,
    defaultStringArraySortMethod,
} from '../../util/ReactTableUtils';
import { levelIconClassNames } from '../../util/OncoKbUtils';

export type OncoKbSummaryTableProps = {
    data: OncoKbSummary[];
    initialSortColumn?: string;
    initialSortDirection?: 'asc' | 'desc';
    initialItemsPerPage?: number;
};

export type OncoKbSummary = {
    count: number;
    proteinChange: string;
    clinicalImplication: string[];
    biologicalEffect: string[];
    level: { level: string; tumorTypes: string[] }[];
};

@observer
export default class OncoKbSummaryTable extends React.Component<
    OncoKbSummaryTableProps,
    {}
> {
    public static defaultProps = {
        data: [],
        initialSortColumn: 'count',
        initialSortDirection: 'desc',
        initialItemsPerPage: 10,
    };

    constructor(props: OncoKbSummaryTableProps) {
        super(props);
        this.state = {};
    }

    @computed
    get hasLevelData(): boolean {
        return this.props.data.find(d => d.level.length > 0) !== undefined;
    }

    @computed
    get columns(): Column[] {
        return [
            {
                id: 'proteinChange',
                accessor: 'proteinChange',
                Header: 'Protein Change',
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
                maxWidth: 80,
            },
            {
                id: 'clinicalImplication',
                accessor: 'clinicalImplication',
                Header: 'Implication',
                Cell: (props: { original: OncoKbSummary }) => (
                    <span>{props.original.clinicalImplication.join(', ')}</span>
                ),
                sortMethod: defaultStringArraySortMethod,
                minWidth: 120,
            },
            {
                id: 'biologicalEffect',
                accessor: 'biologicalEffect',
                Header: 'Effect',
                Cell: (props: { original: OncoKbSummary }) => (
                    <span>{props.original.biologicalEffect.join(', ')}</span>
                ),
                sortMethod: defaultStringArraySortMethod,
                minWidth: 150,
            },
            {
                id: 'level',
                accessor: 'level',
                Header: 'Level',
                sortable: false,
                Cell: (props: { original: OncoKbSummary }) => (
                    <React.Fragment>
                        {props.original.level.map(level => (
                            <div
                                key={level.level}
                                style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                <i
                                    className={levelIconClassNames(level.level)}
                                    style={{
                                        verticalAlign: 'text-bottom',
                                        display: 'inline-block',
                                    }}
                                />
                                <span>: </span>
                                <EllipsisTextTooltip
                                    text={level.tumorTypes.join(', ')}
                                    style={{
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap',
                                        textOverflow: 'ellipsis',
                                    }}
                                />
                            </div>
                        ))}
                    </React.Fragment>
                ),
                minWidth: this.hasLevelData ? 180 : 50,
            },
        ];
    }

    public render() {
        const {
            data,
            initialSortColumn,
            initialSortDirection,
            initialItemsPerPage,
        } = this.props;

        const showPagination =
            data.length >
            (this.props.initialItemsPerPage ||
                OncoKbSummaryTable.defaultProps.initialItemsPerPage);

        return (
            <div
                className={classnames(
                    'cbioportal-frontend',
                    'default-track-tooltip-table'
                )}
            >
                <ReactTable
                    data={data}
                    columns={this.columns}
                    defaultSorted={[
                        {
                            id:
                                initialSortColumn ||
                                OncoKbSummaryTable.defaultProps
                                    .initialSortColumn,
                            desc: initialSortDirection === 'desc',
                        },
                    ]}
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
    }
}
