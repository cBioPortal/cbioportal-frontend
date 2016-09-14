import React, { PropTypes as T } from 'react';

import Immutable from 'immutable';
import { SampleLabelHTML } from './SampleLabel';

import {Table, Column, Cell} from 'fixed-data-table';

import ResponsiveFixedDataTable from 'responsive-fixed-data-table';



import 'fixed-data-table/dist/fixed-data-table.min.css';

import EnhancedFixedDataTable from 'shared/EnhancedFixedDataTable';

import fixedData from './sample-fixed-data';


export class ClinicalInformationSamplesTable extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            myTableData: [
                {name: 'Rylan'},
                {name: 'Amelia'},
                {name: 'Estevan'},
                {name: 'Florence'},
                {name: 'Tressa'},
            ],
        };
    }


    render() {
        // const headerCells = this.props.data.get('columns').map((col, i) => {
        //     return (<th style={{ whiteSpace: 'nowrap' }} key={i}>
        //         <SampleLabelHTML color={'black'} label={i + 1} />
        //         {' ' + col.get('id')}
        //     </th>);
        // });


        // const cols = this.props.data.get('items').map((row, key) => {
        //     return (<Column
        //             <td>{row.get('id')}</td>
        //             {
        //                 this.props.data.get('columns').map((col, i) => {
        //                     if (col.get('id') in row.toJS()) {
        //                         return <td key={i}>{row.get(col.get('id'))}</td>;
        //                     } else {
        //                         return <td key={i}>N/A</td>;
        //                     }
        //                 })
        //             }
        //
        //         </tr>
        //     );
        // });
        //
        //
        // return (
        //     <Table
        //         rowsCount={this.state.myTableData.length}
        //         rowHeight={50}
        //         headerHeight={50}
        //         width={1000}
        //         height={500}>
        //         <Column
        //             header={<Cell>Name</Cell>}
        //             cell={props => (
        //                 <Cell {...props}>
        //                     {this.state.myTableData[props.rowIndex].name}
        //                 </Cell>
        //             )}
        //             width={200}
        //         />
        //     </Table>
        // );

        let items = this.props.data.get('items').toJS();

        const rows = [];


        Object.keys(items).forEach((key)=>{
            rows.push(items[key]);
        });

        const cols = this.props.data.get('columns').toJS();
        
        //return <EnhancedFixedDataTable input={fixedData} uniqueId="SEX" maxHeight="500" tableWidth="2000" autoColumnWidth={false} />




        return(
            <div className="fixedTable">
            <ResponsiveFixedDataTable
            rowsCount={rows.length}
            rowHeight={50}
            headerHeight={50}
            width={1200}
            height={500}>
                <Column
                    header={<Cell>Name</Cell>}
                    cell={props => (
                        <Cell {...props}>
                            {rows[props.rowIndex].id}
                        </Cell>
                    )}
                    width={200}
                />
                {

                    cols.map((col)=>{

                        return(

                            <Column
                                header={<Cell>{col.id}</Cell>}
                                cell={props => (
                                    <Cell {...props}>
                                        {rows[props.rowIndex][col.id]}
                                    </Cell>
                                )}
                                width={200}
                            />


                        )


                    })


                }

        </ResponsiveFixedDataTable>
                </div>
        )


    }
}

export default ClinicalInformationSamplesTable;


ClinicalInformationSamplesTable.propTypes = {
    data: T.any.isRequired,
};

