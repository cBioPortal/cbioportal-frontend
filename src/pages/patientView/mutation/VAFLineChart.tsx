import * as React from "react";
import {Observer, observer} from "mobx-react";
import {VictoryAxis, VictoryChart, VictoryLabel, VictoryLine, VictoryScatter} from "victory";
import CBIOPORTAL_VICTORY_THEME from "../../../shared/theme/cBioPoralTheme";
import {action, computed, observable} from "mobx";
import {Mutation, Sample} from "../../../shared/api/generated/CBioPortalAPI";
import {stringListToIndexSet} from "../../../public-lib";
import _ from "lodash";
import {getVariantAlleleFrequency} from "../../../shared/lib/MutationUtils";
import WindowStore from "../../../shared/components/window/WindowStore";
import TruncatedTextWithTooltipSVG from "../../../shared/components/TruncatedTextWithTooltipSVG";
import {Popover} from "react-bootstrap";
import classnames from "classnames";
import survivalStyles from "../../resultsView/survival/styles.module.scss";
import styles from "./styles.module.scss";
import autobind from "autobind-decorator";
import {Portal} from "react-portal";
import {CoverageInformation} from "../../resultsView/ResultsViewPageStoreUtils";
import {isSampleProfiled} from "../../../shared/lib/isSampleProfiled";
import SampleLabelSVG from "../../../shared/components/sampleLabel/SampleLabel";
import SampleManager from "../SampleManager";
import PatientViewMutationsDataStore from "./PatientViewMutationsDataStore";
import $ from "jquery";
import ComplexKeyMap from "../../../shared/lib/complexKeyDataStructures/ComplexKeyMap";
import invertIncreasingFunction, {invertDecreasingFunction} from "../../../shared/lib/invertIncreasingFunction";
import {MutationStatus, mutationTooltip} from "./PatientViewMutationsTabUtils";


export interface IVAFLineChartProps {
    mutations:Mutation[][];
    samples:Sample[];
    coverageInformation:CoverageInformation;
    mutationProfileId:string;
    sampleManager:SampleManager|null;
    dataStore:PatientViewMutationsDataStore;
    svgRef:(elt:SVGElement|null)=>void;
    logScale:boolean;
}

interface IPoint {
    x:number,
    y:number,
    sampleId:string,
    mutation:Mutation;
    mutationStatus:MutationStatus
}

const LINE_COLOR = "#000000";
const THICK_LINE_STROKE_WIDTH = 6;
const DRAG_COVER_CLASSNAME = "draggingCover";
const MIN_LOG_ARG = 0.001;

class ScaleCapturer extends React.Component<any, any>{
    render() {
        this.props.scaleCallback(this.props.scale);

        return <g/>;
    }
}

function isPointFoundedOnRealVAF(d:{ mutationStatus: MutationStatus }) {
    return d.mutationStatus === MutationStatus.MUTATED_WITH_VAF ||
        d.mutationStatus === MutationStatus.PROFILED_WITH_READS_BUT_UNCALLED;
}

class Tick extends React.Component<any, any>{
    render() {
        let {sampleIdOrder, sampleManager, text:index, ...rest} = this.props;
        const sampleId = sampleIdOrder[index];
        return (
            <g transform={`rotate(50, ${rest.x}, ${rest.y})`}>
                <SampleLabelSVG
                    label={index+1}
                    color={sampleManager ? sampleManager.getColorForSample(sampleId) : "black"}
                    x={rest.x+10}
                    y={rest.y-5}
                    r={6}
                    textDy={-1}
                />
                <TruncatedTextWithTooltipSVG
                    text={sampleId}
                    {...rest}
                    verticalAnchor="start"
                    textAnchor="start"
                    maxWidth={50}
                    dx={20}
                />
            </g>
        );
    }

}

type VictoryScale = { x: (_x:number)=>number, y:(_y:number)=>number };

@observer
export default class VAFLineChart extends React.Component<IVAFLineChartProps, {}> {

    @observable.ref private tooltipDatum:any | null = null;
    @observable private tooltipOnPoint = false;

    private mouseEvents = this.makeMouseEvents();
    @observable.ref mouseEvent:React.MouseEvent<any>|null = null;
    @observable.ref private scale:VictoryScale | null = null;
    @observable.ref private thickLineContainer:any | null = null;

    @observable dragRect = {
        startX:0, startY:0, currentX:0, currentY:0
    };
    @observable dragging = false;

    @autobind
    private thickLineContainerRef(thickLineContainer:any|null) {
        this.thickLineContainer = thickLineContainer;
    }

    @autobind
    private scaleCallback(scale:VictoryScale) {
        this.scale = scale;
    }

    private makeMouseEvents() {
        return [{
            target: "data",
            eventHandlers: {
                onMouseOver: () => {
                    return [
                        {
                            target: "data",
                            mutation: action((props: any) => {
                                let datum;
                                if (props.datum) {
                                    // mouse over point
                                    datum = props.datum;
                                    this.tooltipOnPoint = true;
                                } else if (props.data.length > 0) {
                                    // mouse over line
                                    datum = props.data[0];
                                    this.tooltipOnPoint = false;
                                }
                                this.tooltipDatum = datum;
                                this.props.dataStore.setMouseOverMutation(this.tooltipDatum.mutation);
                                return null;
                            })
                        }
                    ];
                },
                onMouseOut: () => {
                    return [
                        {
                            target: "data",
                            mutation: action(() => {
                                this.tooltipDatum = null;
                                this.tooltipOnPoint = false;
                                this.props.dataStore.setMouseOverMutation(null);
                                return null;
                            })
                        }
                    ];
                },
                onClick: ()=> {
                    return [
                        {
                            target: "data",
                            mutation: action((props:any)=>{
                                let datum;
                                if (props.datum) {
                                    // click on point
                                    datum = props.datum;
                                } else if (props.data.length > 0) {
                                    // click on line
                                    datum = props.data[0];
                                }
                                this.props.dataStore.toggleHighlightedMutation(datum.mutation);
                            })
                        }
                    ];
                }
            }
        }];
    }

    @computed get mutations() {
        if (this.props.dataStore.onlyShowHighlightedInVAFChart) {
            return this.props.mutations.filter(m=>this.props.dataStore.isMutationHighlighted(m[0]));
        } else {
            return this.props.mutations;
        }
    }

    @action
    private selectPointsInDragRect() {
        if (this.scale) {
            const points = this.data.grayPoints.concat(_.flatten(this.data.lineData));

            const rectBoundsSvgSpace = {
                x:[Math.min(this.dragRect.startX, this.dragRect.currentX), Math.max(this.dragRect.startX, this.dragRect.currentX)],
                // y inverted because svg y goes top to bottom
                y:[Math.max(this.dragRect.startY, this.dragRect.currentY), Math.min(this.dragRect.startY, this.dragRect.currentY)]
            };

            const rectBoundsDataSpace = {
                x:rectBoundsSvgSpace.x.map(v=>invertIncreasingFunction(this.scale!.x, v)),
                y:rectBoundsSvgSpace.y.map(v=>invertDecreasingFunction(this.scale!.y, v)) // y is decreasing function because svg y goes top to bottom
            };

            const selectedPoints = points.filter(p=>{
                return p.x >= rectBoundsDataSpace.x[0] && p.x <= rectBoundsDataSpace.x[1] &&
                    p.y >= rectBoundsDataSpace.y[0] && p.y <= rectBoundsDataSpace.y[1];
            });

            this.props.dataStore.setHighlightedMutations(selectedPoints.map(p=>p.mutation));
        }
    }

    @autobind
    @action
    private onMouseMove(e:React.MouseEvent<any>) {
        e.persist();
        this.mouseEvent = e;

        if (this.dragging && (e.target as SVGElement).classList.contains(DRAG_COVER_CLASSNAME)) {
            // only update drag coordinates based on SVG events
            const offset = $(e.target).offset()!;
            this.dragRect.currentX = e.pageX - offset.left;
            this.dragRect.currentY = e.pageY - offset.top;
        }
    }

    @autobind
    @action
    private onMouseDown(e:React.MouseEvent<any>) {
        if ((e.target as SVGElement).nodeName.toLowerCase() === "svg") {
            // start drag if clicking on background
            this.dragging = true;

            const offset = $(e.target).offset()!;
            this.dragRect.startX = e.pageX - offset.left;
            this.dragRect.startY = e.pageY - offset.top;
            this.dragRect.currentX = this.dragRect.startX;
            this.dragRect.currentY = this.dragRect.startY;
        }
    }

    @autobind
    @action
    private onMouseUp(e:React.MouseEvent<any>) {
        // finish drag
        if (this.dragging) {
            this.dragging = false;

            this.selectPointsInDragRect();
        }
    }

    @computed get chartWidth() {
        return Math.min(
            this.props.samples.length * 100 + 100,
            WindowStore.size.width - 100
        );
    }

    @computed get chartHeight() {
        return 300;
    }

    @computed get svgWidth() {
        return this.chartWidth + 35; // give room for labels
    }

    @computed get svgHeight() {
        return this.chartHeight + 35; // give room for labels
    }

    @computed get sampleIdOrder() {
        let order:string[];
        if (this.props.sampleManager) {
            order = this.props.sampleManager.getSampleIdsInOrder();
        } else {
            order = this.props.samples.map(s=>s.sampleId);
        }
        return order;
    }

    @computed get sampleIdIndex() {
        return stringListToIndexSet(this.sampleIdOrder);
    }

    @computed get data() {

        const grayPoints:IPoint[] = [];
        const lineData:IPoint[][] = [];
        const dataPoints:IPoint[] = [];

        for (const mergedMutation of this.mutations) {
            // determine data points in line for this mutation

            // first add data points for each mutation
            let thisLineData:Partial<IPoint>[] = [];
            // keep track of which samples have mutations
            const samplesWithData:{[uniqueSampleKey:string]:boolean} = {};
            for (const mutation of mergedMutation) {
                const sampleKey = mutation.uniqueSampleKey;
                const sampleId = mutation.sampleId;
                const vaf = getVariantAlleleFrequency(mutation);
                if (vaf !== null) {
                    // has VAF data

                    if (mutation.mutationStatus.toLowerCase() === "uncalled") {
                        if (mutation.tumorAltCount > 0) {
                            // add point for uncalled mutation with supporting reads
                            thisLineData.push({
                                x: this.sampleIdIndex[sampleId],
                                y: vaf,
                                sampleId,
                                mutation,
                                mutationStatus: MutationStatus.PROFILED_WITH_READS_BUT_UNCALLED
                            });
                            samplesWithData[sampleKey] = true;
                        }
                    } else {
                        // add point for called mutation with VAF data
                        thisLineData.push({
                            x: this.sampleIdIndex[sampleId],
                            y: vaf,
                            sampleId,
                            mutation,
                            mutationStatus: MutationStatus.MUTATED_WITH_VAF
                        });
                        samplesWithData[sampleKey] = true;
                    }
                } else {
                    // no VAF data - add point which will be extrapolated
                    thisLineData.push({
                        x: this.sampleIdIndex[sampleId],
                        sampleId, mutation,
                        mutationStatus: MutationStatus.MUTATED_BUT_NO_VAF,
                    });
                    samplesWithData[sampleKey] = true;
                }
            }

            const mutation = mergedMutation[0];
            // add data points for samples without mutations
            for (const sample of this.props.samples) {
                if (!(sample.uniqueSampleKey in samplesWithData)) {
                    if (!isSampleProfiled(
                        sample.uniqueSampleKey,
                        this.props.mutationProfileId,
                        mutation.gene.hugoGeneSymbol,
                        this.props.coverageInformation
                    )) {
                        // not profiled
                        thisLineData.push({
                            x: this.sampleIdIndex[sample.sampleId],
                            sampleId: sample.sampleId, mutation,
                            mutationStatus: MutationStatus.NOT_PROFILED,
                        });
                    } else {
                        thisLineData.push({
                            x: this.sampleIdIndex[sample.sampleId],
                            y: 0,
                            sampleId: sample.sampleId, mutation,
                            mutationStatus: MutationStatus.PROFILED_BUT_NOT_MUTATED,
                        });
                    }
                }
            }
            // sort by sample order
            thisLineData = _.sortBy(thisLineData, d=>d.x);
            // interpolate missing y values
            // take out anything from the left and right that dont have data - we'll only interpolate points with data to their left and right
            while (thisLineData.length > 0 && !isPointFoundedOnRealVAF(thisLineData[0] as IPoint)) {
                thisLineData.shift();
            }
            while (thisLineData.length > 0 && !isPointFoundedOnRealVAF(thisLineData[thisLineData.length-1] as IPoint)) {
                thisLineData.pop();
            }
            if (thisLineData.length === 0) {
                // skip this mutation if theres no line data left to plot
                continue;
            }
            // interpolate, and pull out interpolated points into gray points array
            const thisLineDataWithoutGrayPoints:IPoint[] = [];
            const thisGrayPoints:IPoint[] = [];
            for (let i=0; i<thisLineData.length; i++) {
                if (i !== 0 && i !== thisLineData.length-1 && thisLineData[i].y === undefined) {
                    // find closest defined data to the left and right
                    let leftIndex = 0, rightIndex = 0;
                    for (leftIndex=i; leftIndex>=0; leftIndex--) {
                        if (thisLineData[leftIndex].y !== undefined) {
                            break;
                        }
                    }
                    for (rightIndex=i; rightIndex<=thisLineData.length-1; rightIndex++) {
                        if (thisLineData[rightIndex].y !== undefined) {
                            break;
                        }
                    }
                    const step = 1/(rightIndex - leftIndex);
                    thisLineData[i].y = (i-leftIndex)*step*(thisLineData[leftIndex].y! + thisLineData[rightIndex].y!);
                    // add to grayPoints
                    thisGrayPoints.push(thisLineData[i] as IPoint);
                } else {
                    thisLineDataWithoutGrayPoints.push(thisLineData[i] as IPoint);
                }
            }
            // we know thisLineDataWithoutGrayPoints is nonempty because it could only be empty if every point in
            //  it was gray, in which case it would have been made empty and skipped above.
            grayPoints.push(...thisGrayPoints);
            dataPoints.push(...thisLineDataWithoutGrayPoints);

            // only add line if it has more than 1 point
            if (thisLineDataWithoutGrayPoints.length > 1) {
                lineData.push(thisLineDataWithoutGrayPoints);
            }
        }
        return {
            lineData,
            dataPoints,
            grayPoints,
        };
    }

    @computed get mutationToLineData() {
        const map = new ComplexKeyMap<IPoint[]>();
        for (const lineData of this.data.lineData) {
            map.set({
                hugoGeneSymbol: lineData[0].mutation.gene.hugoGeneSymbol,
                proteinChange: lineData[0].mutation.proteinChange
            }, lineData);
        }
        return map;
    }

    private tooltipFunction(datum: any) {
        return mutationTooltip(
            datum.mutation,
            this.tooltipOnPoint ? {
                mutationStatus: datum.mutationStatus,
                sampleId: datum.sampleId,
                vaf: datum.y
            } : undefined
        );
    }

    @autobind
    private getTooltipComponent() {
        if (!this.tooltipDatum || !this.mouseEvent) {
            return <span/>;
        } else {
            let tooltipPlacement = (this.mouseEvent.clientY < 250 ? "bottom" : "top");
            return (
                <Portal isOpened={true} node={document.body}>
                    <Popover
                        className={classnames("cbioportal-frontend", "cbioTooltip", survivalStyles.Tooltip, styles.Tooltip)}
                        positionLeft={this.mouseEvent.pageX}
                        positionTop={this.mouseEvent.pageY+(tooltipPlacement === "top" ? -7 : 7)}
                        style={{
                            transform: (tooltipPlacement === "top" ? "translate(-50%,-100%)" : "translate(-50%,0%)"),
                            maxWidth:400
                        }}
                        placement={tooltipPlacement}
                    >
                        {this.tooltipFunction(this.tooltipDatum)}
                    </Popover>
                </Portal>
            );
        }
    }

    @autobind
    private getThickLines() {
        const highlightedMutations = [];
        if (!this.props.dataStore.onlyShowHighlightedInVAFChart) {
            // dont bold highlighted mutations if we're only showing highlighted mutations
            highlightedMutations.push(...this.props.dataStore.highlightedMutations);
        }
        const mouseOverMutation = this.props.dataStore.getMouseOverMutation();
        if (mouseOverMutation) {
            highlightedMutations.push(mouseOverMutation);
        }
        if (highlightedMutations.length > 0 && this.scale !== null && this.thickLineContainer !== null) {
            return highlightedMutations.map(highlightedMutation=>{
                const points = this.mutationToLineData.get({
                    proteinChange: highlightedMutation.proteinChange,
                    hugoGeneSymbol: highlightedMutation.gene.hugoGeneSymbol
                });
                if (!points) {
                    return <g/>
                }

                let d = `M ${this.scale!.x(points[0].x)} ${this.scale!.y(this.y(points[0]))}`;
                for (let i=1; i<points.length; i++) {
                    d = `${d} L ${this.scale!.x(points[i].x)} ${this.scale!.y(this.y(points[i]))}`;
                }
                return (
                    <Portal isOpened={true} node={this.thickLineContainer}>
                        <path
                            style={{ stroke:"#318ec4", strokeOpacity:1, strokeWidth:THICK_LINE_STROKE_WIDTH, fillOpacity:0, pointerEvents:"none"}}
                            d={d}
                        />
                    </Portal>
                );
            });
        } else {
            return <g/>;
        }
    }

    @autobind
    private getDragRect() {
        if (this.dragging) {
            const x = Math.min(this.dragRect.startX, this.dragRect.currentX);
            const y = Math.min(this.dragRect.startY, this.dragRect.currentY);
            const width = Math.abs(this.dragRect.startX - this.dragRect.currentX);
            const height = Math.abs(this.dragRect.startY - this.dragRect.currentY);

            return ([
                <rect
                    fill="black"
                    fillOpacity="0"
                    x={0}
                    y={0}
                    width={this.svgWidth}
                    height={this.svgHeight}
                    className={DRAG_COVER_CLASSNAME}
                />, // cover svg so text doesnt get selected during drag
                <rect
                    style={{"pointerEvents":"none"}}
                    fill="red"
                    fillOpacity="0.5"
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                />
            ]);
        } else {
            return <g/>;
        }
    }

    @autobind
    private y(d:IPoint) {
        if (this.props.logScale) {
            return Math.log10(Math.max(MIN_LOG_ARG, d.y));
        } else {
            return d.y;
        }
    }

    @computed get yDomain() {
        if (this.props.logScale) {
            return [Math.log10(MIN_LOG_ARG), Math.log10(1)];
        } else {
            return [0, 1];
        }
    }

    @autobind
    private tickFormatY(t:number, tickIndex:number) {
        if (this.props.logScale) {
            const realValue = Math.pow(10, t);
            if (tickIndex === 0) {
                // bottom tick - show less-than-or-equal sign
                return `≤ ${realValue}`;
            } else {
                return realValue;
            }
        } else {
            return t;
        }
    }

    render() {
        if (this.data.lineData.length > 0 || this.data.dataPoints.length > 0) {
            return (
                <>
                    <svg
                        ref={this.props.svgRef}
                        style={{
                            width: this.svgWidth,
                            height: this.svgHeight,
                            pointerEvents: "all"
                        }}
                        height={this.svgHeight}
                        width={this.svgWidth}
                        role="img"
                        viewBox={`0 0 ${this.svgWidth} ${this.svgHeight}`}
                        onMouseMove={this.onMouseMove}
                        onMouseDown={this.onMouseDown}
                        onMouseUp={this.onMouseUp}
                    >
                        <VictoryChart
                            theme={CBIOPORTAL_VICTORY_THEME}
                            standalone={false}
                            domain={{ y: this.yDomain }}
                            width={this.chartWidth}
                            height={this.chartHeight}
                            domainPadding={20}
                            singleQuadrantDomainPadding={false}
                            style={{
                                parent:{
                                    backgroundColor:"white"
                                }
                            }}
                        >
                            <VictoryAxis
                                dependentAxis
                                label="Allele Freq"
                                axisLabelComponent={<VictoryLabel dy={-28}/>}
                                crossAxis={false}
                                offsetX={50}
                                tickFormat={this.tickFormatY}
                            />
                            <VictoryAxis
                                style={{
                                    grid: {
                                        strokeOpacity: (t:number, i:number)=>{ return i === 0 ? 0 : 1; },
                                    }
                                }}
                                tickValues={this.props.samples.map((s,i)=>i)}
                                tickLabelComponent={
                                    <Tick
                                        sampleIdOrder={this.sampleIdOrder}
                                        sampleManager={this.props.sampleManager}
                                    />
                                }
                                crossAxis={false}
                                offsetY={50}
                            />
                            {this.data.lineData.map(dataForSingleLine=>
                                [
                                    <VictoryLine
                                        style={{
                                            data: { stroke: LINE_COLOR, strokeOpacity:0.5, pointerEvents:"none" }
                                        }}
                                        data={dataForSingleLine}
                                        y={this.y}
                                    />,
                                    <VictoryLine
                                        style={{
                                            data: { strokeOpacity:0, pointerEvents:"stroke", strokeWidth:THICK_LINE_STROKE_WIDTH }
                                        }}
                                        data={dataForSingleLine}
                                        events={this.mouseEvents}
                                        y={this.y}
                                    />
                                ]
                            )}
                            <ScaleCapturer scaleCallback={this.scaleCallback}/>
                            <g ref={this.thickLineContainerRef}/> {/*We put this container here so that the highlight layers properly with other elements*/}
                            { this.data.grayPoints.length > 0 && (
                                <VictoryScatter
                                    style={{
                                        data: {
                                            stroke:"gray",
                                            fill:"white",
                                            strokeWidth:2
                                        }
                                    }}
                                    size={2.5}
                                    data={this.data.grayPoints}
                                    events={this.mouseEvents}
                                    y={this.y}
                                />
                            )}
                            { this.data.dataPoints.length > 0 && (
                                <VictoryScatter
                                    style={{
                                        data: {
                                            stroke:LINE_COLOR,
                                            fill:"white",
                                            strokeWidth:2
                                        }
                                    }}
                                    size={3}
                                    data={this.data.dataPoints}
                                    events={this.mouseEvents}
                                    y={this.y}
                                />
                            )}
                        </VictoryChart>
                        <Observer>
                            {this.getThickLines}
                        </Observer>
                        <Observer>
                            {this.getDragRect}
                        </Observer>
                    </svg>
                    <Observer>
                        {this.getTooltipComponent}
                    </Observer>
                </>
            );
        } else {
            return (
                <div style={{
                    display:"flex",
                    justifyContent:"center",
                    alignItems:"center",
                    height:this.svgHeight,
                    width:"100%"
                }}>
                    No VAF data to show.
                </div>
            );
        }
    }
}