import {observer} from "mobx-react";
import * as React from "react";
import {
    Rect,
    VictoryAxis,
    VictoryChart,
    VictoryLabel,
    VictoryLegend,
    VictoryScatter,
    VictorySelectionContainer
} from "victory";
import CBIOPORTAL_VICTORY_THEME from "../../../../shared/theme/cBioPoralTheme";
import {computed, observable} from "mobx";
import autobind from "autobind-decorator";
import {tickFormatNumeral} from "../../../../shared/components/plots/TickUtils";
import {makeMouseEvents} from "../../../../shared/components/plots/PlotUtils";
import _ from "lodash";
import ScatterPlotTooltip from "../../../../shared/components/plots/ScatterPlotTooltip";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import {AbstractChart} from "../ChartContainer";
import {interpolatePlasma} from "d3-scale-chromatic";
import {DensityPlotBin, RectangleBounds} from "../../../../shared/api/generated/CBioPortalAPIInternal";
import invertIncreasingFunction from "../../../../shared/lib/invertIncreasingFunction";

export type IStudyViewDensityScatterPlotDatum = DensityPlotBin & {x:number, y:number};

export interface IStudyViewDensityScatterPlotProps {
    width:number;
    height:number;
    yBinsMin:number;
    data:DensityPlotBin[]
    xBinSize:number;
    yBinSize:number;
    onSelection:(bounds:RectangleBounds)=>void;
    selectionBounds?:RectangleBounds;

    isLoading?:boolean;
    svgRef?:(svg:SVGElement|null)=>void;
    tooltip?:(d:DensityPlotBin)=>JSX.Element;
    axisLabelX?: string;
    axisLabelY?: string;
    title?:string;
}

const NUM_AXIS_TICKS = 8;
const DOMAIN_PADDING = 15;

class _VictorySelectionContainerWithLegend extends VictorySelectionContainer {
    // we have to do this because otherwise adding the legend element messes up the
    //  VictoryChart layout system

    render() {
        const {activateSelectedData, onSelection, containerRef, gradient, legend, children, ...rest} = this.props as any;
        return (
            <VictorySelectionContainer
                activateSelectedData={false}
                onSelection={onSelection}
                containerRef={containerRef}
                children={children.concat(legend).concat(<defs>{gradient}</defs>)}
                {...rest}
            />
        )
    }
}

// need to do this for typescript reasons, because Victory isn't well typed
const VictorySelectionContainerWithLegend = _VictorySelectionContainerWithLegend as any;

@observer
export default class StudyViewDensityScatterPlot extends React.Component<IStudyViewDensityScatterPlotProps, {}> implements AbstractChart {
    @observable tooltipModel:any|null = null;
    @observable pointHovered:boolean = false;
    @observable mouseIsDown:boolean = false;
    public mouseEvents:any = makeMouseEvents(this);

    private xAxis:any | null = null;
    private yAxis:any | null = null;

    @observable.ref private container:HTMLDivElement;
    private svg:SVGElement|null;

    @autobind
    private containerRef(container:HTMLDivElement) {
        this.container = container;
    }

    @autobind
    private svgRef(svg:SVGElement|null) {
        this.svg = svg;
        if (this.props.svgRef) {
            this.props.svgRef(this.svg);
        }
    }

    public toSVGDOMNode(): Element {
        return this.svg!;
    }

    private get title() {
        if (this.props.title) {
            return (
                <VictoryLabel
                    style={{
                        fontWeight:"bold",
                        textAnchor: "middle"
                    }}
                    x={this.props.width/2}
                    y="1.2em"
                    text={this.props.title}
                />
            );
        } else {
            return null;
        }
    }

    @computed get plotDomain() {
        // enforce plot constraints - because of dot size and wanting them to be
        //  right up against each other, we cant have less than yBinsMin on the y axis
        return {
            x: [0,1] as [number, number],
            y: [0, Math.max(this.props.yBinsMin, this.dataDomain.y[1])]
        };
    }

    @computed get dataDomain() {
        // get data extremes
        const max = {x:Number.NEGATIVE_INFINITY, y:Number.NEGATIVE_INFINITY};
        const min = {x:Number.POSITIVE_INFINITY, y:Number.POSITIVE_INFINITY};
        for (const d of this.data) {
            max.x = Math.max(d.x, max.x);
            max.y = Math.max(d.y, max.y);
            min.x = Math.min(d.x, min.x);
            min.y = Math.min(d.y, min.y);
        }
        return {
            //x: [min.x, max.x],
            //y: [min.y, max.y]
            x: [0, 1] as [number,number],
            y:[0, max.y] as [number,number]
        };
    }

    @autobind
    private tickFormat(t:number, index:number, ticks:number[]) {
        return tickFormatNumeral(t, ticks);
    }

    @autobind
    private onMouseDown() {
        this.mouseIsDown = true;
    }

    @autobind
    private onMouseUp() {
        this.mouseIsDown = false;
    }

    @autobind
    private onSelection(scatters:any, bounds:any) {
        if (this.xAxis && this.yAxis) {
            let xStart = Number.POSITIVE_INFINITY;
            let yStart = Number.POSITIVE_INFINITY;
            let xEnd = Number.NEGATIVE_INFINITY;
            let yEnd = Number.NEGATIVE_INFINITY;
            for (const scatter of scatters) {
                for (const p of scatter.data) {
                    xStart = Math.min(xStart, p.x);
                    yStart = Math.min(yStart, p.y);
                    xEnd = Math.max(xEnd, p.x);
                    yEnd = Math.max(yEnd, p.y);
                }
            }
            // add bin size to get proper bound
            xEnd += this.props.xBinSize;
            yEnd += this.props.yBinSize;
            this.props.onSelection({ xStart, xEnd, yStart, yEnd });
        }
    }

    @computed get data():IStudyViewDensityScatterPlotDatum[] {
        return this.props.data.map(d=>Object.assign({}, d, { x: d.binX, y: d.binY }));
    }

    private isSelected(d:IStudyViewDensityScatterPlotDatum) {
        if (!this.props.selectionBounds) {
            return true;
        } else {
            const bounds = this.props.selectionBounds;
            return d.binX >= bounds.xStart && d.binX < bounds.xEnd &&
                    d.binY >= bounds.yStart && d.binY < bounds.yEnd;
        }
    }

    @computed get plotComputations() {
        let max = Number.NEGATIVE_INFINITY;
        let min = Number.POSITIVE_INFINITY;
        // group data, and collect max and min at same time
        // grouping data by count (aka by color) to make different scatter for each color,
        //  this gives significant speed up over passing in a fill function
        const selectedData = [];
        const unselectedData = [];
        for (const d of this.data) {
            if (this.isSelected(d)) {
                selectedData.push(d);
            } else {
                unselectedData.push(d);
            }
        }

        const selectedDataByAreaCount = _.groupBy(selectedData, d=>{
            const areaCount = d.count;
            max = Math.max(areaCount, max);
            min = Math.min(areaCount, min);
            return areaCount;
        });
        const unselectedDataByAreaCount = _.groupBy(unselectedData, d=>{
            const areaCount = d.count;
            max = Math.max(areaCount, max);
            min = Math.min(areaCount, min);
            return areaCount;
        });

        // use log scale because its usually a very long tail distribution
        // we dont need to worry about log(0) because areas wont have data points to them if theres 0 data there,
        //  so these arguments to log will never be 0.

        // if min == max, then set min = 1
        if (min === max) {
            min = 1;
        }
        const logMax = Math.log(max);
        const logMin = Math.log(min);

        let countToColorCoord:(count:number)=>number;
        let colorCoordToCount:((colorCoord:number)=>number) | null;
        let colorCoordToColor:((colorCoord:number)=>string);
        const colorCoordMax = 0.75;
        if (min === max) {
            // this means min = max = 1;
            countToColorCoord = ()=>0;
            colorCoordToColor = ()=>interpolatePlasma(0);
            colorCoordToCount = null;
        } else {
            // scale between 0 and some limit, to avoid lighter colors on top which are not visible against white bg
            countToColorCoord = count=>((Math.log(count) - logMin) / (logMax - logMin));
            colorCoordToCount = coord=>Math.exp((coord*(logMax-logMin)/colorCoordMax) + logMin);
            colorCoordToColor = coord=>interpolatePlasma(colorCoordMax*coord);
        }

        return {
            selectedDataByAreaCount,
            unselectedDataByAreaCount,
            colorCoordToCount,
            colorCoordMax,
            countToSelectedColor:(count:number)=>colorCoordToColor(countToColorCoord(count)),
            countToUnselectedColor:(count:number)=>{
                return "rgb(200,200,200)";
                /*const val = Math.round(countToColorCoord(count)*255);
                return `rgba(${val},${val},${val},0.3)`;&*/
            },
            colorCoordToColor,
            countMax:max,
            countMin:min
        };
    }

    @computed get scatters() {
        if (this.data.length === 0) {
            return [];
        }

        const scatters:JSX.Element[] = [];
        const scatterCategories = [
            {
                dataByAreaCount: this.plotComputations.selectedDataByAreaCount,
                countToColor: this.plotComputations.countToSelectedColor,
                size: 3
            },
            {
                dataByAreaCount: this.plotComputations.unselectedDataByAreaCount,
                countToColor: this.plotComputations.countToUnselectedColor,
                size: 2.5
            }
        ];
        for (const scatterCategory of scatterCategories) {
            _.forEach(scatterCategory.dataByAreaCount, (data, areaCount)=>{
                const color = scatterCategory.countToColor(parseInt(areaCount, 10));
                scatters.push(
                    <VictoryScatter
                        key={`${areaCount}`}
                        style={{
                            data: {
                                fill: color,
                                stroke: "black",
                                strokeWidth: 1,
                                strokeOpacity: 0
                            }
                        }}
                        size={scatterCategory.size}
                        symbol="circle"
                        data={data}
                        events={this.mouseEvents}
                    />
                );
            });
        }
        return scatters;
    }

    @computed get legend() {
        const colorCoordToCount = this.plotComputations.colorCoordToCount;
        if (!colorCoordToCount) {
            return null;
        } else {
            const gradientId = "legendGradient";
            const GRADIENTMESH = 30;
            const gradientStopPoints = [];
            for (let i=0; i<GRADIENTMESH; i++) {
                gradientStopPoints.push(
                    <stop
                        offset={`${((i/GRADIENTMESH)*100).toFixed(0)}%`}
                        style={{stopColor:this.plotComputations.colorCoordToColor(i/GRADIENTMESH)}}
                    />
                );
            }
            const gradientElt = (
                <linearGradient id={gradientId} x1="0%" y1="100%" x2="0%" y2="0%">
                    {gradientStopPoints}
                </linearGradient>
            );

            const rectX = this.props.width - 45;
            const rectY = 70;
            const rectWidth = 10;
            const largeRange = (this.plotComputations.countMax - this.plotComputations.countMin) >= 2;
            const rectHeight = largeRange ? 68 : 38;

            const rect = (
                <rect fill={`url(#${gradientId})`} x={rectX} y={rectY} width={rectWidth} height={rectHeight}/>
            );

            const labels = [
                <text fontSize={11} x={rectX+rectWidth+4} y={rectY} dy="1em">{this.plotComputations.countMax}</text>,
                <text fontSize={11} x={rectX+rectWidth+4} y={rectY+rectHeight} dy="-0.3em">{this.plotComputations.countMin}</text>
            ];
            if (largeRange) {
                // only add a middle label if theres room for another whole number in between
                labels.push(<text fontSize={11} x={rectX+rectWidth+4} y={rectY+(rectHeight/2)} dy="0.3em">{Math.round(colorCoordToCount(0.5))}</text>);
            }

            const title = <text fontSize={11} x={rectX} y={rectY} dy="-0.5em" dx="-12px"># samples</text>;

            return {
                gradient:gradientElt,
                legend: (<g>
                    {title}
                    {rect}
                    {labels}
                </g>)
            };
        }
    }

    @autobind
    private xAxisRef(axis:any|null) {
        this.xAxis = axis;
    }

    @autobind
    private yAxisRef(axis:any|null) {
        this.yAxis = axis;
    }

    render() {
        return (
            <div>
                <div
                    style={{width:this.props.width, height:this.props.height, position:"relative"}}
                    ref={this.containerRef}
                    onMouseDown={this.onMouseDown}
                    onMouseUp={this.onMouseUp}
                >
                    <VictoryChart
                        theme={CBIOPORTAL_VICTORY_THEME}
                        containerComponent={
                            <VictorySelectionContainerWithLegend
                                onSelection={this.onSelection}
                                containerRef={(ref: any) => {
                                    if (ref) {
                                        this.svgRef(ref.firstChild);
                                    }
                                }}
                                legend={this.legend && this.legend.legend}
                                gradient={this.legend && this.legend.gradient}
                            />
                        }
                        width={this.props.width}
                        height={this.props.height}
                        standalone={true}
                        domainPadding={DOMAIN_PADDING}
                        singleQuadrantDomainPadding={false}
                    >
                        {this.title}
                        <VictoryAxis
                            ref={this.xAxisRef}
                            domain={this.plotDomain.x}
                            orientation="bottom"
                            offsetY={50}
                            crossAxis={false}
                            tickCount={NUM_AXIS_TICKS}
                            tickFormat={this.tickFormat}
                            axisLabelComponent={<VictoryLabel dy={20}/>}
                            label={this.props.axisLabelX}
                        />
                        <VictoryAxis
                            ref={this.yAxisRef}
                            domain={this.plotDomain.y}
                            orientation="left"
                            offsetX={50}
                            crossAxis={false}
                            tickCount={NUM_AXIS_TICKS}
                            tickFormat={this.tickFormat}
                            dependentAxis={true}
                            axisLabelComponent={<VictoryLabel dy={-27}/>}
                            label={this.props.axisLabelY}
                        />
                        {this.scatters}
                    </VictoryChart>
                    <span
                        style={{
                            position:"absolute",
                            top:0,
                            left:0,
                            width:"100%",
                            height:"100%",
                            backgroundColor:"rgba(255,255,255,0.8)",
                            display:this.props.isLoading ? "block" : "none"
                        }}
                    />
                    <LoadingIndicator
                        isLoading={!!this.props.isLoading}
                        style={{position:"absolute", top:"50%", left:"50%", marginLeft:-10}}
                    />
                </div>
                { this.tooltipModel && this.props.tooltip && !this.mouseIsDown && (
                    <ScatterPlotTooltip
                        container={this.container}
                        targetHovered={this.pointHovered}
                        targetCoords={{x: this.tooltipModel.x, y: this.tooltipModel.y}}
                        overlay={this.props.tooltip(this.tooltipModel.datum)}
                    />
                )}
            </div>
        );
    }
}