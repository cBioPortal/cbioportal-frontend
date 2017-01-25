import * as React from 'react';
import {Button, ButtonGroup, FormGroup, FormControl, InputGroup} from 'react-bootstrap';
import styles from "./tablePaginationControls.module.scss";

const SHOW_ALL_PAGE_SIZE = -1;

export interface ITablePaginationControlsProps {
    currentPage?:number;
    itemsPerPage?:number;
    itemsPerPageOptions?:number[];
    showAllOption?:boolean;
    textBetweenButtons?:string;
    previousButtonContent?: string | JSX.Element;
    nextButtonContent?: string | JSX.Element;
    onChangeItemsPerPage?:(itemsPerPage:number)=>any;
    onPreviousPageClick?:()=>any;
    onNextPageClick?:()=>any;
    className?:string;
    previousPageDisabled?:boolean;
    nextPageDisabled?:boolean;
    marginLeft?: number;
}

export class TablePaginationControls extends React.Component<ITablePaginationControlsProps, {}> {
    public static defaultProps = {
        currentPage: 1,
        itemsPerPage: SHOW_ALL_PAGE_SIZE,
        itemsPerPageOptions: [10, 25, 50, 100],
        showAllOption: true,
        textBetweenButtons: "text btwn buttons",
        previousButtonContent: (<i className='fa fa-angle-left'/>),
        nextButtonContent: (<i className='fa fa-angle-right'/>),
        onChangeItemsPerPage: ()=>0,
        onPreviousPageClick: ()=>0,
        onNextPageClick: ()=>0,
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
                    <Button key="prevPageBtn" disabled={!!this.props.previousPageDisabled} onClick={this.props.onPreviousPageClick}>
                        {this.props.previousButtonContent}
                    </Button>
                    <Button key="textBetweenButtons" className={styles["auto-cursor"]} disabled={true}>
                        {this.props.textBetweenButtons}
                    </Button>
                    <Button key="nextPageBtn" disabled={!!this.props.nextPageDisabled} onClick={this.props.onNextPageClick}>
                        {this.props.nextButtonContent}
                    </Button>
                </ButtonGroup>

                <FormGroup bsSize="sm" className={styles["form-select"]}>
                    <FormControl
                        componentClass="select"
                        value={this.props.itemsPerPage}
                        onChange={this.handleChangeItemsPerPage as React.FormEventHandler<any>}
                    >
                        {pageSizeOptionElts}
                    </FormControl>
                </FormGroup>
            </div>
        );
    }
}

export default TablePaginationControls;
