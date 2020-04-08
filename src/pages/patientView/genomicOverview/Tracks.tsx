import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import * as tracksHelper from './tracksHelper';
import {
    ClinicalDataBySampleId,
    CopyNumberSeg,
    Mutation,
    Sample,
} from 'cbioportal-ts-api-client';
import SampleManager from '../SampleManager';
import { IKeyedIconData, IIconData } from './GenomicOverviewUtils';
import { observable, action } from 'mobx';
import autobind from 'autobind-decorator';
import { observer } from 'mobx-react';

interface TracksPropTypes {
    mutations: Array<Mutation>;
    cnaSegments: Array<CopyNumberSeg>;
    sampleManager: SampleManager;
    samples: Sample[];
    width: number;
    mutationGenePanelIconData?: IKeyedIconData;
    copyNumberGenePanelIconData?: IKeyedIconData;
    onSelectGenePanel?: (name: string) => void;
}

export const DEFAULT_GENOME_BUILD = 'GRCh37';
const noGenePanelMessage =
    'Gene panel information not found. Sample is presumed to be whole exome/genome sequenced.';

@observer
export default class Tracks extends React.Component<TracksPropTypes, {}> {
    @observable genePanelInTooltip: string = '';

    componentDidMount() {
        this.drawTracks();
    }

    @autobind
    @action
    setGenePanelInTooltip(genePanelId: string) {
        this.genePanelInTooltip = genePanelId;
    }

    drawTracks() {
        // --- construct params ---
        let cnaSamples = _.keyBy(
            this.props.samples.filter(s => s.copyNumberSegmentPresent),
            s => s.sampleId
        );
        let mutSamples = _.keyBy(
            this.props.samples.filter(s => s.sequenced),
            s => s.sampleId
        );
        const showGenePanelIcons = !!(
            (this.props.mutationGenePanelIconData &&
                _.keys(this.props.mutationGenePanelIconData).length > 0) ||
            (this.props.copyNumberGenePanelIconData &&
                _.keys(this.props.copyNumberGenePanelIconData).length > 0)
        );
        var config = tracksHelper.GenomicOverviewConfig(
            Object.keys(cnaSamples).length + Object.keys(mutSamples).length,
            this.props.width,
            showGenePanelIcons
        );
        // --- end of params ---

        // --- raphael config ---
        let rowIndex: number = 0;
        var paper = tracksHelper.createRaphaelCanvas(
            document.getElementsByClassName(
                'genomicOverviewTracksContainer'
            )[0],
            config
        );
        // --- end of raphael config ---

        // --- chromosome chart ---
        let genomeBuild = DEFAULT_GENOME_BUILD;
        if (this.props.mutations && this.props.mutations.length > 0) {
            genomeBuild = this.props.mutations[0].ncbiBuild;
        }
        const chmInfo = tracksHelper.getChmInfo(genomeBuild);
        tracksHelper.plotChromosomes(paper, config, chmInfo, genomeBuild);
        // --- end of chromosome chart ---

        _.each(
            this.props.sampleManager.samples,
            (sample: ClinicalDataBySampleId) => {
                let genePanelIconData: IIconData = {} as IIconData;
                if (this.props.mutationGenePanelIconData) {
                    genePanelIconData = this.props.mutationGenePanelIconData[
                        sample.id
                    ];
                }

                // --- CNA bar chart ---
                if (cnaSamples[sample.id]) {
                    let raphaelData: Array<any> = [];
                    var _trackData = _.filter(this.props.cnaSegments, function(
                        _cnaObj: CopyNumberSeg
                    ) {
                        return _cnaObj.sampleId === sample.id;
                    });
                    _.each(_trackData, function(_dataObj: CopyNumberSeg) {
                        var _tmp: Array<any> = [];
                        _tmp.push(_dataObj.sampleId);
                        _tmp.push(_dataObj.chromosome);
                        _tmp.push(_dataObj.end);
                        _tmp.push(_dataObj.start);
                        _tmp.push(_dataObj.numberOfProbes);
                        _tmp.push(_dataObj.segmentMean);
                        raphaelData.push(_tmp);
                    });
                    tracksHelper.plotCnSegs(
                        paper,
                        config,
                        chmInfo,
                        rowIndex,
                        raphaelData,
                        1,
                        3,
                        2,
                        5,
                        sample.id,
                        genePanelIconData,
                        this.setGenePanelInTooltip
                    );
                    rowIndex = rowIndex + 1;

                    if (this.props.sampleManager.samples.length > 1) {
                        const $container = $(`[id="cnaTrack${sample.id}"]`);
                        const pos = {
                            x: parseInt($container.attr('x')!) - 10,
                            y: parseInt($container.attr('y')!) - 5,
                        };
                        const $newContainer = $(
                            '<svg height="12" width="12" />'
                        ).attr(pos);
                        $container.replaceWith($newContainer);

                        let comp: any = this.props.sampleManager.getComponentForSample(
                            sample.id,
                            1,
                            '',
                            null,
                            this.props.onSelectGenePanel
                        );
                        ReactDOM.render(comp, $newContainer[0]);
                    }
                }
            }
        );
        // --- end of CNA bar chart ---

        // --- mutation events bar chart ---
        _.each(
            this.props.sampleManager.samples,
            (sample: ClinicalDataBySampleId) => {
                let genePanelIconData: IIconData = {} as IIconData;
                if (this.props.mutationGenePanelIconData) {
                    genePanelIconData = this.props.mutationGenePanelIconData[
                        sample.id
                    ];
                }

                if (mutSamples[sample.id]) {
                    var _trackData = _.filter(this.props.mutations, function(
                        _mutObj: any
                    ) {
                        return _mutObj.sampleId === sample.id;
                    });
                    tracksHelper.plotMuts(
                        paper,
                        config,
                        chmInfo,
                        rowIndex,
                        _trackData,
                        sample.id,
                        genePanelIconData,
                        this.setGenePanelInTooltip
                    );
                    rowIndex = rowIndex + 1;

                    if (this.props.sampleManager.samples.length > 1) {
                        const id = `mutTrack${sample.id}`;
                        const $container = $(`[id="${id}"]`);
                        const pos = {
                            x: parseInt($container.attr('x')!) - 10,
                            y: parseInt($container.attr('y')!) - 5,
                        };
                        const $newContainer = $(
                            `<svg id="${id}" height="12" width="12" />`
                        );
                        $newContainer.attr(pos);
                        $container.replaceWith($newContainer);

                        let comp: any = this.props.sampleManager.getComponentForSample(
                            sample.id,
                            1,
                            '',
                            null,
                            this.props.onSelectGenePanel
                        );

                        ReactDOM.render(comp, $newContainer[0]);
                    }
                }
            }
        );
        // --- end of mutation events bar chart ---
    }

    public render() {
        return (
            <React.Fragment>
                <div className="genomicOverviewTracksContainer" />
                <div className="tooltip-content" style={{ display: 'none' }}>
                    <span>
                        {this.genePanelInTooltip ? (
                            <React.Fragment>
                                Gene panel:{' '}
                                <a
                                    onClick={() =>
                                        this.props.onSelectGenePanel!(
                                            this.genePanelInTooltip
                                        )
                                    }
                                >
                                    {this.genePanelInTooltip}
                                </a>
                            </React.Fragment>
                        ) : (
                            noGenePanelMessage
                        )}
                    </span>
                </div>
            </React.Fragment>
        );
    }
}
