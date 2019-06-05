import * as React from 'react';
import {action, computed, observable} from 'mobx';
import {observer} from "mobx-react";
import styles from "./EllipsisTextTooltip.module.scss";
import DefaultTooltip from "../defaultTooltip/DefaultTooltip";
import $ from "jquery";
import autobind from "autobind-decorator";

@observer
export default class EllipsisTextTooltip extends React.Component<{ text:any; style?:any; shownWidth?:number, hideTooltip?:boolean },{}> {

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
        }
        
        const isOverflowed = (actualWidth - shownWidth) > 1;
        this.tooltipVisible = !this.props.hideTooltip && isVisible && isOverflowed;
    }

    @autobind
    setRef(el:HTMLSpanElement){
        this.el = el;
    }

    @computed get style() {
        const style:any = Object.assign({}, this.props.style);
        if (this.props.shownWidth) {
            style.maxWidth = this.props.shownWidth;
        }
        return style;
    }

    render(){
        return <DefaultTooltip overlay={<span>{this.props.text}</span>}
                               visible={this.tooltipVisible}
                               onVisibleChange={(this.onVisibleChange)}
        >
            <span className={styles.text} style={this.style} ref={this.setRef}>{this.props.text}</span>
        </DefaultTooltip>
    }

}