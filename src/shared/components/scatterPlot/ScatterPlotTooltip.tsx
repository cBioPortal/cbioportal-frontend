import {observer} from "mobx-react";
import * as React from "react";
import {observable} from "mobx";
import {Popover} from "react-bootstrap";
import bind from "bind-decorator";

export interface IScatterPlotTooltipProps {
    container:HTMLDivElement;
    overlay:JSX.Element;
    targetCoords:{x:number, y:number};
    targetHovered?:boolean;
    className?:string;
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
        const arrowOffsetTop = 30; // experimentally determined for aesthetic excellence
        const leftPadding = 5;
        if (this.props.targetHovered || this.isHovered) {
            return (
                <Popover
                    className={this.props.className}
                    positionLeft={this.props.targetCoords.x + this.props.container.offsetLeft + leftPadding}
                    positionTop={this.props.targetCoords.y + this.props.container.offsetTop - arrowOffsetTop}
                    onMouseEnter={this.onMouseEnter}
                    onMouseLeave={this.onMouseLeave}
                    arrowOffsetTop={arrowOffsetTop}
                >
                    {this.props.overlay}
                </Popover>
            );
        } else {
            return null;
        }
    }
}