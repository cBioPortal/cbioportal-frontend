import React, { ReactElement } from 'react';
import { observer } from "mobx-react";
import { observable, runInAction } from "mobx";
import Plotly from 'plotly.js';
import classNames from 'classnames';
import {sleep} from "../../../shared/lib/TimeUtils";
import {Popover} from 'react-bootstrap';

export interface IReactPlotlyWrapperProps {
    layout: any;
    data: any;
    buildTooltip: (tooltipModel: any) => JSX.Element | null
}

@observer
export default class ReactPlotlyWrapper extends React.Component<IReactPlotlyWrapperProps, {}>
{
    private wrapper: any;
    private tooltipTriggeredRender = false;
    private isTooltipHovered: boolean;
    private tooltipCounter: number = 0;
    @observable.ref private tooltipModel: any = null;

    constructor() {
        super();
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
    }

    componentDidMount() {
        this.renderPlotly();
    }

    componentDidUpdate() {
        if (!this.tooltipTriggeredRender) {
            this.renderPlotly();
        } else {
            this.tooltipTriggeredRender = false;
        }
    }

    renderPlotly() {
        Plotly.newPlot(this.wrapper, this.props.data, this.props.layout);

        const that = this;

        this.wrapper.on('plotly_hover', function (data: any) {
            that.tooltipTriggeredRender = true;
            that.tooltipModel = data;
            that.tooltipCounter++;
        }.bind(this)).on('plotly_unhover', async function (data: any) {
            await sleep(100);
            if (!that.isTooltipHovered && this.tooltipCounter === 1) {
                that.tooltipTriggeredRender = true;
                that.tooltipModel = null;
            }
            this.tooltipCounter--;
        }.bind(this));
    }

    private onMouseLeave() {
        this.tooltipTriggeredRender = true;
        this.tooltipModel = null;
        this.isTooltipHovered = false;
    }

    private onMouseEnter() {
        this.tooltipTriggeredRender = true;
        this.isTooltipHovered = true;
    }

    render() {

        let positionLeft: number = 0;
        let positionTop: number = 0;
        if (this.tooltipModel) {
            const point = this.tooltipModel.points[0];
            positionLeft = point.xaxis.l2p(point.x) + 100;
            positionTop = point.yaxis.l2p(point.y) + 86;
        }

        return (<div style={{ position: 'relative' }}>
            {this.tooltipModel &&
                <Popover arrowOffsetTop={14} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}
                positionLeft={positionLeft} positionTop={positionTop}>
                    {
                        this.props.buildTooltip(this.tooltipModel)
                    }
                </Popover>
            }
            <div ref={(el: HTMLDivElement) => this.wrapper = el}></div>
        </div>
        )
    }
}
