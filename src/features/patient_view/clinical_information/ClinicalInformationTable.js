import React, { PropTypes as T } from 'react';
import { Table } from 'react-bootstrap';

export class ClinicalInformationTable extends React.Component {

    componentDidMount() {

    }

    render() {

        const arr = [];

        // NOTE: we can use either naked bootstrap or a fancy bootstrap datatable control
        // and get the same style.  That's the case for boostrap datatable control
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
                        <tr><th>{ this.props.title1 }</th><th>{ this.props.title2 }</th></tr>
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