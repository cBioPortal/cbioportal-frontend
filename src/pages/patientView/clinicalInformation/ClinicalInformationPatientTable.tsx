import {List} from 'immutable';
import * as React from 'react';
import { Table } from 'react-bootstrap';

type TODO = any;

export interface IClinicalInformationPatientTableProps {
    data: List<TODO>;
}

class ClinicalInformationPatientTable extends React.Component<IClinicalInformationPatientTableProps, {}> {
    public render() {
        const rows: JSX.Element[] = [];

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

export default ClinicalInformationPatientTable;
