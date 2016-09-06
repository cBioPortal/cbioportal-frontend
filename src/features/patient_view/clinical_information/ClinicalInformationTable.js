import React, { PropTypes as T } from 'react';
import { Table } from 'react-bootstrap';
import Immutable from 'immutable';

export class ClinicalInformationTable extends React.Component {

    componentDidMount() {

    }

    render() {
        if (this.props.data) {
            const arr = [];

            // NOTE: we can use either naked bootstrap or a fancy bootstrap datatable control
            // and get the same style.  That's the case for boostrap datatable control
            this.props.data.forEach((row, i) => {
                arr.push(<tr key={i}>
                         {row.map((item, j) => {
                             return <td key={j}>{ item.toString() }</td>
                         })}
                    </tr>
                );
            });

            return (
                    <Table striped>
                        <thead>
                            <tr>
                            {this.props.header.map((item ,i) => {
                                return <th key={i}>{ item } </th>
                            })}
                            </tr>
                        </thead>
                          <tbody>{ arr }</tbody>
                    </Table>
            );
        } else {
            return "No data to display";
        }
    }
}

export function convertPatientDataToTable(patient) {
    let rv;

    rv = patient.get('clinicalData').map(x => Immutable.List([x.get('name'), x.get('value')]));
    if (!rv) {
        rv = [];
    }

    return rv;
}

export function convertSampleDataToTable(samples) {
    let rv, sampleIds, clinIds;

    // Get union of clinical attribute ids
    clinIds = samples.map(x => x.get('clinicalData'))
                .reduce((a, b) => a.concat(b))
                .map(x => x.get('id'))
                .toSet()
    sampleIds = samples.map(x => x.get('id')).sort()
    // construct rows with first column clinical attribute id and values for
    // each sample
    rv = clinIds.map(x => {
        return Immutable.List([x]).concat(
            sampleIds.map(y => samples.find(z => z.get('id') === y))
                     .map(y => {
                         try {
                              return y.get('clinicalData').find(z => z.get('id') === x).get('value');
                         } catch (e) {
                             if (e instanceof TypeError) {
                                 return "N/A";
                             } else {
                                 throw e;
                             }
                         }
                     })
        );
    });
    if (!rv) {
        rv = [];
    }

    return rv;
}

export default ClinicalInformationTable;


ClinicalInformationTable.propTypes = {
    data: T.any.isRequired,
    header: T.any.isRequired
};
