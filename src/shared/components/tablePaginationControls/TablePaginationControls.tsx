import * as React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import './styles.css';

const SHOW_ALL_PAGE_SIZE = -1;

export type ITablePaginationControlsProps = {
    currentPage?:number;
    itemsPerPage?:number;
    itemsPerPageOptions?:number[];
    showAllOption?:boolean;
    textBetweenButtons?:string;
    onChangeItemsPerPage?:(itemsPerPage:number)=>any;
    onPreviousPageClick?:()=>any;
    onNextPageClick?:()=>any;
    className?:string;
    previousPageDisabled?:boolean;
    nextPageDisabled?:boolean;
}

export class TablePaginationControls extends React.Component<ITablePaginationControlsProps, {}> {
    public static defaultProps = {
        currentPage: 1,
        itemsPerPage: SHOW_ALL_PAGE_SIZE,
        itemsPerPageOptions: [10, 25, 50, 100],
        showAllOption: true,
        textBetweenButtons: "text btwn buttons",
        onChangeItemsPerPage: ()=>0,
        onPreviousPageClick: ()=>0,
        onNextPageClick: ()=>0,
        className: "",
        previousPageDisabled:false,
        nextPageDisabled:false
    };

    constructor(props:ITablePaginationControlsProps) {
        super(props);
        this.handleChangeItemsPerPage = this.handleChangeItemsPerPage.bind(this);
    }

    handleChangeItemsPerPage(evt:React.FormEvent) {
        (this.props.onChangeItemsPerPage || (()=>0))(parseInt((evt.target as HTMLSelectElement).value,10));
    }

    render() {
        const pageSizeOptionElts = (this.props.itemsPerPageOptions || []).map((opt:number) => (<option value={opt+""}>{opt}</option>));
        if (this.props.showAllOption) {
            pageSizeOptionElts.push(<option value={SHOW_ALL_PAGE_SIZE+""}>all</option>);
        }
        return (<div className={this.props.className}>
            <ButtonGroup bsSize="sm">
            <Button key="prevPageBtn" disabled={!!this.props.previousPageDisabled} onClick={this.props.onPreviousPageClick}>Previous</Button>
            <Button key="textBetweenButtons" className="auto-cursor" disabled={true}>{this.props.textBetweenButtons}</Button>
            <Button key="nextPageBtn" disabled={!!this.props.nextPageDisabled} onClick={this.props.onNextPageClick}>Next</Button>
            </ButtonGroup>

            <ButtonGroup bsSize="sm">
            <select className="bootstrap-mimic-select" value={this.props.itemsPerPage+""} onChange={this.handleChangeItemsPerPage}>
                {pageSizeOptionElts}
            </select>
        </ButtonGroup>
        </div>);
    }
}

export default TablePaginationControls;
