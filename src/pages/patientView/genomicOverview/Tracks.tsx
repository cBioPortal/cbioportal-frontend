import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import * as tracksHelper from './tracksHelper'
import {CopyNumberSeg, Mutation, Sample} from 'shared/api/generated/CBioPortalAPI';
import SampleManager from "../sampleManager";
import {ClinicalDataBySampleId} from "../../../shared/api/api-types-extended";
import {stringListToSet} from "../../../shared/lib/StringUtils";

interface TracksPropTypes {
    mutations:Array<Mutation>;
    cnaSegments:Array<CopyNumberSeg>;
    sampleManager:SampleManager;
    samples:Sample[];
    width:number;
}

export default class Tracks extends React.Component<TracksPropTypes, {}> {

    constructor(){
        super();
    }

    componentDidMount() {

        // --- construct params ---
        let cnaSamples = _.keyBy(this.props.samples.filter(s=>s.copyNumberSegmentPresent), s=>s.sampleId);
        let mutSamples = _.keyBy(this.props.samples.filter(s=>s.sequenced), s=>s.sampleId);
        var config = tracksHelper.GenomicOverviewConfig(Object.keys(cnaSamples).length + Object.keys(mutSamples).length, this.props.width);
        // --- end of params ---

        // --- raphael config ---
        let rowIndex: number = 0;
        var paper = tracksHelper.createRaphaelCanvas(document.getElementsByClassName('genomicOverviewTracksContainer')[0], config);
        // --- end of raphael config ---

        // --- chromosome chart ---
        var chmInfo = tracksHelper.getChmInfo(this.props.mutations[0].ncbiBuild);
        tracksHelper.plotChromosomes(paper,config,chmInfo);
        // --- end of chromosome chart ---


        _.each(this.props.sampleManager.samples, (sample: ClinicalDataBySampleId) => {

            // --- CNA bar chart ---
            if (cnaSamples[sample.id]) {
                let raphaelData: Array<any> = [];
                var _trackData = _.filter(this.props.cnaSegments, function (_cnaObj: CopyNumberSeg) {
                    return _cnaObj.sampleId === sample.id;
                });
                _.each(_trackData, function (_dataObj: CopyNumberSeg) {
                    var _tmp: Array<any> = [];
                    _tmp.push(_dataObj.sampleId);
                    _tmp.push(_dataObj.chromosome);
                    _tmp.push(_dataObj.end);
                    _tmp.push(_dataObj.start);
                    _tmp.push(_dataObj.numberOfProbes);
                    _tmp.push(_dataObj.segmentMean);
                    raphaelData.push(_tmp);
                });
                tracksHelper.plotCnSegs(paper, config, chmInfo, rowIndex, raphaelData, 1, 3, 2, 5, sample.id);
                rowIndex = rowIndex + 1;

                if (this.props.sampleManager.samples.length > 1) {
                    const $container = $(`#cnaTrack${sample.id}`);
                    const pos = {x: parseInt($container.attr('x')) - 10, y: parseInt($container.attr('y')) - 5};
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
            if (mutSamples[sample.id]) {
                var _trackData = _.filter(this.props.mutations, function (_mutObj: any) {
                    return _mutObj.sampleId === sample.id;
                });
                tracksHelper.plotMuts(paper, config, chmInfo, rowIndex, _trackData, sample.id);
                rowIndex = rowIndex + 1;

                if (this.props.sampleManager.samples.length > 1) {
                    const id = `#mutTrack${sample.id}`;
                    const $container = $(id);
                    const pos = {x: parseInt($container.attr('x')) - 10, y: parseInt($container.attr('y')) - 5};
                    const $newContainer = $(`<svg id="${id}" height="12" width="12" />`);
                    $newContainer.attr(pos);
                    $container.replaceWith($newContainer);

                    let comp: any = this.props.sampleManager.getComponentForSample(sample.id);

                    ReactDOM.render(
                        comp,
                        $newContainer[0]
                    );
                }
            };
        });
        // --- end of mutation events bar chart ---




    }


    public render() {
        return (
            <div className="genomicOverviewTracksContainer" />
        );
    }
}
