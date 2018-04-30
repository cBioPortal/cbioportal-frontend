import * as React from 'react';
import * as _ from 'lodash';
import {observer} from "mobx-react";
import './styles.scss';
import {CancerStudy, Gene, NumericGeneMolecularData, Mutation} from "../../../shared/api/generated/CBioPortalAPI";
import {action, computed, observable} from "mobx";
import getCanonicalMutationType from "../../../shared/lib/getCanonicalMutationType";
import {ExpressionStyle, ExpressionStyleSheet} from "./expressionHelpers";
import {Modal} from "react-bootstrap";
import autobind from "autobind-decorator";
import {
    VictoryBoxPlot, VictoryChart, VictoryAxis,
    VictoryLabel, VictoryContainer, VictoryPie, VictoryScatter, VictoryLegend
} from 'victory';
import CBIOPORTAL_VICTORY_THEME from "../../../shared/theme/cBioPoralTheme";
import {BoxPlotModel, calculateBoxPlotModel} from "../../../shared/lib/boxPlotUtils";
import d3 from 'd3';
import {ITooltipModel} from "../../../shared/model/ITooltipModel";
import ChartContainer from "../../../shared/components/ChartContainer/ChartContainer";
import {If, Then, Else} from 'react-if';


interface ExpressionWrapperProps {

    studyMap: { [studyId: string]: CancerStudy };
    genes: Gene[];
    data: { [hugeGeneSymbol: string]: NumericGeneMolecularData[][] };
    mutations: Mutation[];
    onRNASeqVersionChange:(version:number)=>void;
    RNASeqVersion:number;

}

interface MolecularDataBuckets {
    mutationBuckets: { [mutationType: string]: NumericGeneMolecularData[] };
    unmutatedBucket: NumericGeneMolecularData[]
};

const JITTER_VALUE = 0.4;

const BOX_WIDTH = 100;

const ZERO_EXPRESSION = -2;

const SAMPLE_STYLE_BASE = {
    size: 6,
    line: {color: "#B40404", width: 1.2}
};

const BOX_STYLES = {
    min: {stroke: "#999999"},
    max: {stroke: "#999999"},
    q1: {fill: "#eeeeee"},
    q3: {fill: "#eeeeee"},
    median: {stroke: "#999999", strokeWidth: 1},
};


function getMolecularDataBuckets(studyData: NumericGeneMolecularData[],
                                 showMutations: boolean,
                                 mutationsKeyedBySampleId: { [sampleId: string]: Mutation }) {


    // if mutation mode is on, we want to fill buckets by mutation type (or unmutated)
    const mutationModeInteratee = (memo: MolecularDataBuckets, molecularData: NumericGeneMolecularData) => {
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
    const noMutationModeIteratee = (memo: MolecularDataBuckets, molecularData: NumericGeneMolecularData) => {
        memo.unmutatedBucket.push(molecularData);
        return memo;
    };

    const iteratee = (showMutations) ? mutationModeInteratee : noMutationModeIteratee;

    // populate buckets using iteratee
    const buckets = studyData.reduce(iteratee, {mutationBuckets: {}, unmutatedBucket: []});

    return buckets;

}

export type ScatterPoint = { x: number, y: NumericGeneMolecularData };

type SortOptions = "alphabetic" | "median";

function findMedian(_input_data: number[]) {
    var m = _.orderBy(_input_data);
    var middle = Math.floor((m.length - 1) / 2); // NB: operator precedence
    if (m.length % 2) {
        return m[middle];
    } else {
        return (m[middle] + m[middle + 1]) / 2.0;
    }
}

function getJitter() {
    return (Math.random() * JITTER_VALUE - JITTER_VALUE / 2);
}

@observer
export default class ExpressionWrapper extends React.Component<ExpressionWrapperProps, {}> {

    constructor(props: ExpressionWrapperProps) {
        super();
        this.selectedGene = props.genes[0].hugoGeneSymbol;
        this._selectedStudies = _.mapValues(props.studyMap, () => true);

        (window as any).box = this;
    }

    svgContainer: SVGAElement;

    @observable.ref tooltipModel: ITooltipModel<{ studyName: string; sampleId: string; expression: number, style: ExpressionStyle }> | null = null;

    @observable selectedGene: string;

    @observable studySelectorModalVisible = false;

    @observable showMutations: boolean = true;

    @observable _selectedStudies: { [studyId: string]: boolean } = {};

    @observable logScale = true;

    @observable sortBy: SortOptions = "alphabetic";

    @computed
    get filteredData() {
        // filter for selected studies
        return _.filter(this.props.data[this.selectedGene], (data: NumericGeneMolecularData[]) => this._selectedStudies[data[0].studyId] === true);
    }

    @computed
    get selectedStudies(){
        return _.filter(this._selectedStudies,(isSelected:boolean, study:CancerStudy)=>isSelected);
    }

    @computed
    get sortedData() {
        if (this.sortBy === "alphabetic") {
            return _.sortBy(this.filteredData, [
                (data: NumericGeneMolecularData[]) => {
                    return this.props.studyMap[data[0].studyId].shortName
                }]
            );
        } else {
            return _.sortBy(this.filteredData, [(data: NumericGeneMolecularData[]) => {
                return findMedian(data.map((molecularData: NumericGeneMolecularData) => molecularData.value));
            }]);
        }
    }

    @computed
    get sortedLabels() {

        return _.map(this.sortedData, (data: NumericGeneMolecularData[]) => {
            return this.props.studyMap[data[0].studyId].shortName;
        });

    }

    @computed
    get mutationsKeyedBySampleId() {
        return _.keyBy(this.props.mutations, (mutation: Mutation) => mutation.uniqueSampleKey);
    }

    @computed get dataTransformer(){
        function logger(expressionValue:number){
            return (expressionValue === 0) ? .00001 : Math.log(expressionValue);
        }
        return (molecularData: NumericGeneMolecularData) =>
            (this.logScale ? logger(molecularData.value) : molecularData.value);
    }

    @computed
    get victoryTraces() {

        const boxTraces: Partial<BoxPlotModel>[] = [];
        const mutationScatterTraces: { [key: string]: ScatterPoint[] }[] = [];
        const unMutatedTraces: ScatterPoint[][] = [];

        const sortedData = this.sortedData;
        for (let i = 0; i < sortedData.length; i++) {
            const studyData = sortedData[i];

            // we don't want to let zero values affect the distribution markers
            const withoutZeros = studyData.filter((molecularData:NumericGeneMolecularData)=>molecularData.value > 0);

            const boxData = calculateBoxPlotModel(withoutZeros.map(this.dataTransformer));

            // *IMPORTANT* because Victory does not handle outliers,
            // we are overriding meaning of min and max in order to show whiskers
            // at quartile +/-IQL * 1.5 instead of true max/min

            boxTraces.push({
                realMin:boxData.min,
                realMax:boxData.max,
                min: boxData.whiskerLower, // see above
                median: boxData.median, // see above
                max: boxData.whiskerUpper,
                q1: boxData.q1,
                q3: boxData.q3,
                x: i,
            });

            const buckets = getMolecularDataBuckets(studyData, this.showMutations, this.mutationsKeyedBySampleId);

            const mutationTraces = _.mapValues(buckets.mutationBuckets, (molecularData: NumericGeneMolecularData[], canonicalMutationType: string) => {
                return molecularData.map((datum) => {
                    return {y: datum, x: i + getJitter()}
                });
            });

            mutationScatterTraces.push(mutationTraces);

            if (buckets.unmutatedBucket.length > 0) {
                const unmutated = buckets.unmutatedBucket.map((datum: NumericGeneMolecularData) => {
                    return {y: datum, x: i + getJitter()}
                });
                unMutatedTraces.push(unmutated);
            }

        }

        return {boxTraces, mutationScatterTraces, unMutatedTraces};

    }

    @computed get domain(){

        const min = _.min(this.victoryTraces.boxTraces.map(trace=>trace.realMin));
        const max = _.max(this.victoryTraces.boxTraces.map(trace=>trace.realMax));
        return { min, max };

    }

    @autobind
    handleStudySelection(event: React.SyntheticEvent<HTMLInputElement>) {
        // toggle state of it
        this._selectedStudies[event.currentTarget.value] = !this._selectedStudies[event.currentTarget.value];
    }

    @autobind
    handleRNASeqVersionChange(event: React.SyntheticEvent<HTMLSelectElement>){
        this.props.onRNASeqVersionChange(parseInt(event.currentTarget.value));
    }

    studySelectionModal() {

        return (<Modal show={this.studySelectorModalVisible} onHide={() => {
            this.studySelectorModalVisible = false
        }} className="cbioportal-frontend">
            <Modal.Header closeButton>
                <Modal.Title>Select Studies</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div>
                    {
                        _.map(this.props.studyMap, (study: CancerStudy) => {
                            return (
                                <div className="checkbox">
                                    <label>
                                        <input type="checkbox"
                                               checked={this._selectedStudies[study.studyId] === true}
                                               value={study.studyId}
                                               onChange={this.handleStudySelection}/>
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
    @computed
    get mutationTypesPresent() {
        const mutationTypes = _.flatMap(this.victoryTraces.mutationScatterTraces, (blah: any) => {
            return _.keys(blah);
        });
        return _.uniq(mutationTypes);
    }

    @computed
    get legendData() {
        const legendData = this.mutationTypesPresent.map((mutationType: string) => {
            let style = ExpressionStyleSheet[mutationType] || ExpressionStyleSheet.other;
            return {name: style.legendText, symbol: {fill: style.fill, type: style.symbol}}
        });
        // now lets add non mutated entry
        const nonMutStyle = ExpressionStyleSheet.non_mut;
        legendData.push({name: nonMutStyle.legendText, symbol: {fill: nonMutStyle.fill, type: nonMutStyle.symbol}});
        return legendData;
    }

    @autobind
    hideTooltip() {
        this.tooltipModel = null;
    }

    @autobind
    makeTooltip(props: any) {

        const geneMolecularData: NumericGeneMolecularData = props.datum.y;
        const mutation = this.mutationsKeyedBySampleId[geneMolecularData.uniqueSampleKey];

        // determine style based on mutation
        let expressionStyle: ExpressionStyle;
        if (mutation) {
            const canonicalMutationType = getCanonicalMutationType(mutation.mutationType) || "other";
            expressionStyle = ExpressionStyleSheet[canonicalMutationType];
        } else {
            expressionStyle = ExpressionStyleSheet.non_mut;
        }

        this.tooltipModel = {
            x: props.x + 20,
            y: props.y - 18,
            data: {
                studyName: this.props.studyMap[geneMolecularData.studyId].name,
                sampleId: geneMolecularData.sampleId,
                expression: geneMolecularData.value,
                style: expressionStyle
            }
        };

    }

    @computed
    get yAxisLabel() {
        const log = this.logScale ? ' (log)' : '';
        return `${this.selectedGene} Expression --- RNA Seq V${this.props.RNASeqVersion}${log}`;
    }

    @computed
    get toolTip() {

        return (
            <div className="popover right cbioTooltip"
                 onMouseLeave={() => this.hideTooltip()}
                 style={{top: this.tooltipModel!.y, left: this.tooltipModel!.x}}
            >
                <div className="arrow" style={{top: 30}}></div>
                <div className="popover-content">

                    <svg height="10" width="10">
                        <circle cx="5" cy="5" r="3" stroke="black" stroke-width="1"
                                fill={this.tooltipModel!.data.style.fill}/>
                    </svg>
                    &nbsp;{this.tooltipModel!.data.style.legendText}
                    <br/>
                    <strong>Study:</strong> {this.tooltipModel!.data.studyName}<br/>
                    <strong>Sample ID:</strong> {this.tooltipModel!.data.sampleId}<br/>
                    <strong>Expression:</strong> {this.tooltipModel!.data.expression}
                </div>
            </div>

        )

    }

    buildScatter(data: ScatterPoint[], style: ExpressionStyle) {

        return <VictoryScatter
            style={{data: {fill: style.fill, stroke: "#666666", strokeWidth: 1}}}
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
            y={(datum: { y: NumericGeneMolecularData }) => {
                return this.dataTransformer(datum.y);
            }}
            x={(item: ScatterPoint) => item.x + 1}
            size={3}
            data={data}
        />

    }

    @autobind
    public applyStudyFilter(test:(study:CancerStudy)=>boolean){
        this._selectedStudies = _.mapValues(this.props.studyMap,(study:CancerStudy, studyId:string)=>{
           return test(study);
        });
    }

    @computed
    get buildUnmutatedTraces() {
        return this.victoryTraces.unMutatedTraces.map((trace) => this.buildScatter(trace, ExpressionStyleSheet.non_mut))
    }

    @computed
    get buildMutationScatters() {

        return _.flatMap(this.victoryTraces.mutationScatterTraces, (blah: any) => {
            return _.map(blah, (value: any, key) => {
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

    @computed
    get width() {
        return this.sortedLabels.length * 150 + 200;
    }

    @observable height = 600;

    @computed
    get chart() {

        return (
            <ChartContainer>
                <VictoryChart
                    height={this.height}
                    width={this.width}
                    theme={CBIOPORTAL_VICTORY_THEME}
                    domainPadding={{x: [100, 100]}}
                    domain={{y: [this.domain.min, this.domain.max]}}
                    padding={{bottom: 200, left: 100, top: 100, right: 10}}
                    containerComponent={<VictoryContainer containerRef={(ref: any) => this.svgContainer = ref}
                                                          responsive={false}/>}
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

                                 tickFormat={(val: number) => val }
                                 axisLabelComponent={<VictoryLabel dy={-50}/>}
                                 label={this.yAxisLabel}
                    />


                    <VictoryBoxPlot
                        boxWidth={BOX_WIDTH}
                        style={BOX_STYLES}
                        data={this.victoryTraces.boxTraces}
                        x={(item: BoxPlotModel) => item.x! + 1}
                    />

                    {
                        this.buildUnmutatedTraces
                    }

                    {
                        this.buildMutationScatters
                    }

                    <VictoryLegend x={0} y={0}
                                   orientation="horizontal"
                                   gutter={20}
                                   data={this.legendData}
                    />

                </VictoryChart>
            </ChartContainer>
        )

    }


    render() {

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
                                            onChange={(event: React.SyntheticEvent<HTMLSelectElement>) => this.selectedGene = event.currentTarget.value}
                                            title="Select gene">
                                        {
                                            this.props.genes.map((gene: Gene) => <option>{gene.hugoGeneSymbol}</option>)
                                        }
                                    </select>
                                </div>
                                <div className="form-group">
                                    <h5>Profile:</h5>
                                    <select className="form-control input-sm" value={this.props.RNASeqVersion} onChange={this.handleRNASeqVersionChange} title="Select profile">
                                        <option value={2}>RNA Seq V2</option>
                                        <option value={1}>RNA Seq</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <h5>Sort By:</h5>
                                    <label className="radio-inline">
                                        <input type="radio"
                                               onChange={(event: React.SyntheticEvent<HTMLInputElement>) => this.sortBy = event.currentTarget.value as SortOptions}
                                               value={"alphabetic"}
                                               title="Sort by cancer study"
                                               checked={this.sortBy === "alphabetic"}/> Cancer Study
                                    </label>

                                    <label className="radio-inline">
                                        <input type="radio"
                                               onChange={(event: React.SyntheticEvent<HTMLInputElement>) => this.sortBy = event.currentTarget.value as SortOptions}
                                               value={"median"}
                                               checked={this.sortBy === "median"}
                                               title="Sort by median"/> Median
                                    </label>
                                </div>

                                <div className="form-group">
                                    <label className="checkbox-inline">
                                        <input type="checkbox" checked={this.logScale}
                                               onChange={() => this.logScale = !this.logScale} title="Log scale"/>
                                        Log scale
                                    </label>
                                    <label className="checkbox-inline">
                                        <input type="checkbox" checked={this.showMutations}
                                               onChange={() => this.showMutations = !this.showMutations}
                                               title="Show mutations"/>
                                        Show mutations
                                    </label>
                                </div>

                                <div className="form-group">
                                    <div className="btn-group" role="group">
                                        <button className="btn btn-default btn-xs" type="button">
                                            <i className="fa fa-cloud-download" aria-hidden="true"></i> PDF
                                        </button>
                                        <button className="btn btn-default btn-xs" type="button">
                                            <i className="fa fa-cloud-download" aria-hidden="true"></i> SVG
                                        </button>
                                        <button className="btn btn-default btn-xs" type="button">
                                            <i className="fa fa-cloud-download" aria-hidden="true"></i> Data
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <button className="btn btn-default btn-xs"
                                            onClick={() => this.studySelectorModalVisible = true} type="button">
                                        <i className="fa fa-bars" aria-hidden="true"></i>&nbsp;Select Studies
                                    </button>
                                </div>


                            </form>

                            <div>
                                Quick filters:
                                <a onClick={()=>this.applyStudyFilter((study:CancerStudy)=>/_tcga$/.test(study.studyId))}>TCGA Provisional</a>&nbsp;|&nbsp;
                                <a onClick={()=>this.applyStudyFilter((study:CancerStudy)=>/_tcga_pan_can_atlas_2018/.test(study.studyId))}>TCGA Provisional</a>
                            </div>


                            <div className="collapse">
                                <div className="well"></div>
                            </div>
                        </div>
                    </tr>
                    <tr>
                        <td></td>
                    </tr>
                </table>


                <If condition={this.selectedStudies.length > 0}>
                    <Then>
                        <div className="posRelative">
                            {
                                (this.tooltipModel) && (this.toolTip)
                            }
                            {this.chart}
                        </div>
                    </Then>
                    <Else>
                        <div>
                            No studies selected.
                        </div>
                    </Else>
                </If>




            </div>


        );
    }

}