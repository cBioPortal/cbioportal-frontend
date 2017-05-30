import * as React from 'react';
import {Button, ButtonGroup, FormGroup, FormControl} from 'react-bootstrap';
import styles from "./paginationControls.module.scss";
import { If, Then, Else } from 'react-if';
import {observable} from "mobx";
import {observer} from "mobx-react";

export const SHOW_ALL_PAGE_SIZE = -1;

export const MAX_DIGITS = 6;

export interface IPaginationControlsProps {
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
    onChangeItemsPerPage?:(itemsPerPage:number)=>void;
    onFirstPageClick?:()=>void;
    onPreviousPageClick?:()=>void;
    onNextPageClick?:()=>void;
    onLastPageClick?:()=>void;
    onChangeCurrentPage?:(newPage:number)=>void;
    className?:string;
    style?:{ [k: string]: string | number },
    firstPageDisabled?:boolean;
    previousPageDisabled?:boolean;
    nextPageDisabled?:boolean;
    lastPageDisabled?:boolean;
    pageNumberEditable?:boolean;
}

@observer
export class PaginationControls extends React.Component<IPaginationControlsProps, {}> {
    public static defaultProps = {
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
        className: "",
        style:{},
        previousPageDisabled:false,
        nextPageDisabled:false,
        pageNumberEditable: false
    };

    constructor(props:IPaginationControlsProps) {
        super(props);
        this.handleChangeItemsPerPage = this.handleChangeItemsPerPage.bind(this);
        this.handleChangeCurrentPage = this.handleChangeCurrentPage.bind(this);
        this.handleOnBlur = this.handleOnBlur.bind(this);
    }

    private pageNumberInput: HTMLSpanElement;

    private jumpToPage() {

        if (this.props.onChangeCurrentPage) {
            this.props.onChangeCurrentPage(parseInt(this.pageNumberInput.innerText, 10));
        }

        this.pageNumberInput.innerText = (this.props.currentPage as number).toString();
    }

    handleChangeItemsPerPage(evt:React.FormEvent<HTMLSelectElement>) {

        if (this.props.onChangeItemsPerPage) {
            this.props.onChangeItemsPerPage(parseInt((evt.target as HTMLSelectElement).value,10));
        }
    }

    handleChangeCurrentPage(evt:React.KeyboardEvent<HTMLSpanElement>) {

        const newKey = evt.key;

        if (newKey === "Enter") {
            evt.preventDefault();
            evt.currentTarget.blur();
            return;
        }

        if (evt.currentTarget.innerText.length === MAX_DIGITS) {
            evt.preventDefault();
            return;
        }

        const regex = /^\d$/;
        if(!regex.test(newKey)) {
            evt.preventDefault();
        }
    }

    handleOnBlur(evt:React.FocusEvent<HTMLSpanElement>) {

        if (evt.currentTarget.innerText.length > 0) {
            this.jumpToPage();
        } else {
            evt.currentTarget.innerText = (this.props.currentPage as number).toString();
        }
    }

    render() {
        const pageSizeOptionElts = (this.props.itemsPerPageOptions || []).map((opt:number) => (<option key={opt} value={opt+""}>{opt}</option>));
        if (this.props.showAllOption) {
            pageSizeOptionElts.push(<option key="all" value={SHOW_ALL_PAGE_SIZE+""}>all</option>);
        }

        return (
            <div className={this.props.className} style={this.props.style}>
                <ButtonGroup bsSize="sm">
                    <If condition={!!this.props.showFirstPage}>
                        <Button key="firstPageBtn" disabled={!!this.props.firstPageDisabled} onClick={this.props.onFirstPageClick}>
                            {this.props.firstButtonContent}
                        </Button>
                    </If>
                    <Button className="prevPageBtn" key="prevPageBtn" disabled={!!this.props.previousPageDisabled} onClick={this.props.onPreviousPageClick}>
                        {this.props.previousButtonContent}
                    </Button>

                    <span
                        key="textBetweenButtons"
                        className={styles["default-cursor"] + " btn btn-default disabled textBetweenButtons"}
                    >
                        <If condition={this.props.pageNumberEditable}>
                            <span
                                ref={input => this.pageNumberInput = input}
                                className={styles["page-number-input"]}
                                contentEditable={true}
                                onKeyPress={this.handleChangeCurrentPage as React.KeyboardEventHandler<any>}
                                onBlur={this.handleOnBlur as React.FocusEventHandler<any>}
                            >
                                {this.props.currentPage}
                            </span>
                        </If>
                        {this.props.textBetweenButtons}
                    </span>

                    <Button className="nextPageBtn" key="nextPageBtn" disabled={!!this.props.nextPageDisabled} onClick={this.props.onNextPageClick}>
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
                            className="itemsPerPageSelector"
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

export default PaginationControls;
