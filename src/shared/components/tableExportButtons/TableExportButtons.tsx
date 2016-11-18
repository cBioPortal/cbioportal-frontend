import * as React  from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import ReactZeroClipboard from 'react-zeroclipboard';
import fileDownload from 'react-file-download';
import * as _ from 'lodash';

export interface ITableExportButtonsProps {
    tableData?: Array<any>;
    className?: string;
}

function serializeTableData(tableData: Array<any>) {

    let content: Array<string> = [];
    let delim = '\t';

    Object.keys(tableData[0]).forEach((col: any)=>content.push(col,delim));

    content.pop();
    content.push('\r\n');

    tableData.forEach((row: any) => {

        _.each(row,(cell: string) => {
            content.push(cell, delim);
        });

        content.pop();
        content.push('\r\n');

    });

    return content.join('');
}

export default class TableExportButtons extends React.Component<ITableExportButtonsProps, {}> {

    public render() {
        return (

            <ButtonGroup className={this.props.className || ''}>
                <ReactZeroClipboard swfPath={require('react-zeroclipboard/assets/ZeroClipboard.swf')} getText={ this.getText }>
                    <Button className="btn-sm">Copy</Button>
                </ReactZeroClipboard>

                <Button className="btn-sm" onClick={ this.downloadData }>Download CSV</Button>
            </ButtonGroup>
        );
    }

    private getText = () => {
        return serializeTableData(this.props.tableData || []);
    };

    private downloadData = () => {
        fileDownload(serializeTableData(this.props.tableData || []), 'patient-clinical-attributes.csv');
    };
}

