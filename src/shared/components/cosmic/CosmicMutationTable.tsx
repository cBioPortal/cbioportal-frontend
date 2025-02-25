import * as React from 'react';
import { calcProteinChangeSortValue } from 'cbioportal-utils';
import { CosmicMutation } from 'cbioportal-ts-api-client';
import {
    Column,
    default as LazyMobXTable,
} from '../lazyMobXTable/LazyMobXTable';

// TODO interface ICosmicTableProps extends IMSKTableProps<CosmicMutation>
// To avoid duplication, it would be nice here to have an extendable interface for LazyMobXTableProps
export interface ICosmicTableProps {
    data: CosmicMutation[];
    proteinChange: string;
    columns?: Array<Column<CosmicMutation>>;
    initialSortColumn?: string;
    initialSortDirection?: 'asc' | 'desc';
    initialItemsPerPage?: number;
}

// LazyMobXTable is a generic component which requires data type argument
class CosmicTable extends LazyMobXTable<CosmicMutation> {}

/**
 * @author Selcuk Onur Sumer
 */
export default class CosmicMutationTable extends React.Component<
    ICosmicTableProps,
    {}
> {
    public static defaultProps = {
        data: [],
        initialSortColumn: 'Occurrence',
        initialSortDirection: 'desc',
        initialItemsPerPage: 10,
    };

    constructor(props: ICosmicTableProps) {
        super(props);
        this.state = {};
    }

    get columns() {
        return (
            this.props.columns || [
                {
                    name: 'COSMIC ID',
                    render: (d: CosmicMutation) =>
                        d.proteinChange === this.props.proteinChange ? (
                            <b>
                                <a
                                    href={`http://cancer.sanger.ac.uk/cosmic/mutation/overview?id=${d.cosmicMutationId}`}
                                    target="_blank"
                                >
                                    {d.cosmicMutationId}
                                </a>
                            </b>
                        ) : (
                            <span>
                                <a
                                    href={`http://cancer.sanger.ac.uk/cosmic/mutation/overview?id=${d.cosmicMutationId}`}
                                    target="_blank"
                                >
                                    {d.cosmicMutationId}
                                </a>
                            </span>
                        ),
                    sortBy: (d: CosmicMutation) => d.cosmicMutationId,
                },
                {
                    name: 'Protein Change',
                    render: (d: CosmicMutation) =>
                        d.proteinChange === this.props.proteinChange ? (
                            <b>{d.proteinChange}</b>
                        ) : (
                            <span>{d.proteinChange}</span>
                        ),
                    sortBy: (d: CosmicMutation) =>
                        calcProteinChangeSortValue(d.proteinChange),
                },
                {
                    name: 'Occurrence',
                    render: (d: CosmicMutation) =>
                        d.proteinChange === this.props.proteinChange ? (
                            <b>{d.count}</b>
                        ) : (
                            <span>{d.count}</span>
                        ),
                    sortBy: (d: CosmicMutation) => d.count,
                },
            ]
        );
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
                CosmicMutationTable.defaultProps.initialItemsPerPage);

        return (
            <div className="cbioportal-frontend">
                <CosmicTable
                    data={data}
                    columns={this.columns}
                    initialSortColumn={initialSortColumn}
                    initialSortDirection={initialSortDirection}
                    initialItemsPerPage={initialItemsPerPage}
                    showCopyDownload={false}
                    showColumnVisibility={false}
                    showFilter={false}
                    showPagination={showPagination}
                    showPaginationAtTop={true}
                    paginationProps={{ showMoreButton: false }}
                />
            </div>
        );
    }
}
