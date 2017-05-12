import * as React from "react";
import * as _ from 'lodash';
import {ThreeBounce} from 'better-react-spinkit';
import { CancerStudy } from 'shared/api/generated/CBioPortalAPI';
import * as Highcharts from 'highcharts';
import './barGraph.scss';

import HCE from 'highcharts/modules/exporting';
HCE(Highcharts);


export interface IBarGraphProps {
    data:CancerStudy[];
};

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

    shouldComponentUpdate() {
        return false;
    }

    getShortName(cancerStudiesObj:ICounterObj) {
        const aliases:{[id:string]:string} = {
            'Ovarian': 'Ovary', 'Cervical': 'Cervix', 'Uterine': 'Uterus',
            'Melanoma': 'Skin', 'CCLE':'Mixed', 'Thymoma(TCGA)': 'Thymus', 'Uveal': 'Eye'
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

        Highcharts.chart('high-charts-data-sets', {

            chart: {type: 'bar', backgroundColor:'' },

            exporting: { enabled:false },

            title: {text: ''},

            xAxis: {categories: cancerTypeStudiesArray.slice(0, 20).map((cancer) => (cancer.shortName)),
                    labels: {style: {fontSize: '10px'}}},

            yAxis: {
                allowDecimals: false,
                min: 0,
                // max: 6000,
                title: {text: ''}
            },

            legend: {enabled: false},

            tooltip: {
                useHTML: true,
                backgroundColor: '#ffffff',
                formatter: function() {
                    return `
                            <div style="font-size:11px;">
                                ${this.x}: ${this.point.stackTotal} cases
                                <br/> 
                                <span style="width: 200px !important; font-size:12px; color:${this.point.color}; overflow:auto; white-space:normal !important;" >
                                    ${this.series.name}: <b>${this.point.y} cases</b>
                                </span>
                            </div>
                          `;
                }
            },

            plotOptions: {
                series: {
                    stacking: 'normal',
                    cursor: 'pointer',
                    events: {
                        click: function() {
                            location.href= 'http://www.cbioportal.org/study?id=' + this.options.studyId, + '#summary';
                        }
                    }
                }
            },

            series: _.flattenDeep(cancerTypeStudiesArray.map((cancerStudySet, i:number) => (
                cancerStudySet.studies.map((cancerStudy: CancerStudy, j: number) => {
                    const {name, studyId, allSampleCount} = cancerStudy;
                    const max = cancerStudySet.studies.length;
                    const colors = ['1E36BF', '128C47', 'BF2231', '7D1FBF', 'BF7D15'];
                    const color = this.lightenDarkenColor(colors[i%5], (max-j)/max * 120);
                    return {
                        borderColor: '#F1F6FE',
                        name,
                        studyId,
                        data: i === 0 ? [{y: allSampleCount, color}] : [...Array(i).fill(0),{y: allSampleCount, color}]
                    };
                })
            )))

        });
    }

    render() {
        if (this.props.data) {
            return <div id='high-charts-data-sets'/>;
        } else {
            return (
                <div>
                    <ThreeBounce />
                </div>
            );
        }
    }
};
