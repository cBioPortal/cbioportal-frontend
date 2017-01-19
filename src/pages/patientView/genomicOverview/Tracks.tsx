import * as React from 'react';
import * as _ from 'lodash';
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
        let uniqCnasampleIds = _.uniq(_.map(this.props.cnaSegments, 'sample'));
        let uniqMutSampleIds = _.uniq(_.map(this.props.mutations, 'sampleId'));
        var config = tracksHelper.GenomicOverviewConfig(uniqCnasampleIds.length + uniqMutSampleIds.length, 1000);
        // --- end of params ---

        // --- raphael config ---
        let rowIndex: number = 0;
        var paper = tracksHelper.createRaphaelCanvas(document.getElementsByClassName('genomicOverviewTracksContainer')[0], config);
        // --- end of raphael config ---

        // --- chromosome chart ---
        var chmInfo = tracksHelper.getChmInfo();
        tracksHelper.plotChromosomes(paper,config,chmInfo);
        // --- end of chromosome chart ---

        // --- CNA bar chart ---
        _.each(uniqCnasampleIds, (_sampleId: string) => {
            let raphaelData: Array<any> = [];
            var _trackData = _.filter(this.props.cnaSegments, function(_cnaObj: any) { return _cnaObj.sample === _sampleId; });
            _.each(_trackData, function(_dataObj: any) {
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
        _.each(uniqMutSampleIds, (_sampleId: string) => {
            var _trackData = _.filter(this.props.mutations, function(_mutObj: any) {   return _mutObj.sampleId === _sampleId; });
            tracksHelper.plotMuts(paper, config, chmInfo, rowIndex, _trackData, _sampleId);
            rowIndex = rowIndex + 1;
        });
        // --- end of mutation events bar chart ---

    }


    public render() {
        return (
            <div className="genomicOverviewTracksContainer" />
        );
    }
}