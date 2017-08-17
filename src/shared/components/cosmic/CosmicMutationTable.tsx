import * as React from 'react';
import {CosmicMutation} from "shared/api/generated/CBioPortalAPIInternal";
import ProteinChangeColumnFormatter from "../mutationTable/column/ProteinChangeColumnFormatter";
import {Column, default as LazyMobXTable} from "../lazyMobXTable/LazyMobXTable";

// TODO interface ICosmicTableProps extends IMSKTableProps<CosmicMutation>
// To avoid duplication, it would be nice here to have an extendable interface for LazyMobXTableProps
export interface ICosmicTableProps
{
    data: CosmicMutation[];
    columns?: Array<Column<CosmicMutation>>;
    initialSortColumn?: string;
    initialSortDirection?: 'asc'|'desc';
    initialItemsPerPage?: number;
}

// LazyMobXTable is a generic component which requires data type argument
class CosmicTable extends LazyMobXTable<CosmicMutation> {}

/**
 * @author Selcuk Onur Sumer
 */
export default class CosmicMutationTable extends React.Component<ICosmicTableProps, {}>
{
    public static defaultProps = {
        data: [],
        columns: [
            {
                name: "COSMIC ID",
                order: 1.00,
                render: (d:CosmicMutation) => (
                    <span>
                        <a
                            href={`http://cancer.sanger.ac.uk/cosmic/mutation/overview?id=${d.cosmicMutationId}`}
                            target="_blank"
                        >
                            {d.cosmicMutationId}
                        </a>
                    </span>
                ),
                sortBy: (d:CosmicMutation) => d.cosmicMutationId
            },
            {
                name: "Protein Change",
                order: 2.00,
                render: (d:CosmicMutation) => (<span>{d.proteinChange}</span>),
                sortBy: (d:CosmicMutation) => ProteinChangeColumnFormatter.extractSortValue(d.proteinChange)
            },
            {
                name: "Occurrence",
                order: 3.00,
                render: (d:CosmicMutation) => (<span>{d.count}</span>),
                sortBy: (d:CosmicMutation) => d.count
            }
        ],
        initialSortColumn: "Occurrence",
        initialSortDirection: "desc",
        initialItemsPerPage: 10
    };

    constructor(props: ICosmicTableProps)
    {
        super(props);
        this.state = {};
    }

    public render()
    {
        const {
            data,
            columns,
            initialSortColumn,
            initialSortDirection,
            initialItemsPerPage,
        } = this.props;

        const showPagination = data.length >
            (this.props.initialItemsPerPage || CosmicMutationTable.defaultProps.initialItemsPerPage);

        return (
            <div className='cbioportal-frontend'>
                <CosmicTable
                    data={data}
                    columns={columns || CosmicMutationTable.defaultProps.columns}
                    initialSortColumn={initialSortColumn}
                    initialSortDirection={initialSortDirection}
                    initialItemsPerPage={initialItemsPerPage}
                    showCopyDownload={false}
                    showColumnVisibility={false}
                    showFilter={false}
                    showPagination={showPagination}
                    showPaginationAtTop={true}
                    paginationProps={{showMoreButton:false}}
                />
            </div>
        );
    }
}
