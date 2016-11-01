import * as _ from 'lodash';
import * as React from 'react';
import { Table } from 'react-bootstrap';

type TODO = any;

export interface IClinicalInformationPatientTableProps {
    data: SeamlessImmutable.ImmutableArray<TODO>;
}

class ClinicalInformationPatientTable extends React.Component<IClinicalInformationPatientTableProps, {}> {
    public render() {
        const rows: JSX.Element[] = [];

        _.each(this.props.data, (item: TODO) => {
            rows.push(
                <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.value}</td>
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
