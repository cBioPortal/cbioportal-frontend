import * as React  from 'react';
import * as ReactDOM from 'react-dom';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import {Button, ButtonGroup, ButtonToolbar, Form, FormGroup, MenuItem} from 'react-bootstrap';
var ClipboardButton = require('react-clipboard.js');
var Clipboard = require('clipboard');
import fileDownload from 'react-file-download';
import * as _ from 'lodash';
import {PaginationControls, IPaginationControlsProps} from "../paginationControls/PaginationControls";
import { If } from 'react-if';
import {
    IColumnVisibilityControlsProps,
    ColumnVisibilityControls
} from "../columnVisibilityControls/ColumnVisibilityControls";

export interface ITableHeaderControlsProps {
    tableData?: Array<any>;
    className?: string;
    searchClassName?: string;
    showSearch?: boolean;
    showCopyAndDownload?: boolean;
    copyDownloadClassName?: string;
    showHideShowColumnButton?: boolean;
    showPagination?:boolean;
    handleInput?: Function;
    downloadDataGenerator?: Function;
    downloadDataContainsHeader?: boolean;
    downloadFilename?: string;
    paginationProps?: IPaginationControlsProps;
    columnVisibilityProps?: IColumnVisibilityControlsProps;
    searchDelayMs?:number;
}

function serializeTableData(tableData: Array<any>, containsHeader?:boolean) {

    let content: Array<string> = [];
    let delim = ',';

    if (!containsHeader) {
        // try to get the header from object keys in case no header provided
        // if contains header, assuming that the first element represents the header values
        Object.keys(tableData[0]).forEach((col: any)=>content.push(col,delim));

        content.pop();
        content.push('\r\n');
    }

    tableData.forEach((row: any) => {

        _.each(row,(cell: string) => {
            content.push(cell, delim);
        });

        content.pop();
        content.push('\r\n');

    });

    return content.join('');
}

export default class TableHeaderControls extends React.Component<ITableHeaderControlsProps, {}> {


    private searchTimeout:number | null;

    private _copyButton: HTMLElement;

    constructor(){

        super();


        this.handleInput = this.handleInput.bind(this);
        this.getText = this.getText.bind(this);

    }

    componentDidMount(){

        // this is necessary because the clipboard wrapper library
        // doesn't work with tooltips :(
        if (this.props.showCopyAndDownload && this._copyButton) {
            this.bindCopyButton();
        }

    }

    public bindCopyButton(){

        new Clipboard(this._copyButton, {
            text: function() {
                return this.getText();
            }.bind(this)
        });

    }

    public static defaultProps: ITableHeaderControlsProps = {
        showSearch:false,
        showCopyAndDownload:true,
        showPagination:false,
        searchClassName: '',
        copyDownloadClassName: '',
        downloadFilename: 'patient-clinical-attributes.tsv',
        downloadDataContainsHeader: false,
        paginationProps:{},
        columnVisibilityProps:{},
        searchDelayMs: 400
    };


    public handleInput(evt: any){

        if (this.searchTimeout !== null) {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = null;
        }

        const filterValue = evt.currentTarget.value;

        this.searchTimeout = setTimeout(() => {
            if (this.props.handleInput) {
                this.props.handleInput(filterValue);
            }
        }, this.props.searchDelayMs);

    }

    public render() {

        const arrowContent = <div className="rc-tooltip-arrow-inner"/>;

        return (
            <div className={ (this.props.className || '') + '' }>

                <ButtonToolbar>
                    <If condition={this.props.showPagination}>
                        <PaginationControls className="pull-left" {...this.props.paginationProps}/>
                    </If>

                    <If condition={this.props.showHideShowColumnButton}>
                        <ColumnVisibilityControls {...this.props.columnVisibilityProps}/>
                    </If>

                    <If condition={this.props.showCopyAndDownload}>
                        <ButtonGroup className={this.props.copyDownloadClassName} style={{ marginLeft:10 }}>

                            <DefaultTooltip overlay={<span>Copy</span>} placement="top" mouseLeaveDelay={0} mouseEnterDelay={0.5}  arrowContent={arrowContent}>
                                    <button ref={(el: HTMLButtonElement)=>{ this._copyButton = el }} className="btn btn-sm btn-default" data-clipboard-text="blablabhabha" id="donkey" option-text={ this.getText }>
                                            <i className='fa fa-clipboard'/>
                                    </button>
                                </DefaultTooltip>


                            <DefaultTooltip overlay={<span>Download CSV</span>} mouseLeaveDelay={0} mouseEnterDelay={0.5} placement="top" arrowContent={arrowContent}>
                                <Button className="btn-sm" onClick={this.downloadData}>
                                    <i className='fa fa-cloud-download'/>
                                </Button>
                            </DefaultTooltip>
                        </ButtonGroup>
                    </If>

                    <If condition={this.props.showSearch}>
                        <div className={`${this.props.searchClassName} form-group has-feedback input-group-sm`} style={{ display:'inline-block', marginLeft:10  }}>
                            <input type="text" onInput={this.handleInput} className="form-control tableSearchInput" style={{ width:200 }}  />
                            <span className="fa fa-search form-control-feedback" aria-hidden="true"></span>
                        </div>
                    </If>

                </ButtonToolbar>

            </div>
        );
    }

    public getText() {
        if (this.props.downloadDataGenerator) {
            return serializeTableData(this.props.downloadDataGenerator() || [], this.props.downloadDataContainsHeader);
        }
        else {
            return serializeTableData(this.props.tableData || [], this.props.downloadDataContainsHeader);
        }
    }

    private downloadData = () => {
        if (this.props.downloadDataGenerator) {
            fileDownload(
                serializeTableData(this.props.downloadDataGenerator() || [], this.props.downloadDataContainsHeader),
                this.props.downloadFilename
            );
        }
        else {
            fileDownload(
                serializeTableData(this.props.tableData || [], this.props.downloadDataContainsHeader),
                this.props.downloadFilename
            );
        }

    };
}
