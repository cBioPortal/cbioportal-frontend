import {observer} from "mobx-react";
import * as React from "react";
import {VictoryChart, VictorySelectionContainer, VictoryAxis, VictoryLabel, VictoryScatter, VictoryLegend} from "victory";
import CBIOPORTAL_VICTORY_THEME from "../../../../shared/theme/cBioPoralTheme";
import {computed, observable} from "mobx";
import autobind from "autobind-decorator";
import {tickFormatNumeral} from "../../../../shared/components/plots/TickUtils";
import {makeMouseEvents} from "../../../../shared/components/plots/PlotUtils";
import _ from "lodash";
import {downsampleByGrouping, DSData} from "../../../../shared/components/plots/downsampleByGrouping";
import ScatterPlotTooltip from "../../../../shared/components/plots/ScatterPlotTooltip";
import {DOWNSAMPLE_PIXEL_DISTANCE_THRESHOLD, getDownsampledData, MAX_DOT_SIZE} from "./StudyViewScatterPlotUtils";
import {ClinicalAttribute, SampleIdentifier} from "../../../../shared/api/generated/CBioPortalAPI";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator"
import $ from "jquery";
import {AnalysisGroup} from "../../StudyViewPageStore";
import {AbstractChart} from "../ChartContainer";
import {interpolatePlasma} from "d3-scale-chromatic";

export interface IStudyViewDensityScatterPlotData {
    x:number;
    y:number;
    uniqueSampleKey:string;
    studyId:string;
    sampleId:string;
    patientId:string;
}

export interface IStudyViewDensityScatterPlotProps {
    width:number;
    height:number;
    data:IStudyViewDensityScatterPlotData[]
    onSelection:(sampleIdentifiers:SampleIdentifier[], keepCurrent:boolean)=>void;

    isLoading?:boolean;
    svgRef?:(svg:SVGElement|null)=>void;
    tooltip?:(d:DSData<IStudyViewDensityScatterPlotData>)=>JSX.Element;
    axisLabelX?: string;
    axisLabelY?: string;
    title?:string;
}

const NUM_AXIS_TICKS = 8;
const DOMAIN_PADDING = 15;
const BIN_THRESHOLD = 0; // set to 0 means always bin

@observer
export default class StudyViewDensityScatterPlot extends React.Component<IStudyViewDensityScatterPlotProps, {}> implements AbstractChart {
    @observable tooltipModel:any|null = null;
    @observable pointHovered:boolean = false;
    @observable mouseIsDown:boolean = false;
    @observable shiftPressed:boolean = false;
    public mouseEvents:any = makeMouseEvents(this);

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

    @autobind
    private onKeyDown(e: JQueryKeyEventObject) {
        if (e.which === 16) {
            this.shiftPressed = true;
        }
    }

    @autobind
    private onKeyUp(e: JQueryKeyEventObject) {
        if (e.which === 16) {
            this.shiftPressed = false;
        }
    }

    componentDidMount() {
        // Make it so that if you hold down shift, you can select more than one region at once
        $(document).on("keydown",this.onKeyDown);
        $(document).on("keyup", this.onKeyUp);
    }

    componentWillUnmount() {
        $(document).off("keydown",this.onKeyDown);
        $(document).off("keyup", this.onKeyUp);
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

    @computed get dataDomain() {
        // get data extremes
        const max = {x:Number.NEGATIVE_INFINITY, y:Number.NEGATIVE_INFINITY};
        const min = {x:Number.POSITIVE_INFINITY, y:Number.POSITIVE_INFINITY};
        for (const d of this.props.data) {
            max.x = Math.max(d.x, max.x);
            max.y = Math.max(d.y, max.y);
            min.x = Math.min(d.x, min.x);
            min.y = Math.min(d.y, min.y);
        }
        return {
            //x: [min.x, max.x],
            //y: [min.y, max.y]
            x: [0, 1],
            y:[0, max.y]
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
    private onSelection(points:any) {
        const selectedSamples = _.reduce(points, function (acc, point) {
            _.each(point.data, datum => _.each(datum.data, (d: IStudyViewDensityScatterPlotData) => acc.push({
                sampleId: d.sampleId,
                studyId: d.studyId
            })));
            return acc;
        }, [] as SampleIdentifier[]);

        this.props.onSelection(selectedSamples, this.shiftPressed); // keep other selection if shift pressed
    }

    @computed get binningData() {
        return this.props.data.length > BIN_THRESHOLD;
    }

    @computed get data():DSData<IStudyViewDensityScatterPlotData>[] {
        if (this.binningData) {
            const MESH = 50;
            const X_STEP = (this.dataDomain.x[1] - this.dataDomain.x[0])/MESH;
            const Y_STEP = (this.dataDomain.y[1] - this.dataDomain.y[0])/MESH;
            const getGridCoords = (d:{x:number, y:number})=>{
                const x = Math.floor((d.x - this.dataDomain.x[0])/X_STEP);
                const y = Math.floor((d.y - this.dataDomain.y[0])/Y_STEP);
                return { x, y };
            };

            const getAreaHash = (gridCoords:{x:number, y:number})=>`${gridCoords.x},${gridCoords.y}`;

            const bins = _.groupBy(this.props.data, d=>getAreaHash(getGridCoords(d)));
            return _.values(bins).map(data=>{
                const gridCoords = getGridCoords(data[0]);
                return {
                    x: gridCoords.x*X_STEP,
                    y: gridCoords.y*Y_STEP,
                    data
                };
            });
        } else {
            return this.props.data.map(d=>({
                x: d.x,
                y:d.y,
                data: [d]
            }));
        }
    }

    @computed get plotComputations() {
        let max = Number.NEGATIVE_INFINITY;
        let min = Number.POSITIVE_INFINITY;
        // group data, and collect max and min at same time
        // grouping data by count (aka by color) to make different scatter for each color,
        //  this gives significant speed up over passing in a fill function
        const dataByAreaCount = _.groupBy(this.data, d=>{
            const areaCount = d.data.length;
            max = Math.max(areaCount, max);
            min = Math.min(areaCount, min);
            return areaCount;
        });

        // use log scale because its usually a very long tail distribution
        // we dont need to worry about log(0) because areas wont have data points to them if theres 0 data there,
        //  so these arguments to log will never be 0.
        const logMax = Math.log(max);
        const logMin = Math.log(min);

        let countToColorCoord:(count:number)=>number;
        let colorCoordToCount:((colorCoord:number)=>number) | null;
        const colorCoordMax = 0.75;
        if (min === max) {
            countToColorCoord = ()=>0.2;
            colorCoordToCount = null;
        } else {
            // scale between 0 and some limit, to avoid lighter colors on top which are not visible against white bg
            countToColorCoord = count=>colorCoordMax*((Math.log(count) - logMin) / (logMax - logMin));
            colorCoordToCount = coord=>Math.exp((coord*(logMax-logMin)/colorCoordMax) + logMin);
        }

        return {
            dataByAreaCount,
            colorCoordToCount,
            colorCoordMax,
            countToColor:(count:number)=>interpolatePlasma(countToColorCoord(count)),
            countMax:max,
            countMin:min
        };
    }

    @computed get scatters() {
        if (this.data.length === 0) {
            return [];
        }

        const scatters:JSX.Element[] = [];
        _.forEach(this.plotComputations.dataByAreaCount, (data, areaCount)=>{
            const color = this.binningData ? this.plotComputations.countToColor(parseInt(areaCount, 10)) : "red";
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
                    size={3}
                    symbol="circle"
                    data={data}
                    events={this.mouseEvents}
                />
            );
        });
        return scatters;
    }

    @autobind
    private size(d:DSData<IStudyViewDensityScatterPlotData>) {
        const baseSize = 3;
        const increment = 0.5;
        return Math.min(MAX_DOT_SIZE, (baseSize - increment) + increment*d.data.length);
    }

    @computed get legendData() {
        const colorCoordToCount = this.plotComputations.colorCoordToCount;
        if (!colorCoordToCount) {
            return [];
        } else {
            // one circle at uniform spaced intervals in color space

            // first generate count values uniformly spaced in color space
            const NUM_ELTS = 5;// hard coded based on how many will fit
            const increment = this.plotComputations.colorCoordMax / (NUM_ELTS-1);
            let countValues = [];
            for (let i=0; i<NUM_ELTS-1; i++) {
                countValues.push(Math.round(colorCoordToCount(i*increment)));
            }
            countValues.push(this.plotComputations.countMax);
            // first is set to the countMin (it would be in theory, but this fixes any rounding errors)
            countValues[0] = this.plotComputations.countMin;
            // remove duplicates (would happen in case of small range, NUM_ELTS greater than number of area counts)
            countValues = _.uniq(countValues);
            // reverse so top value is on top
            countValues.reverse();

            // generate circles for it
            return countValues.map(count=>({
                name: count,
                symbol: {
                    fill: this.plotComputations.countToColor(count),
                    strokeOpacity: 0,
                    type: "circles"
                }
            }));
        }
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
                            <VictorySelectionContainer
                                activateSelectedData={false}
                                onSelection={this.onSelection}
                                containerRef={(ref: any) => {
                                    if (ref) {
                                        this.svgRef(ref.firstChild);
                                    }
                                }}
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
                            domain={this.dataDomain.x}
                            orientation="bottom"
                            offsetY={50}
                            crossAxis={false}
                            tickCount={NUM_AXIS_TICKS}
                            tickFormat={this.tickFormat}
                            axisLabelComponent={<VictoryLabel dy={25}/>}
                            label={this.props.axisLabelX}
                        />
                        <VictoryAxis
                            domain={this.dataDomain.y}
                            orientation="left"
                            offsetX={50}
                            crossAxis={false}
                            tickCount={NUM_AXIS_TICKS}
                            tickFormat={this.tickFormat}
                            dependentAxis={true}
                            axisLabelComponent={<VictoryLabel dy={-30}/>}
                            label={this.props.axisLabelY}
                        />
                        {this.scatters}
                        {(this.legendData.length > 0) && (
                            <VictoryLegend
                                title="# Samples"
                                titleComponent={<VictoryLabel style={{fontSize:11}} dx={-4} dy={5}/>}
                                orientation="vertical"
                                symbolSpacer={6}
                                style={{ data: { size:5 }}}
                                data={this.legendData}
                                rowGutter={-3}
                                x={this.props.width - 57}
                                y={50}
                            />
                        )}
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