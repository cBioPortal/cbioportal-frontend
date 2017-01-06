import * as React  from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import ReactZeroClipboard from 'react-zeroclipboard';
import fileDownload from 'react-file-download';
import * as _ from 'lodash';
import renderif from 'render-if';

export interface ITableExportButtonsProps {
    tableData?: Array<any>;
    className?: string;
    showSearch?: boolean;
    showCopyAndDownload?: boolean;
    handleInput?: Function;
}

function serializeTableData(tableData: Array<any>) {

    let content: Array<string> = [];
    let delim = ',';

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


    constructor(){

        super();

        this.handleInput = this.handleInput.bind(this);

    }

    public static defaultProps: ITableExportButtonsProps = {
        showSearch:false,
        showCopyAndDownload:true
    };


    public handleInput(evt: any){

        if (this.props.handleInput) {
            this.props.handleInput(evt.currentTarget.value);
        }

    }

    public render() {

        return (
            <div className={ (this.props.className || '') + '' }>

                { renderif(this.props.showSearch) (
                <div className="form-group has-feedback input-group-sm" style={{ display:'inline-block'  }}>
                    <input type="text" onInput={this.handleInput} className="form-control" style={{ width:200 }}  />
                        <span className="fa fa-search form-control-feedback" aria-hidden="true"></span>
                </div>
                )}

                { renderif(this.props.showCopyAndDownload) (
                <ButtonGroup style={{ marginLeft:10 }}>
                    <ReactZeroClipboard swfPath={require('react-zeroclipboard/assets/ZeroClipboard.swf')} getText={ this.getText }>
                        <Button className="btn-sm">Copy</Button>
                    </ReactZeroClipboard>

                    <Button className="btn-sm" onClick={ this.downloadData }>Download CSV</Button>
                </ButtonGroup>
                )}
            </div>
        );
    }

    private getText = () => {
        return serializeTableData(this.props.tableData || []);
    };

    private downloadData = () => {
        fileDownload(serializeTableData(this.props.tableData || []), 'patient-clinical-attributes.csv');
    };
}
