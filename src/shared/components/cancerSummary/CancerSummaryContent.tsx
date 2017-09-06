import * as React from "react";
import * as _ from 'lodash';
import {Checkbox} from 'react-bootstrap';
import {computed, observable} from "mobx";
import {observer} from "mobx-react";
import Slider from 'react-rangeslider';
import Select from 'react-select';
import {FormGroup, ControlLabel, FormControl} from 'react-bootstrap';
import jsPDF from 'jspdf';

import 'react-select/dist/react-select.css';
import 'react-rangeslider/lib/index.css';

import SummaryBarGraph from './SummaryBarGraph';

export interface ICancerTypeAlterationPlotData {
    mutated:number;
    amplified:number;
    deleted:number;
    multiple:number;
}

export interface IBarGraphDataset {
    label: string;
    totalCases: number;
    altTotalPercent: number;
    total: number;
    count: number;
    percent: number;
    data: number[];
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
    datasets: IBarGraphDataset[];
}

export interface ICancerTypeAlterationData extends ICancerTypeAlterationPlotData {
    total:number;
}

interface ICancerSummaryContentProps {
    data: {
        [cancerType:string]:ICancerTypeAlterationData
    };
}


@observer
export class CancerSummaryContent extends React.Component<ICancerSummaryContentProps, {}> {

    private inputYAxisEl:any;
    private inputXAxisEl:any;
    @observable private pngAnchor = '';
    @observable private pdfAnchor = '';
    @observable private showControls = false;
    @observable private showGenomicAlt = true;
    @observable private yAxis: 'alt-freq' | 'abs-count' = 'alt-freq';
    @observable private xAxis: 'y-axis' | 'can-types' = 'y-axis';
    @observable private multiSelectValue:string = this.cancerTypes[0].value;
    @observable private multiSelectOptions = this.cancerTypes;
    @observable private altCasesValue = 0;
    @observable private totalCasesValue = 0;

    constructor(props:ICancerSummaryContentProps) {
        super(props);

        this.handleYAxisChange = this.handleYAxisChange.bind(this);
        this.handleXAxisChange = this.handleXAxisChange.bind(this);
        this.handleAltSliderChange = this.handleAltSliderChange.bind(this);
        this.handleGenomicCheckboxChange = this.handleGenomicCheckboxChange.bind(this);
        this.handleSelectChange = this.handleSelectChange.bind(this);
        this.handleTotalSliderChange = this.handleTotalSliderChange.bind(this);
        this.toggleShowControls = this.toggleShowControls.bind(this);
        this.setPngAnchor = this.setPngAnchor.bind(this);
        this.setPdfAnchor = this.setPdfAnchor.bind(this);
        this.downloadPdf = this.downloadPdf.bind(this);
        this.resetSliders = this.resetSliders.bind(this);
    }

    @computed get barChartDatasets():IBarChartSortedData[] {
        const {data} = this.props;
        const {yAxis} = this;
        return _.reduce(data, (accum, cancer:ICancerTypeAlterationData, cancerType:string) => {
            const totalCases = cancer.total;
            const cancerAlterations:ICancerTypeAlterationPlotData | {} = _.omit(cancer, ['total']);
            const altTotalCount = _.reduce(cancerAlterations, (total:number, value:number) => total + value, 0);
            const altTotalPercent = _.round((altTotalCount / totalCases * 100), 1);
            if (this.selectedCancerTypes[cancerType] && totalCases >= this.totalCasesValue) {
                accum.push({
                    label: cancerType,
                    sortBy: yAxis,
                    symbol: yAxis === "abs-count" ? '' : "%",
                    sortCount: yAxis === "abs-count" ? altTotalCount : altTotalPercent,
                    data: _.map(cancerAlterations, (count:number, altType: string) => {
                        const percent = count / totalCases * 100;
                        const total = yAxis === "abs-count" ? count : percent;
                        return {
                            label: altType,
                            totalCases,
                            altTotalPercent,
                            total,
                            count,
                            percent,
                            backgroundColor: this.getColors(altType)
                        };
                    })
                });
            }
            return accum;
        }, [] as any[]);
    }

    private handleYAxisChange(e:any) {
        this.yAxis = e.target.value;
        this.resetSliders();
    }

    private handleXAxisChange(e:any) {
        this.xAxis = e.target.value;
        this.resetSliders();
    }

    private resetSliders() {
        this.altCasesValue = 0;
        this.totalCasesValue = 0;
    }

    private handleGenomicCheckboxChange() {
        this.showGenomicAlt = !this.showGenomicAlt;
    }

    private handleAltSliderChange(value:number) {
        this.altCasesValue = value;
    }

    private handleTotalSliderChange(value:number) {
        this.totalCasesValue = value;
    }

    private toggleShowControls() {
        this.showControls = !this.showControls;
    }

    private getColors(color:string) {
        const colors:{[id:string]:string} = {
            mutated:"#36a2eb",
            amplified:"#ff6384",
            deleted:"#ffce56",
            multiple:"#cc65fe",
        };
        return this.showGenomicAlt ? (colors[color] || "#4BC0C0") : '#aaaaaa';
    }

    @computed private get cancerTypes() {
        return [{label: 'All', value: 'all'},
            ...Object.keys(this.props.data).map(point => (
                {label: point, value: point}
            ))
        ];
    }

    @computed private get altCasesMax() {
        return Math.floor(Math.max(...this.barChartDatasets.map(data => data.sortCount)));
    }

    @computed private get selectedCancerTypes() {
        const multiSelectValuesArray = this.multiSelectValue.toLowerCase().split(",");
        return _.reduce(this.props.data, (accum, value, key) => {
                accum[key] = !!_.intersection(["all", "", key.toLowerCase()], multiSelectValuesArray).length;
                return accum;
            }, {} as any);
    }

    @computed private get totalCasesMax() {
        return Math.max(
                ..._.map(
                    _.filter(this.props.data, (unusedData, label) => this.selectedCancerTypes[label]),
                    (cancer:ICancerTypeAlterationData) => cancer.total));
    }

    @computed private get chartData() {
        const {barChartDatasets:datasets, xAxis, altCasesValue} = this;

        const orderedDatasets = _.orderBy(datasets,
                                    [xAxis === "y-axis" ? 'sortCount': 'label'],
                                    [xAxis === "y-axis" ? 'desc' : 'asc']);

        const flattenedDatasets = _.flatten(
            orderedDatasets.filter(dataPoint => dataPoint.sortCount >= altCasesValue)
                            .map((orderedDataset, i) => (
                            orderedDataset.data.map(dataPoint => (
                                {
                                    ...dataPoint,
                                    data: i === 0 ? [dataPoint.total] : [...Array(i).fill(0), dataPoint.total]
                                }
                            ))
            ))
        );

        return {
            labels: orderedDatasets.map(dataset => dataset!.label),
            datasets: flattenedDatasets
        };
    }

    private handleSelectChange (value: any) {
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

    public setPngAnchor(href:string) {
        this.pngAnchor = href;
    }

    public setPdfAnchor(dataURL:string) {
        this.pdfAnchor = dataURL;
    }

    private downloadPdf() {
        const pdf = new jsPDF('l')
            .addImage(this.pdfAnchor, 'JPEG', 0, 0)
            .save("cBioPortalCancerSummary.pdf");
    }

    public render() {
        const {totalCasesMax, altCasesMax, yAxis} = this;
        const altMax = altCasesMax;
        const symbol = yAxis === 'alt-freq' ? '%' : '';
        const controls = this.showControls ? (
            <span>
                <div className="form-section">
                    <FormGroup>
                        <ControlLabel>Cancer Type(s):</ControlLabel>
                        <Select multi simpleValue
                                value={this.multiSelectValue} placeholder="Select cancer types"
                                options={this.multiSelectOptions} onChange={this.handleSelectChange} />
                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>Y Axis Value:</ControlLabel>
                        <FormControl componentClass="select" onChange={this.handleYAxisChange} ref={(el:any) => this.inputYAxisEl = el }>
                            <option value="alt-freq">Alteration Frequency</option>
                            <option value="abs-count">Absolute Counts</option>
                        </FormControl>
                    </FormGroup>
                    <div className="slider-holder">
                        <FormGroup>
                            <ControlLabel>{`Min. ${yAxis === 'alt-freq' ? '%' : '#'} Altered Cases:`}</ControlLabel>
                            <div className='slider custom-labels'>
                                <Slider
                                    min={0}
                                    max={altMax}
                                    value={this.altCasesValue}
                                    labels={{0:0 + symbol, [altMax]:altMax + symbol}}
                                    format={(val:string) => val + symbol}
                                    onChange={this.handleAltSliderChange}
                                />
                            </div>
                        </FormGroup>
                        <FormGroup>
                            <FormControl type="text" value={this.altCasesValue + symbol}/>
                        </FormGroup>
                    </div>
                </div>
                <div className="form-section">
                    <FormGroup>
                        <Checkbox checked={this.showGenomicAlt} onChange={this.handleGenomicCheckboxChange}>
                            Show Genomic Alteration Types
                        </Checkbox>
                    </FormGroup>
                    <FormGroup >
                        <ControlLabel>X Axis Value:</ControlLabel>
                        <FormControl componentClass="select" onChange={this.handleXAxisChange} ref={(el:any) => this.inputXAxisEl = el }>
                            <option value="y-axis">Y-Axis Values</option>
                            <option value="can-types">Cancer Types</option>
                        </FormControl>
                    </FormGroup>
                    <div className="slider-holder">
                        <FormGroup>
                            <ControlLabel>Min. # Total Cases:</ControlLabel>
                            <div className='slider custom-labels'>
                                <Slider
                                    min={0}
                                    max={totalCasesMax}
                                    value={this.totalCasesValue}
                                    labels={{0:0, [totalCasesMax]:totalCasesMax}}
                                    onChange={this.handleTotalSliderChange}
                                />
                            </div>
                        </FormGroup>
                        <FormGroup>
                            <FormControl type="text" value={this.totalCasesValue}/>
                        </FormGroup>
                    </div>
                </div>
            </span>
        ) : null;
        return (
            <div>
                <div className="btn-row">
                    <button onClick={this.toggleShowControls} className="btn btn-primary">Customize Histogram</button>
                    <a type="button" className={`btn btn-primary${this.pngAnchor ? '': ' disabled'}`}
                        href={this.pngAnchor} download="cBioPortalCancerSummary.png">
                        PNG
                    </a>
                    <a type="button" className={`btn btn-primary${this.pdfAnchor ? '': ' disabled'}`}
                       onClick={this.downloadPdf}>
                        PDF
                    </a>
                </div>
                {controls}
                <SummaryBarGraph data={this.chartData} yAxis={this.yAxis} xAxis={this.xAxis}
                                 setPdfAnchor={this.setPdfAnchor} setPngAnchor={this.setPngAnchor} legend={this.showGenomicAlt}/>
            </div>
        );
    }
}
