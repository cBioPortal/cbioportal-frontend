import * as React from 'react';
import * as _ from 'lodash';
import {observer} from "mobx-react";
import './styles.scss';
import {CancerStudy, Gene, NumericGeneMolecularData, Mutation} from "../../../shared/api/generated/CBioPortalAPI";
import {computed, observable} from "mobx";
import getCanonicalMutationType from "../../../shared/lib/getCanonicalMutationType";
import {ExpressionStyle, ExpressionStyleSheet} from "./expressionHelpers";
import {Modal} from "react-bootstrap";
import autobind from "autobind-decorator";
import { VictoryBoxPlot, VictoryChart, VictoryAxis,
    VictoryLabel,  VictoryContainer, VictoryPie, VictoryScatter, VictoryLegend } from 'victory';
import CBIOPORTAL_VICTORY_THEME from "../../../shared/theme/cBioPoralTheme";
import {BoxPlotModel, calculateBoxPlotModel} from "../../../shared/lib/boxPlotUtils";
import d3 from 'd3';
import {ITooltipModel} from "../../../shared/model/ITooltipModel";


interface ExpressionWrapperProps {

    studyMap:{[studyId:string]:CancerStudy};
    genes:Gene[];
    data:{[hugeGeneSymbol:string]:NumericGeneMolecularData[][]};
    mutations:Mutation[];

}

interface MolecularDataBuckets {
    mutationBuckets: { [mutationType:string]:NumericGeneMolecularData[] };
    unmutatedBucket: NumericGeneMolecularData[]
};

const JITTER_VALUE = 0.4;

const BOX_WIDTH = 100;

const ZERO_EXPRESSION = -2;

const SAMPLE_STYLE_BASE = {
    size: 6,
    line: {color: "#B40404", width: 1.2}
};

const logger = (num:number)=>{
    return Math.log(num)/Math.log(2);
};

const BOX_STYLES ={
    min: { stroke: "#999999" },
    max: { stroke: "#999999" },
    q1: { fill: "#eeeeee" },
    q3: { fill: "#eeeeee" },
    median: { stroke: "#999999", strokeWidth: 1 },
};

function getMolecularDataBuckets(studyData:NumericGeneMolecularData[],
                                 showMutations:boolean,
                                 mutationsKeyedBySampleId:{ [sampleId:string]:Mutation }){


    // if mutation mode is on, we want to fill buckets by mutation type (or unmutated)
    const mutationModeInteratee = (memo:MolecularDataBuckets , molecularData:NumericGeneMolecularData)=>{
        const mutation = mutationsKeyedBySampleId[molecularData.uniqueSampleKey];
        if (mutation) {
            const canonicalMutationType = getCanonicalMutationType(mutation.mutationType) || "other";
            const bucket = memo.mutationBuckets[canonicalMutationType] = memo.mutationBuckets[canonicalMutationType] || [];
            bucket.push(molecularData);
        } else {
            memo.unmutatedBucket.push(molecularData);
        }
        return memo;
    };

    // if mutation mode is off, we don't care about mutation state
    const noMutationModeIteratee = (memo:MolecularDataBuckets, molecularData:NumericGeneMolecularData)=>{
        memo.unmutatedBucket.push(molecularData);
        return memo;
    };

    const iteratee = (showMutations) ? mutationModeInteratee : noMutationModeIteratee;

    // populate buckets using iteratee
    const buckets = studyData.reduce(iteratee, { mutationBuckets:{}, unmutatedBucket:[] });

    return buckets;

}

export type ScatterPoint = { x:number, y:NumericGeneMolecularData };

type SortOptions = "alphabetic" | "median";

function findMedian(_input_data:number[]) {
    var m = _.orderBy(_input_data);
    var middle = Math.floor((m.length - 1) / 2); // NB: operator precedence
    if (m.length % 2) {
        return m[middle];
    } else {
        return (m[middle] + m[middle + 1]) / 2.0;
    }
}

function getJitter(){
    return (Math.random() * JITTER_VALUE - JITTER_VALUE / 2);
}

@observer
export default class ExpressionWrapper extends React.Component<ExpressionWrapperProps, {}> {

    constructor(props:ExpressionWrapperProps) {
        super();
        this.selectedGene = props.genes[0].hugoGeneSymbol;
        this.selectedStudies = _.mapValues(props.studyMap,()=>true);

        (window as any).box = this;
    }

    svgContainer:SVGAElement;

    @observable.ref tooltipModel: ITooltipModel<{studyName:string;sampleId:string;expression:number}> | null = null;

    @observable selectedGene:string;

    @observable studySelectorModalVisible = false;

    @observable showMutations:boolean = true;

    @observable selectedStudies: { [studyId:string]:boolean } = {};

    @observable logScale = true;

    @observable sortBy: SortOptions = "alphabetic";

    @computed get filteredData(){
        // filter for selected studies
        return _.filter(this.props.data[this.selectedGene], (data:NumericGeneMolecularData[])=>this.selectedStudies[data[0].studyId] === true);
    }

    @computed get sortedData() {
        if (this.sortBy === "alphabetic") {
            return _.sortBy(this.filteredData, [
                (data:NumericGeneMolecularData[])=>{
                    return this.props.studyMap[data[0].studyId].shortName
                }]
            );
        } else {
            return _.sortBy(this.filteredData, [(data:NumericGeneMolecularData[])=>{
                return findMedian(data.map((molecularData:NumericGeneMolecularData)=>molecularData.value));
            }]);
        }
    }

    @computed get sortedLabels(){

        return _.map(this.sortedData,(data:NumericGeneMolecularData[])=>{
            return this.props.studyMap[data[0].studyId].shortName;
        });

    }

    @computed get mutationsKeyedBySampleId(){
        return _.keyBy(this.props.mutations,(mutation:Mutation)=>mutation.uniqueSampleKey);
    }

    @computed get victoryTraces(){

        const boxTraces: Partial<BoxPlotModel>[] = [];
        const mutationScatterTraces: { [key:string]:ScatterPoint[] }[] = [];
        const unMutatedTraces: ScatterPoint[][] = [];

        const handleZero = (num:number)=>(num === 0) ? 0.25 : num;

        // if we are in log mode, compute log of value
        const dataTransformer = (molecularData:NumericGeneMolecularData)=>
            (this.logScale ? handleZero(molecularData.value) : molecularData.value);

        const sortedData = this.sortedData;
        for (let i = 0; i < sortedData.length; i++) {
            const studyData = sortedData[i];
            const boxData = calculateBoxPlotModel(studyData.map(dataTransformer));

            // *IMPORTANT* because Victory does not handle outliers,
            // we are overriding meaning of min and max in order to show whiskers
            // at quartile +/-IQL * 1.5 instead of true max/min

            boxTraces.push({
                min: boxData.whiskerLower, // see above
                median: boxData.median, // see above
                max: boxData.whiskerUpper,
                q1: boxData.q1,
                q3: boxData.q3,
                x: i,
            });

            const buckets = getMolecularDataBuckets(studyData, this.showMutations, this.mutationsKeyedBySampleId);

            const mutationTraces = _.mapValues(buckets.mutationBuckets,(molecularData:NumericGeneMolecularData[],canonicalMutationType:string)=>{
                return molecularData.map((datum)=>{
                    return { y:datum, x:i + getJitter()  }
                });
            });

            mutationScatterTraces.push(mutationTraces);

            if (buckets.unmutatedBucket.length > 0) {
                const unmutated = buckets.unmutatedBucket.map((datum:NumericGeneMolecularData)=>{
                    return { y:datum, x:i + getJitter() }
                });
                unMutatedTraces.push(unmutated);
            }

        }

        // this.sortedData.forEach((studyData)=>{
        //
        //     //const boxData = studyData.map(dataTransformer);
        //
        //     const boxData = calculateBoxPlotModel(studyData.map(dataTransformer));
        //
        //     // *IMPORTANT* because Victory does not handle outliers,
        //     // we are overriding meaning of min and max in order to show whiskers
        //     // at quartile +/-IQL * 1.5 instead of true max/min
        //
        //     boxTraces.push({
        //         min: boxData.whiskerLower, // see above
        //         median: boxData.median, // see above
        //         max: boxData.whiskerUpper,
        //         q1: boxData.q1,
        //         q3: boxData.q3,
        //         x: i,
        //     });
        //
        //     const buckets = getMolecularDataBuckets(studyData, this.showMutations, this.mutationsKeyedBySampleId);
        //
        //     const mutationTraces = _.mapValues(buckets.mutationBuckets,(molecularData:NumericGeneMolecularData[],canonicalMutationType:string)=>{
        //         return molecularData.map((datum)=>{
        //             return { y:datum, x:studyIndex + getJitter()  }
        //         });
        //     });
        //
        //     mutationScatterTraces.push(mutationTraces);
        //
        //     if (buckets.unmutatedBucket.length > 0) {
        //         const unmutated = buckets.unmutatedBucket.map((datum:NumericGeneMolecularData)=>{
        //             return { y:datum, x:studyIndex + getJitter() }
        //         });
        //         unMutatedTraces.push(unmutated);
        //     }
        //
        //     studyIndex++;
        //
        // });

        return { boxTraces, mutationScatterTraces, unMutatedTraces };

    }

    @autobind
    handleStudySelection(event:React.SyntheticEvent<HTMLInputElement>){
        // toggle state of it
        this.selectedStudies[event.currentTarget.value] = !this.selectedStudies[event.currentTarget.value];
    }

    studySelectionModal(){

        return (<Modal show={this.studySelectorModalVisible} onHide={()=>{this.studySelectorModalVisible = false}} className="cbioportal-frontend">
            <Modal.Header closeButton>
                <Modal.Title>Select Studies</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div>
                    {
                        _.map(this.props.studyMap,(study:CancerStudy)=>{
                            return (
                                <div className="checkbox">
                                    <label>
                                        <input type="checkbox"
                                               checked={this.selectedStudies[study.studyId] === true}
                                               value={study.studyId}
                                               onChange={this.handleStudySelection} />
                                        {study.name}
                                    </label>
                                </div>
                            )
                        })
                    }
                </div>
            </Modal.Body>
        </Modal>)

    }

    // the keys of the scatter traces will ALWAYS be canonycal mutation types
    @computed get mutationTypesPresent(){
        const mutationTypes = _.flatMap(this.victoryTraces.mutationScatterTraces,(blah:any)=>{
            return _.keys(blah);
        });
        return _.uniq(mutationTypes);
    }

    @computed get legendData(){
        const legendData = this.mutationTypesPresent.map((mutationType:string)=>{
            const style = ExpressionStyleSheet[mutationType];
            return { name: style.legendText, symbol: { fill: style.fill, type: style.symbol } }
        });
        //legendData.push(Expre);
        return legendData;
    }

    @autobind hideTooltip(){
        this.tooltipModel = null;
    }

    @autobind makeTooltip(props:any){

        const geneMolecularData: NumericGeneMolecularData = props.datum.y;

        this.tooltipModel = {
            x:props.x + 20,
            y:props.y - 18,
            data:{
                studyName:this.props.studyMap[geneMolecularData.studyId].name,
                sampleId:geneMolecularData.sampleId,
                expression:geneMolecularData.value
            }
        };

    }

    @computed get toolTip(){

        return (
            <div className="popover right"
                 onMouseLeave={()=>this.hideTooltip()}
                 style={{display:'block', position:'absolute', top:this.tooltipModel!.y, width:500, left:this.tooltipModel!.x}}
            >
                <div className="arrow" style={{top:30}}></div>
                <div className="popover-content">
                    <strong>Study:</strong> { this.tooltipModel!.data.studyName }<br />
                    <strong>Sample ID:</strong> { this.tooltipModel!.data.sampleId }<br />
                    <strong>Expression:</strong> { this.tooltipModel!.data.expression }
                </div>
            </div>

        )

    }

    buildScatter(data:ScatterPoint[], style: ExpressionStyle){

        return <VictoryScatter
            style={{ data: { fill: style.fill, stroke:"#666666", strokeWidth: 1 } }}
            symbol={style.symbol}
            events={[{
                target: "data",
                eventHandlers: {
                    onMouseOver: () => {
                        return [
                            {
                                target: "data",
                                mutation: this.makeTooltip
                            }
                        ];
                    },
                    onMouseLeave: () => {
                        return [
                            {
                                target: "data",
                                mutation: this.hideTooltip
                            }
                        ];
                    }
                }
            }]}
            y={(datum:{ y:NumericGeneMolecularData })=>{
                return datum.y.value;
            }}
            x={(item:ScatterPoint)=>item.x+1}
            size={3}
            data={data}
        />

    }


    @computed get buildUnmutatedTraces(){
        return this.victoryTraces.unMutatedTraces.map((trace)=>this.buildScatter(trace, ExpressionStyleSheet.non_mut))
    }

    @computed get buildMutationScatters(){

        return _.flatMap(this.victoryTraces.mutationScatterTraces,(blah:any)=>{
            return _.map(blah,(value:any,key)=>{
                // mutation types (keys) have been canonicalized, so there should always be
                // an entry in ExpressionStyleSheet, but just in case ...
                if (key in ExpressionStyleSheet) {
                    const style = ExpressionStyleSheet[key];
                    return this.buildScatter(value, style);

                } else {
                    return null;
                }
            })
        });

    }

    @computed get width(){
        return this.sortedLabels.length * 150 + 200;
    }

    @observable height = 600;

    @computed get chart(){

        return <VictoryChart
            height={this.height}
            width={this.width}
            theme={CBIOPORTAL_VICTORY_THEME}
            domainPadding={{x:[100,100]}}
            domain={{y: [0.15,100000]}}
            scale={{x: "linear", y: d3.scale.log().base(2) }}
            padding={{bottom:200, left:100, top:100, right:10}}
            containerComponent={<VictoryContainer containerRef={(ref: any) => this.svgContainer = ref} responsive={false}/>}
        >

            <VictoryAxis
                tickFormat={this.sortedLabels}
                tickLabelComponent={
                    <VictoryLabel
                        angle={-85}
                        verticalAnchor="middle"
                        textAnchor="end"
                    />
                }

            />

            <VictoryAxis dependentAxis
                         axisLabelComponent={<VictoryLabel />}
                         tickValues={[-5,0,5,10,15].map((val)=>Math.pow(2,val))}
                         tickFormat={(val:number)=>Math.log2(val)}
            />


            <VictoryBoxPlot
                boxWidth={BOX_WIDTH}
                style={BOX_STYLES}
                data={this.victoryTraces.boxTraces}
                x={(item:BoxPlotModel)=>item.x!+1}
            />

            {
                this.buildUnmutatedTraces
            }

            {
                this.buildMutationScatters
            }

            <VictoryLegend x={0} y={0}
                title="Legend"
                centerTitle
                orientation="horizontal"
                gutter={20}
                style={{ border: { stroke: "black" }, title: {fontSize: 20 } }}
                data={this.legendData}
            />

        </VictoryChart>


    }


    render(){

        return (
            <div>

                {this.studySelectionModal()}

                <table>
                    <tr>
                        <div>
                            <form className="form-inline expression-controls">
                                <div className="form-group">
                                    <h5>Gene:</h5>
                                    <select className="form-control input-sm"
                                            value={this.selectedGene}
                                            onChange={(event:React.SyntheticEvent<HTMLSelectElement>)=> this.selectedGene = event.currentTarget.value}
                                            title="Select gene">
                                        {
                                            this.props.genes.map((gene:Gene)=><option>{gene.hugoGeneSymbol}</option>)
                                        }
                                    </select>
                                </div>
                                <div className="form-group">
                                    <h5>Profile:</h5>
                                    <select className="form-control input-sm" onChange={()=>{}} title="Select profile">
                                        <option>RNA Seq V2</option>
                                        <option>RNA Seq</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <h5>Sort By:</h5>
                                    <label className="radio-inline">
                                        <input type="radio"
                                               onChange={(event:React.SyntheticEvent<HTMLInputElement>)=>this.sortBy = event.currentTarget.value as SortOptions}
                                               value={"alphabetic"}
                                               title="Sort by cancer study"
                                               checked={this.sortBy === "alphabetic"}/> Cancer Study
                                    </label>

                                    <label className="radio-inline">
                                        <input type="radio"
                                               onChange={(event:React.SyntheticEvent<HTMLInputElement>)=>this.sortBy = event.currentTarget.value as SortOptions}
                                               value={"median"}
                                               checked={this.sortBy === "median"}
                                               title="Sort by median" /> Median
                                    </label>
                                </div>

                                <div className="form-group">
                                    <label className="checkbox-inline">
                                        <input type="checkbox" checked={this.logScale} onChange={()=>this.logScale = !this.logScale} title="Log scale"/>
                                        Log scale
                                    </label>
                                    <label className="checkbox-inline">
                                        <input type="checkbox" checked={this.showMutations} onChange={()=>this.showMutations = !this.showMutations} title="Show mutations" />
                                        Show mutations
                                    </label>
                                </div>

                                <div className="form-group">
                                    <div className="btn-group" role="group">
                                        <button className="btn btn-default btn-xs" type="button">
                                            <i className="fa fa-cloud-download" aria-hidden="true"></i> PDF</button>
                                        <button className="btn btn-default btn-xs" type="button" >
                                            <i className="fa fa-cloud-download" aria-hidden="true"></i> SVG</button>
                                        <button className="btn btn-default btn-xs" type="button">
                                            <i className="fa fa-cloud-download" aria-hidden="true"></i> Data</button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <button className="btn btn-default btn-xs" onClick={()=>this.studySelectorModalVisible = true} type="button">
                                        <i className="fa fa-bars" aria-hidden="true"></i>&nbsp;Select Studies
                                    </button>
                                </div>


                            </form>

                            <div className="collapse">
                                <div className="well"></div>
                            </div>
                        </div>
                    </tr>
                    <tr>
                        <td></td>
                    </tr>
                </table>

                <div className="posRelative">

                    {
                        (this.tooltipModel) && (this.toolTip)
                    }

                    {this.chart}
                </div>


            </div>


        );
    }

}