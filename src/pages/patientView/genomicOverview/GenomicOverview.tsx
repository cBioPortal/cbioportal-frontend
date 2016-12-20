import * as React from "react";
import * as $ from 'jquery';
import * as _ from 'underscore';
import CBioPortalAPI from "shared/api/CBioPortalAPI";
//import { GenomicOverviewConfig, createRaphaelCanvas, getChmInfo, plotChromosomes, plotCnSegs } from './genomicOverviewHelper';
import * as genomicOverviewHelper from './genomicOverviewHelper'
import {CopyNumberSegment} from "../../../shared/api/CBioPortalAPI";

export default class GenomicOverview extends React.Component<{}, {}> {

    constructor(){

        super();

    }

    fetchData() {

        var fetchJSON = function(url) {
            return new Promise((resolve, reject) => {
                $.getJSON(url)
                    .done((json) => resolve(json))
                    .fail((xhr, status, err) => reject(status + err.message));
            });
        }
        var itemUrls = [
                "http://www.cbioportal.org/api-legacy/copynumbersegments?cancerStudyId=ov_tcga_pub&chromosome=17&sampleIds=TCGA-24-2024-01",
                "https://raw.githubusercontent.com/onursumer/cbioportal-frontend/enhanced-react-table/src/pages/patientView/mutation/mock/mutationData.json"
            ],
            itemPromises = _.map(itemUrls, fetchJSON);
        return Promise.all(itemPromises);

    }

    componentDidMount() {

        this.fetchData().then( apiResult => {

            var cnaResult = apiResult[0];
            var mutationResult = apiResult[1];

            // --- construct params ---
            let sampleId = _.uniq(_.pluck(cnaResult, 'sample'))[0]; //TODO: multiple samples
            var config = genomicOverviewHelper.GenomicOverviewConfig(2, 1000); //TODO: nRows, width
            // --- end of params ---

            // --- raphael config ---
            var paper = genomicOverviewHelper.createRaphaelCanvas('genomic_overview_div', config);
            // --- end of raphael config ---
            
            // --- chromosome chart ---
            var chmInfo = genomicOverviewHelper.getChmInfo();
            genomicOverviewHelper.plotChromosomes(paper,config,chmInfo);
            // --- end of chromosome chart ---

            // --- CNA bar chart ---
            let cnaRaphaelData: any = {};
            cnaRaphaelData[sampleId] = [];
            _.each(cnaResult, function(_dataObj: any) {
                var _tmp: Array<any> = [];
                _tmp.push(_dataObj.sample);
                _tmp.push(_dataObj.chr);
                _tmp.push(_dataObj.end);
                _tmp.push(_dataObj.start);
                _tmp.push(_dataObj.numProbes);
                _tmp.push(_dataObj.value);
                cnaRaphaelData[sampleId].push(_tmp);
            });
            genomicOverviewHelper.plotCnSegs(paper, config, chmInfo, 0, cnaRaphaelData[sampleId], 1, 3, 2, 5, sampleId);
            // --- end of CNA bar chart ---

            // --- mutation events bar chart ---
            genomicOverviewHelper.plotMuts(paper, config, chmInfo, 1, mutationResult, sampleId);
            // --- end of mutation events bar chart ---

        });

    }


    public render() {
        return (
            <div className="genomicOverViewContainer" style={{ backgroundColor: '#F0FFFF'}}>
                <div id="genomic_overview_div"></div>
            </div>
        );
    }
}