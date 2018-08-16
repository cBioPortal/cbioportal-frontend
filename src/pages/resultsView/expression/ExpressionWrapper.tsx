import * as React from 'react';
import * as _ from 'lodash';
import {observer} from "mobx-react";
import './styles.scss';
import {
    CancerStudy, Gene, NumericGeneMolecularData, Mutation
} from "../../../shared/api/generated/CBioPortalAPI";
import {action, computed, observable} from "mobx";
import getCanonicalMutationType from "../../../shared/lib/getCanonicalMutationType";
import {
    calculateJitter, ExpressionStyle, ExpressionStyleSheet, getExpressionStyle,
    getMolecularDataBuckets, prioritizeMutations
} from "./expressionHelpers";
import {Modal} from "react-bootstrap";
import autobind from "autobind-decorator";
import {
    VictoryBoxPlot, VictoryChart, VictoryAxis, Point,
    VictoryLabel, VictoryContainer, VictoryTooltip, VictoryScatter, VictoryLegend
} from 'victory';
import CBIOPORTAL_VICTORY_THEME from "../../../shared/theme/cBioPoralTheme";
import {BOX_STYLES, BoxPlotModel, calculateBoxPlotModel, VictoryBoxPlotModel} from "../../../shared/lib/boxPlotUtils";
import {ITooltipModel} from "../../../shared/model/ITooltipModel";
import ChartContainer from "../../../shared/components/ChartContainer/ChartContainer";
import {If, Then, Else} from 'react-if';
import jStat from 'jStat';
import numeral from 'numeral';
import classNames from 'classnames';
import {MSKTab, MSKTabs} from "../../../shared/components/MSKTabs/MSKTabs";
import {CoverageInformation, isPanCanStudy, isTCGAProvStudy} from "../ResultsViewPageStoreUtils";
import {sleep} from "../../../shared/lib/TimeUtils";
import {mutationRenderPriority} from "../plots/PlotsTabUtils";
import {getOncoprintMutationType} from "../../../shared/components/oncoprint/DataUtils";
import {getSampleViewUrl} from "../../../shared/api/urls";
import {ResultsViewPageStore} from "../ResultsViewPageStore";
import NoOqlWarning from "../../../shared/components/NoOqlWarning";

export interface ExpressionWrapperProps {
    store:ResultsViewPageStore;
    studyMap: { [studyId: string]: CancerStudy };
    genes: Gene[];
    data: { [hugeGeneSymbol: string]: NumericGeneMolecularData[][] };
    mutations: Mutation[];
    onRNASeqVersionChange: (version: number) => void;
    RNASeqVersion: number;
    coverageInformation: CoverageInformation
}

const SYMBOL_SIZE = 3;

const EXPRESSION_CAP = .01;

const LOGGING_FUNCTION = Math.log2;

export type ScatterPoint = { x: number, y: NumericGeneMolecularData };

type SortOptions = "alphabetic" | "median";

type ExpressionTooltipModel = {
    studyName: string;
    studyId:string;
    mutationType:string | null;
    proteinChange:string | null;
    sampleId: string;
    expression: number,
    style: ExpressionStyle
};

@observer
export default class ExpressionWrapper extends React.Component<ExpressionWrapperProps, {}> {

    constructor(props: ExpressionWrapperProps) {
        super();
        this.selectedGene = props.genes[0].hugoGeneSymbol;
        (window as any).box = this;
    }

    componentWillMount(){
        // initialize selected study state. study is on except if it does not have any data (doesn't appear in data collection)
        this._selectedStudies = _.mapValues(this.props.studyMap,(study)=>true);
    }

    svgContainer: SVGElement;

    @observable.ref tooltipModel: ITooltipModel<ExpressionTooltipModel> | null = null;

    @observable selectedGene: string;

    @observable studySelectorModalVisible = false;

    @observable showMutations: boolean = true;

    @observable _selectedStudies: { [studyId: string]: boolean } = {};

    @observable height = 700;

    @observable logScale = true;

    @observable sortBy: SortOptions = "alphabetic";

    @observable isTooltipHovered = false;

    // for debugging
    @observable public showMutationType = [];

    tooltipCounter: number = 0;

    @computed get filteredData() {
        // filter for selected studies
        return _.filter(this.props.data[this.selectedGene], (data: NumericGeneMolecularData[]) => this._selectedStudies[data[0].studyId] === true);
    }

    @computed get dataByStudyId(): { [studyId:string] :  NumericGeneMolecularData[] } {
        return _.keyBy(this.props.data[this.selectedGene], (data: NumericGeneMolecularData[]) => data[0].studyId);
    }

    @computed get selectedStudies() {
        return _.filter(this.props.studyMap,(study)=>this._selectedStudies[study.studyId] === true);
    }

    @computed get containerWidth() {
        const legendBased = (this.legendData.length * 80) + 200;
        return (legendBased > this.chartWidth) ? legendBased : this.chartWidth;
    }

    @computed get chartWidth() {
        return this.sortedLabels.length * (this.widthThreshold ? 30 : 110) + 200;
    }

    @computed get widthThreshold(){
        return (this.selectedStudies.length > 7);
    }

    @computed get boxWidth(){
        return this.widthThreshold ? 27 : 80;
    }

    @computed get sortedData() {
        if (this.sortBy === "alphabetic") {
            return _.sortBy(this.filteredData, [
                (data: NumericGeneMolecularData[]) => {
                    return this.props.studyMap[data[0].studyId].shortName
                }]
            );
        } else {
            return _.sortBy(this.filteredData, [(data: NumericGeneMolecularData[]) => {
                //Note: we have to use slice to convert Seamless immutable array to real array, otherwise jStat chokes
                return jStat.median(Array.prototype.slice((data.map((molecularData: NumericGeneMolecularData) => molecularData.value) as any))) as number;
            }]);
        }
    }

    @computed get sortedStudies() {
        return _.map(this.sortedData, (data: NumericGeneMolecularData[]) => {
            return this.props.studyMap[data[0].studyId];
        });
    }

    @computed get studyTypeCounts(){
        const allStudies = _.values(this.props.studyMap);
        return {
            provisional:allStudies.filter((study)=>isTCGAProvStudy(study.studyId)),
            panCancer:allStudies.filter((study)=>isPanCanStudy(study.studyId))
        }
    }

    @computed get sortedLabels(){
        return this.sortedStudies.map((study:CancerStudy)=>study.shortName);
    }

    @computed get mutationsByGene(){
        return _.groupBy(this.props.mutations,(mutation:Mutation)=>mutation.gene.hugoGeneSymbol);
    }

    @computed get mutationsKeyedBySampleId() {
        const mutations = this.mutationsByGene[this.selectedGene] || [];

        // find if there are any mutations which apply to sample sample
        const groups = _.groupBy(mutations,(mutation: Mutation) => mutation.uniqueSampleKey);

        const sampleIdToMutationMap = _.mapValues(groups,(mutations:Mutation[])=>{
            if (mutations.length > 1) {
                return prioritizeMutations(mutations)[0];
            } else {
                return mutations[0];
            }
        });

        return sampleIdToMutationMap;
    }

    @computed
    get dataTransformer() {
        function logger(expressionValue: number) {
            return (expressionValue < EXPRESSION_CAP) ? LOGGING_FUNCTION(EXPRESSION_CAP) : LOGGING_FUNCTION(expressionValue);
        }

        return (molecularData: NumericGeneMolecularData) =>
            (this.logScale ? logger(molecularData.value) : molecularData.value);
    }

    // we need to refactor victoryTraces to make it more easy to test

    @computed get boxTraces(){
        const boxTraces: Partial<VictoryBoxPlotModel>[] = [];
        const sortedData = this.sortedData;

        for (let i = 0; i < sortedData.length; i++) {
            const studyData = sortedData[i];

            let transformedData = studyData;

            transformedData = transformedData.filter((molecularData: NumericGeneMolecularData) => molecularData.value > 0);

            const boxData = calculateBoxPlotModel(transformedData.map(this.dataTransformer));

            // *IMPORTANT* because Victory does not handle outliers,
            // we are overriding meaning of min and max in order to show whiskers
            // at quartile +/-IQL * 1.5 instead of true max/min
            boxTraces.push({
                realMin: boxData.min,
                realMax: boxData.max,
                min: boxData.whiskerLower, // see above
                median: boxData.median, // see above
                max: boxData.whiskerUpper,
                q1: boxData.q1,
                q3: boxData.q3,
                x: i,
            });

        }

        return boxTraces;

    }

    @computed get mutationTraces(){
        const mutationScatterTraces: { [key: string]: ScatterPoint[] }[] = [];
        const sortedData = this.sortedData;
        for (let i = 0; i < sortedData.length; i++) {
            const studyData = sortedData[i];
            const buckets = getMolecularDataBuckets(studyData, this.showMutations, this.mutationsKeyedBySampleId, this.props.coverageInformation, this.selectedGene);
            const mutationTraces = _.mapValues(buckets.mutationBuckets, (molecularData: NumericGeneMolecularData[], canonicalMutationType: string) => {
                return molecularData.map((datum) => {
                    return {y: datum, x: i + calculateJitter(datum.uniqueSampleKey)}
                });
            });
            mutationScatterTraces.push(mutationTraces);
        }
        return mutationScatterTraces;
    }

    @computed get molecularDataByMutationType(){
        return this.sortedData.map((studyData)=>{
            return getMolecularDataBuckets(studyData, this.showMutations, this.mutationsKeyedBySampleId, this.props.coverageInformation, this.selectedGene);
        });
    }

    @computed get unmutatedTraces(){
        const unMutatedTraces: ScatterPoint[][] = [];
        const sortedData = this.sortedData;
        for (let i = 0; i < sortedData.length; i++) {
            const studyData = sortedData[i];
            const buckets = this.molecularDataByMutationType[i];
            const unmutatedTrace = buckets.unmutatedBucket.map((datum: NumericGeneMolecularData) => {
                return {y: datum, x: i + calculateJitter(datum.uniqueSampleKey)}
            });
            unMutatedTraces.push(unmutatedTrace);
        }
        return unMutatedTraces;
    }

    @computed get unsequencedTraces(){
        const unsequencedTraces: ScatterPoint[][] = [];
        const sortedData = this.sortedData;
        for (let i = 0; i < sortedData.length; i++) {
            // get buckets for this study
            const buckets = this.molecularDataByMutationType[i];
            const unsequencedTrace = buckets.unsequencedBucket.map((datum: NumericGeneMolecularData) => {
                return {y: datum, x: i + calculateJitter(datum.uniqueSampleKey)}
            });
            unsequencedTraces.push(unsequencedTrace);
        }
        return unsequencedTraces;
    }

    @computed get victoryTraces() {
        return {boxTraces:this.boxTraces, mutationScatterTraces: this.mutationTraces, unSequencedTraces:this.unsequencedTraces, unMutatedTraces: this.unmutatedTraces};
    }

    @computed
    get domain() {
        const min = _.min(this.victoryTraces.boxTraces.map(trace => trace.realMin));
        const max = _.max(this.victoryTraces.boxTraces.map(trace => trace.realMax));
        return {min, max};
    }

    @autobind
    handleStudySelection(event: React.SyntheticEvent<HTMLInputElement>) {
        // toggle state of it
        this._selectedStudies[event.currentTarget.value] = !this._selectedStudies[event.currentTarget.value];
    }

    @autobind
    handleRNASeqVersionChange(event: React.SyntheticEvent<HTMLSelectElement>) {
        this.props.onRNASeqVersionChange(parseInt(event.currentTarget.value));
    }

    @autobind
    handleSortByChange(event: React.SyntheticEvent<HTMLSelectElement>) {
        this.sortBy = event.currentTarget.value as any;
    }

    @autobind
    handleSelectAllStudies(){
        this.applyStudyFilter((study)=>{
            return study.studyId in this.dataByStudyId;
        });
    }

    @autobind
    handleDeselectAllStudies(){
        this.applyStudyFilter((study)=>{
            return false;
        });
    }

    @computed get hasUnselectedStudies(){
        return undefined !== _.find(this.props.studyMap,(study)=>{
            const hasData = study.studyId in this.dataByStudyId;
            const isSelected = this.selectedStudies.includes(study);
            return hasData && !isSelected;
        });
    }

    @computed
    get alphabetizedStudies(){
        return _.chain(this.props.studyMap).values().sortBy(
            (study:CancerStudy)=>study.name
        ).value();
    }

    @computed
    get studySelectionModal() {

        return (<Modal data-test="ExpressionStudyModal" show={true} onHide={() => {
            this.studySelectorModalVisible = false
        }} className="cbioportal-frontend">
            <Modal.Header closeButton>
                <Modal.Title>Select Studies</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div>
                    <div>
                        <a data-test="ExpressionStudySelectAll" className={classNames({hidden:!this.hasUnselectedStudies})} onClick={this.handleSelectAllStudies}>Select all</a>
                        <span className={classNames({hidden:!this.hasUnselectedStudies || this.selectedStudies.length === 0})}>&nbsp;|&nbsp;</span>
                        <a data-test="ExpressionStudyUnselectAll" className={classNames({hidden:this.selectedStudies.length === 0})} onClick={this.handleDeselectAllStudies}>Deselect all</a>
                    </div>
                    {
                        _.map(this.alphabetizedStudies, (study: CancerStudy) => {
                            const hasData = study.studyId in this.dataByStudyId;
                            return (
                                <div className={classNames('checkbox',{ disabled:!hasData })}>
                                    <label>
                                        <input type="checkbox"
                                               checked={hasData && this._selectedStudies[study.studyId] === true}
                                               value={study.studyId}
                                               disabled={!hasData}
                                               onChange={(!hasData)? ()=>{} : this.handleStudySelection}/>
                                        {study.name}
                                        { (!hasData) && (<span className="badge badge-info small" style={{marginLeft:5}}>{"No Expr. Data"}</span>) }
                                    </label>
                                </div>
                            )
                        })
                    }
                </div>
            </Modal.Body>
        </Modal>)

    }

    @computed
    get mutationTypesPresent() {
        const mutationTypes = _.flatMap(this.mutationTraces, (traceMap: {[mutationType:string]:any}) => {
            return _.keys(traceMap);
        });
        return _.uniq(mutationTypes);
    }

    @computed
    get legendData() {
        const legendData = this.mutationTypesPresent.map((mutationType: string) => {
            let style = getExpressionStyle(mutationType);
            return {name: style.legendText, symbol: {fill: style.fill, size:SYMBOL_SIZE, stroke:style.stroke, type: style.symbol}}
        });

        const deDupedLegendData = _.uniqBy(legendData,(item:any)=>item.name);

        // now lets add non-mutated and non-sequenced entries
        const nonMutStyle = ExpressionStyleSheet.non_mut;
        const nonSequenced = ExpressionStyleSheet.non_sequenced;

        if (this.showMutations) {
            deDupedLegendData.push({name: nonMutStyle.legendText, symbol: {fill: nonMutStyle.fill, stroke:nonMutStyle.stroke, size:SYMBOL_SIZE, type: nonMutStyle.symbol}});
        }

        if (_.flatten(this.victoryTraces.unSequencedTraces).length > 0) {
            deDupedLegendData.push({name: nonSequenced.legendText,
                symbol: {
                    fill: nonSequenced.fill,
                    size: SYMBOL_SIZE,
                    stroke: nonSequenced.stroke,
                    type: nonSequenced.symbol
                }
            });
        }
        return deDupedLegendData;
    }

    @autobind
    async hideTooltip() {
        await sleep(100);
        if (this.isTooltipHovered === false && this.tooltipCounter === 1) {
            this.tooltipModel = null;

        }
        this.tooltipCounter--;
    }

    @autobind
    tooltipMouseLeave(): void {
        this.isTooltipHovered = false;
        this.tooltipModel = null;
    }

    @autobind
    tooltipMouseEnter(): void {
        this.isTooltipHovered = true;
    }

    @autobind
    makeTooltip(props: any) {

        const geneMolecularData: NumericGeneMolecularData = props.datum.y;
        const mutation = this.mutationsKeyedBySampleId[geneMolecularData.uniqueSampleKey];

        // determine style based on mutation
        let expressionStyle: ExpressionStyle;
        let oncoprintMutationType:string = "";
        if (mutation) {
            oncoprintMutationType = getOncoprintMutationType(mutation);
            expressionStyle = getExpressionStyle(oncoprintMutationType);
        } else {
            expressionStyle = ExpressionStyleSheet.non_mut;
        }

        this.tooltipModel = {
            x: props.x + 20,
            y: props.y - 18,
            data: {
                studyName: this.props.studyMap[geneMolecularData.studyId].name,
                sampleId: geneMolecularData.sampleId,
                studyId: geneMolecularData.studyId,
                expression: geneMolecularData.value,
                style: expressionStyle,
                mutationType:(mutation && oncoprintMutationType) ? oncoprintMutationType : null,
                proteinChange: (mutation && mutation.proteinChange) ? mutation.proteinChange : null
            }
        };

        this.tooltipCounter++;

    }

    @autobind
    public applyStudyFilter(test: (study: CancerStudy) => boolean) {
        this._selectedStudies = _.mapValues(this.props.studyMap, (study: CancerStudy, studyId: string) => {
            return test(study);
        });
    }

    @autobind
    public handleTabClick(id: string, datum:Gene) {
        this.selectedGene = datum.hugoGeneSymbol;
    }

    @computed
    get buildUnmutatedTraces() {
        return this.victoryTraces.unMutatedTraces.map((trace) => this.buildScatter(trace, this.showMutations ? ExpressionStyleSheet.non_mut : ExpressionStyleSheet.not_showing_mut))
    }

    @computed
    get buildUnsequencedTraces() {
        return this.victoryTraces.unSequencedTraces.map((trace) => this.buildScatter(trace, ExpressionStyleSheet.non_sequenced))
    }

    @computed
    get buildMutationScatters() {
        return _.flatMap(this.victoryTraces.mutationScatterTraces, (traces:{[mutationType:string]:ScatterPoint[]}) => {
            // sort traces by mutation rendering priority
            const sortedEntries = _.sortBy(_.toPairs(traces), entry=>-1*mutationRenderPriority[entry[0]]);
            return sortedEntries.map(entry=>{
                const key = entry[0];
                const value = entry[1];
                const style = getExpressionStyle(key);
                return (this.showMutationType.length === 0 || (this.showMutationType as any).includes(key))
                    ? this.buildScatter(value, style) : null;
            })
        });
    }

    @computed
    get tickFormat() {
        function format(val:number) {
            if (val >= 1000) {
                return numeral(val).format('0a');
            } else {
                return numeral(val).format('0.[00]');
            }
        }
        return (this.logScale) ? (val:number)=>val : (val:number) => format(val);
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

    @computed get paddingBottom(){
        if (!this.sortedLabels.length) {
            return 10;
        } else {
            return _.maxBy(this.sortedLabels,(label:string)=>label.length)!.length * 9;
        }
    }

    @computed
    get yAxisLabel() {
        const log = this.logScale ? ' (log2)' : '';
        return `${this.selectedGene} Expression --- RNA Seq V${this.props.RNASeqVersion}${log}`;
    }

    @computed
    get toolTip() {
        const style: ExpressionStyle = this.tooltipModel!.data.style as ExpressionStyle;

        return (
            <div className="popover right cbioTooltip"
                 onMouseLeave={this.tooltipMouseLeave}
                 onMouseEnter={this.tooltipMouseEnter}
                 style={{top: this.tooltipModel!.y, left: this.tooltipModel!.x-8}}
            >
                <div className="arrow" style={{top: 27}}></div>
                <div className="popover-content">
                    <strong>Study:</strong> {this.tooltipModel!.data.studyName}<br/>
                    <strong>Sample ID:</strong>&nbsp;
                    <a href={getSampleViewUrl(this.tooltipModel!.data.studyId, this.tooltipModel!.data.sampleId)} target="_blank">
                    {this.tooltipModel!.data.sampleId}</a>
                    <br/>
                    <strong>Expression:</strong> {this.tooltipModel!.data.expression}
                    { this.showMutations && (
                        <div>
                            <strong>Mutation type:</strong>
                            &nbsp;{style.legendText}
                            <br/>
                        </div>
                    )}
                    {
                        (this.showMutations && this.tooltipModel!.data.proteinChange) &&
                        (<div><strong>Mutation detail:</strong> {this.tooltipModel!.data.proteinChange}</div>)
                    }


                </div>
            </div>

        )

    }

    @autobind
    private getRef(ref:any){
        this.svgContainer = (ref && ref.children.length) ? ref.children[0] : null
    }

    @computed
    get chart() {
        return (

                <VictoryChart
                    height={this.height}
                    width={this.chartWidth}
                    theme={CBIOPORTAL_VICTORY_THEME}
                    domainPadding={{x: [30, 30], y:[10, 10]}}
                    domain={{ x:[0,this.victoryTraces.boxTraces.length + 1]}}
                    padding={{bottom: this.paddingBottom, left: 100, top: 60, right: 10}}
                    containerComponent={
                        <VictoryContainer width={this.containerWidth}
                                          containerRef={this.getRef}
                                          responsive={false}
                        />
                    }
                >
                    <VictoryAxis dependentAxis
                                 tickFormat={this.tickFormat}
                                 axisLabelComponent={<VictoryLabel dy={-50}/>}
                                 label={this.yAxisLabel}
                                 crossAxis={false}
                    />

                    <VictoryAxis
                        tickFormat={this.sortedLabels}
                        orientation={'bottom'}
                        offsetY={this.paddingBottom}
                        tickLabelComponent={
                            <VictoryLabel
                                angle={-85}
                                dx={-20}
                                verticalAnchor="middle"
                                textAnchor="end"
                            />
                        }

                    />

                    <VictoryBoxPlot
                        boxWidth={this.boxWidth}
                        style={BOX_STYLES}
                        data={this.victoryTraces.boxTraces}
                        x={(item: BoxPlotModel) => item.x! + 1}
                    />
                    {
                        this.buildUnmutatedTraces
                    }

                    {
                        this.buildUnsequencedTraces
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
        )
    }

    render() {
        return (
            <div>
                <div style={{marginBottom:10, marginLeft:-2, marginTop:-2}}>
                    <NoOqlWarning store={this.props.store}/>
                </div>
                { (this.studySelectorModalVisible) && this.studySelectionModal }
                <div style={{marginBottom:15}}>

                    <MSKTabs onTabClick={this.handleTabClick}
                             enablePagination={true}
                             unmountOnHide={true}
                             tabButtonStyle="pills"
                             activeTabId={"summaryTab" + this.selectedGene}
                             className="pillTabs">
                        {
                            this.props.genes.map((gene:Gene)=> {
                               return <MSKTab key={gene.hugoGeneSymbol} datum={gene} id={"summaryTab" + gene.hugoGeneSymbol}
                                        linkText={gene.hugoGeneSymbol}/>
                            })
                        }
                    </MSKTabs>

                    <form className="form-inline expression-controls" style={{marginBottom:10}}>

                        <div className="form-group">
                            <h5>Profile:</h5>
                            <select className="form-control input-sm" value={this.props.RNASeqVersion}
                                    onChange={this.handleRNASeqVersionChange} title="Select profile">
                                <option value={2}>RNA Seq V2</option>
                                <option value={1}>RNA Seq</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <h5>Sort By:</h5>

                            <select className="form-control input-sm" value={this.sortBy}
                                    onChange={this.handleSortByChange} title="Select profile">
                                <option value={"alphabetic"}>Cancer Study</option>
                                <option value={"median"}>Median</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-inline">
                                <input type="checkbox" checked={this.logScale}
                                       onChange={()=>this.logScale = !this.logScale} title="Log scale"/>
                                Log scale
                            </label>
                            <label className="checkbox-inline">
                                <input type="checkbox" checked={this.showMutations}
                                       onChange={() => this.showMutations = !this.showMutations}
                                       title="Show mutations"/>
                                Show mutations
                            </label>
                        </div>

                    </form>

                    <div>
                        <label>Select studies:</label>&nbsp;
                        <If condition={this.studyTypeCounts.provisional.length > 0}>
                            <button className="btn btn-default btn-xs" style={{marginRight:5}}
                                    onClick={() => this.applyStudyFilter((study: CancerStudy) => isTCGAProvStudy(study.studyId))}>
                                 TCGA Provisional ({this.studyTypeCounts.provisional.length})
                            </button>
                        </If>
                        <If condition={this.studyTypeCounts.panCancer.length > 0}>
                            <button className="btn btn-default btn-xs" style={{marginRight:5}}
                                    onClick={() => this.applyStudyFilter((study: CancerStudy) => isPanCanStudy(study.studyId))}>
                                TCGA Pan-Can Atlas ({this.studyTypeCounts.panCancer.length})
                            </button>
                        </If>
                        <button data-test="ExpressionStudyModalButton"className="btn btn-default btn-xs"
                                onClick={() => this.studySelectorModalVisible = !this.studySelectorModalVisible}>Custom list</button>

                    </div>

                    <div className="collapse">
                        <div className="well"></div>
                    </div>
                </div>

                <If condition={this.selectedStudies.length > 0}>
                    <Then>
                        <If condition={_.size(this.props.data) > 0}>
                            <Then>
                                <div className="posRelative">

                                    <ChartContainer
                                        getSVGElement={()=>this.svgContainer}
                                        exportFileName="Expression"
                                    >
                                        {(this.tooltipModel) && (this.toolTip)}
                                        {this.chart}
                                    </ChartContainer>


                                </div>
                            </Then>
                            <Else>
                                <div className="alert alert-info">
                                    No expression data for this query.
                                </div>
                            </Else>
                        </If>
                    </Then>
                    <Else>
                        <div className="alert alert-info">
                            No studies selected.
                        </div>
                    </Else>
                </If>
            </div>
        );
    }

}