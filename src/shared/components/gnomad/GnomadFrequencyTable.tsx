import * as React from 'react';
import { GnomadData, frequencyOutput} from '../mutationTable/column/GnomadColumnFormatter';
import {Column, default as LazyMobXTable} from "../lazyMobXTable/LazyMobXTable";
import SimpleTable from '../simpleTable/SimpleTable';
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
    constructor(props: IGnomadFrequencyTableProps)
    {
        super(props);
        this.state = {};
    }

    private getHeaders(): JSX.Element[] {
        const ret: JSX.Element[] = [];
        const titles = ['Population', 'Allele Count', 'Allele Number', 'Number of Homezygotes', 'Allele Frequency'];
        titles.forEach(title => {
            ret.push(
                <td>{title}</td>
            );
        });
        return ret;
    }

    private getRows(): JSX.Element[] {
        const ret: JSX.Element[] = [];
        this.props.data.forEach(d => {
            ret.push(

            <tr>
                <td>{d.population}</td>
                <td>{d.alleleCount}</td>
                <td>{d.alleleNumber}</td>
                <td>{d.homezygotes}</td>
                <td>{frequencyOutput(d.alleleFrequency)}</td>
            </tr>
            );
        });
        return ret;
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
                <SimpleTable
                    headers={this.getHeaders()}
                    rows={this.getRows()}
                />
            </div>
        );
    }
}
