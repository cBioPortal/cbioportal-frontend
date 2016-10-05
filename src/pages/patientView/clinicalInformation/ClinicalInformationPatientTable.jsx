import React, { PropTypes as T } from 'react';
import { Table } from 'react-bootstrap';
import Immutable from 'immutable';

export default class ClinicalInformationPatientTable extends React.Component {

    componentDidMount() {

    }

    shouldComponentUpdate(nextProps, nextState) {
        return (nextProps === this.props);
    }


    render() {
        const rows = [];

        this.props.data.forEach((item) => {
            rows.push(
                <tr key={item.get('id')}>
                    <td>{item.get('id')}</td>
                    <td>{item.get('value')}</td>
                </tr>
            );
        });

        return (
            <Table striped>
                <thead>
                <tr>
                    <th>Attribute</th>
                    <th>Value</th>
                </tr>
                </thead>
                <tbody>
                {rows}
                </tbody>
            </Table>
        );
    }
}


ClinicalInformationPatientTable.propTypes = {
    data: T.any.isRequired,
};
