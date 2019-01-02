import * as React from 'react';
import {action, observable} from 'mobx';
import {observer} from "mobx-react";
import styles from "./EllipsisTextTooltip.module.scss";
import DefaultTooltip from "../defaultTooltip/DefaultTooltip";
import $ from "jquery";
import autobind from "autobind-decorator";

@observer
export default class EllipsisTextTooltip extends React.Component<{ text:string },{}> {

    @observable tooltipVisible = false;

    el:HTMLSpanElement;

    @autobind
    @action
    onVisibleChange(isVisible:boolean){
        const isOverflowed = (this.el.scrollWidth - $(this.el).innerWidth()) > 1;
        this.tooltipVisible = isVisible && isOverflowed;
    }

    @autobind
    setRef(el:HTMLSpanElement){
        this.el = el;
    }

    render(){
        return <DefaultTooltip overlay={<span>{this.props.text}</span>}
                               visible={this.tooltipVisible}
                               onVisibleChange={(this.onVisibleChange as any)}
        >
            <span className={styles.text} ref={this.setRef}>{this.props.text}</span>
        </DefaultTooltip>
    }

}