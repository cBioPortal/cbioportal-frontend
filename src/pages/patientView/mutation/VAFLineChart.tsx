import * as React from "react";
import {Observer, observer} from "mobx-react";
import {VictoryAxis, VictoryChart, VictoryLabel, VictoryLine, VictoryScatter} from "victory";
import CBIOPORTAL_VICTORY_THEME from "../../../shared/theme/cBioPoralTheme";
import {computed, observable} from "mobx";
import {Mutation, Sample} from "../../../shared/api/generated/CBioPortalAPI";
import {stringListToIndexSet} from "../../../public-lib";
import _ from "lodash";
import {getVariantAlleleFrequency} from "../../../shared/lib/MutationUtils";
import WindowStore from "../../../shared/components/window/WindowStore";
import TruncatedTextWithTooltipSVG from "../../../shared/components/TruncatedTextWithTooltipSVG";
import {Popover} from "react-bootstrap";
import classnames from "classnames";
import styles from "../../resultsView/survival/styles.module.scss";
import autobind from "autobind-decorator";
import {Portal} from "react-portal";
import {CoverageInformation} from "../../resultsView/ResultsViewPageStoreUtils";
import {isSampleProfiled} from "../../../shared/lib/isSampleProfiled";
import SampleLabelSVG from "../../../shared/components/sampleLabel/SampleLabel";
import SampleManager from "../sampleManager";
import PatientViewMutationsDataStore from "./PatientViewMutationsDataStore";
import ComplexKeyMap from "../../../shared/lib/complexKeyDataStructures/ComplexKeyMap";

export interface IVAFLineChartProps {
    mutations:Mutation[][];
    samples:Sample[];
    coverageInformation:CoverageInformation;
    mutationProfileId:string;
    sampleManager:SampleManager|null;
    dataStore:PatientViewMutationsDataStore;
}

enum NoMutationReason {
    NO_VAF_DATA="NO_VAF_DATA",
    NOT_SEQUENCED="NOT_SEQUENCED",
    NOT_MUTATED="NOT_MUTATED"
}

interface IPoint {
    x:number,
    y:number,
    sampleId:string,
    proteinChange:string,
    hugoGeneSymbol:string,
    lineData:IPoint[],

    noMutationReason?:NoMutationReason
}

const LINE_COLOR = "#c43a31";
const THICK_LINE_STROKE_WIDTH = 6;

class ScaleCapturer extends React.Component<any, any>{
    render() {
        this.props.scaleCallback(this.props.scale);

        return <g/>;
    }
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
                            mutation: (props: any) => {
                                if (props.datum) {
                                    this.tooltipDatum = props.datum;
                                    this.tooltipOnPoint = true;
                                } else if (props.data.length > 0) {
                                    this.tooltipDatum = props.data[0];
                                    this.tooltipOnPoint = false;
                                }
                                this.props.dataStore.setHighlightModel({
                                    proteinChange:this.tooltipDatum.proteinChange,
                                    hugoGeneSymbol: this.tooltipDatum.hugoGeneSymbol
                                });
                                return null;
                            }
                        }
                    ];
                },
                onMouseOut: () => {
                    return [
                        {
                            target: "data",
                            mutation: () => {
                                this.tooltipDatum = null;
                                this.tooltipOnPoint = false;
                                this.props.dataStore.setHighlightModel(null);
                                return null;
                            }
                        }
                    ];
                },
            }
        }];
    }

    @autobind private onMouseMove(e:React.MouseEvent<any>) {
        e.persist();
        this.mouseEvent = e;
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

        for (const mergedMutation of this.props.mutations) {
            // determine data points in line for this mutation

            const proteinChange = mergedMutation[0].proteinChange;
            const hugoGeneSymbol = mergedMutation[0].gene.hugoGeneSymbol;

            // first add data points for each mutation
            let thisLineData:Partial<IPoint>[] = [];
            // keep track of which samples have mutations
            const samplesWithData:{[uniqueSampleKey:string]:boolean} = {};
            for (const mutation of mergedMutation) {
                const sampleKey = mutation.uniqueSampleKey;
                samplesWithData[sampleKey] = true;
                const sampleId = mutation.sampleId;
                const vaf = getVariantAlleleFrequency(mutation);
                if (vaf !== null) {
                    // has VAF data - add real point
                    thisLineData.push({
                        x: this.sampleIdIndex[sampleId],
                        y: vaf,
                        sampleId,
                        proteinChange,
                        hugoGeneSymbol,
                        lineData:[]
                    });
                } else {
                    // no VAF data - add point which will be extrapolated
                    thisLineData.push({
                        x: this.sampleIdIndex[sampleId],
                        sampleId, proteinChange, hugoGeneSymbol,
                        noMutationReason: NoMutationReason.NO_VAF_DATA,
                        lineData:[]
                    });
                }
            }
            // add data points for samples without mutations
            for (const sample of this.props.samples) {
                if (!(sample.uniqueSampleKey in samplesWithData)) {
                    if (!isSampleProfiled(
                        sample.uniqueSampleKey,
                        this.props.mutationProfileId,
                        hugoGeneSymbol,
                        this.props.coverageInformation
                    )) {
                        // not profiled
                        thisLineData.push({
                            x: this.sampleIdIndex[sample.sampleId],
                            sampleId: sample.sampleId, proteinChange, hugoGeneSymbol,
                            noMutationReason: NoMutationReason.NOT_SEQUENCED,
                            lineData:[]
                        });
                    } else {
                        thisLineData.push({
                            x: this.sampleIdIndex[sample.sampleId],
                            y: 0,
                            sampleId: sample.sampleId, proteinChange, hugoGeneSymbol,
                            noMutationReason: NoMutationReason.NOT_MUTATED,
                            lineData:[]
                        });
                    }
                }
            }
            // sort by sample order
            thisLineData = _.sortBy(thisLineData, d=>d.x);
            // interpolate missing y values
            // take out anything from the left and right that dont have data - we'll only interpolate points with data to their left and right
            while (thisLineData.length > 0 && thisLineData[0].y === undefined) {
                thisLineData.shift();
            }
            while (thisLineData.length > 0 && thisLineData[thisLineData.length-1].y === undefined) {
                thisLineData.pop();
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
            // add copy of line data for hover effect
            for (const point of thisGrayPoints) {
                point.lineData = thisLineDataWithoutGrayPoints;
            }
            for (const point of thisLineDataWithoutGrayPoints) {
                point.lineData = thisLineDataWithoutGrayPoints;
            }
            grayPoints.push(...thisGrayPoints);
            lineData.push(thisLineDataWithoutGrayPoints);
        }
        return { lineData, grayPoints};
    }

    @computed get mutationToLineData() {
        const map = new ComplexKeyMap<IPoint[]>();
        for (const lineData of this.data.lineData) {
            map.set({
                hugoGeneSymbol: lineData[0].hugoGeneSymbol,
                proteinChange: lineData[0].proteinChange
            }, lineData);
        }
        return map;
    }

    private tooltipFunction(datum: any) {
        let sampleSpecificSection:any = null;
        if (this.tooltipOnPoint) {
            // show tooltip when hovering a point
            let vafExplanation:string;
            if (datum.noMutationReason === undefined) {
                vafExplanation = `VAF: ${datum.y.toFixed(2)}`;
            } else {
                switch (datum.noMutationReason) {
                    case NoMutationReason.NO_VAF_DATA:
                        vafExplanation = `Mutated, but we don't have VAF data.`;
                        break;
                    case NoMutationReason.NOT_MUTATED:
                        vafExplanation = `Not mutated (VAF: 0)`;
                        break;
                    case NoMutationReason.NOT_SEQUENCED:
                    default:
                        vafExplanation = `${datum.sampleId} is not sequenced for ${datum.hugoGeneSymbol} mutations.`;
                        break;
                }
            }
            sampleSpecificSection = (
                <>
                    <span>Sample ID: {datum.sampleId}</span><br/>
                    <span>{vafExplanation}</span>
                </>
            );
        }
        return (
            <div>
                <span>Gene: {datum.hugoGeneSymbol}</span><br/>
                <span>Protein Change: {datum.proteinChange}</span><br/>
                {sampleSpecificSection}
            </div>
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
                        className={classnames("cbioportal-frontend", "cbioTooltip", styles.Tooltip)}
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
    private getThickLine() {
        if (this.props.dataStore.getHighlightModel() !== null && this.scale !== null && this.thickLineContainer !== null) {
            const points = this.mutationToLineData.get(
                this.props.dataStore.getHighlightModel()!, ["proteinChange","hugoGeneSymbol"]
            );
            if (!points) {
                return <g/>
            }

            let d = `M ${this.scale.x(points[0].x)} ${this.scale.y(points[0].y)}`;
            for (let i=1; i<points.length; i++) {
                d = `${d} L ${this.scale.x(points[i].x)} ${this.scale.y(points[i].y)}`;
            }
            return (
                <Portal isOpened={true} node={this.thickLineContainer}>
                    <path
                        style={{ stroke:"#318ec4", strokeOpacity:1, strokeWidth:THICK_LINE_STROKE_WIDTH, fillOpacity:0, pointerEvents:"none"}}
                        d={d}
                    />
                </Portal>
            );
        } else {
            return <g/>;
        }
    }

    render() {
        if (this.data.lineData.length > 0) {
            return (
                <>
                    <svg
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
                    >
                        <VictoryChart
                            theme={CBIOPORTAL_VICTORY_THEME}
                            standalone={false}
                            domain={{ y: [0, 1] }}
                            width={this.chartWidth}
                            height={this.chartHeight}
                        >
                            <VictoryAxis
                                dependentAxis
                                label="Allele Freq"
                                axisLabelComponent={<VictoryLabel dy={-28}/>}
                            />
                            <VictoryAxis
                                style={{
                                    grid: {
                                        strokeOpacity: (t:number, i:number)=>{ return i === 0 ? 0 : 1; },
                                    }
                                }}
                                tickValues={this.props.samples.map((s,i)=>i)}
                                tickLabelComponent={
                                    <Tick sampleIdOrder={this.sampleIdOrder} sampleManager={this.props.sampleManager}/>
                                }
                            />
                            {this.data.lineData.map(dataForSingleLine=>
                                [
                                    <VictoryLine
                                        style={{
                                            data: { stroke: LINE_COLOR, strokeOpacity:0.5, pointerEvents:"none" }
                                        }}
                                        data={dataForSingleLine}
                                    />,
                                    <VictoryLine
                                        style={{
                                            data: { strokeOpacity:0, pointerEvents:"stroke", strokeWidth:THICK_LINE_STROKE_WIDTH }
                                        }}
                                        data={dataForSingleLine}
                                        events={this.mouseEvents}
                                    />
                                ]
                            )}
                            <ScaleCapturer scaleCallback={this.scaleCallback}/>
                            <g ref={this.thickLineContainerRef}/>
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
                            />
                            <VictoryScatter
                                style={{
                                    data: {
                                        stroke:LINE_COLOR,
                                        fill:"white",
                                        strokeWidth:2
                                    }
                                }}
                                size={3}
                                data={_.flatten(this.data.lineData)}
                                events={this.mouseEvents}
                            />
                        </VictoryChart>
                        <Observer>
                            {this.getThickLine}
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
                    No mutations selected.
                </div>
            );
        }
    }
}