import * as React from "react";
import * as _ from 'lodash';
import {computed, observable} from "mobx";
import { ChartTooltipItem } from 'chart.js';
import Chart, {ChartLegendItem} from 'chart.js';
import {IBarGraphConfigOptions, IBarGraphDataset} from './CancerSummaryContent';
import {observer} from "mobx-react";
import classnames from 'classnames';
import './styles.scss';

interface ISummaryBarGraphProps {
    data: IBarGraphConfigOptions;
    yAxis: 'alt-freq' | 'abs-count';
    xAxis: 'y-axis' | 'can-types';
    legend: boolean;
    setPngAnchor:any;
    setPdfAnchor:any;
    gene: string;
}

@observer
export default class SummaryBarGraph extends React.Component<ISummaryBarGraphProps, {}> {

    @observable private chartContainer:HTMLElement;
    @observable private chartTarget:HTMLCanvasElement;
    private chart:any;
    @observable private chartConfig:any={type:'bar'};
    @observable private chartContainerWidth = 0;


    constructor() {
        super();

        this.updateChart = this.updateChart.bind(this);
    }

    private getTooltipOptions(tooltipModel: any, data:IBarGraphConfigOptions, chartOptions:any, sumBarGraph:any) {

        const uniqueId = sumBarGraph.props.gene;

        // Tooltip Element
        let tooltipEl = document.getElementById('cancer-type-summary-tab-tooltip-' + uniqueId);

        // Create element on first render
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'cancer-type-summary-tab-tooltip-' + uniqueId;
            tooltipEl.className = 'cancer-type-summary-tab-tooltip';
            tooltipEl.innerHTML = "<div></div>";
            this.chartContainer.appendChild(tooltipEl);
        }

        // Hide if no tooltip
        if (tooltipModel.opacity === 0) {
            tooltipEl.style.opacity = '0';
            return;
        }

        // Set caret Position
        tooltipEl.classList.remove('above', 'below', 'no-transform');
        if (tooltipModel.yAlign) {
            tooltipEl.classList.add(tooltipModel.yAlign);
        } else {
            tooltipEl.classList.add('no-transform');
        }

        function getBody(bodyItem:any, i:number) {
            const {label, count, percent} = data.datasets[tooltipModel.dataPoints[i].datasetIndex];
            return {label, count, percent};
        }

        // Set Text
        if (tooltipModel.body) {

            const bodyLines:{ label:string; count:number; percent:number }[] = tooltipModel.body.map(getBody);
            const {totalCases, altTotalPercent} = data.datasets[tooltipModel.dataPoints[0].datasetIndex];

            let innerHtml = (
                `<div><b>Summary for ${tooltipModel.title[0]}</b></div>
                    <div>Gene altered in ${_.round(altTotalPercent, 2)}% of ${totalCases} cases</div>
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Alteration</th>
                                <th>Frequency</th>
                            </tr>
                        </thead>
                        <tbody>`
            );

            bodyLines.forEach(body => {
                innerHtml += (
                    `<tr>
                        <td> ${sumBarGraph.getLegendNames(body.label)} </td>
                        <td> ${_.round(body.percent, 2)}% (${body.count} cases)</td>
                     </tr>`
                );
            });
            innerHtml += '</tbody></table>';

            const tableRoot = tooltipEl.querySelector('div');
            tableRoot!.innerHTML = innerHtml;
        }

        // `chartOptions` will be the overall tooltip
        // const position = chartOptions._chart.canvas.getBoundingClientRect();

        // Display, position, and set styles for font
        tooltipEl.style.opacity = '1';
        tooltipEl.style.left =  tooltipModel.caretX + 35 + 'px';
        tooltipEl.style.top = tooltipModel.caretY + 5 + 'px';
    }

    public componentDidMount() {
        this.chartConfig.data = this.props.data;
        this.chartConfig.options = this.chartOptions;
        this.chart = new Chart(this.chartTarget, this.chartConfig);
    }

    public componentDidUpdate() {
        this.updateChart();
    }

    private updateChart() {
        this.chartConfig.data = this.props.data;
        this.chartConfig.options = {};
        this.chartConfig.options = this.chartOptions;
        this.chart.update();
    }

    private hasAlterations() {
        return _.sumBy(this.props.data.datasets, function(dataset) { return dataset.count }) > 0;
    }

    private getLegendNames(id:string) {
        const names: {[alterationName:string]:string} = {
            mutated: "Mutation",
            amplified: "Amplification",
            // deleted: "Deletion",
            fusion: "Fusion",
            gain: "Gain",
            mrnaExpressionUp: "mRNA Upregulation",
            mrnaExpressionDown: "mRNA Downregulation",
            protExpressionUp: "Protein Upregulation",
            protExpressionDown: "Protein Downregulation",
            multiple: "Multiple Alterations",
            homdel: "Deep Deletion",
            hetloss: "Shallow Deletion"
        };
        return names[id] || id;
    }

    private get chartOptions() {
        const {data} = this.props;
        const that = this;

        return {
            title: {
                display: true,
                text: 'Cancer Type Summary',
                fontSize: 14,
                fontStyle: 'normal'
            },
            maintainAspectRatio: false,
            responsive: true,
            tooltips: {
                enabled: false,
                mode: 'x',
                filter(tooltipItem:ChartTooltipItem) {
                    if (tooltipItem) return Number(tooltipItem.yLabel) > 0;
                    return false;
                },
                custom(tooltipModel: any){
                    return that.getTooltipOptions(tooltipModel, data, this, that);}
            },
            scales: {
                xAxes: [{
                    barThickness:30,
                    gridLines: {display: false},
                    stacked: true,
                    ticks: {
                        maxRotation: 90,
                        autoSkip: false
                    }
                }],
                yAxes: [{
                    stacked: true,
                    scaleLabel: {
                        display: true,
                        fontSize: 13,
                        labelString: 'Alteration Frequency'
                    },
                    display:true,
                    ticks: {
                        fontSize: 11,
                        callback: function(value:number) {
                            return that.props.yAxis === "abs-count" ? value : (Math.round(value*10)/10) + '%';
                        },

                    }
                }]
            },
            legend: {
                position: 'right',
                display: this.props.legend,
                labels: {
                    generateLabels:(chart:any) => {
                        let counter = 0;
                        const {data:chartData} = chart;
                        if (chartData.labels.length && chartData.datasets.length) {
                            const alterationCounts = _.reduce(chartData.datasets, (obj, dataset:IBarGraphDataset) => {
                                if (obj[dataset.label]) {
                                    obj[dataset.label].count = obj[dataset.label].count + dataset.total;
                                } else {
                                    obj[dataset.label] = {count: dataset.total, backgroundColor:dataset.backgroundColor};
                                }
                                return obj;
                            }, {} as any)
                            return _.reduce(alterationCounts, (arr, value:{count:number, backgroundColor: string}, label) => {
                                if (value.count) {
                                    arr.push({
                                        text: this.getLegendNames(label),
                                        fillStyle: value.backgroundColor,
                                        index: counter ++
                                    });
                                }
                                return arr;
                            }, [] as any);
                        } else {
                            return [];
                        }
                    }
                }
            },
            animation: {
                onComplete: () => {
                    this.toImagePdf();
                }
            }
        };
    }

    private toImagePdf() {
        if (this.chart) {
            const png = this.chart.toBase64Image();
            this.props.setPngAnchor(png);
        }
        if (this.chartTarget) {
            const pdf = this.chartTarget.toDataURL();
            this.props.setPdfAnchor(pdf);
        }
    }

    private get width() {
        return 220 + this.props.data.labels.length * 57;
    }

    public render() {
        let errorMessage = null;
        if (!this.hasAlterations()) {
            errorMessage = <div className="alert alert-info">No alteration plot data.</div>;
        }
        return (
            <div style={{overflowX:'auto'}}>
            <div style={{width:this.width}} ref={(el: HTMLDivElement) => this.chartContainer = el}
                 className="cancer-summary-chart-container">
                {errorMessage}
                <canvas ref={(el:HTMLCanvasElement) => this.chartTarget = el}
                        className={classnames({ hidden:!this.hasAlterations() })} height="400"/>
            </div>
            </div>
        );
    }
};