import * as React from "react";
import * as _ from 'lodash';
import wordwrap from 'word-wrap';
import { ThreeBounce } from 'better-react-spinkit';
import { CancerStudy } from 'shared/api/generated/CBioPortalAPI';
import { ChartTooltipItem } from 'chart.js';
const convertCssColorNameToHex = require('convert-css-color-name-to-hex');
import Chart from 'chart.js';

interface ICancerTypeStudy {
    shortName: string;
    color: string;
    studies: CancerStudy[];
    caseCount?:number;
}

export interface IBarGraphProps {
    data:ICancerTypeStudy[];
    openStudy:(studyId:string)=>void;
};

export default class BarGraph extends React.Component<IBarGraphProps, {}> {

    constructor() {
        super();
    }

    chartTarget:HTMLCanvasElement;

    shouldComponentUpdate() {
        return false;
    }

    getShortName(study:ICancerTypeStudy) {
        const aliases:{[id:string]:string} = {
            'Esophagus/Stomach': 'Stomach',
            'Ovary/Fallopian Tube': 'Ovary',
            'Bladder/Urinary Tract': 'Bladder',
            'Head and Neck': 'Head/Neck',
            'Peripheral Nervous System': 'PNS',
            'Ampulla of Vater': 'Amp. of Vater'
        };
        const shortName = study.shortName;
        return {
            ...study,
            shortName: aliases[shortName] || shortName
        };
    }

    lightenDarkenColor(color:string, amt:number):string {
        const hexColor = convertCssColorNameToHex(color).slice(1);

        const num = parseInt(hexColor,16);

        let r = (num >> 16) + amt;

        if (r > 255) r = 255;
        else if  (r < 0) r = 0;

        let b = ((num >> 8) & 0x00FF) + amt;

        if (b > 255) b = 255;
        else if  (b < 0) b = 0;

        let g = (num & 0x0000FF) + amt;

        if (g > 255) g = 255;
        else if (g < 0) g = 0;

        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (luma >= 254 && color !== 'White' && amt > 1) {
            return this.lightenDarkenColor(color, amt/2);
        }

        return "#" + (g | (b << 8) | (r << 16)).toString(16);
    }

    formatTooltipString(label: string) {
        return wordwrap(label, {width: 30}).split(/\r?\n/).map(_label => _label.trim());
    }

    get byPrimarySiteStudies() {
        return this.props.data.filter(cancers => _.every(cancers.studies, study => study.cancerTypeId !== "other" &&  study.cancerTypeId  !== "mixed"));
    }

    componentDidMount() {

        const cancerStudies = this.byPrimarySiteStudies;

        if (!cancerStudies.length) return;
        cancerStudies.forEach(study => {study.caseCount = study.studies.reduce((sum:number, cStudy) => sum + cStudy.allSampleCount, 0)});

        const cancerTypeStudiesArray = cancerStudies.sort((a, b) => b.caseCount! - a.caseCount!).slice(0, 20).map(study => this.getShortName(study));

        const datasets:any = _.flattenDeep(cancerTypeStudiesArray.map((cancerStudySet, i) => (
            cancerStudySet.studies.sort((a: CancerStudy, b:CancerStudy) => b.allSampleCount - a.allSampleCount).map((cancerStudy: CancerStudy, j: number) => {
                let lightenColorConstant = 3;
                const cancerColor = cancerStudySet.color;
                const {name, studyId, allSampleCount} = cancerStudy;
                const max = cancerStudySet.studies.length;
                if (cancerColor === "Cyan") {
                    lightenColorConstant = 18;
                } else if (cancerColor === "Yellow") {
                    lightenColorConstant = 11;
                } else if (_.includes(["LightBlue", "LightSkyBlue", "PeachPuff", "LightYellow"], cancerColor)) {
                    lightenColorConstant = 0;
                } else if (cancerColor === "Teal") {
                    lightenColorConstant = 1;
                } else if (cancerColor === "LightYellow") {
                    lightenColorConstant = -3;
                } else if (cancerColor === "Black") {
                    lightenColorConstant = 6;
                }
                const color = this.lightenDarkenColor(cancerColor, (j + lightenColorConstant)/max * 90);
                return {
                    studyId,
                    borderColor: _.includes(['Gainsboro', 'White', 'LightYellow'], cancerColor) ? '#dddddd' : '#F1F6FE',
                    backgroundColor: color,
                    borderWidth: 1,
                    label: name,
                    total: cancerStudySet.caseCount,
                    data: i === 0 ? [allSampleCount] : [...Array(i).fill(0), allSampleCount]
                };}
            ))
        ));

        const data = {
            labels: cancerTypeStudiesArray.map(cancer => (cancer.shortName)),
            datasets
        };

        var self = this;

        const options = {
            animation:{
                duration:0
            },
            title: {
                display: true,
                text: 'Cases by Top 20 Primary Sites',
                fontSize: 14,
                fontStyle: 'normal'
            },
            onClick: function (e: Event) {
                if (this.getElementAtEvent(e)[0]) {
                    const {studyId} = datasets[this.getElementAtEvent(e)[0]._datasetIndex];
                    self.props.openStudy(studyId);
                }
                return false;
            },
            responsive: true,
            tooltips: {
                enabled: true,
                displayColors: false,
                xPadding: 10,
                yPadding: 10,
                backgroundColor: 'rgb(255,255,255)',
                bodyFontColor: '#000',
                bodyFontStyle: 'bold',
                bodyFontSize: 11,
                titleFontColor: '#000',
                titleFontStyle: 'normal',
                filter: function (tooltipItem:ChartTooltipItem) {
                    if (tooltipItem) {
                        return Number(tooltipItem.xLabel) > 0;
                    }
                    return false;
                },
                callbacks: {
                    title: (tooltipItem:ChartTooltipItem[], _data:any) => {
                        if (tooltipItem.length > 0) {
                            const tooltipItems = tooltipItem[0];
                            const label = tooltipItems.yLabel + ': ' + _data.datasets[tooltipItems.datasetIndex!].total + ' cases';
                            return this.formatTooltipString(label);
                        }
                    },
                    label: (tooltipItems:ChartTooltipItem, _data:any) => {
                        const label = _data.datasets[tooltipItems.datasetIndex!].label + ': ' + tooltipItems.xLabel + ' cases';
                        return this.formatTooltipString(label);
                    },
                }
            },
            scales: {
                xAxes: [{ stacked: true }],
                yAxes: [{
                    stacked: true,
                    gridLines: {display: false},
                    ticks: {fontSize: 11}
                }]
            },
            legend: { display: false },
        };

        new Chart(this.chartTarget, {
            type: 'horizontalBar',
            data,
            options,
            plugins: [this.backgroundColorPlugin]
        } as any);

    }

    private backgroundColorPlugin = {
        beforeDraw: function(chartInstance:any) {
            var ctx = chartInstance.chart.ctx;
            ctx.fillStyle = "#F1F6FE";
            ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
        }
    };

    render() {
        const length = this.byPrimarySiteStudies.length;
        return length ? (
            <canvas
                ref={(el:HTMLCanvasElement) => this.chartTarget = el}
                height={70 + 430 * (length > 20 ? 20 : length)/20}
            />
        ): null;
    }

};