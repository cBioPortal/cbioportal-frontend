import React, { PropTypes as T } from 'react';

import Immutable from 'immutable';
import { SampleLabelHTML } from './SampleLabel';

import {Table, Column, Cell} from 'fixed-data-table';

import ResponsiveFixedDataTable from 'responsive-fixed-data-table';

import covertSampleData from './lib/convertSamplesData';

import 'fixed-data-table/dist/fixed-data-table.min.css';

import EnhancedFixedDataTable from 'shared/components/EnhancedFixedDataTable';

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



        const data = covertSampleData(this.props.data.toArray());

        const cells = [];

        var i = 0;
        Object.keys(data.items).forEach((key)=>{

            const item = data.items[key];

           data.columns.forEach((col)=>{
               if (col.id in item) {
                   cells.push({ id:i, attr_id:col.id, attr_val: item[col.id] });
               } else {
                   cells.push({ id:i, attr_id:col.id, attr_val: "N/A" });
               }

                i++;
            });


        });


        // attr_id: The column ID.
        //     display_name: The column display name in the table header.
        //     datatype: The column type(filter type). 'STRING', 'NUMBER' and 'PERCENTAGE' are supported at this moment. You should include '%' sign for the PERCENTAGE column.
        //     column_width: Specify the column width
        // fixed: Whether Left fixed column. Default value: false
        // show: Whether display column. Deafult value: true


        // attr_id: The column id of the cell
        // id(or whatever uniqueId you defined above)
        // attr_val: The cell content



        const d = {
          attributes: data.columns.map((col)=>{
            return { attr_id:col.id, datatype:'STRING', display_name:col.id }
          }),
            data: cells
        };


        console.log(d);

        return null;

        return <EnhancedFixedDataTable input={ fixedData } uniqueId="MUTATION_COUNT"  maxHeight={500} groupHeader={false} tableWidth={1000} autoColumnWidth={false} />


        // return(
        //     <div className="fixedTable">
        //     <ResponsiveFixedDataTable
        //     rowsCount={rows.length}
        //     rowHeight={50}
        //     headerHeight={50}
        //     width={1200}
        //     height={500}>
        //         <Column
        //             header={<Cell>Name</Cell>}
        //             cell={props => (
        //                 <Cell {...props}>
        //                     {rows[props.rowIndex].id}
        //                 </Cell>
        //             )}
        //             width={200}
        //         />
        //         {
        //
        //             cols.map((col)=>{
        //
        //                 return(
        //
        //                     <Column
        //                         header={<Cell>{col.id}</Cell>}
        //                         cell={props => (
        //                             <Cell {...props}>
        //                                 {rows[props.rowIndex][col.id]}
        //                             </Cell>
        //                         )}
        //                         width={200}
        //                     />
        //
        //
        //                 )
        //
        //
        //             })
        //
        //
        //         }
        //
        // </ResponsiveFixedDataTable>
        //         </div>
        // )


    }
}

export default ClinicalInformationSamplesTable;


ClinicalInformationSamplesTable.propTypes = {
    data: T.any.isRequired,
};

