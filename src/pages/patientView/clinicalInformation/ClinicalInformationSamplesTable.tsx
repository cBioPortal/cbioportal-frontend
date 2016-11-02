import * as React from 'react';
import { Table } from 'react-bootstrap';
import { SampleLabelHTML } from '../SampleLabel';
import convertSamplesData from './lib/convertSamplesData';
import {ClinicalDataBySampleId} from "./getClinicalInformationData";

interface IClinicalInformationSamplesTableProps {
    samples: Array<ClinicalDataBySampleId>;
}

type TODO = any;

export class ClinicalInformationSamplesTable extends React.Component<IClinicalInformationSamplesTableProps, any> {

    render() {

        const sampleTableData = convertSamplesData(this.props.samples);

        const headerCells = sampleTableData.columns.map((col: TODO, i: number) => {
            return (<th style={{ whiteSpace: 'nowrap' }} key={i}>
                       <SampleLabelHTML color={'black'} label={(i + 1).toString()} />
                       {' ' + col.id}
                   </th>);
        });

        const rows: Array<JSX.Element> = [];

        Object.keys(sampleTableData.items).forEach((key: string) => {
            const rowData: TODO = sampleTableData.items[key];
            rows.push(
                <tr key={key}>
                    <td key={-1}>{rowData.clinicalAttribute.displayName}</td>
                    {
                        sampleTableData.columns.map((col: TODO, i: number) => {
                            if (col.id in rowData) {
                                return <td key={i}>{rowData[col.id]}</td>;
                            } else {
                                return <td key={i}>N/A</td>;
                            }
                        })
                    }
                </tr>
            );
        });

        return (
            // undo global css styles from cbioportal
            <Table striped style={{borderCollapse: 'unset', borderSpacing: '0px'}}>
                <thead><tr>
                    <th key={-1}>Attribute</th>
                    { headerCells }
                </tr></thead>
                <tbody>{ rows }</tbody>
            </Table>
        );
    }
}

export default ClinicalInformationSamplesTable;
