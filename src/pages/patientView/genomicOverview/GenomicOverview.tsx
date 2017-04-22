import * as React from 'react';
import * as _ from 'lodash';
import Tracks from './Tracks';
import {ThumbnailExpandVAFPlot} from '../vafPlot/ThumbnailExpandVAFPlot';
import {Mutation} from "../../../shared/api/CBioPortalAPI";
import SampleManager from "../sampleManager";
import {ClinicalDataBySampleId} from "../../../shared/api/api-types-extended";

interface IGenomicOverviewProps {
    mutations: Mutation[];
    cnaSegments: any;
    sampleOrder: {[s:string]:number};
    sampleLabels: {[s:string]:string};
    sampleColors: {[s:string]:string};
    sampleManager: SampleManager;
}
export default class GenomicOverview extends React.Component<IGenomicOverviewProps, {vafPlotData:{[s:string]:number[]}}> {

    constructor(props:IGenomicOverviewProps) {
        super(props);
        const vafPlotData = this.computeVAFPlotData(props.mutations);
        this.state = {
            vafPlotData,
        };
    }

    public render() {

        const labels = _.reduce(this.props.sampleManager.samples, (result: any, sample: ClinicalDataBySampleId, i: number)=>{
            result[sample.id] = i + 1;
            return result;
        }, {});

        return (
            <div style={{ display:'flex', alignItems:'center'  }}>
                <Tracks mutations={this.props.mutations} sampleManager={this.props.sampleManager} cnaSegments={this.props.cnaSegments} />
                <ThumbnailExpandVAFPlot
                    data={this.state.vafPlotData}
                    order={this.props.sampleManager.sampleIndex}
                    colors={this.props.sampleColors}
                    labels={labels}
                    overlayPlacement="right"
                />
            </div>
        );
    }

    private computeVAFPlotData(mutations:Mutation[]):{[s:string]:number[]} {
        const ret:{[s:string]:number[]} = {};
        let sampleId;
        let freq;
        for (let mutation of mutations) {
            sampleId = mutation.sampleId;
            freq = mutation.tumorAltCount / (mutation.tumorRefCount + mutation.tumorAltCount);
            ret[sampleId] = ret[sampleId] || [];
            ret[sampleId].push(freq);
        }
        return ret;
    }

}
