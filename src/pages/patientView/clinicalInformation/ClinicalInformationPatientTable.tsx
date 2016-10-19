import * as React from 'react';
import { Table } from 'react-bootstrap';
import {List} from "immutable";
import * as Immutable from 'immutable';

type TODO = any;

export interface ClinicalInformationPatientTableProps
{
    data: List<TODO>;
}

export default class ClinicalInformationPatientTable extends React.Component<ClinicalInformationPatientTableProps, {}>
{
    render()
    {
        const rows:JSX.Element[] = [];
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
