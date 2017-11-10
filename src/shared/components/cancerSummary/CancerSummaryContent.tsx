import * as React from "react";
import * as _ from 'lodash';
import {Checkbox, ButtonGroup, Panel, Radio } from 'react-bootstrap';
import {computed, observable} from "mobx";
import {observer} from "mobx-react";
import Slider from 'react-rangeslider';
import Select from 'react-select';
import {FormGroup, ControlLabel, FormControl} from 'react-bootstrap';
import jsPDF from 'jspdf';
import {If, Then, Else} from 'react-if';
import classnames from 'classnames';

import 'react-select/dist/react-select.css';
import 'react-rangeslider/lib/index.css';

import SummaryBarGraph from './SummaryBarGraph';
import {ExtendedSample} from "../../../pages/resultsView/ResultsViewPageStore";

const orderedLabels: Record<keyof IAlterationCountMap, string> = {
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

export interface IBarGraphDataset {
    label: string;
    totalCases: number;
    altTotalPercent: number;
    total: number;
    count: number;
    percent: number;
    backgroundColor: string;
}

export interface IBarChartSortedData {
    data: IBarGraphDataset[];
    label: string;
    sortCount: number;
    sortBy: string;
    symbol: string;
}

export interface IBarGraphConfigOptions {
    labels: string[];
    datasets: IBarGraphDataset[];
}

interface ICancerSummaryContentProps {
    dataByCancerSubType?: {
        [cancerType: string]: IAlterationData
    };
    dataByCancerType?: {
        [cancerType: string]: IAlterationData
    };
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
    {value: 'cancerTypeDetailed', label: 'Detailed Cancer Type'}
];

@observer
export class CancerSummaryContent extends React.Component<ICancerSummaryContentProps, {}> {

    private inputYAxisEl: any;
    private inputXAxisEl: any;
    @observable private tempAltCasesInputValue = 0;
    @observable private tempTotalCasesInputValue = 0;
    @observable private pngAnchor = '';
    @observable private pdf: { anchor: string; width: number; height: number } = {anchor: '', width: 0, height: 0};
    @observable private showControls = false;
    @observable private showGenomicAlt = true;
    @observable private yAxis: 'alt-freq' | 'abs-count' = 'alt-freq';
    @observable private xAxis: 'y-axis' | 'x-axis' = 'y-axis';
    @observable private multiSelectValue: string = this.cancerTypes[0].value;
    @observable private multiSelectOptions = this.cancerTypes;
    @observable private altCasesValue = 0;
    @observable private totalCasesValue = 0;
    @observable private tempTotalCasesValue = 0;
    @observable private tempAltCasesValue = 0;
    @observable private viewCountsByCancerSubType = false;

    constructor(props: ICancerSummaryContentProps) {
        super(props);

        this.handleYAxisChange = this.handleYAxisChange.bind(this);
        this.handleXAxisChange = this.handleXAxisChange.bind(this);
        this.handleGenomicCheckboxChange = this.handleGenomicCheckboxChange.bind(this);
        this.handleCancerTypeCheckboxChange = this.handleCancerTypeCheckboxChange.bind(this);
        this.handleSelectChange = this.handleSelectChange.bind(this);
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
        this.setPdfProperties = this.setPdfProperties.bind(this);
        this.downloadPdf = this.downloadPdf.bind(this);
        this.resetSliders = this.resetSliders.bind(this);
    }

    public componentWillMount() {
        //if there is only one cancer type, then we want to default to show cancer sub types
    }

    @computed
    get onlyOneSelected() {
        return this.multiSelectValue !== "all";
    }

    @computed
    get countsData() {
        return this.props.groupedAlterationData;
        //return (this.viewCountsByCancerSubType || this.onlyOneSelected)? this.props.dataByCancerSubType : this.props.dataByCancerType;
    }

    @computed
    get barChartTitle() {
        const type = _.find(GroupByOptions,{ value:this.props.groupAlterationsBy })!.label;
        return `${type} Summary`;
    }

    @computed
    get barChartDatasets(): IBarChartSortedData[] {
        return _.reduce(this.countsData, (accum, alterationData, groupKey) => {
            const cancerAlterations = alterationData.alterationTypeCounts;
            let altTotalPercent = (alterationData.alteredSampleCount / alterationData.sampleTotal) * 100;
            if (alterationData.sampleTotal >= this.totalCasesValue) {
                const datasets = _.reduce(cancerAlterations as any, (memo, count: number, altType: string) => {
                    let percent = (count / alterationData.sampleTotal) * 100;
                    const total = (this.yAxis === "abs-count") ? count : percent;
                    memo.push({
                        label: altType,
                        totalCases: alterationData.sampleTotal,
                        altTotalPercent,
                        total,
                        count,
                        percent,
                        backgroundColor: this.getColors(altType)
                    });
                    return memo;
                }, [] as IBarGraphDataset[]);
                const orderedAlts = _.keys(orderedLabels);
                const sortedDatasets = datasets.sort((a: IBarGraphDataset, b: IBarGraphDataset) => {
                    return orderedAlts.indexOf(a.label) - orderedAlts.indexOf(b.label);
                });
                accum.push({
                    label: groupKey,
                    sortBy: this.yAxis,
                    symbol: this.yAxis === "abs-count" ? '' : "%",
                    sortCount: this.yAxis === "abs-count" ? alterationData.alteredSampleCount : altTotalPercent,
                    data: sortedDatasets
                });
            }
            return accum;
        }, [] as IBarChartSortedData[]);
    }

    private handleYAxisChange(e: any) {
        this.yAxis = e.target.value;
        this.resetSliders();
    }

    private handleXAxisChange(e: any) {
        this.xAxis = e.target.value;
        this.resetSliders();
    }

    private resetSliders() {
        this.altCasesValue = 0;
        this.totalCasesValue = 0;
        this.handleAltSliderChange(0);
        this.handleTotalSliderChange(0);
    }

    private handleCancerTypeCheckboxChange() {
        this.viewCountsByCancerSubType = (this.viewCountsByCancerSubType === false);
    }

    private handleGenomicCheckboxChange() {
        this.showGenomicAlt = !this.showGenomicAlt;
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

    private getColors(color: string) {
        const alterationToColor: Record<keyof IAlterationCountMap, string> = {
            mutated: "#008000",
            amp: "#ff0000",
            homdel: "rgb(0,0,255)",
            hetloss: "#000",
            gain: "rgb(255,182,193)",
            fusion: "#8B00C9",
            mrnaExpressionUp: "#FF989A",
            mrnaExpressionDown: "#529AC8",
            protExpressionUp: "#FF989A",
            protExpressionDown: "#E0FFFF",
            multiple: "#666"
        };
        // TODO: fix ts index signature issue so we don't have to cast alterationToColor as any
        return this.showGenomicAlt ? ((alterationToColor as any)[color] || "#000000") : '#aaaaaa';
    }

    @computed
    private get cancerTypes() {
        // build array of cancer type options and sort alphabetically
        const sortedCancerTypes = Object.keys(this.countsData).map(point => (
            {label: point, value: point}
        )).sort();

        return [{label: 'All', value: 'all'},
            ...sortedCancerTypes
        ];
    }

    @computed
    private get altCasesMax() {
        return Math.max(...this.barChartDatasets.map(data => data.sortCount));
    }

    // @computed private get selectedCancerTypes() {
    //     const multiSelectValuesArray = this.multiSelectValue.toLowerCase().split(",");
    //     return _.reduce(this.props.dataByCancerType, (accum, value, key) => {
    //             accum[key] = !!_.intersection(["all", "", key.toLowerCase()], multiSelectValuesArray).length;
    //             return accum;
    //         }, {} as any);
    // }

    @computed
    private get totalCasesMax() {
        return Math.max(
            ..._.map(
                this.countsData,
                (cancer: IAlterationData) => cancer.sampleTotal));
    }

    @computed
    private get chartData() {
        const {barChartDatasets: datasets, xAxis, altCasesValue} = this;

        const orderedDatasets = _.orderBy(datasets,
            [xAxis === "y-axis" ? 'sortCount' : 'label'],
            [xAxis === "y-axis" ? 'desc' : 'asc']);

        const flattenedDatasets = _.flatten(
            orderedDatasets.filter(dataPoint => dataPoint.sortCount && dataPoint.sortCount >= altCasesValue)
                .map((orderedDataset, i) => (
                    orderedDataset.data.map(dataPoint => (
                        {
                            ...dataPoint,
                            data: i === 0 ? [dataPoint.total] : [...Array(i).fill(0), dataPoint.total]
                        }
                    ))
                ))
        );

        const labels = _.reduce(orderedDatasets, (accum, data) => {
            if (data.sortCount >= this.altCasesValue) accum.push(data.label);
            return accum;
        }, [] as string[]);

        return {
            labels: labels,
            datasets: flattenedDatasets
        };
    }

    @computed
    private get hasAlterations() {
        return _.reduce(this.countsData, (count, alterationData: IAlterationData) => {
            return count + alterationData.alterationTotal;
        }, 0) > 0;
    }

    private handleSelectChange(value: any) {
        const values = value.split(",");
        if (_.last(values) === "all") {
            this.multiSelectValue = "all";
            return;
        } else if (values[0] === "all" && values.length > 1) {
            this.multiSelectValue = values.slice(1).join(",");
            return;
        } else this.multiSelectValue = value;
        this.resetSliders();
    }

    public setPngAnchor(href: string) {
        this.pngAnchor = href;
    }

    public setPdfProperties(anchor: string, width: number = 1100, height: number = 600) {
        this.pdf = {anchor, width, height};
    }

    private downloadPdf() {
        const {anchor, width, height} = this.pdf;
        let orientation = 'p';
        if (width > height) {
            orientation = 'l';
        }
        const pdf = new jsPDF({orientation, unit: 'mm', format: [width * 0.264583, height * 0.264583]});
        pdf.addImage(anchor, 'JPEG', 0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height)
            .save("cBioPortalCancerSummary.pdf");
    }

    public render() {

        const {totalCasesMax, altCasesMax, yAxis} = this;
        const altMax = altCasesMax;
        const symbol = yAxis === 'alt-freq' ? '%' : '';
        const controls = (

            <div style={{display: 'flex'}} className="cancer--summary-form-controls">

                <div>
                    <FormGroup>
                        <ControlLabel>Y Axis Value:</ControlLabel>
                        <FormControl componentClass="select" onChange={this.handleYAxisChange}
                                     ref={(el: any) => this.inputYAxisEl = el}>
                            <option value="alt-freq">Alteration Frequency</option>
                            <option value="abs-count">Absolute Counts</option>
                        </FormControl>
                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>Sort X Axis By:</ControlLabel>
                        <FormControl componentClass="select" onChange={this.handleXAxisChange}
                                     ref={(el: any) => this.inputXAxisEl = el}>
                            <option value="y-axis">Y-Axis Values</option>
                            <option value="x-axis">X-Axis Values</option>
                        </FormControl>
                    </FormGroup>
                </div>

                <div style={{width:400}}>
                    <div className="slider-holder">
                        <FormGroup>
                            <ControlLabel>{`Min. ${yAxis === 'alt-freq' ? '%' : '#'} Altered Cases:`}</ControlLabel>
                            <div className='slider custom-labels'>
                                <Slider
                                    min={0}
                                    max={altMax}
                                    value={this.tempAltCasesValue}
                                    labels={{0: 0 + symbol, [altMax]: Math.ceil(altMax) + symbol}}
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
                                         onKeyPress={this.handleAltInputKeyPress}/>
                        </FormGroup>
                    </div>

                    <div className="slider-holder">
                        <FormGroup>
                            <ControlLabel>Min. # Total Cases:</ControlLabel>
                            <div className='slider custom-labels'>
                                <Slider
                                    min={0}
                                    max={totalCasesMax}
                                    value={this.tempTotalCasesValue}
                                    labels={{0: 0, [totalCasesMax]: totalCasesMax}}
                                    onChange={this.handleTotalSliderChange}
                                    onChangeComplete={this.handleTotalSliderChangeComplete}
                                />
                            </div>
                        </FormGroup>
                        <FormGroup>
                            <ControlLabel className="invisible">Hidden</ControlLabel>
                            <FormControl type="text" value={this.tempTotalCasesInputValue}
                                         onChange={this.handleTotalInputChange}
                                         onKeyPress={this.handleTotalInputKeyPress}/>
                        </FormGroup>
                    </div>
                </div>

                <div>
                    <Checkbox checked={this.showGenomicAlt} onChange={this.handleGenomicCheckboxChange}>
                        Show Genomic Alteration Types
                    </Checkbox>
                </div>

            </div>

        );

        return (
            <If condition={this.hasAlterations}>
                <Then>
                    <div>

                        <div className={'cancer-summary-main-options'}>
                            {/*<Select*/}
                                {/*simpleValue*/}
                                {/*name="form-field-name"*/}
                                {/*value={this.props.groupAlterationsBy}*/}
                                {/*options={groupByOptions}*/}
                                {/*onChange={(e)=>this.props.handlePivotChange(e)}*/}
                            {/*/>*/}

                            <ButtonGroup>
                                {
                                    GroupByOptions.map((option, i)=>{
                                        return <Radio
                                            checked={option.value === this.props.groupAlterationsBy}
                                            onChange={(e)=>{  this.props.handlePivotChange($(e.target).attr("data-value"))  }}
                                            inline
                                            data-value={option.value}
                                            name="groupOptions">{option.label}</Radio>
                                    })
                                }
                            </ButtonGroup>


                        </div>


                        <div role="group" className="btn-group cancer-summary-">
                            <button onClick={this.toggleShowControls} className="btn btn-default btn-xs">Customize <i
                                className="fa fa-cog" aria-hidden="true"></i></button>
                            <a className={`btn btn-default btn-xs ${this.pngAnchor ? '' : ' disabled'}`}
                               href={this.pngAnchor} download="cBioPortalCancerSummary.png">
                                PNG <i className="fa fa-cloud-download" aria-hidden="true"></i>
                            </a>
                            {/*
                            <button className={`btn btn-default btn-xs ${this.pdf.anchor ? '': ' disabled'}`}
                               onClick={this.downloadPdf}>
                                PDF <i className="fa fa-cloud-download" aria-hidden="true"></i>
                            </button>
                           */}
                        </div>

                        <Panel className={classnames({ hidden:!this.showControls  }, 'cancer-summary-secondary-options')}>
                            <button type="button" onClick={this.toggleShowControls} className="close">×</button>
                            {controls}
                        </Panel>

                        <SummaryBarGraph data={this.chartData} yAxis={this.yAxis} xAxis={this.xAxis}
                                         gene={this.props.gene} width={this.props.width}
                                         setPdfProperties={this.setPdfProperties} setPngAnchor={this.setPngAnchor}
                                         legend={this.showGenomicAlt}
                                         title={ this.barChartTitle }
                                         orderedLabels={orderedLabels} altCasesMax={this.altCasesMax}
                        />

                    </div>
                </Then>
                <Else>
                    <div className="alert alert-info">There are no alterations in this gene.</div>
                </Else>
            </If>

        );
    }
}
