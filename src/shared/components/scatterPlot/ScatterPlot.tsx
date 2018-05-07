import * as React from "react";
import {observer} from "mobx-react";
import bind from "bind-decorator";
import {computed, observable} from "mobx";
import CBIOPORTAL_VICTORY_THEME from "../../theme/cBioPoralTheme";
import Timer = NodeJS.Timer;
import {VictoryChart, VictoryAxis, VictoryScatter, VictoryLegend, VictoryLabel} from "victory";
import jStat from "jStat";
import ScatterPlotTooltip from "./ScatterPlotTooltip";
import {dataLengthToPixels, pixelsToDataLength, VictoryAxisStyle} from "./ScatterPlotUtils";

export interface IBaseScatterPlotData {
    x:number;
    y:number;
}

export interface IScatterPlotProps<D extends IBaseScatterPlotData> {
    title?:string;
    data: D[];
    chartWidth:number;
    chartHeight:number;
    fill?:(d:D)=>string;
    stroke?:(d:D)=>string;
    fillOpacity?:(d:D)=>number;
    strokeWidth?:(d:D)=>number;
    size?:(d:D)=>number;
    symbol?: (d:D)=>string; // see http://formidable.com/open-source/victory/docs/victory-scatter/#symbol for options
    tooltip?:(d:D)=>JSX.Element;
    legendData?:{name:string, symbol:any}[]; // see http://formidable.com/open-source/victory/docs/victory-legend/#data
    correlation?: {
        pearson: number;
        spearman: number;
    }
}

const FONT_FAMILY = "Verdana,Arial,sans-serif";
const CORRELATION_INFO_Y = 100; // experimentally determined
const RIGHT_GUTTER = 120; // room for correlation info and legend
const NUM_AXIS_TICKS = 8;
const TOP_GUTTER = 50; // room for title;
const PLOT_DATA_PADDING_PIXELS = 10;


@observer
export default class ScatterPlot<D extends IBaseScatterPlotData> extends React.Component<IScatterPlotProps<D>, {}> {
    @observable tooltipModel:any|null = null;
    @observable pointHovered:boolean = false;
    private mouseEvents:any = this.makeMouseEvents();

    @observable.ref private container:HTMLDivElement;
    private svg:SVGElement|null;

    @bind
    private containerRef(container:HTMLDivElement) {
        this.container = container;
    }

    @bind
    private svgRef(svg:SVGElement|null) {
        this.svg = svg;
    }

    private makeMouseEvents() {
        let disappearTimeout:Timer | null = null;
        const disappearDelayMs = 250;

        return [{
            target: "data",
            eventHandlers: {
                onMouseOver: () => {
                    return [
                        {
                            target: "data",
                            mutation: (props: any) => {
                                this.tooltipModel = props;
                                this.pointHovered = true;

                                if (disappearTimeout !== null) {
                                    clearTimeout(disappearTimeout);
                                    disappearTimeout = null;
                                }

                                return { active: true };
                            }
                        }
                    ];
                },
                onMouseOut: () => {
                    return [
                        {
                            target: "data",
                            mutation: () => {
                                if (disappearTimeout !== null) {
                                    clearTimeout(disappearTimeout);
                                }

                                disappearTimeout = setTimeout(()=>{
                                    this.pointHovered = false;
                                }, disappearDelayMs);

                                return { active: false };
                            }
                        }
                    ];
                }
            }
        }];
    }

    private get title() {
        if (this.props.title) {
            return (
                <VictoryLabel
                    style={{
                        fontWeight:"bold",
                        fontFamily: FONT_FAMILY,
                        textAnchor: "middle"
                    }}
                    x={this.svgWidth/2}
                    y="1.2em"
                    text={this.props.title}
                />
            );
        } else {
            return null;
        }
    }

    private get legend() {
        const x = this.props.chartWidth;
        const topPadding = 30;
        const approximateCorrelationInfoHeight = 30;
        const y = CORRELATION_INFO_Y + approximateCorrelationInfoHeight + topPadding;
        if (this.props.legendData && this.props.legendData.length) {
            return (
                <VictoryLegend
                    orientation="vertical"
                    data={this.props.legendData}
                    x={x}
                    y={y}
                    width={RIGHT_GUTTER}
                />
            );
        } else {
            return null;
        }
    }

    private get correlationInfo() {
        const approxTextWidth = 107; // experimentally determined
        const x = this.props.chartWidth;
        return (
            <g>
                <text
                    x={x + approxTextWidth}
                    y={CORRELATION_INFO_Y}
                    fontFamily={FONT_FAMILY}
                    textAnchor="end"
                >
                    {`Pearson: ${(this.props.correlation ? this.props.correlation.pearson : this.pearsonCorr).toFixed(2)}`}
                </text>
                <text
                    x={x + approxTextWidth}
                    y={CORRELATION_INFO_Y}
                    fontFamily={FONT_FAMILY}
                    textAnchor="end"
                    dy="1.2em"
                >
                    {`Spearman: ${(this.props.correlation ? this.props.correlation.spearman : this.spearmanCorr).toFixed(2)}`}
                </text>
            </g>
        );
    }

    @computed get splitData() {
        const x = [];
        const y = [];
        for (const d of this.props.data) {
            x.push(d.x);
            y.push(d.y);
        }
        return { x, y };
    }

    @computed get plotDomain() {
        // data extremes plus padding
        const max = {x:Number.NEGATIVE_INFINITY, y:Number.NEGATIVE_INFINITY};
        const min = {x:Number.POSITIVE_INFINITY, y:Number.POSITIVE_INFINITY};
        for (const d of this.props.data) {
            max.x = Math.max(d.x, max.x);
            max.y = Math.max(d.y, max.y);
            min.x = Math.min(d.x, min.x);
            min.y = Math.min(d.y, min.y);
        }
        const xPadding = pixelsToDataLength(PLOT_DATA_PADDING_PIXELS, [min.x, max.x], this.props.chartWidth);
        const yPadding = pixelsToDataLength(PLOT_DATA_PADDING_PIXELS, [min.y, max.y], this.props.chartHeight);
        max.x += xPadding;
        min.x -= xPadding;
        max.y += yPadding;
        min.y -= yPadding;
        return {
            x: [min.x, max.x],
            y: [min.y, max.y]
        };
    }

    @computed get yAxisOffsetX() {
        const minX = this.plotDomain.x[0];
        if (minX >= 0) {
            // we wont cross 0, so it'll be at bottom anyway
            return 0;
        } else {
            return -dataLengthToPixels(
                Math.abs(minX),
                this.plotDomain.x,
                this.props.chartWidth
            );
        }
    }

    @computed get xAxisOffsetY() {
        const minY = this.plotDomain.y[0];
        if (minY >= 0) {
            // we wont cross 0, so it'll be at bottom anyway
            return 0;
        } else {
            return -dataLengthToPixels(
                Math.abs(minY),
                this.plotDomain.y,
                this.props.chartHeight
            );
        }
    }

    @computed get pearsonCorr() {
        return jStat.corrcoeff(this.splitData.x, this.splitData.y);
    }

    @computed get spearmanCorr() {
        return jStat.spearmancoeff(this.splitData.x, this.splitData.y);
    }

    @computed get svgWidth() {
        return this.props.chartWidth + RIGHT_GUTTER;
    }

    @computed get svgHeight() {
        return this.props.chartHeight + TOP_GUTTER;
    }

    render() {
        return (
            <div>
                <div
                    ref={this.containerRef}
                    style={{width: this.svgWidth, height: this.svgHeight}}
                >
                    <svg
                        ref={this.svgRef}
                        style={{
                            width: this.svgWidth,
                            height: this.svgHeight,
                            pointerEvents: "all"
                        }}
                        height={this.svgHeight}
                        width={this.svgWidth}
                        role="img"
                        viewBox={`0 0 ${this.svgWidth} ${this.svgHeight}`}
                    >
                        <VictoryChart
                            theme={CBIOPORTAL_VICTORY_THEME}
                            width={this.props.chartWidth}
                            height={this.props.chartHeight}
                            standalone={false}
                        >
                            {this.title}
                            {this.legend}
                            {this.correlationInfo}
                            <VictoryAxis
                                domain={this.plotDomain.x}
                                style={VictoryAxisStyle}
                                crossAxis={false}
                                tickCount={NUM_AXIS_TICKS}
                                axisLabelComponent={<VictoryLabel style={{fontWeight:"bold", fontFamily:FONT_FAMILY}} dy={25}/>}
                            />
                            <VictoryAxis
                                domain={this.plotDomain.y}
                                style={VictoryAxisStyle}
                                crossAxis={false}
                                tickCount={NUM_AXIS_TICKS}
                                dependentAxis={true}
                                axisLabelComponent={<VictoryLabel style={{fontWeight:"bold", fontFamily:FONT_FAMILY}} dy={25}/>}
                            />
                            <VictoryScatter
                                style={{
                                    data: {
                                        fill: this.props.fill || "0x000000",
                                        stroke: this.props.stroke || "0x000000",
                                        strokeWidth: this.props.strokeWidth || 0,
                                        fillOpacity: this.props.fillOpacity || 1
                                    }
                                }}
                                size={this.props.size || 3}
                                symbol={this.props.symbol || "circle"}
                                data={this.props.data}
                                events={this.mouseEvents}
                            />
                        </VictoryChart>
                    </svg>
                </div>
                {this.container && this.tooltipModel && (
                    <ScatterPlotTooltip
                        container={this.container}
                        targetHovered={this.pointHovered}
                        targetCoords={{x: this.tooltipModel.x, y: this.tooltipModel.y}}
                        overlay={<span>Not implemented yet.</span>}
                    />
                )}
            </div>
        );
    }
}