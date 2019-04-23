import * as React from 'react';
import { GnomadData, frequencyOutput} from '../mutationTable/column/GnomadColumnFormatter';
import {Column, default as LazyMobXTable} from "../lazyMobXTable/LazyMobXTable";
export interface IGnomadFrequencyTableProps
{
    data: GnomadData[];
    columns?: Array<Column<GnomadData>>;
    initialSortColumn?: string;
    initialSortDirection?: 'asc'|'desc';
    initialItemsPerPage?: number;
}

// LazyMobXTable is a generic component which requires data type argument
class GnomadTable extends LazyMobXTable<GnomadData> {}

export default class GnomadFrequencyTable extends React.Component<IGnomadFrequencyTableProps, {}>
{
    public static defaultProps = {
        data: [],
        columns: [
            {
                name: "Population",
                order: 1.00,
                render: (d:GnomadData) => (<span>{d.population}</span>),
                sortBy: (d:GnomadData) => d.population
            },
            {
                name: "Allele Count",
                order: 2.00,
                render: (d:GnomadData) => (<span>{d.alleleCount}</span>),
                sortBy: (d:GnomadData) => d.alleleCount
            },
            {
                name: "Allele Number",
                order: 3.00,
                render: (d:GnomadData) => (<span>{d.alleleNumber}</span>),
                sortBy: (d:GnomadData) => d.alleleNumber
            },
            {
                name: "Number of Homozygotes",
                order: 4.00,
                render: (d:GnomadData) => (<span>{d.homezygotes}</span>),
                sortBy: (d:GnomadData) => d.homezygotes
            },
            {
                name: "Allele Frequency",
                order: 5.00,
                render: (d:GnomadData) => (frequencyOutput(d.alleleFrequency)),
                sortBy: (d:GnomadData) => d.alleleFrequency
            }
        ],
        initialSortColumn: "Occurrence",
        initialSortDirection: "desc",
        initialItemsPerPage: 10
    };

    constructor(props: IGnomadFrequencyTableProps)
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

        return (
            <div className='cbioportal-frontend'>
                <GnomadTable
                    data = {data}
                    columns={columns || GnomadFrequencyTable.defaultProps.columns}
                    initialSortColumn={initialSortColumn}
                    initialSortDirection={initialSortDirection}
                    initialItemsPerPage={initialItemsPerPage}
                    showCopyDownload={false}
                    showColumnVisibility={false}
                    showFilter={false}
                    
                    showPaginationAtTop={true}
                    paginationProps={{showMoreButton:false}}
                />
            </div>
        );
    }
}
