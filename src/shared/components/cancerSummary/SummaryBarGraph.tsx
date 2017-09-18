import * as React from "react";
import * as _ from 'lodash';
import {computed, observable} from "mobx";
import { ChartTooltipItem } from 'chart.js';
import Chart, {ChartLegendItem} from 'chart.js';
import {IBarGraphConfigOptions, IBarGraphDataset} from './CancerSummaryContent';
import {observer} from "mobx-react";
import './styles.scss';

interface ISummaryBarGraphProps {
    data: IBarGraphConfigOptions;
    yAxis: 'alt-freq' | 'abs-count';
    xAxis: 'y-axis' | 'can-types';
    legend: boolean;
    setPngAnchor:any;
    setPdfAnchor:any;
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

    private getTooltipOptions(tooltipModel: any, data:IBarGraphConfigOptions, chartOptions:any) {
        // $('#chartjs-tooltip').remove();

        // Tooltip Element
        let tooltipEl = document.getElementById('chartjs-tooltip');

        // Create element on first render
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'chartjs-tooltip';
            tooltipEl.innerHTML = "<div></div>";
            document.getElementsByClassName('cancer-summary-chart-container')[0].appendChild(tooltipEl);
        }

        // Hide if no tooltip
        if (tooltipModel.opacity === 0) {
            tooltipEl.style.opacity = '0';
            // tooltipEl.style.display = 'none';
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
                        <td> ${body.label} </td>
                        <td> ${_.round(body.percent, 2)}% (${body.count} cases)</td>
                     </tr>`
                );
            });
            innerHtml += '</tbody></table>';

            const tableRoot = tooltipEl.querySelector('div');
            tableRoot!.innerHTML = innerHtml;
        }

        // `this` will be the overall tooltip
        const position = chartOptions._chart.canvas.getBoundingClientRect();

        // Display, position, and set styles for font
        tooltipEl.style.opacity = '1';
        // tooltipEl.style.display = 'block';
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
        this.chart.update({duration: 0});
    }

    private getLegendNames(id:string) {
        const names: {[alterationName:string]:string} = {
            mutated: "Mutation",
            amplified: "Amplification",
            deleted: "Deletion",
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
                    return that.getTooltipOptions(tooltipModel, data, this);}
            },
            scales: {
                xAxes: [{
                    maxBarThickness: 40,
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
                    ticks: {
                        fontSize: 11,
                        callback: function(value:number) {
                            return that.props.yAxis === "abs-count" ? value : _.round(value) + '%';
                        }
                    }
                }]
            },
            legend: {
                position: 'right',
                display: this.props.legend,
                labels: {
                    generateLabels:(chart:any) => {
                        const {data:cdata} = chart;
                        if (cdata.labels.length && cdata.datasets.length) {
                            return _.uniqBy(cdata.datasets, 'label').map((dataset:IBarGraphDataset, i) => {
                                return {
                                    text: this.getLegendNames(dataset.label),
                                    fillStyle: dataset.backgroundColor,
                                    index: i
                                };
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
            this.props.setPdfAnchor(pdf);
        }
    }

    get width() {
        const labelsL = this.props.data.labels.length;
        const contWidth = this.chartContainerWidth;
        if (!contWidth) return null;
        return (60 + labelsL * 50) > contWidth ? contWidth : (60 + labelsL * 50);
    }

    public render() {
        let errorMessage = null;
        if (!this.props.data.datasets.length) {
            errorMessage = <div className="cancer-summary-error-message">No alteration plot data.</div>;
        }
        return (
            <div ref={(el: HTMLDivElement) => this.chartContainer = el} className="cancer-summary-chart-container">
                {errorMessage}
                <canvas ref={(el:HTMLCanvasElement) => this.chartTarget = el} width="100%" height="600"/>
            </div>
        );
    }
};