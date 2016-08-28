import React, { PropTypes as T } from 'react';
import { Table } from 'react-bootstrap';

export class ClinicalInformationTable extends React.Component {

    componentDidMount() {

    }

    render() {

        const arr = [];

        this.props.data.forEach((item, i)=>{
            arr.push(<tr key={i}>
                    <td>{ item.get(0) }</td>
                    <td>{ item.get(1) }</td>
                </tr>
            );
        });

        return (
                <Table striped>
                    <thead>
                        <tr><th>Attribute</th><th>Value</th></tr>
                    </thead>
                    <tbody>{ arr }</tbody>
                </Table>
        );

    }
}

export default ClinicalInformationTable;


ClinicalInformationTable.propTypes = {
    data: T.any.isRequired
};