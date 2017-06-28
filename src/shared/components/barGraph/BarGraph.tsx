import * as React from "react";
import * as _ from 'lodash';
import { ThreeBounce } from 'better-react-spinkit';
import { CancerStudy } from 'shared/api/generated/CBioPortalAPI';
import './barGraph.scss';

import Chart from 'chart.js';

export interface IBarGraphProps {
    data:CancerStudy[];
};

interface BodyItem {
    after: string[];
    before: string[];
    lines: string[];
}

interface ICancerTypeStudy {
    caseCount:number;
    shortName:string;
    studies: CancerStudy[];
};

interface ICounterObj {
    [name:string]: ICancerTypeStudy;
};

export default class BarGraph extends React.Component<IBarGraphProps, {colors: string[]}> {

    constructor() {
        super();
    }

    chartTarget:HTMLElement;

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
        const studies = [..._.flattenDeep(_.map(y, 'studies')), ...x.studies]
        return {
            caseCount: y.reduce((a, b) => a + b.caseCount, x.caseCount),
            shortName,
            studies
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
            const { cancerTypeId, allSampleCount, shortName } = study;
            if (counterObj[cancerTypeId]) {
                counterObj[cancerTypeId].caseCount += allSampleCount;
                counterObj[cancerTypeId].studies.push(study);
            } else {
                counterObj[cancerTypeId] = {
                    caseCount: allSampleCount,
                    shortName,
                    studies: [study]
                };
            }
            return counterObj;
        }, {} as any);
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

        cancerTypeStudiesObj = _.omit(cancerTypeStudiesObj, 'lusc', 'sclc', 'nsclc', 'plmeso',
            'paad', 'panet', 'escc', 'acyc', 'head_neck', 'gbm', 'mbl', 'aml',
            'all', 'soft_tissue', 'es', 'mm', 'prcc', 'chrcc', 'nbl', 'acc', 'nccrcc',
            'thyroid', 'mixed');

        const cancerTypeStudiesArray =  Object.keys(cancerTypeStudiesObj).map((cancerType) => (
            { type: cancerType,
                ...cancerTypeStudiesObj[cancerType] }
        ))
            .sort((a, b) => b.caseCount - a.caseCount)
            .slice(0, 20);

        const datasets = _.flattenDeep(cancerTypeStudiesArray.map((cancerStudySet, i) => (
            cancerStudySet.studies.map((cancerStudy: CancerStudy, j: number) => {
                const {name, studyId, allSampleCount} = cancerStudy;
                const max = cancerStudySet.studies.length;
                const colors = ['1E36BF', '128C47', 'BF2231', '7D1FBF', 'BF7D15'];
                const color = this.lightenDarkenColor(colors[i%5], (max-j)/max * 120);
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
            labels: cancerTypeStudiesArray.slice(0, 20).map(cancer => (cancer.shortName)),
            datasets
        };

        const options = {
            onClick: function(e: Event) {
                if (this.getElementAtEvent(e)[0]) {
                    const {studyId} = datasets[this.getElementAtEvent(e)[0]._datasetIndex];
                    window.location.href = 'study?id=' + studyId + '#summary';
                }
            },
            responsive: true,
            tooltips: {
                enabled: false,
                mode: 'nearest',
                custom(tooltipModel: any) {
                    // Tooltip Element
                    var tooltipEl = document.getElementById('chartjs-tooltip');

                    // Create element on first render
                    if (!tooltipEl) {
                        tooltipEl = document.createElement('div');
                        tooltipEl.id = 'chartjs-tooltip';
                        tooltipEl.innerHTML = "<table></table>";
                        document.body.appendChild(tooltipEl);
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
                        // tooltipEl.classList.add('below');
                    } else {
                        tooltipEl.classList.add('no-transform');
                    }

                    function getBody(bodyItem:BodyItem) {
                        return bodyItem.lines;
                    }

                    // Set Text
                    if (tooltipModel.body) {
                        const titleLines = tooltipModel.title || [];
                        const bodyLines = tooltipModel.body.map(getBody);

                        let innerHtml = '<thead>';

                        titleLines.forEach(function(title: string) {
                            innerHtml += '<tr><th>' + title + ': ' + datasets[tooltipModel.dataPoints[0].datasetIndex].total + ' cases</th></tr>';
                        });
                        innerHtml += '</thead><tbody>';

                        bodyLines.forEach(function(body:string, i:number) {
                            tooltipEl!.style.borderColor = datasets[tooltipModel.dataPoints[0].datasetIndex].backgroundColor;

                            const colors = tooltipModel.labelColors[i];
                            let style = 'background-color: ' + tooltipModel.labelColors[0].backgroundColor;
                            style += '; border-color:' + colors.borderColor + '; border-width: 1px';
                            // style += '; border-width: 1px';
                            var span = '<span class="chartjs-tooltip-key" style=' + style + '></span>';
                            innerHtml += '<tr><td>' + span + body + ' cases</td></tr>';
                        });
                        innerHtml += '</tbody>';

                        const tableRoot = tooltipEl.querySelector('table');
                        tableRoot!.innerHTML = innerHtml;
                    }

                    // `this` will be the overall tooltip
                    const position = this._chart.canvas.getBoundingClientRect();

                    // Display, position, and set styles for font
                    tooltipEl.style.opacity = '1';
                    tooltipEl.style.left = position.left + tooltipModel.caretX - 10 + 'px';
                    tooltipEl.style.top = position.top + tooltipModel.caretY + 5 + 'px';
                    tooltipEl.style.padding = tooltipModel.yPadding + 'px ' + tooltipModel.xPadding + 'px';
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

        const canvas:any = document.getElementById("chart");

        new Chart(canvas.getContext("2d"), {
            type: 'horizontalBar',
            data,
            options
        });

    }

    render() {
        return (
            <div id="canvas-holder" style={{position: 'relative'}}>
                <canvas id="chart" height="500px"/>
            </div>
        );
    }

};
