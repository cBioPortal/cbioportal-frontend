import * as React from "react";
import Raphael from 'webpack-raphael';
import { createRaphaelCanvas } from './genomicOverview';
import $ from 'jquery';

export interface IClinicalInformationPatientTableProps {
}

export default class GenomicOverview extends React.Component<IClinicalInformationPatientTableProps, {}> {

    constructor(){

        super();

    }

    fetchData() {

        // use ajax againt new api
        // return Promise.resolve([1,2,3]);
        // example: http://www.cbioportal.org/api-legacy/copynumbersegments?cancerStudyId=ov_tcga_pub&chromosome=17&sampleIds=TCGA-13-1510-01

    }

    componentDidMount() {

        //this.fetchData.then((data=>{
            var paper = new Raphael(document.getElementById('cna_segment_bar_chart_div'), 500, 500);
            var circle = paper.circle(100, 100, 80);
            for (var i = 0; i < 5; i += 1) {
                var multiplier = i * 5;
                paper.circle(250 + (2 * multiplier), 100 + multiplier, 50 - multiplier)
            }
            var rectangle = paper.rect(200, 200, 250, 100);
            var ellipse = paper.ellipse(200, 400, 100, 50);
        //});

    }


    public render() {
        return (
            <div className="genomicOverViewContainer" style={{ backgroundColor: 'red'}}>
                <div id="cna_segment_bar_chart_div"></div>
            </div>
        );
    }
}
