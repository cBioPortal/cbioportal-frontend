import * as React from 'react';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap_white.css';
import $ from "jquery";
import "./styles.scss";

export type DefaultTooltipProps = Tooltip.Props & { disabled?:boolean, getTooltipContainer?:()=>Element };
export default class DefaultTooltip extends React.Component<DefaultTooltipProps, {}> {
    static readonly defaultProps = {
        mouseEnterDelay: 0.5,
        mouseLeaveDelay: 0.05,
        arrowContent: <div className="rc-tooltip-arrow-inner"/>,
        onPopupAlign:setArrowLeft
    };

    render() {
        let {disabled, visible, ...restProps} = this.props;
        let tooltipProps:Tooltip.Props = restProps;
        if (disabled) {
            visible = false;
        }
        if (typeof visible !== "undefined") {
            tooltipProps.visible = visible;
        }
        return (
            <Tooltip {...tooltipProps}/>
        );
    }
}

function setArrowLeft(tooltipEl:Element, align:any) {
    // Corrects for screen overflow adjustment (should really be handled by the library...)
    const arrowEl:HTMLDivElement = tooltipEl.querySelector('div.rc-tooltip-arrow') as HTMLDivElement;
    const targetEl = this.getRootDomNode();  // eslint-disable-line no-invalid-this

    if (arrowEl && align && align.points && align.points[1] && align.points[1][1] === "c") {
        // if aligning to the horizontal center, set arrow left to the horizontal center of the target
        const offset = $(targetEl).offset();
        const width = $(targetEl).width();
        const tooltipOffset = $(tooltipEl).offset();
        const arrowLeftOffset = offset.left - tooltipOffset.left;

        arrowEl.style.left = `${arrowLeftOffset + width/2}px`;
    }
}

// we need this to account for issue with rc-tooltip when dealing with large tooltip overlay content
export function placeArrowBottomLeft(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    const targetEl = this.getRootDomNode();  // eslint-disable-line no-invalid-this
    arrowEl.style.left = '10px';
}
