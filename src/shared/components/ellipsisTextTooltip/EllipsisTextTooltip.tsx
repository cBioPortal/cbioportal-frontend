import * as React from 'react';
import {action, observable} from 'mobx';
import {observer} from "mobx-react";
import styles from "./EllipsisTextTooltip.module.scss";
import DefaultTooltip from "../defaultTooltip/DefaultTooltip";
import $ from "jquery";
import autobind from "autobind-decorator";

@observer
export default class EllipsisTextTooltip extends React.Component<{ text:string; shownWidth?:number },{}> {

    @observable tooltipVisible = false;

    el:HTMLSpanElement;

    @autobind
    @action
    onVisibleChange(isVisible:boolean){
        // if shownWidth exist, using the shownWidth
        let shownWidth =  $(this.el).innerWidth();
        let actualWidth = this.el.scrollWidth;

        if (this.props.shownWidth) {
            shownWidth = this.props.shownWidth;
            actualWidth = this.el.offsetWidth;
        }
        
        const isOverflowed = (actualWidth - shownWidth) > 1;
        this.tooltipVisible = isVisible && isOverflowed;
    }

    @autobind
    setRef(el:HTMLSpanElement){
        this.el = el;
    }

    render(){
        return <DefaultTooltip overlay={<span>{this.props.text}</span>}
                               visible={this.tooltipVisible}
                               onVisibleChange={(this.onVisibleChange)}
        >
            <span className={styles.text} ref={this.setRef}>{this.props.text}</span>
        </DefaultTooltip>
    }

}