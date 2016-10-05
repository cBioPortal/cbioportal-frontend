import React, { PropTypes as T } from 'react';
import { Table } from 'react-bootstrap';
import Immutable from 'immutable';
import { SampleLabelHTML } from '../SampleLabel';
import convertSamplesData from './lib/convertSamplesData';


export class ClinicalInformationSamplesTable extends React.Component {

    componentDidMount() {

    }

    shouldComponentUpdate(nextProps, nextState) {
        return (nextProps === this.props);
    }


    render() {
        const data = convertSamplesData(this.props.data.toArray());

        const headerCells = data.columns.map((col, i) => {
            return (<th style={{ whiteSpace: 'nowrap' }} key={i}>
                       <SampleLabelHTML color={'black'} label={(i + 1).toString()} />
                       {' ' + col.id}
                   </th>);
        });

        const rows = [];

        Object.keys(data.items).forEach((key) => {
            const row = data.items[key];
            rows.push(
                <tr key={key}>
                    <td key={-1}>{row.id}</td>
                    {
                        data.columns.map((col, i) => {
                            if (col.id in row) {
                                return <td key={i}>{row[col.id]}</td>;
                            } else {
                                return <td key={i}>N/A</td>;
                            }
                        })
                    }

                </tr>
            );
        });

        return (
            <Table striped>
                <thead><tr>
                    <th key={-1} />
                    { headerCells }
                </tr></thead>
                <tbody>{ rows }</tbody>
            </Table>
        );
    }
}

export default ClinicalInformationSamplesTable;


// ClinicalInformationSamplesTable.propTypes = {
//     data: T.any.isRequired,
// };
