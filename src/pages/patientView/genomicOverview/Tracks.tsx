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
        let sampleIds = _.uniq(_.pluck(this.props.cnaSegments, 'sample'));
        var config = tracksHelper.GenomicOverviewConfig(sampleIds.length, 1000);
        // --- end of params ---

        // --- raphael config ---
        var paper = tracksHelper.createRaphaelCanvas(document.getElementsByClassName('genomicOverviewTracksContainer')[0], config);
        // --- end of raphael config ---

        // --- chromosome chart ---
        var chmInfo = tracksHelper.getChmInfo();
        tracksHelper.plotChromosomes(paper,config,chmInfo);
        // --- end of chromosome chart ---

        // --- CNA bar chart ---

        let rowIndex: number = 0;
        _.each(sampleIds, (_sampleId: string) => {
            let raphaelData: Array<any> = [];
            var _sampleTrackData = _.filter(this.props.cnaSegments, function(_cnaObj: any) { return _cnaObj.sample === _sampleId; });
            _.each(_sampleTrackData, function(_dataObj: any) {
                var _tmp: Array<any> = [];
                _tmp.push(_dataObj.sample);
                _tmp.push(_dataObj.chr);
                _tmp.push(_dataObj.end);
                _tmp.push(_dataObj.start);
                _tmp.push(_dataObj.numProbes);
                _tmp.push(_dataObj.value);
                raphaelData.push(_tmp);
            });
            tracksHelper.plotCnSegs(paper, config, chmInfo, rowIndex, raphaelData, 1, 3, 2, 5, _sampleId);
            rowIndex = rowIndex + 1;
        });
        // --- end of CNA bar chart ---

        // --- mutation events bar chart ---
        //let mutationResultTS: Array<Mutation> = _.map(mutationResult, function(_mutObj: Mutation) {});
        //tracksHelper.plotMuts(paper, config, chmInfo, 1, this.props.mutations, sampleId);
        // --- end of mutation events bar chart ---

    }


    public render() {
        return (
            <div className="genomicOverviewTracksContainer" />
        );
    }
}