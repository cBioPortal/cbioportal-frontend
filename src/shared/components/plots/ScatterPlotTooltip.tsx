import {observer} from "mobx-react";
import * as React from "react";
import {observable} from "mobx";
import {Popover} from "react-bootstrap";
import bind from "bind-decorator";
import classnames from "classnames";

export interface IScatterPlotTooltipProps {
    container:HTMLDivElement;
    overlay:JSX.Element;
    targetCoords:{x:number, y:number};
    targetHovered?:boolean;
    className?:string;
    placement?:string;
    arrowOffsetTop?:number;
}

@observer
export default class ScatterPlotTooltip extends React.Component<IScatterPlotTooltipProps, {}> {
    @observable isHovered = false; // allows persistence when mouse rolls over tooltip

    @bind
    private onMouseEnter() {
        this.isHovered = true;
    }

    @bind
    private onMouseLeave() {
        this.isHovered = false;
    }

    render() {
        const arrowOffsetTop = (this.props.arrowOffsetTop === undefined ? 30 : this.props.arrowOffsetTop);
        const arrowOffsetLeft = 24;
        const leftPadding = 5;
        const horizontal = !this.props.placement || this.props.placement === "left" || this.props.placement === "right";
        if (this.props.targetHovered || this.isHovered) {
            return (
                <Popover
                    className={classnames("cbioportal-frontend", "cbioTooltip", this.props.className)}
                    positionLeft={this.props.targetCoords.x + this.props.container.offsetLeft + leftPadding - (!horizontal ? arrowOffsetLeft + 6 : 0)}
                    positionTop={this.props.targetCoords.y + this.props.container.offsetTop - (horizontal ? arrowOffsetTop : -5)}
                    onMouseEnter={this.onMouseEnter}
                    onMouseLeave={this.onMouseLeave}
                    arrowOffsetTop={horizontal ? arrowOffsetTop : undefined}
                    arrowOffsetLeft={!horizontal ? arrowOffsetLeft : undefined}
                    placement={this.props.placement}
                >
                    {this.props.overlay}
                </Popover>
            );
        } else {
            return null;
        }
    }
}