import * as React from "react";
import {observer} from "mobx-react";
import {computed, observable} from "mobx";
import {bind} from "bind-decorator";
import CBIOPORTAL_VICTORY_THEME from "../../theme/cBioPoralTheme";
import ifndef from "../../lib/ifndef";
import {BoxPlotModel, calculateBoxPlotModel} from "../../lib/boxPlotUtils";
import ScatterPlotTooltip from "./ScatterPlotTooltip";
import Timer = NodeJS.Timer;
import {VictoryBoxPlot, VictoryChart, VictoryAxis, VictoryScatter, VictoryLegend, VictoryLabel} from "victory";
import {IBaseScatterPlotData} from "./ScatterPlot";
import {getDeterministicRandomNumber} from "./PlotUtils";
import {logicalAnd} from "../../lib/LogicUtils";
import {tickFormatNumeral, wrapTick} from "./TickUtils";
import {scatterPlotSize} from "./PlotUtils";

export interface IBaseBoxScatterPlotPoint {
    value:number;
}

export interface IBoxScatterPlotData<D extends IBaseBoxScatterPlotPoint> {
    label:string;
    data:D[];
}

export interface IBoxScatterPlotProps<D extends IBaseBoxScatterPlotPoint> {
    svgRef?:(svg:SVGElement|null)=>void;
    fontFamily?:string;
    title?:string;
    data: IBoxScatterPlotData<D>[];
    chartBase:number;
    highlight?:(d:D)=>boolean;
    size?:(d:D, active:boolean, isHighlighted?:boolean)=>number;
    fill?:string | ((d:D)=>string);
    stroke?:string | ((d:D)=>string);
    fillOpacity?:number | ((d:D)=>number);
    strokeWidth?:number | ((d:D)=>number);
    symbol?: string | ((d:D)=>string); // see http://formidable.com/open-source/victory/docs/victory-scatter/#symbol for options
    tooltip?:(d:D)=>JSX.Element;
    legendData?:{name:string, symbol:any}[]; // see http://formidable.com/open-source/victory/docs/victory-legend/#data
    logScale?:boolean; // log scale along the point data axis
    axisLabelX?:string;
    axisLabelY?:string;
    horizontal?:boolean; // whether the box plot is horizontal
    useLogSpaceTicks?:boolean; // if log scale for an axis, then this prop determines whether the ticks are shown in post-log coordinate, or original data coordinate space
    boxWidth?:number;
}

type BoxModel = {
    min:number,
    max:number,
    median:number,
    q1:number,
    q3:number,
    x?:number,
    y?:number
};

const DEFAULT_FONT_FAMILY = "Verdana,Arial,sans-serif";
const RIGHT_GUTTER = 120; // room for legend
const NUM_AXIS_TICKS = 8;
const PLOT_DATA_PADDING_PIXELS = 50;
export const LEGEND_Y = 100; // experimentally determined
const MIN_LOG_ARGUMENT = 0.01;
const CATEGORY_LABEL_HORZ_ANGLE = -70;
const DEFAULT_LEFT_PADDING = 25;
const LABEL_GUTTER = 150; // room for axis label when categories on that axis
const BOTTOM_GUTTER = LABEL_GUTTER;


const BOX_STYLES = {
    min: {stroke: "#999999"},
    max: {stroke: "#999999"},
    q1: {fill: "#eeeeee"},
    q3: {fill: "#eeeeee"},
    median: {stroke: "#999999", strokeWidth: 1},
};

@observer
export default class BoxScatterPlot<D extends IBaseBoxScatterPlotPoint> extends React.Component<IBoxScatterPlotProps<D>, {}> {
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
        if (this.props.svgRef) {
            this.props.svgRef(this.svg);
        }
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

    @computed get chartWidth() {
        if (this.props.horizontal) {
            return this.props.chartBase;
        } else {
            return this.chartExtent;
        }
    }

    @computed get chartHeight() {
        if (this.props.horizontal) {
            return this.chartExtent;
        } else {
            return this.props.chartBase;
        }
    }

    @computed get legendX() {
        return this.chartWidth - 20;
    }

    private get legend() {
        const x = this.legendX;
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

    @computed get plotDomain() {
        // data extremes plus padding
        let max = Number.NEGATIVE_INFINITY;
        let min = Number.POSITIVE_INFINITY;
        for (const d of this.props.data) {
            for (const d2 of d.data) {
                max = Math.max(d2.value, max);
                min = Math.min(d2.value, min);
            }
        }
        if (this.props.logScale) {
            min = this.logScale(min);
            max = this.logScale(max);
        }
        let x:number[], y:number[];
        const dataDomain = [min, max];
        const categoryDomain = [0, this.categoryCoord(this.props.data.length)];
        if (this.props.horizontal) {
            x = dataDomain;
            y = categoryDomain;
        } else {
            x = categoryDomain;
            y = dataDomain;
        }
        return { x, y };
    }

    @computed get chartExtent() {
        const miscPadding = 200; // specifying chart width in victory doesnt translate directly to the actual graph size
        const numBoxes = this.props.data.length;
        const computedExtent = numBoxes*this.boxWidth + (numBoxes-1)*this.boxSeparation + miscPadding;
        const ret = Math.max(computedExtent, this.props.chartBase);
        return ret;
    }

    @computed get svgWidth() {
        return this.leftPadding + this.chartWidth + RIGHT_GUTTER;
    }

    @computed get svgHeight() {
        return this.chartHeight + BOTTOM_GUTTER;
    }

    @computed get boxSeparation() {
        return 0.4*this.boxWidth;
    }

    @computed get boxWidth() {
        return this.props.boxWidth || 10;
    }

    @computed get boxWidthDataSpace() {
        return this.boxWidth * (this.props.horizontal ? ((this.plotDomain.y[1] - this.plotDomain.y[0])/this.chartHeight) : ((this.plotDomain.x[1] - this.plotDomain.x[0])/this.chartWidth));
    }

    private jitter(seed:number) {
        // receive seed so jitter for same number is always the same
        return 0.5*this.boxWidthDataSpace * getDeterministicRandomNumber(seed, [-1, 1]);
    }

    @bind
    private scatterPlotX(d:IBaseScatterPlotData) {
        if (this.props.logScale && this.props.horizontal) {
            return this.logScale(d.x);
        } else {
            const jitter = this.props.horizontal ? 0 : this.jitter(d.y);
            return d.x + jitter;
        }
    }

    @bind
    private scatterPlotY(d:IBaseScatterPlotData) {
        if (this.props.logScale && !this.props.horizontal) {
            return this.logScale(d.y);
        } else {
            const jitter = this.props.horizontal ? this.jitter(d.x) : 0;
            return d.y + jitter;
        }
    }

    @computed get scatterPlotSize() {
        const highlight = this.props.highlight;
        const size = this.props.size;
        // need to regenerate this function whenever highlight changes in order to trigger immediate Victory rerender
        return scatterPlotSize(highlight, size);
    }

    @computed get labels() {
        return this.props.data.map(d=>d.label);
    }

    @bind
    private formatCategoryTick(t:number, index:number) {
        return wrapTick(this.labels[index], LABEL_GUTTER - 30);
    }

    @bind
    private formatNumericalTick(t:number, i:number, ticks:number[]) {
        return tickFormatNumeral(t, ticks, (this.props.logScale && !this.props.useLogSpaceTicks) ? x=>this.invLogScale(x) : undefined);
    }

    @computed get horzAxis() {
        return (
            <VictoryAxis
                orientation="bottom"
                offsetY={50}
                crossAxis={false}
                label={this.props.axisLabelX}

                tickValues={this.props.horizontal ? undefined: this.categoryTickValues}
                tickCount={this.props.horizontal ? NUM_AXIS_TICKS: undefined }
                tickFormat={this.props.horizontal ? this.formatNumericalTick : this.formatCategoryTick}
                tickLabelComponent={<VictoryLabel angle={this.props.horizontal ? undefined : CATEGORY_LABEL_HORZ_ANGLE}
                                                  verticalAnchor={this.props.horizontal ? undefined : "middle"}
                                                  textAnchor={this.props.horizontal ? undefined : "end"}
                                  />}
                axisLabelComponent={<VictoryLabel dy={this.props.horizontal ? 25 : BOTTOM_GUTTER-20 /* leave more room for labels */}/>}
            />
        );
    }

    @computed get vertAxis() {
        return (
            <VictoryAxis
                orientation="left"
                offsetX={50}
                crossAxis={false}
                label={this.props.axisLabelY}
                dependentAxis={true}
                tickValues={this.props.horizontal ? this.categoryTickValues : undefined}
                tickCount={this.props.horizontal ? undefined : NUM_AXIS_TICKS}
                tickFormat={this.props.horizontal ? this.formatCategoryTick : this.formatNumericalTick}
                axisLabelComponent={<VictoryLabel dy={this.props.horizontal ? -1*this.leftPadding /* leave more room for labels */: -50}/>}
            />
        );
    }

    @computed get scatterPlotData() {
        let dataAxis:"x"|"y" = this.props.horizontal ? "x" : "y";
        let categoryAxis:"x"|"y" = this.props.horizontal ? "y" : "x";
        const data:{x:number, y:number}[] = [];
        for (let i=0; i<this.props.data.length; i++) {
            const categoryCoord = this.categoryCoord(i);
            for (const d of this.props.data[i].data) {
                data.push(Object.assign({}, d, {
                    [dataAxis]:d.value,
                    [categoryAxis]:categoryCoord,
                } as {x:number, y:number}));
            }
        }
        return data;
    }

    @computed get leftPadding() {
        // more left padding if horizontal, to make room for labels
        if (this.props.horizontal) {
            return LABEL_GUTTER;
        } else {
            return DEFAULT_LEFT_PADDING;
        }
    }

    private logScale(x:number) {
        return Math.log2(Math.max(x, MIN_LOG_ARGUMENT));
    }

    private invLogScale(x:number) {
        return Math.pow(2, x);
    }

    private categoryCoord(index:number) {
        return (index + 1) * this.boxSeparation;
    }

    @computed get categoryTickValues() {
        return this.props.data.map((x, i)=>this.categoryCoord(i));
    }

    @computed get boxPlotData():BoxModel[] {
        return this.props.data.map(d=>calculateBoxPlotModel(d.data.map(x=>{
            if (this.props.logScale) {
                return this.logScale(x.value);
            } else {
                return x.value;
            }
        }))).filter(box=>{
            // filter out not well-defined boxes
            return logicalAnd(
                ["IQR", "max", "median", "min", "q1", "q2", "q3", "whiskerLower", "whiskerUpper"].map(key=>{
                    return !isNaN((box as any)[key]);
                })
            );
        }).map((model, i)=>{
            const box:BoxModel = {
                min: model.whiskerLower,
                max: model.whiskerUpper,
                median: model.median,
                q1: model.q1,
                q3: model.q3,
            };
            if (this.props.horizontal) {
                box.y = this.categoryCoord(i)
            } else {
                box.x = this.categoryCoord(i)
            }
            return box;
        });
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
                        <g
                            transform={`translate(${this.leftPadding}, 0)`}
                        >
                            <VictoryChart
                                theme={CBIOPORTAL_VICTORY_THEME}
                                width={this.chartWidth}
                                height={this.chartHeight}
                                standalone={false}
                                domainPadding={PLOT_DATA_PADDING_PIXELS}
                                domain={this.plotDomain}
                            >
                                {this.title}
                                {this.legend}
                                {this.horzAxis}
                                {this.vertAxis}
                                <VictoryBoxPlot
                                    boxWidth={this.boxWidth}
                                    style={BOX_STYLES}
                                    data={this.boxPlotData}
                                    horizontal={this.props.horizontal}
                                />
                                <VictoryScatter
                                    style={{
                                        data: {
                                            fill: ifndef(this.props.fill, "0x000000"),
                                            stroke: ifndef(this.props.stroke, "0x000000"),
                                            strokeWidth: ifndef(this.props.strokeWidth, 0),
                                            fillOpacity: ifndef(this.props.fillOpacity, 1)
                                        }
                                    }}
                                    size={this.scatterPlotSize}
                                    symbol={this.props.symbol || "circle"}
                                    data={this.scatterPlotData}
                                    events={this.mouseEvents}
                                    x={this.scatterPlotX}
                                    y={this.scatterPlotY}
                                />
                            </VictoryChart>
                        </g>
                    </svg>
                </div>
                {this.container && this.tooltipModel && this.props.tooltip && (
                    <ScatterPlotTooltip
                        placement={this.props.horizontal ? "bottom" : "right"}
                        container={this.container}
                        targetHovered={this.pointHovered}
                        targetCoords={{x: this.tooltipModel.x + this.leftPadding, y: this.tooltipModel.y}}
                        overlay={this.props.tooltip(this.tooltipModel.datum)}
                    />
                )}
            </div>
        );
    }
}