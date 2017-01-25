import * as React  from 'react';
import Tooltip from 'rc-tooltip';
import {Button, ButtonGroup, ButtonToolbar, Form, FormGroup, MenuItem} from 'react-bootstrap';
import ReactZeroClipboard from 'react-zeroclipboard';
import fileDownload from 'react-file-download';
import * as _ from 'lodash';
import {TablePaginationControls, ITablePaginationControlsProps} from "../tablePaginationControls/TablePaginationControls";
import { If } from 'react-if';
import {
    IColumnVisibilityControlsProps,
    ColumnVisibilityControls
} from "../columnVisibilityControls/ColumnVisibilityControls";

export interface ITableExportButtonsProps {
    tableData?: Array<any>;
    className?: string;
    searchClassName?: string;
    showSearch?: boolean;
    showCopyAndDownload?: boolean;
    copyDownloadClassName?: string;
    showHideShowColumnButton?: boolean;
    showPagination?:boolean;
    handleInput?: Function;
    paginationProps?: ITablePaginationControlsProps;
    columnVisibilityProps?: IColumnVisibilityControlsProps;
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
        showCopyAndDownload:true,
        showPagination:false,
        searchClassName: '',
        copyDownloadClassName: '',
        paginationProps:{},
        columnVisibilityProps:{},
    };


    public handleInput(evt: any){

        if (this.props.handleInput) {
            this.props.handleInput(evt.currentTarget.value);
        }

    }

    public render() {

        const arrowContent = <div className="rc-tooltip-arrow-inner"/>;

        return (
            <div className={ (this.props.className || '') + '' }>

                <ButtonToolbar>
                    <If condition={this.props.showPagination}>
                        <TablePaginationControls className="pull-left" {...this.props.paginationProps}/>
                    </If>

                    <If condition={this.props.showHideShowColumnButton}>
                        <ColumnVisibilityControls {...this.props.columnVisibilityProps}/>
                    </If>

                    <If condition={ this.props.showCopyAndDownload}>
                        <ButtonGroup className={this.props.copyDownloadClassName} style={{ marginLeft:10 }}>
                            <ReactZeroClipboard swfPath={require('react-zeroclipboard/assets/ZeroClipboard.swf')} getText={this.getText}>
                                <Tooltip overlay="Copy" placement="top" arrowContent={arrowContent}>
                                    <Button className="btn-sm">
                                        <i className='fa fa-clipboard'/>
                                    </Button>
                                </Tooltip>
                            </ReactZeroClipboard>

                            <Tooltip overlay="Download CSV" placement="top" arrowContent={arrowContent}>
                                <Button className="btn-sm" onClick={this.downloadData}>
                                    <i className='fa fa-cloud-download'/>
                                </Button>
                            </Tooltip>
                        </ButtonGroup>
                    </If>

                    <If condition={this.props.showSearch}>
                        <div className={`${this.props.searchClassName} form-group has-feedback input-group-sm`} style={{ display:'inline-block', marginLeft:10  }}>
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
