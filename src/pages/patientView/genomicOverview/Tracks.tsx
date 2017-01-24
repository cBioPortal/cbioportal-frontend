import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import * as tracksHelper from './tracksHelper'
import {CopyNumberSeg, Mutation} from 'shared/api/CBioPortalAPI';
import SampleManager from "../sampleManager";
import {ClinicalDataBySampleId} from "../../../shared/api/api-types-extended";

interface TracksPropTypes {
    mutations:Array<Mutation>;
    cnaSegments:Array<CopyNumberSeg>;
    sampleManager:SampleManager;
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


        _.each(this.props.sampleManager.samples, (sample: ClinicalDataBySampleId) => {

            // --- CNA bar chart ---
            if (_.includes(uniqCnasampleIds, sample.id)) {
                let raphaelData: Array<any> = [];
                var _trackData = _.filter(this.props.cnaSegments, function (_cnaObj: any) {
                    return _cnaObj.sample === sample.id;
                });
                _.each(_trackData, function (_dataObj: any) {
                    var _tmp: Array<any> = [];
                    _tmp.push(_dataObj.sample);
                    _tmp.push(_dataObj.chr);
                    _tmp.push(_dataObj.end);
                    _tmp.push(_dataObj.start);
                    _tmp.push(_dataObj.numProbes);
                    _tmp.push(_dataObj.value);
                    raphaelData.push(_tmp);
                });
                tracksHelper.plotCnSegs(paper, config, chmInfo, rowIndex, raphaelData, 1, 3, 2, 5, sample.id);
                rowIndex = rowIndex + 1;

                if (this.props.sampleManager.samples.length > 1) {
                    const $container = $(`#cnaTrack${sample.id}`);
                    const pos = {x: $container.attr('x'), y: $container.attr('y')};
                    const $newContainer = $('<svg height="12" width="12" />').attr(pos);
                    $container.replaceWith($newContainer);

                    let comp: any = this.props.sampleManager.getComponentForSample(sample.id);

                    ReactDOM.render(
                        comp,
                        $newContainer[0]
                    );
                }
            }
        });
        // --- end of CNA bar chart ---


        // --- mutation events bar chart ---
        _.each(this.props.sampleManager.samples, (sample: ClinicalDataBySampleId) => {
            if (_.includes(uniqMutSampleIds, sample.id)) {
                var _trackData = _.filter(this.props.mutations, function (_mutObj: any) {
                    return _mutObj.sampleId === sample.id;
                });
                tracksHelper.plotMuts(paper, config, chmInfo, rowIndex, _trackData, sample.id);
                rowIndex = rowIndex + 1;

                if (this.props.sampleManager.samples.length > 1) {
                    const $container = $(`#mutTrack${sample.id}`);
                    const pos = {x: $container.attr('x'), y: $container.attr('y')};
                    const $newContainer = $('<svg height="12" width="12" />').attr(pos);
                    $container.replaceWith($newContainer);

                    let comp: any = this.props.sampleManager.getComponentForSample(sample.id);

                    ReactDOM.render(
                        comp,
                        $newContainer[0]
                    );
                }
            }
        });
        // --- end of mutation events bar chart ---




    }


    public render() {
        return (
            <div className="genomicOverviewTracksContainer" />
        );
    }
}