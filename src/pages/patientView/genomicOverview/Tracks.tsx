import * as React from "react";
import * as $ from 'jquery';
import * as _ from 'underscore';
import CBioPortalAPI from "shared/api/CBioPortalAPI";
import * as genomicOverviewHelper from './genomicOverviewHelper'
import {CopyNumberSegment} from "../../../shared/api/CBioPortalAPI";

export default class Tracks extends React.Component<{}, {}> {

    constructor(){

        super();

    }


    componentDidMount() {

            const apiResult = this.props.data;

            var cnaResult = apiResult[1];
            var mutationResult = apiResult[0];

            // --- construct params ---
            let sampleId = _.uniq(_.pluck(cnaResult, 'sample'))[0];
            var config = genomicOverviewHelper.GenomicOverviewConfig(2, 1000);
            // --- end of params ---

            // --- raphael config ---
            var paper = genomicOverviewHelper.createRaphaelCanvas('tracks_div', config);
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

    }


    public render() {
        return (
            <div className="genomicOverViewContainer" style={{ backgroundColor: '#F0FFFF'}}>
                <div id="tracks_div"></div>
            </div>
        );
    }
}