import * as React from "react";
import * as $ from 'jquery';
import * as _ from 'underscore';
import queryString from "query-string";
import CBioPortalAPI from "shared/api/CBioPortalAPI";
import { GenomicOverviewConfig, createRaphaelCanvas, getChmInfo, plotChromosomes, plotCnSegs } from './genomicOverviewHelper';
import {CopyNumberSegment} from "../../../shared/api/CBioPortalAPI";

export default class GenomicOverview extends React.Component<{}, {}> {

    constructor(){

        super();

    }

    fetchData() {

        const qs = queryString.parse(location.search);
        var p = Promise.resolve(
            //$.get("http://www.cbioportal.org/api-legacy/copynumbersegments?cancerStudyId=" + qs.cancer_study_id + "&chromosome=17&sampleIds=P04_Pri")
            $.get("http://www.cbioportal.org/api-legacy/copynumbersegments?cancerStudyId=ov_tcga_pub&chromosome=17&sampleIds=TCGA-24-2035-01")
        );
        return p;

    }

    componentDidMount() {

        this.fetchData().then( apiResult => {

            // transform API result
            let raphaelData: any = {};

            let sampleId = _.uniq(_.pluck(apiResult, 'sample'))[0];

            raphaelData[sampleId] = [];
            _.each(apiResult, function(_dataObj: any) {
                var _tmp: Array<any> = [];
                _tmp.push(_dataObj.sample);
                _tmp.push(_dataObj.chr);
                _tmp.push(_dataObj.end);
                _tmp.push(_dataObj.start);
                _tmp.push(_dataObj.numProbes);
                _tmp.push(_dataObj.value);
                raphaelData[sampleId].push(_tmp);
            });

            // render cna segment bar chart
            var config = GenomicOverviewConfig(1, 1000);
            var paper = createRaphaelCanvas('cna_segment_bar_chart_div', config);
            var chmInfo = getChmInfo();
            plotChromosomes(paper,config,chmInfo);
            plotCnSegs(paper, config, chmInfo, 0, raphaelData[sampleId], 1, 3, 2, 5, sampleId);

        });

    }


    public render() {
        return (
            <div className="genomicOverViewContainer" style={{ backgroundColor: '#F0FFFF'}}>
                <div id="cna_segment_bar_chart_div"></div>
            </div>
        );
    }
}