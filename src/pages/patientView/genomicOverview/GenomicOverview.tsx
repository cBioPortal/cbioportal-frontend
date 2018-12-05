import * as React from 'react';
import * as _ from 'lodash';
import {If, Then, Else} from 'react-if';
import {ThumbnailExpandVAFPlot} from '../vafPlot/ThumbnailExpandVAFPlot';
import {MutationFrequenciesBySample} from "../vafPlot/VAFPlot";
import {ClinicalDataBySampleId} from "shared/api/api-types-extended";
import {CopyNumberSeg, Mutation, Sample} from "shared/api/generated/CBioPortalAPI";
import IntegrativeGenomicsViewer from "shared/components/igv/IntegrativeGenomicsViewer";
import {
    WHOLE_GENOME, calcSegmentTrackHeight, defaultSegmentTrackProps, generateSegmentFeatures
} from "shared/lib/IGVUtils";
import {getColorForProteinImpactType} from "shared/lib/MutationUtils";
import SampleManager from "../sampleManager";

interface IGenomicOverviewProps {
    mergedMutations: Mutation[][];
    cnaSegments: any;
    samples:Sample[];
    sampleOrder: {[s:string]:number};
    sampleLabels: {[s:string]:string};
    sampleColors: {[s:string]:string};
    sampleManager: SampleManager;
    containerWidth: number;
    locus?: string;
}

export default class GenomicOverview extends React.Component<IGenomicOverviewProps, { frequencies:MutationFrequenciesBySample }> {

    public static defaultProps: Partial<IGenomicOverviewProps> = {
        locus: WHOLE_GENOME
    };

    shouldComponentUpdate(nextProps:IGenomicOverviewProps){
        // only rerender to resize or to search
        return (
            nextProps.containerWidth !== this.props.containerWidth ||
            nextProps.locus !== this.props.locus
        );
    }

    constructor(props:IGenomicOverviewProps) {
        super(props);
        const frequencies = this.computeMutationFrequencyBySample(props.mergedMutations);
        this.state = {
            frequencies
        };

    }

    /*componentDidMount(){

        var debouncedResize =  _.debounce(()=>this.forceUpdate(),500);

        $(window).resize(debouncedResize);

    }*/

    public get tracks() {
        const tracks: any[] = [];

        if (this.props.cnaSegments.length > 0) {
            // sort segments by sample order
            const segFeatures = generateSegmentFeatures(this.props.cnaSegments.sort(
                (a: CopyNumberSeg, b: CopyNumberSeg) =>
                    this.props.sampleOrder[a.sampleId] - this.props.sampleOrder[b.sampleId])
            );

            const segHeight = calcSegmentTrackHeight(segFeatures);

            tracks.push({
                ...defaultSegmentTrackProps(),
                height: segHeight,
                features: segFeatures
            });
        }

        // TODO enable this for mutation track
        // if (this.props.mergedMutations.length > 0) {
        //     const mutFeatures = _.flatten(this.props.mergedMutations).map(mutation => ({
        //         // TODO sampleKey: mutation.uniqueSampleKey,
        //         sample: mutation.sampleId,
        //         chr: mutation.gene.chromosome,
        //         start: mutation.startPosition,
        //         end: mutation.endPosition,
        //         proteinChange: mutation.proteinChange,
        //         mutationType: mutation.mutationType,
        //         color: getColorForProteinImpactType([mutation])
        //     }));
        //
        //     tracks.push({
        //         type: "annotation",
        //         visibilityWindow: 3088286401,
        //         displayMode: "FILL",
        //         name: "MUT",
        //         height: 25,
        //         features: mutFeatures
        //     });
        // }

        return tracks;
    }

    public render() {

        const labels = _.reduce(this.props.sampleManager.samples, (result: any, sample: ClinicalDataBySampleId, i: number)=>{
            result[sample.id] = i + 1;
            return result;
        }, {});

        return (
            <div style={{ display:'flex' }}>
                <span style={{width: this.getTracksWidth()}}>
                    <IntegrativeGenomicsViewer
                        tracks={this.tracks}
                        locus={this.props.locus}
                    />
                </span>
                <If condition={this.shouldShowVAFPlot()}>
                    <ThumbnailExpandVAFPlot
                        data={this.state.frequencies}
                        order={this.props.sampleManager.sampleIndex}
                        colors={this.props.sampleColors}
                        labels={labels}
                        overlayPlacement="right"
                        cssClass="vafPlot"
                    />
                </If>
            </div>
        );
    }

    private shouldShowVAFPlot():boolean {
        return this.props.mergedMutations.length > 0 && this.isFrequencyExist();
    }

    private isFrequencyExist():boolean {
        for (const frequencyId of Object.keys(this.state.frequencies)){
            if (this.state.frequencies.hasOwnProperty(frequencyId)){
                for (const frequency of this.state.frequencies[frequencyId]){
                    return !isNaN(frequency);
                }
            }
        }
        return false;
    }

    private getTracksWidth():number {
        return this.props.containerWidth - (this.shouldShowVAFPlot() ? 140 : 40);
    }

    private computeMutationFrequencyBySample(mergedMutations:Mutation[][]):MutationFrequenciesBySample {
        const ret:MutationFrequenciesBySample = {};
        let sampleId;
        let freq;
        for (const mutations of mergedMutations) {
            for (const mutation of mutations) {
                if (mutation.tumorAltCount >= 0 && mutation.tumorRefCount >= 0) {
                    sampleId = mutation.sampleId;
                    freq = mutation.tumorAltCount / (mutation.tumorRefCount + mutation.tumorAltCount);
                    ret[sampleId] = ret[sampleId] || [];
                    ret[sampleId].push(freq);
                }
            }
        }
        for (const sampleId of Object.keys(this.props.sampleOrder)) {
            ret[sampleId] = ret[sampleId] || [];
            const shouldAdd = mergedMutations.length - ret[sampleId].length;
            for (let i=0; i<shouldAdd; i++) {
                ret[sampleId].push(NaN);
            }
        }
        return ret;
    }

}
