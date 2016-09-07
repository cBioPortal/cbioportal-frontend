import React, {PropTypes as T} from 'react';
import {Table} from 'react-bootstrap';
import Immutable from 'immutable';

export class ClinicalInformationSamplesTable extends React.Component {

    componentDidMount() {

    }

    shouldComponentUpdate(nextProps, nextState) {
        return (nextProps === this.props);
    }


    render() {

        const headerCells = this.props.data.get('columns').map((col, i)=> {
            return <th key={i}>{col.get('id')}</th>
        });

        const rows = this.props.data.get('items').map((row, key) => {

            return (<tr key={key}>
                    <td>{row.get('name')}</td>
                    {
                        this.props.data.get('columns').map((col, i)=> {
                            if (col.get('id') in row.toJS()) {
                                return <td key={i}>{row.get(col.get('id'))}</td>
                            } else {
                                return <td key={i}>N/A</td>
                            }

                        })
                    }

                </tr>
            );
        });

        return (
            <Table striped>
                <thead><tr>
                    <th></th>
                    { headerCells }
                </tr></thead>
                <tbody>{ rows }</tbody>
            </Table>
        );
    }
}

export default ClinicalInformationSamplesTable;


ClinicalInformationSamplesTable.propTypes = {
    data: T.any.isRequired
};
