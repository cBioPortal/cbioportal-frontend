import * as React from "react";
import * as _ from 'lodash';
import wordwrap from 'word-wrap';
import { ThreeBounce } from 'better-react-spinkit';
import { CancerStudy } from 'shared/api/generated/CBioPortalAPI';
import { ChartTooltipItem } from '@types/chart.js';
const convertCssColorNameToHex = require('convert-css-color-name-to-hex');
import Chart from 'chart.js';

export interface IBarGraphProps {
    data:CancerStudy[];
};

interface ICancerTypeStudy {
    caseCount:number;
    shortName:string;
    color: string;
    studies: CancerStudy[];
};

interface ICounterObj {
    [name:string]: ICancerTypeStudy;
};

export default class BarGraph extends React.Component<IBarGraphProps, {colors: string[]}> {

    constructor() {
        super();
    }

    chartTarget:HTMLCanvasElement;

    shouldComponentUpdate() {
        return false;
    }

    getShortName(cancerStudiesObj:ICounterObj) {
        const aliases:{[id:string]:string} = {
            'Ovarian': 'Ovary', 'Cervical': 'Cervix', 'Uterine': 'Uterus',
            'Melanoma': 'Skin', 'CCLE':'Mixed', 'Thymoma(TCGA)': 'Thymus', 'Uveal': 'Eye',
            'Testicular': 'Testicle', 'Colorectal': 'Colon'
        };
        return _.mapValues(cancerStudiesObj, (cancerStudy) => {
            const shortName = cancerStudy.shortName.split(" ")[0];
            return {
                ...cancerStudy,
                shortName: aliases[shortName] ? aliases[shortName] : shortName
            };
        });
    }

    condenseCancerTypes(x:ICancerTypeStudy, y:ICancerTypeStudy[], shortName:string) {
        let xStudy = x ? x : {studies:[], caseCount: 0};
        const yStudies = _.without(y, null, undefined);
        if (yStudies.length === 0) {
            if (_.isEmpty(xStudy)) return false;
            return {
                caseCount: x.caseCount,
                shortName,
                studies: x.studies,
                color: x.color
            };
        }
        const studies = [..._.flattenDeep(_.map(yStudies, 'studies')), ...xStudy.studies]
        return {
            caseCount: yStudies.reduce((a, b) => a + b!.caseCount, xStudy.caseCount),
            shortName,
            studies,
            color: yStudies[0]!.color
        };
    }

    lightenDarkenColor(col:string, amt:number) {
        const num = parseInt(col,16);

        let r = (num >> 16) + amt;

        if (r > 255) r = 255;
        else if  (r < 0) r = 0;

        let b = ((num >> 8) & 0x00FF) + amt;

        if (b > 255) b = 255;
        else if  (b < 0) b = 0;

        let g = (num & 0x0000FF) + amt;

        if (g > 255) g = 255;
        else if (g < 0) g = 0;

        return "#" + (g | (b << 8) | (r << 16)).toString(16);
    }

    reduceDataArray(data:CancerStudy[]) {
        return _.reduce(data, (counterObj:ICounterObj, study) => {
            const { cancerTypeId, allSampleCount, shortName, cancerType } = study;
            if (counterObj[cancerTypeId]) {
                counterObj[cancerTypeId].caseCount += allSampleCount;
                counterObj[cancerTypeId].studies.push(study);
            } else {
                counterObj[cancerTypeId] = {
                    caseCount: allSampleCount,
                    shortName,
                    color: cancerType.dedicatedColor || "black",
                    studies: [study]
                };
            }
            return counterObj;
        }, {} as any);
    }

    formatTooltipString(label: string) {
        return wordwrap(label, {width: 30}).split(/\r?\n/).map(_label => _label.trim());
    }

    componentDidMount() {

        let cancerTypeStudiesObj = this.reduceDataArray(this.props.data);

        cancerTypeStudiesObj = this.getShortName(cancerTypeStudiesObj);

        const {luad, lusc, sclc, nsclc, plmeso, paac, paad, panet, esca, escc,
            hnsc, acyc, head_neck, thpa, thyroid, mnet, nbl, acc, difg, gbm, mbl,
            cll, aml, all, es, mm, soft_tissue, ccrcc, prcc, chrcc, nccrcc } = cancerTypeStudiesObj;

        cancerTypeStudiesObj.luad = this.condenseCancerTypes(luad, [lusc, sclc, nsclc, plmeso], 'Lung');
        cancerTypeStudiesObj.paac = this.condenseCancerTypes(paac, [paad, panet], 'Pancreas');
        cancerTypeStudiesObj.esca = this.condenseCancerTypes(esca, [escc], 'Esophagus');
        cancerTypeStudiesObj.hnsc = this.condenseCancerTypes(hnsc, [acyc, head_neck], 'Head/Neck');
        cancerTypeStudiesObj.thpa = this.condenseCancerTypes(thpa, [thyroid], 'Thyroid');
        cancerTypeStudiesObj.difg = this.condenseCancerTypes(difg, [gbm, mbl], 'Brain');
        cancerTypeStudiesObj.cll = this.condenseCancerTypes(cll, [aml, all, soft_tissue, es, mm], 'Blood/Bone');
        cancerTypeStudiesObj.ccrcc = this.condenseCancerTypes(ccrcc, [prcc, chrcc, nccrcc], 'Kidney');
        cancerTypeStudiesObj.mnet = this.condenseCancerTypes(mnet, [nbl, acc], 'Adrenal Gland');

        cancerTypeStudiesObj = _.omitBy(_.omit(cancerTypeStudiesObj, 'lusc', 'sclc', 'nsclc', 'plmeso',
            'paad', 'panet', 'escc', 'acyc', 'head_neck', 'gbm', 'mbl', 'aml',
            'all', 'soft_tissue', 'es', 'mm', 'prcc', 'chrcc', 'nbl', 'acc', 'nccrcc',
            'thyroid', 'mixed'), value => value === false);

        const cancerTypeStudiesArray =  Object.keys(cancerTypeStudiesObj).map((cancerType) => (
            { type: cancerType,
                ...cancerTypeStudiesObj[cancerType] }
        ))
            .sort((a, b) => b.caseCount - a.caseCount)
            .slice(0, 20);

        const datasets = _.flattenDeep(cancerTypeStudiesArray.map((cancerStudySet, i) => (
            cancerStudySet.studies.sort((a: CancerStudy, b:CancerStudy) => b.allSampleCount - a.allSampleCount).map((cancerStudy: CancerStudy, j: number) => {
                let lightenColorConstant = 3;
                const cancerColor = cancerStudySet.color;
                const {name, studyId, allSampleCount} = cancerStudy;
                const max = cancerStudySet.studies.length;
                if (cancerColor === "Cyan") {
                    lightenColorConstant = 18;
                }
                if (cancerColor === "LightBlue" || cancerColor === "LightSkyBlue" || cancerColor === "PeachPuff") {
                    lightenColorConstant = 0;
                }
                const color = this.lightenDarkenColor(convertCssColorNameToHex(cancerColor).slice(1), (j + lightenColorConstant)/max * 90);
                return {
                    borderColor: '#F1F6FE',
                    backgroundColor: color,
                    borderWidth: 1,
                    label: name,
                    total: cancerStudySet.caseCount,
                    studyId,
                    data: i === 0 ? [allSampleCount] : [...Array(i).fill(0), allSampleCount]
                };}
            ))
        ));

        const data = {
            labels: cancerTypeStudiesArray.map(cancer => (cancer.shortName)),
            datasets
        };

        const options = {
            title: {
                display: true,
                text: 'Cases by Primary Site',
                fontSize: 14,
                fontStyle: 'normal'
            },
            onClick: function (e: Event) {
                if (this.getElementAtEvent(e)[0]) {
                    const {studyId} = datasets[this.getElementAtEvent(e)[0]._datasetIndex];
                    window.location.href = 'study?id=' + studyId + '#summary';
                }
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
                    } return false;
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
            legend: { display: false }
        };

        new Chart(this.chartTarget, {
            type: 'horizontalBar',
            data,
            options
        });

    }

    render() {
        return <canvas ref={el => this.chartTarget = el} height="500px"/>;
    }

};
