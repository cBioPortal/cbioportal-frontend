import * as _ from 'lodash';
import * as React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { Table } from 'react-bootstrap';
import ReactZeroClipboard from 'react-zeroclipboard';
import fileDownload from 'react-file-download';
import {ClinicalData} from "../../../shared/api/CBioPortalAPI";

type TODO = any;

export interface IClinicalInformationPatientTableProps {
    data: Array<ClinicalData>;
}

let serializeTableData = function(tableData: Array<ClinicalData>) {

    let content: Array<string> = [];
    let delim = ',';

    content.push('Attribute', delim, 'Value');

    tableData.forEach((item: ClinicalData) => {
        content.push('\r\n', (item.clinicalAttribute.displayName || 'Unknown'), delim, item.attrValue );
    });

    return content.join('');

}


class ClinicalInformationPatientTable extends React.Component<IClinicalInformationPatientTableProps, {}> {

    private downloadData(){

        fileDownload(serializeTableData(this.props.data), 'patient-clinical-attributes.csv');

    }

    public render() {
        const rows: JSX.Element[] = [];

        _.each(this.props.data, (item: TODO) => {
            rows.push(
                <tr key={item.id}>
                    <td>{item.clinicalAttribute.displayName}</td>
                    <td>{item.value}</td>
                </tr>
            );
        });

        return (
            <div>
                <ButtonGroup>
                    <ReactZeroClipboard swfPath={require('react-zeroclipboard/assets/ZeroClipboard.swf')} getText={ serializeTableData.bind(this, this.props.data) }>
                        <Button>Copy</Button>
                    </ReactZeroClipboard>

                    <Button onClick={ this.downloadData.bind(this) }>Download CSV</Button>
                </ButtonGroup>

                <Table striped style={{borderCollapse: 'unset', borderSpacing: '0px'}}>
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
            </div>
        );
    }
}

export default ClinicalInformationPatientTable;
