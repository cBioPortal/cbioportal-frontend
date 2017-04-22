import * as React from 'react';
import {Button, ButtonGroup, FormGroup, FormControl, InputGroup} from 'react-bootstrap';
import styles from "./tablePaginationControls.module.scss";
import { If } from 'react-if';

const SHOW_ALL_PAGE_SIZE = -1;

export interface ITablePaginationControlsProps {
    currentPage?:number;
    itemsPerPage?:number;
    itemsPerPageOptions?:number[];
    showAllOption?:boolean;
    textBetweenButtons?:string;
    firstButtonContent?: string | JSX.Element;
    previousButtonContent?: string | JSX.Element;
    nextButtonContent?: string | JSX.Element;
    lastButtonContent?: string | JSX.Element;
    showFirstPage?:boolean;
    showLastPage?:boolean;
    showItemsPerPageSelector?:boolean;
    onChangeItemsPerPage?:(itemsPerPage:number)=>any;
    onFirstPageClick?:()=>any;
    onPreviousPageClick?:()=>any;
    onNextPageClick?:()=>any;
    onLastPageClick?:()=>any;
    className?:string;
    marginLeft?: number;
    firstPageDisabled?:boolean;
    previousPageDisabled?:boolean;
    nextPageDisabled?:boolean;
    lastPageDisabled?:boolean;
}

export class TablePaginationControls extends React.Component<ITablePaginationControlsProps, {}> {
    public static defaultProps = {
        currentPage: 1,
        itemsPerPage: SHOW_ALL_PAGE_SIZE,
        itemsPerPageOptions: [10, 25, 50, 100],
        showAllOption: true,
        textBetweenButtons: "text btwn buttons",
        firstButtonContent: (<i className='fa fa-angle-double-left'/>),
        previousButtonContent: (<i className='fa fa-angle-left'/>),
        nextButtonContent: (<i className='fa fa-angle-right'/>),
        lastButtonContent: (<i className='fa fa-angle-double-right'/>),
        showItemsPerPageSelector:true,
        showFirstPage:false,
        showLastPage:false,
        onChangeItemsPerPage: ()=>0,
        onFirstPageClick:()=>0,
        onPreviousPageClick: ()=>0,
        onNextPageClick: ()=>0,
        onLastPageClick: ()=>0,
        className: "",
        marginLeft: 5,
        previousPageDisabled:false,
        nextPageDisabled:false
    };

    constructor(props:ITablePaginationControlsProps) {
        super(props);
        this.handleChangeItemsPerPage = this.handleChangeItemsPerPage.bind(this);
    }

    handleChangeItemsPerPage(evt:React.FormEvent<HTMLSelectElement>) {
        (this.props.onChangeItemsPerPage || (()=>0))(parseInt((evt.target as HTMLSelectElement).value,10));
    }

    render() {
        const pageSizeOptionElts = (this.props.itemsPerPageOptions || []).map((opt:number) => (<option key={opt} value={opt+""}>{opt}</option>));
        if (this.props.showAllOption) {
            pageSizeOptionElts.push(<option key="all" value={SHOW_ALL_PAGE_SIZE+""}>all</option>);
        }

        return (
            <div className={this.props.className} style={{marginLeft: this.props.marginLeft}}>
                <ButtonGroup bsSize="sm">
                    <If condition={!!this.props.showFirstPage}>
                        <Button key="firstPageBtn" disabled={!!this.props.firstPageDisabled} onClick={this.props.onFirstPageClick}>
                            {this.props.firstButtonContent}
                        </Button>
                    </If>
                    <Button key="prevPageBtn" disabled={!!this.props.previousPageDisabled} onClick={this.props.onPreviousPageClick}>
                        {this.props.previousButtonContent}
                    </Button>
                    <Button key="textBetweenButtons" className={styles["auto-cursor"]} disabled={true}>
                        {this.props.textBetweenButtons}
                    </Button>
                    <Button key="nextPageBtn" disabled={!!this.props.nextPageDisabled} onClick={this.props.onNextPageClick}>
                        {this.props.nextButtonContent}
                    </Button>
                    <If condition={!!this.props.showLastPage}>
                        <Button key="lastPageBtn" disabled={!!this.props.lastPageDisabled} onClick={this.props.onLastPageClick}>
                            {this.props.lastButtonContent}
                        </Button>
                    </If>
                </ButtonGroup>

                <If condition={!!this.props.showItemsPerPageSelector}>
                    <FormGroup bsSize="sm" className={styles["form-select"]}>
                        <FormControl
                            componentClass="select"
                            value={this.props.itemsPerPage}
                            onChange={this.handleChangeItemsPerPage as React.FormEventHandler<any>}
                        >
                            {pageSizeOptionElts}
                        </FormControl>
                    </FormGroup>
                </If>
            </div>
        );
    }
}

export default TablePaginationControls;
