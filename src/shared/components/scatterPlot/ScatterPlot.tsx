import * as React from "react";
import {observer} from "mobx-react";
import bind from "bind-decorator";
import {computed, observable} from "mobx";
import CBIOPORTAL_VICTORY_THEME from "../../theme/cBioPoralTheme";
import Timer = NodeJS.Timer;
import {VictoryChart, VictoryAxis, VictoryScatter, VictoryLegend, VictoryLabel} from "victory";

export interface IBaseScatterPlotData {
    x:number;
    y:number;
}

export interface IScatterPlotProps<D extends IBaseScatterPlotData> {
    title?:string;
    data: D[];
    width:number;
    height:number;
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
    }

    private get legend() {
        const x = this.props.width;
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
        const x = this.props.width;
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

    @computed get svgWidth() {
        return this.props.width + RIGHT_GUTTER;
    }

    @computed get svgHeight() {
        return this.props.height + TOP_GUTTER;
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
                            standalone={false}
                        >
                            {this.title}
                            {this.legend}
                            {this.correlationInfo}
                            <VictoryScatter
                                style={{
                                    data: {
                                        fill: this.props.fill || "0x000000",
                                        stroke: this.props.stroke || "0x000000",
                                        strokeWidth: this.props.strokeWidth || 0,
                                        fillOpacity: this.props.fillOpacity || 0
                                    }
                                }}
                                size={this.props.size || 3}
                                symbol={this.props.symbol || "circle"}
                                data={this.plotData}
                                events={this.mouseEvents}
                            />
                        </VictoryChart>
                    </svg>
                </div>
                {this.container && (
                    <ScatterPlotTooltip
                        container={this.container}
                        targetHovered={this.pointHovered}
                        targetCoords={{x: this.tooltipModel.x, y: this.tooltipModel.y}}
                        overlay={()=><span>Not implemented yet.</span>}
                    />
                )}
            </div>
        );
    }
}