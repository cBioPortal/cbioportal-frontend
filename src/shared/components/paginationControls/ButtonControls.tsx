import * as React from 'react';
import {Button, ButtonGroup, FormGroup, FormControl} from 'react-bootstrap';
import styles from "./paginationControls.module.scss";
import { If, Then, Else } from 'react-if';
import {observable} from "mobx";
import {observer} from "mobx-react";
import classNames from 'classnames';

export const SHOW_ALL_PAGE_SIZE = -1;

export interface IButtonControlsProps {
    itemsPerPage?:number;
    onChangeItemsPerPage?:(itemsPerPage:number)=>void;
}

@observer
export class ButtonControls extends React.Component<IButtonControlsProps, {}> {
    public static defaultProps = {
        itemsPerPage: SHOW_ALL_PAGE_SIZE
    };

    counter:number;
    showMoreItems:number[];
    
    constructor(props:IButtonControlsProps) {
        super(props);
        this.handleChangeItemsPerPage = this.handleChangeItemsPerPage.bind(this);
        this.counter=0;
        this.showMoreItems=[10,25,50,100,-1]
    }

    handleChangeItemsPerPage() {

        if(this.props.onChangeItemsPerPage){
            if (this.props.itemsPerPage) {
                this.counter = this.showMoreItems.indexOf(this.props.itemsPerPage) + 1
                if(this.counter < this.showMoreItems.length){
                    this.props.onChangeItemsPerPage(this.showMoreItems[this.counter]);
                }        
            }
        }    
    }


    render() {
        return (
            <div className='wrapper text-center'>
                <Button bsSize="sm" disabled={this.props.itemsPerPage==SHOW_ALL_PAGE_SIZE} onClick={ this.handleChangeItemsPerPage }>Show More</Button>
            </div>
        );
    }
}

export default ButtonControls;
