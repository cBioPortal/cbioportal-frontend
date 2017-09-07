import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import $ from 'jquery';
import {If, Then, Else} from 'react-if';
import Tracks from './Tracks';
import {ThumbnailExpandVAFPlot} from '../vafPlot/ThumbnailExpandVAFPlot';
import {Mutation, Sample} from "../../../shared/api/generated/CBioPortalAPI";
import SampleManager from "../sampleManager";
import {ClinicalDataBySampleId} from "../../../shared/api/api-types-extended";
import {MutationFrequenciesBySample} from "../vafPlot/VAFPlot";

interface IGenomicOverviewProps {
    mergedMutations: Mutation[][];
    cnaSegments: any;
    samples:Sample[];
    sampleOrder: {[s:string]:number};
    sampleLabels: {[s:string]:string};
    sampleColors: {[s:string]:string};
    sampleManager: SampleManager;
    getContainerWidth: ()=>number;
}

export default class GenomicOverview extends React.Component<IGenomicOverviewProps, { frequencies:MutationFrequenciesBySample }> {

    shouldComponentUpdate(){
        return false;
    }

    constructor(props:IGenomicOverviewProps) {
        super(props);
        const frequencies = this.computeMutationFrequencyBySample(props.mergedMutations);
        this.state = {
            frequencies
        };

    }

    componentDidMount(){

        var debouncedResize =  _.debounce(()=>this.forceUpdate(),500);

        $(window).resize(debouncedResize);

    }


    public render() {

        const labels = _.reduce(this.props.sampleManager.samples, (result: any, sample: ClinicalDataBySampleId, i: number)=>{
            result[sample.id] = i + 1;
            return result;
        }, {});

        return (
            <div style={{ display:'flex' }}>
                <Tracks mutations={_.flatten(this.props.mergedMutations)}
                        key={Math.random() /* Force remounting on every render */}
                        sampleManager={this.props.sampleManager}
                        width={this.getTracksWidth()}
                        cnaSegments={this.props.cnaSegments}
                        samples={this.props.samples}
                />
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
        return this.props.mergedMutations.length > 0;
    }

    private getTracksWidth():number {
        return this.props.getContainerWidth() - (this.shouldShowVAFPlot() ? 140 : 40);
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
