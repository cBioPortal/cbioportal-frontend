import * as React from "react";
import * as _ from 'lodash';
import {Checkbox, ButtonGroup, Panel, Radio} from 'react-bootstrap';
import {computed, observable} from "mobx";
import {observer} from "mobx-react";
import Slider from 'react-rangeslider';
import {FormGroup, ControlLabel, FormControl} from 'react-bootstrap';
import {If, Then, Else} from 'react-if';
import classnames from 'classnames';
import SvgSaver from 'svgsaver';

import 'react-select/dist/react-select.css';
import 'react-rangeslider/lib/index.css';

import { CancerSummaryChart } from "./CancerSummaryChart";
import autobind from "autobind-decorator";
import DownloadControls from "shared/components/downloadControls/DownloadControls"

export const OrderedAlterationLabelMap: Record<keyof IAlterationCountMap, string> = {
    multiple: "Multiple Alterations",
    protExpressionDown: "Protein Downregulation",
    protExpressionUp: "Protein Upregulation",
    mrnaExpressionDown: "mRNA Downregulation",
    mrnaExpressionUp: "mRNA Upregulation",
    hetloss: "Shallow Deletion",
    homdel: "Deep Deletion",
    gain: "Gain",
    amp: "Amplification",
    fusion: "Fusion",
    mutated: "Mutation"
};

const alterationToColor: Record<keyof IAlterationCountMap, string> = {
    mutated: "#008000",
    amp: "#ff0000",
    homdel: "#0000ff", //"#8fd8d8" "rgb(0,0,255)",
    hetloss: "#8fd8d8",
    gain: "rgb(255,182,193)",
    fusion: "#8B00C9",
    mrnaExpressionUp: "#FF989A",
    mrnaExpressionDown: "#529AC8",
    protExpressionUp: "#FF989A",
    protExpressionDown: "#E0FFFF",
    multiple: "#666"
};


export interface IAlterationCountMap {
    mutated: number;
    amp: number;
    homdel: number;
    hetloss: number;
    gain: number;
    fusion: number;
    mrnaExpressionUp: number;
    mrnaExpressionDown: number;
    protExpressionUp: number;
    protExpressionDown: number;
    multiple: number;
};


export interface IAlterationData {
    alterationTotal: number;
    sampleTotal: number;
    alterationTypeCounts: IAlterationCountMap;
    alteredSampleCount: number;
    parentCancerType: string;
}


export interface ICancerSummaryChartData {
    representedAlterations: { [alterationType: string]: boolean };
    data: {
        x: string,
        y: number,
        alterationType: string }[][];
    labels: string[];
    maxPercentage: number;
    maxAbsoluteCount: number;
    maxSampleCount: number;
}

export interface ICancerSummaryContentProps {
    labelTransformer?: (key: string) => string;
    groupedAlterationData: {
        [groupType: string]: IAlterationData
    }
    groupAlterationsBy: string;
    gene: string;
    width: number;
    handlePivotChange: (e: any) => void;
}

const GroupByOptions = [
    {value: 'studyId', label: 'Cancer Study'},
    {value: 'cancerType', label: 'Cancer Type'},
    {value: 'cancerTypeDetailed', label: 'Cancer Type Detailed'}
];

export function calculatePercentage(part:number, whole:number){
    return  (part / whole) * 100;
}

@observer
export class CancerSummaryContent extends React.Component<ICancerSummaryContentProps, {}> {

    private inputYAxisEl: any;
    private inputXAxisEl: any;
    @observable private tempAltCasesInputValue = 0;
    @observable private tempTotalCasesInputValue = 0;
    @observable private pngAnchor = '';
    @observable private pdf: { anchor: string; width: number; height: number } = {anchor: '', width: 0, height: 0};
    @observable private showControls = false;
    @observable private hideGenomicAlterations = false;
    @observable public yAxis: 'alt-freq' | 'abs-count' = 'alt-freq';
    @observable private xAxis: 'y-axis' | 'x-axis' = 'y-axis';
    @observable public altCasesValue = 0;
    @observable public totalCasesValue = 0;
    @observable public tempTotalCasesValue = 0;
    @observable public tempAltCasesValue = 0;
    @observable private viewCountsByCancerSubType = false;

    constructor(props: ICancerSummaryContentProps) {
        super();
        this.handleYAxisChange = this.handleYAxisChange.bind(this);
        this.handleXAxisChange = this.handleXAxisChange.bind(this);
        this.handleGenomicCheckboxChange = this.handleGenomicCheckboxChange.bind(this);
        this.handleCancerTypeCheckboxChange = this.handleCancerTypeCheckboxChange.bind(this);
        this.handleAltSliderChange = this.handleAltSliderChange.bind(this);
        this.handleTotalSliderChange = this.handleTotalSliderChange.bind(this);
        this.handleAltSliderChangeComplete = this.handleAltSliderChangeComplete.bind(this);
        this.handleTotalSliderChangeComplete = this.handleTotalSliderChangeComplete.bind(this);
        this.handleAltInputChange = this.handleAltInputChange.bind(this);
        this.handleAltInputKeyPress = this.handleAltInputKeyPress.bind(this);
        this.handleTotalInputChange = this.handleTotalInputChange.bind(this);
        this.handleTotalInputKeyPress = this.handleTotalInputKeyPress.bind(this);
        this.toggleShowControls = this.toggleShowControls.bind(this);
        this.setPngAnchor = this.setPngAnchor.bind(this);
    }

    private chartComponent:any;

    get countsData() {
        return this.props.groupedAlterationData;
    }

    public getYValue(count:number, total:number) {
        return (this.yAxis === "abs-count") ? count : (count / total) * 100;
    }

    determineSorterAndDirection(): { sorter:(item:any)=>number|string, dir:'asc'| 'desc' } {
        const sortByPercentage = (key:string) => {
            const alterationCountsData: IAlterationData = this.countsData[key];
            return alterationCountsData.alteredSampleCount / alterationCountsData.sampleTotal;
        };
        const sortByAbsoluteCount = (key:string) => {
            const alterationCountsData: IAlterationData = this.countsData[key];
            return alterationCountsData.alteredSampleCount
        };
        const sortByLabel = (key:string) => {
            return key;
        }
        let sorter;
        let dir: 'asc' | 'desc';
        if (this.xAxis === 'x-axis') {
            sorter = sortByLabel;
            dir = 'asc' as 'asc';
        } else {
            sorter = (this.yAxis === "abs-count") ? sortByAbsoluteCount : sortByPercentage;
            dir = 'desc' as 'desc';
        }
        return { sorter, dir };
    }

    @computed
    get chartData(): ICancerSummaryChartData  {

        const { dir, sorter } = this.determineSorterAndDirection();

        const representedAlterations: { [alterationType: string]: boolean } = {};
   
        const groupKeysSorted = _.chain(this.countsData)
            .keys()
            .orderBy(sorter, [dir])
            .value();

        let maxPercentage = 0;
        let maxAbsoluteCount = 0;
        let maxSampleCount = 0;

        const labels:string[] = [];

        // for each alteration type stack, we need the collection of different group types
        const retData = _.map(OrderedAlterationLabelMap, (alterationLabel, alterationKey) => {
            return _.reduce(groupKeysSorted, (memo, groupKey) => {
                // each of these represents a bucket along x-axis (e.g. cancer type or cancer study)
                const alterationData = this.countsData[groupKey];

                const alterationPercentage = calculatePercentage(alterationData.alteredSampleCount,alterationData.sampleTotal);

                //console.log("me", this.tempAltCasesValue);

                let meetsAlterationThreshold;

                if (this.yAxis === "abs-count") {
                    meetsAlterationThreshold = alterationData.alteredSampleCount >= this.tempAltCasesValue;
                } else {
                    meetsAlterationThreshold = alterationPercentage >= this.tempAltCasesValue;
                }

                const meetsSampleTotalThreshold = alterationData.sampleTotal >= this.totalCasesValue;

                // if we don't meet the threshold set by the user in the custom controls, don't put data in (default 0)
                if (meetsAlterationThreshold && meetsSampleTotalThreshold) {
                    // now we push label into collection

                    if (this.props.labelTransformer) {
                        labels.push(this.props.labelTransformer(groupKey))
                    } else {
                        labels.push(groupKey)
                    }

                    // update maxes if item exceeds memoized
                    maxPercentage = (alterationPercentage > maxPercentage) ? alterationPercentage : maxPercentage;
                    maxAbsoluteCount = (alterationData.alteredSampleCount > maxAbsoluteCount) ? alterationData.alteredSampleCount : maxAbsoluteCount;
                    maxSampleCount = (alterationData.sampleTotal > maxSampleCount) ? alterationData.sampleTotal : maxSampleCount;

                    const alterationCount = (alterationData.alterationTypeCounts as any)[alterationKey];

                    // we want to keep track of what alterationTypes are actually
                    // present in this dataset
                    if (alterationCount > 0) {
                        representedAlterations[alterationKey] = true;
                    }

                    memo.push({
                        alterationType: alterationKey,
                        x: (this.props.labelTransformer) ? this.props.labelTransformer(groupKey) : groupKey,
                        xKey: groupKey,
                        y: this.getYValue(alterationCount, alterationData.sampleTotal)
                    });
                }

                return memo;
            }, [] as { x: string, y: number, xKey:string, alterationType: string }[]);
        });

        return { labels:_.uniq(labels), data: retData, representedAlterations, maxPercentage , maxAbsoluteCount, maxSampleCount };

    }

    @computed
    public get altCasesMax() {
        return (this.yAxis === "abs-count") ? this.chartData.maxAbsoluteCount : this.chartData.maxPercentage;
    }

    @computed
    private get totalCasesMax() {
        return this.chartData.maxSampleCount;
    }

    @computed
    private get hasAlterations() {
        return _.reduce(this.countsData, (count, alterationData: IAlterationData) => {
            return count + alterationData.alterationTotal;
        }, 0) > 0;
    }

    private transformLabel(str: string) {
        if (this.props.labelTransformer) {
            return this.props.labelTransformer(str);
        } else {
            return str;
        }
    }

    public handleYAxisChange(e: any) {
        this.yAxis = e.target.value;
        this.altCasesValue = 0;
        this.handleAltSliderChange(0);
    }

    public handleXAxisChange(e: any) {
        this.xAxis = e.target.value;
    }

    private handleCancerTypeCheckboxChange() {
        this.viewCountsByCancerSubType = (this.viewCountsByCancerSubType === false);
    }

    private handleGenomicCheckboxChange() {
        this.hideGenomicAlterations = !this.hideGenomicAlterations;
    }

    private handleAltSliderChange(value: number) {
        this.tempAltCasesValue = value;
        this.tempAltCasesInputValue = value;
    }

    private handleTotalSliderChange(value: number) {
        this.tempTotalCasesValue = value;
        this.tempTotalCasesInputValue = value;
    }

    private handleAltInputKeyPress(target: any) {
        if (target.charCode === 13) {
            if (isNaN(this.tempAltCasesInputValue)) {
                this.tempAltCasesInputValue = 0;
                return;
            }
            //removes leading 0s
            this.tempAltCasesInputValue = Number(this.tempAltCasesInputValue);
            this.tempAltCasesValue = this.tempAltCasesInputValue;
            this.handleAltSliderChangeComplete();
        }
    }

    private handleTotalInputKeyPress(target: any) {
        if (target.charCode === 13) {
            if (isNaN(this.tempTotalCasesInputValue)) {
                this.tempTotalCasesInputValue = 0;
                return;
            }
            //removes leading 0s
            this.tempTotalCasesInputValue = Number(this.tempTotalCasesInputValue);
            this.tempTotalCasesValue = this.tempTotalCasesInputValue;
            this.handleTotalSliderChangeComplete();
        }
    }

    private handleAltInputChange(e: any) {
        this.tempAltCasesInputValue = e.target.value.replace(/[^0-9\.]/g, '');
    }

    private handleTotalInputChange(e: any) {
        this.tempTotalCasesInputValue = e.target.value.replace(/[^0-9\.]/g, '');
    }

    private handleAltSliderChangeComplete() {
        this.altCasesValue = this.tempAltCasesValue;
    }

    private handleTotalSliderChangeComplete() {
        this.totalCasesValue = this.tempTotalCasesValue;
    }

    private toggleShowControls() {
        this.showControls = !this.showControls;
    }

    public setPngAnchor(href: string) {
        this.pngAnchor = href;
    }

    @computed public get controls(){

        const symbol = this.yAxis === 'alt-freq' ? '%' : '';

        return (

            <div style={{display: 'flex'}} className="cancer-summary--form-controls">

                <div>
                    <FormGroup>
                        <ControlLabel>Y-Axis Value:</ControlLabel>
                        <FormControl componentClass="select" data-test="cancerSummaryYAxisSelect" onChange={this.handleYAxisChange}
                                     ref={(el: any) => this.inputYAxisEl = el}>
                            <option value="alt-freq">Alteration Frequency</option>
                            <option value="abs-count">Absolute Counts</option>
                        </FormControl>
                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>Sort X-Axis By:</ControlLabel>
                        <FormControl componentClass="select" data-test="cancerSummaryXAxisSelect" onChange={this.handleXAxisChange}
                                     ref={(el: any) => this.inputXAxisEl = el}>
                            <option value="y-axis">Y-Axis Values</option>
                            <option value="x-axis">Alphabetically</option>
                        </FormControl>
                    </FormGroup>
                </div>

                <div style={{width: 400}}>
                    <div className="slider-holder">
                        <FormGroup>
                            <ControlLabel>Min. # Total Cases:</ControlLabel>
                            <div className='slider custom-labels'>
                                <Slider
                                    min={0}
                                    max={this.totalCasesMax}
                                    value={this.tempTotalCasesValue}
                                    labels={{0: 0, [this.totalCasesMax]: this.totalCasesMax}}
                                    onChange={this.handleTotalSliderChange}
                                    onChangeComplete={this.handleTotalSliderChangeComplete}
                                />
                            </div>
                        </FormGroup>
                        <FormGroup>
                            <ControlLabel className="invisible">Hidden</ControlLabel>
                            <FormControl type="text" value={this.tempTotalCasesInputValue}
                                         data-test="sampleTotalThresholdInput"
                                         onChange={this.handleTotalInputChange}
                                         onKeyPress={this.handleTotalInputKeyPress}/>
                        </FormGroup>
                    </div>
                    <div className="slider-holder">
                        <FormGroup>
                            <ControlLabel>{`Min. ${this.yAxis === 'alt-freq' ? '%' : '#'} Altered Cases:`}</ControlLabel>
                            <div className='slider custom-labels'>
                                <Slider
                                    min={0}
                                    max={this.altCasesMax}
                                    value={this.tempAltCasesValue}
                                    labels={{0: 0 + symbol, [this.altCasesMax]: Math.ceil(this.altCasesMax) + symbol}}
                                    format={(val: string) => val + symbol}
                                    onChange={this.handleAltSliderChange}
                                    onChangeComplete={this.handleAltSliderChangeComplete}
                                />
                            </div>
                        </FormGroup>
                        <FormGroup>
                            <ControlLabel className="invisible">Hidden</ControlLabel>
                            <FormControl type="text" value={this.tempAltCasesInputValue + symbol}
                                         onChange={this.handleAltInputChange}
                                         data-test="alterationThresholdInput"
                                         onKeyPress={this.handleAltInputKeyPress}/>
                        </FormGroup>
                    </div>
                </div>

                <div>
                    <Checkbox checked={!this.hideGenomicAlterations} onChange={this.handleGenomicCheckboxChange}>
                        Show Genomic Alteration Types
                    </Checkbox>
                </div>
            </div>)
    }

    public render() {
        return (
            <If condition={this.hasAlterations}>
                <Then>
                    <div>

                        <div className={'cancer-summary--main-options'}>

                            <ButtonGroup>
                                {
                                    GroupByOptions.map((option, i) => {
                                        return <Radio
                                            checked={option.value === this.props.groupAlterationsBy}
                                            onChange={(e) => {
                                                this.props.handlePivotChange($(e.target).attr("data-value"))
                                            }}
                                            inline
                                            data-value={option.value}
                                        >{option.label}</Radio>
                                    })
                                }
                            </ButtonGroup>
                        </div>

                        <div role="group" className="btn-group cancer-summary--chart-buttons">
                            <button onClick={this.toggleShowControls} className="btn btn-default btn-xs">Customize <i
                                className="fa fa-cog" aria-hidden="true"></i></button>
                        </div>

                        <Panel className={classnames({hidden: !this.showControls}, 'cancer-summary-secondary-options')}>
                            <button type="button" onClick={this.toggleShowControls} className="close">×</button>
                            {this.controls}
                        </Panel>

                        <CancerSummaryChart key={Date.now()}
                                        data={this.chartData.data}
                                        ref={(el:any)=>this.chartComponent = el}
                                        countsByGroup={this.countsData}
                                        representedAlterations={this.chartData.representedAlterations}
                                        alterationTypes={OrderedAlterationLabelMap}
                                        isPercentage={(this.yAxis === "alt-freq")}
                                        colors={alterationToColor}
                                        hideGenomicAlterations={this.hideGenomicAlterations}
                                        xLabels={this.chartData.labels}/>

                    </div>
                </Then>
                <Else>
                    <div className="alert alert-info">There are no alterations in this gene.</div>
                </Else>
            </If>

        );
    }
}
