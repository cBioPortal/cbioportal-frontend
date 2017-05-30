import * as React from 'react';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap_white.css';
import $ from "jquery";

export default class DefaultTooltip extends React.Component<Tooltip.Props, {}> {
    static readonly defaultProps = {
        mouseEnterDelay: 0.5,
        mouseLeaveDelay: 0.05,
        arrowContent: <div className="rc-tooltip-arrow-inner"/>,
        onPopupAlign:setArrowLeft
    };

    render() {
        return (
            <Tooltip {...this.props}/>
        );
    }
}

function setArrowLeft(tooltipEl:Element, align:any) {
    // Corrects for screen overflow adjustment
    const arrowEl:HTMLDivElement = tooltipEl.querySelector('div.rc-tooltip-arrow') as HTMLDivElement;
    const targetEl = this.getRootDomNode();  // eslint-disable-line no-invalid-this

    if (arrowEl) {
        const offset = $(targetEl).offset();
        const width = $(targetEl).width();
        const tooltipOffset = $(tooltipEl).offset();
        const arrowLeftOffset = offset.left - tooltipOffset.left;

        arrowEl.style.left = `${arrowLeftOffset + width/2}px`;
    }
}
