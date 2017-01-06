import * as React from 'react';
import * as _ from 'underscore';
import * as tracksHelper from './tracksHelper'
import {CopyNumberSegment, Mutation} from 'shared/api/CBioPortalAPI';

interface TracksPropTypes {
    mutations:Array<Mutation>;
    cnaSegments:Array<CopyNumberSegment>;
}

export default class Tracks extends React.Component<TracksPropTypes, {}> {

    constructor(){
        super();
    }

    componentDidMount() {

        // --- construct params ---
        let sampleId = _.uniq(_.pluck(this.props.cnaSegments, 'sample'))[0];
        var config = tracksHelper.GenomicOverviewConfig(2, 1000);
        // --- end of params ---

        // --- raphael config ---
        var paper = tracksHelper.createRaphaelCanvas(document.getElementsByClassName('genomicOverviewTracksContainer')[0], config);
        // --- end of raphael config ---

        // --- chromosome chart ---
        var chmInfo = tracksHelper.getChmInfo();
        tracksHelper.plotChromosomes(paper,config,chmInfo);
        // --- end of chromosome chart ---

        // --- CNA bar chart ---
        let cnaRaphaelData: any = {};
        cnaRaphaelData[sampleId] = [];
        _.each(this.props.cnaSegments, function(_dataObj: any) {
            var _tmp: Array<any> = [];
            _tmp.push(_dataObj.sample);
            _tmp.push(_dataObj.chr);
            _tmp.push(_dataObj.end);
            _tmp.push(_dataObj.start);
            _tmp.push(_dataObj.numProbes);
            _tmp.push(_dataObj.value);
            cnaRaphaelData[sampleId].push(_tmp);
        });
        tracksHelper.plotCnSegs(paper, config, chmInfo, 0, cnaRaphaelData[sampleId], 1, 3, 2, 5, sampleId);
        // --- end of CNA bar chart ---

        // --- mutation events bar chart ---
        //let mutationResultTS: Array<Mutation> = _.map(mutationResult, function(_mutObj: Mutation) {});
        tracksHelper.plotMuts(paper, config, chmInfo, 1, this.props.mutations, sampleId);
        // --- end of mutation events bar chart ---

    }


    public render() {
        return (
            <div className="genomicOverviewTracksContainer" />
        );
    }
}