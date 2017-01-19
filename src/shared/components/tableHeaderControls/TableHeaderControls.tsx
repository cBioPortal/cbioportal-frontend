import * as React  from 'react';
import { Button, ButtonGroup, Dropdown, ButtonToolbar, Checkbox } from 'react-bootstrap';
import ReactZeroClipboard from 'react-zeroclipboard';
import fileDownload from 'react-file-download';
import * as _ from 'lodash';
import { IColumnVisibilityDef } from "../enhancedReactTable/IEnhancedReactTableProps";
import { If } from 'react-if';

export interface ITableExportButtonsProps {
    tableData?: Array<any>;
    className?: string;
    showSearch?: boolean;
    showCopyAndDownload?: boolean;
    showHideShowColumnButton?: boolean;
    handleInput?: Function;
    columnVisibility?:Array<IColumnVisibilityDef>;
    onColumnToggled?: (columnId: String) => void;
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
        this.handleSelect = this.handleSelect.bind(this);

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

    handleSelect(evt: React.FormEvent<HTMLInputElement>) {

        let id = evt.currentTarget.getAttribute("data-id");

        if (this.props.onColumnToggled && id) {
            this.props.onColumnToggled(id);
        }

    }

    public render() {

        return (
            <div className={ (this.props.className || '') + '' }>



                <ButtonToolbar>
                    <If condition={this.props.showHideShowColumnButton}>
                        <Dropdown id="dropdown-custom-1">
                            <Dropdown.Toggle {...{rootCloseEvent: "click"}} className="btn-sm">
                                Show/Hide Columns
                            </Dropdown.Toggle>
                            <Dropdown.Menu {...{bsRole: "menu"}} style={{ paddingLeft:10, overflow:'auto', maxHeight:300, whiteSpace:'nowrap' }}>
                                <ul className="list-unstyled">
                                {
                                    this.props.columnVisibility &&
                                    _.map(this.props.columnVisibility, (visibility: IColumnVisibilityDef) => {
                                        return (
                                            <li key={visibility.id}>
                                                <Checkbox data-id={visibility.id} onChange={this.handleSelect as React.FormEventHandler<any>} checked={visibility.visibility === "visible"} inline>{visibility.name}</Checkbox>
                                            </li>
                                        );
                                    })
                                }
                                </ul>
                            </Dropdown.Menu>

                        </Dropdown>
                    </If>

                    <If condition={ this.props.showCopyAndDownload}>
                        <ButtonGroup style={{ marginLeft:10 }}>
                            <ReactZeroClipboard swfPath={require('react-zeroclipboard/assets/ZeroClipboard.swf')} getText={ this.getText }>
                                <Button className="btn-sm">Copy</Button>
                            </ReactZeroClipboard>

                            <Button className="btn-sm" onClick={ this.downloadData }>Download CSV</Button>
                        </ButtonGroup>
                    </If>

                    <If condition={this.props.showSearch}>
                        <div className="form-group has-feedback input-group-sm" style={{ display:'inline-block', marginLeft:10  }}>
                            <input type="text" onInput={this.handleInput} className="form-control" style={{ width:200 }}  />
                            <span className="fa fa-search form-control-feedback" aria-hidden="true"></span>
                        </div>
                    </If>

                </ButtonToolbar>






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
