import * as React from "react";
import {observer} from "mobx-react";
import bind from "bind-decorator";
import {computed, observable} from "mobx";
import CBIOPORTAL_VICTORY_THEME, {baseLabelStyles} from "../../theme/cBioPoralTheme";
import Timer = NodeJS.Timer;
import {VictoryChart, VictoryAxis, VictoryScatter, VictoryLegend, VictoryLabel} from "victory";
import jStat from "jStat";
import ScatterPlotTooltip from "./ScatterPlotTooltip";
import ifndef from "shared/lib/ifndef";
import {tickFormatNumeral} from "./TickUtils";
import {scatterPlotSize} from "./PlotUtils";

export interface IBaseScatterPlotData {
    x:number;
    y:number;
}

export interface IScatterPlotProps<D extends IBaseScatterPlotData> {
    svgId?:string;
    title?:string;
    data: D[];
    chartWidth:number;
    chartHeight:number;
    highlight?:(d:D)=>boolean;
    fill?:string | ((d:D)=>string);
    stroke?:string | ((d:D)=>string);
    size?:(d:D, active:boolean, isHighlighted?:boolean)=>number;
    fillOpacity?:number | ((d:D)=>number);
    strokeOpacity?:number | ((d:D)=>number);
    strokeWidth?:number | ((d:D)=>number);
    symbol?: string | ((d:D)=>string); // see http://formidable.com/open-source/victory/docs/victory-scatter/#symbol for options
    tooltip?:(d:D)=>JSX.Element;
    legendData?:{name:string|string[], symbol:any}[]; // see http://formidable.com/open-source/victory/docs/victory-legend/#data
    correlation?: {
        pearson: number;
        spearman: number;
    }
    logX?:boolean;
    logY?:boolean;
    useLogSpaceTicks?:boolean; // if log scale for an axis, then this prop determines whether the ticks are shown in post-log coordinate, or original data coordinate space
    axisLabelX?:string;
    axisLabelY?:string;
    fontFamily?:string;
}

const DEFAULT_FONT_FAMILY = "Verdana,Arial,sans-serif";
const CORRELATION_INFO_Y = 100; // experimentally determined
export const LEGEND_Y = CORRELATION_INFO_Y + 30 /* approximate correlation info height */ + 30 /* top padding*/
const RIGHT_GUTTER = 120; // room for correlation info and legend
const NUM_AXIS_TICKS = 8;
const PLOT_DATA_PADDING_PIXELS = 50;
const MIN_LOG_ARGUMENT = 0.01;
const LEFT_PADDING = 25;


@observer
export default class ScatterPlot<D extends IBaseScatterPlotData> extends React.Component<IScatterPlotProps<D>, {}> {
    @observable tooltipModel:any|null = null;
    @observable pointHovered:boolean = false;
    private mouseEvents:any = this.makeMouseEvents();

    @observable.ref private container:HTMLDivElement;

    @bind
    private containerRef(container:HTMLDivElement) {
        this.container = container;
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

    @computed get fontFamily() {
        return this.props.fontFamily || DEFAULT_FONT_FAMILY;
    }

    private get title() {
        if (this.props.title) {
            return (
                <VictoryLabel
                    style={{
                        fontWeight:"bold",
                        fontFamily: this.fontFamily,
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

    @computed get legendX() {
        return this.props.chartWidth - 20;
    }

    private get legend() {
        const x = this.legendX;
        const topPadding = 30;
        const approximateCorrelationInfoHeight = 30;
        if (this.props.legendData && this.props.legendData.length) {
            return (
                <VictoryLegend
                    orientation="vertical"
                    data={this.props.legendData}
                    x={x}
                    y={LEGEND_Y}
                    width={RIGHT_GUTTER}
                />
            );
        } else {
            return null;
        }
    }

    private get correlationInfo() {
        const approxTextWidth = 107; // experimentally determined
        const x = this.legendX;
        const style = {fontFamily: baseLabelStyles.fontFamily, fontSize: baseLabelStyles.fontSize};
        return (
            <g>
                <VictoryLabel  x={x + approxTextWidth}
                               y={CORRELATION_INFO_Y}
                               textAnchor="end"
                               text={`Pearson: ${(this.props.correlation ? this.props.correlation.pearson : this.pearsonCorr).toFixed(2)}`}
                               style={style}
                ></VictoryLabel>
                <VictoryLabel  x={x + approxTextWidth}
                               y={CORRELATION_INFO_Y}
                               textAnchor="end"
                               dy="2"
                               text={`Spearman: ${(this.props.correlation ? this.props.correlation.spearman : this.spearmanCorr).toFixed(2)}`}
                               style={style}
                ></VictoryLabel>
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
        // data extremes
        const max = {x:Number.NEGATIVE_INFINITY, y:Number.NEGATIVE_INFINITY};
        const min = {x:Number.POSITIVE_INFINITY, y:Number.POSITIVE_INFINITY};
        for (const d of this.props.data) {
            max.x = Math.max(d.x, max.x);
            max.y = Math.max(d.y, max.y);
            min.x = Math.min(d.x, min.x);
            min.y = Math.min(d.y, min.y);
        }
        if (this.props.logX) {
            min.x = this.logScale(min.x);
            max.x = this.logScale(max.x);
        }
        if (this.props.logY) {
            min.y = this.logScale(min.y);
            max.y = this.logScale(max.y);
        }
        return {
            x: [min.x, max.x],
            y: [min.y, max.y]
        };
    }

    @computed get pearsonCorr() {
        let x = this.splitData.x;
        let y = this.splitData.y;
        if (this.props.logX) {
            x = x.map(d=>this.logScale(d));
        }
        if (this.props.logY) {
            y = y.map(d=>this.logScale(d));
        }
        return jStat.corrcoeff(x, y);
    }

    @computed get spearmanCorr() {
        return jStat.spearmancoeff(this.splitData.x, this.splitData.y);
    }

    @computed get svgWidth() {
        return LEFT_PADDING + this.props.chartWidth + RIGHT_GUTTER;
    }

    @computed get svgHeight() {
        return this.props.chartHeight;
    }

    private logScale(x:number) {
        return Math.log2(Math.max(x, MIN_LOG_ARGUMENT));
    }

    private invLogScale(x:number) {
        return Math.pow(2, x);
    }

    @bind
    private x(d:D) {
        if (this.props.logX) {
            return this.logScale(d.x);
        } else {
            return d.x;
        }
    }

    @bind
    private y(d:D) {
        if (this.props.logY) {
            return this.logScale(d.y);
        } else {
            return d.y;
        }
    }

    @computed get size() {
        const highlight = this.props.highlight;
        const size = this.props.size;
        // need to regenerate this function whenever highlight changes in order to trigger immediate Victory rerender
        return scatterPlotSize(highlight, size);
    }
    
    private tickFormat(t:number, ticks:number[], logScale:boolean) {
        if (logScale && !this.props.useLogSpaceTicks) {
            t = this.invLogScale(t);
            ticks = ticks.map(x=>this.invLogScale(x));
        }
        return tickFormatNumeral(t, ticks);
    }

    @bind
    private tickFormatX(t:number, i:number, ticks:number[]) {
        return this.tickFormat(t, ticks, !!this.props.logX);
    }

    @bind
    private tickFormatY(t:number, i:number, ticks:number[]) {
        return this.tickFormat(t, ticks, !!this.props.logY);
    }

    render() {
        if (!this.props.data.length) {
            return <span>No data to plot.</span>;
        }
        return (
            <div>
                <div
                    ref={this.containerRef}
                    style={{width: this.svgWidth, height: this.svgHeight}}
                >
                    <svg
                        id={this.props.svgId || ""}
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
                        <g
                            transform={`translate(${LEFT_PADDING},0)`}
                        >
                            <VictoryChart
                                theme={CBIOPORTAL_VICTORY_THEME}
                                width={this.props.chartWidth}
                                height={this.props.chartHeight}
                                standalone={false}
                                domainPadding={PLOT_DATA_PADDING_PIXELS}
                                singleQuadrantDomainPadding={false}
                            >
                                {this.title}
                                {this.legend}
                                <VictoryAxis
                                    domain={this.plotDomain.x}
                                    orientation="bottom"
                                    offsetY={50}
                                    crossAxis={false}
                                    tickCount={NUM_AXIS_TICKS}
                                    tickFormat={this.tickFormatX}
                                    axisLabelComponent={<VictoryLabel dy={25}/>}
                                    label={this.props.axisLabelX}
                                />
                                <VictoryAxis
                                    domain={this.plotDomain.y}
                                    offsetX={50}
                                    orientation="left"
                                    crossAxis={false}
                                    tickCount={NUM_AXIS_TICKS}
                                    tickFormat={this.tickFormatY}
                                    dependentAxis={true}
                                    axisLabelComponent={<VictoryLabel dy={-35}/>}
                                    label={this.props.axisLabelY}
                                />
                                <VictoryScatter
                                    style={{
                                        data: {
                                            fill: ifndef(this.props.fill, "0x000000"),
                                            stroke: ifndef(this.props.stroke, "0x000000"),
                                            strokeWidth: ifndef(this.props.strokeWidth, 0),
                                            strokeOpacity: ifndef(this.props.strokeOpacity, 1),
                                            fillOpacity: ifndef(this.props.fillOpacity, 1),
                                        }
                                    }}
                                    size={this.size}
                                    symbol={this.props.symbol || "circle"}
                                    data={this.props.data}
                                    events={this.mouseEvents}
                                    x={this.x}
                                    y={this.y}
                                />
                            </VictoryChart>
                            {this.correlationInfo}
                        </g>
                    </svg>
                </div>
                {this.container && this.tooltipModel && this.props.tooltip && (
                    <ScatterPlotTooltip
                        container={this.container}
                        targetHovered={this.pointHovered}
                        targetCoords={{x: this.tooltipModel.x + LEFT_PADDING, y: this.tooltipModel.y}}
                        overlay={this.props.tooltip(this.tooltipModel.datum)}
                    />
                )}
            </div>
        );
    }
}