import * as React from "react";
import * as _ from 'lodash';
import {computed, observable} from "mobx";
import { ChartTooltipItem } from 'chart.js';
import Chart, {ChartLegendItem} from 'chart.js';
import {
    IBarGraphConfigOptions, IBarGraphDataset,
    // ICancerTypeAlterationPlotData
} from './CancerSummaryContent';
import {observer} from "mobx-react";
import classnames from 'classnames';
import './styles.scss';

interface ISummaryBarGraphProps {
    data: IBarGraphConfigOptions;
    yAxis: 'alt-freq' | 'abs-count';
    xAxis: 'y-axis' | 'can-types';
    legend: boolean;
    setPngAnchor:(href:string) => void;
    setPdfProperties:(anchor:string, width: number, height: number) => void;
    gene: string;
    width: number;
    orderedLabels: {
        [key:string]: string;
    };
}

@observer
export default class SummaryBarGraph extends React.Component<ISummaryBarGraphProps, {}> {

    private chartContainer:HTMLElement;
    private chartTarget:HTMLCanvasElement;
    private chart:any;
    private chartConfig:any={type:'bar'};


    constructor() {
        super();

        this.updateChart = this.updateChart.bind(this);
        this.getLegendNames = this.getLegendNames.bind(this);
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
            //tooltipEl.style.opacity = '0';
            tooltipEl.style.display = 'none';
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

            bodyLines.reverse().forEach(body => {
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
        tooltipEl.style.display ='block';
        tooltipEl.style.left =  tooltipModel.caretX + 35 + 'px';
        tooltipEl.style.top =  tooltipModel.y + 'px';
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

        // we need to start over
        this.chart.destroy();
        this.chartConfig.data = this.props.data;
        this.chartConfig.options = this.chartOptions;
        this.chart = new Chart(this.chartTarget, this.chartConfig);

    }

    private hasAlterations() {
        return _.sumBy(this.props.data.datasets, function(dataset) { return dataset.count; }) > 0;
    }

    private getLegendNames(id:string) {
        //TODO: figure out ts issue with index signature.
        return this.props.orderedLabels[id] || id;
    }

    private get chartOptions() {
        const {data, yAxis} = this.props;

        const orderedAltNames = _.values(this.props.orderedLabels);

        return {
            title: {
                display: true,
                text: 'Cancer Type Summary',
                fontSize: 14,
                fontStyle: 'normal'
            },
            maintainAspectRatio: false,
            responsive: true,
            layout: {
              padding:{
                  top:5,
                  left:20,
                  right:20,
                  bottom:5
              }
            },
            tooltips: {
                enabled: false,
                position:'nearest',
                mode:'x',
                filter:(tooltipItem:ChartTooltipItem)=>{
                    if (tooltipItem) return Number(tooltipItem.yLabel) > 0;
                    return false;
                },
                custom:(tooltipModel: any)=>{
                    return this.getTooltipOptions(tooltipModel, data, this, this);
                }
            },
            scales: {
                xAxes: [{
                    gridLines: {display: false},
                    stacked: true,
                    barThickness:(this.props.data.labels.length > 15) ? 14 : 25,
                    ticks: {
                        maxRotation: 70,
                        autoSkip: false
                    }
                }],
                yAxes: [{
                    stacked: true,
                    scaleLabel: {
                        display: true,
                        fontSize: 13,
                        labelString: yAxis === 'abs-count' ? 'Absolute Counts': 'Alteration Frequency'
                    },
                    display:true,
                    ticks: {
                        fontSize: 11,
                        callback: (value:number) => {
                            return _.round(value, 1) + (this.props.yAxis === "abs-count" ? '': '%');
                        }
                    }
                }]
            },
            legend: {
                position: 'right',
                labels: {
                    generateLabels:(chart:any) => {
                        const {data:chartData} = chart;
                        if (!this.props.legend) return [];
                        else if (chartData.labels.length && chartData.datasets.length) {
                            const alterationCounts = _.reduce(chartData.datasets, (obj, dataset:IBarGraphDataset) => {
                                if (obj[dataset.label]) {
                                    obj[dataset.label].count = obj[dataset.label].count + dataset.total;
                                } else {
                                    obj[dataset.label] = {count: dataset.total, backgroundColor:dataset.backgroundColor};
                                }
                                return obj;
                            }, {} as any)
                            const alterationLabels = _.reduce(alterationCounts, (arr, value:{count:number, backgroundColor: string}, label) => {
                                if (value.count) {
                                    arr.push({
                                        text: this.getLegendNames(label),
                                        fillStyle: value.backgroundColor
                                    });
                                }
                                return arr;
                            }, [] as {text: string, fillStyle: string}[]);
                            return alterationLabels.sort((a, b) => {
                                return orderedAltNames.indexOf(b.text) - orderedAltNames.indexOf(a.text);
                            });
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
            this.props.setPdfProperties(pdf, this.width, this.chartTarget.offsetHeight);
        }
    }

    private get width() {
        const maxWidth = 300 + this.props.data.labels.length * 45;
        const conWidth = (this.props.width || 1159);
        return maxWidth > conWidth ? conWidth : maxWidth;
    }

    public render() {
        let errorMessage = null;
        return (
            <div style={{width:this.width}} ref={(el: HTMLDivElement) => this.chartContainer = el}
                 className="cancer-summary-chart-container borderedChart">
                {errorMessage}
                <canvas ref={(el:HTMLCanvasElement) => this.chartTarget = el}
                        className={classnames({ hidden:!this.hasAlterations() })}/>
            </div>
        );
    }
};