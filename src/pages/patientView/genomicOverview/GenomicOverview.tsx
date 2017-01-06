import * as React from 'react';
import Tracks from './Tracks';
import {ThumbnailExpandVAFPlot} from '../vafPlot/ThumbnailExpandVAFPlot';
import {Mutation} from "../../../shared/api/CBioPortalAPI";

interface IGenomicOverviewProps {
    mutations: Mutation[];
    cnaSegments: any;
    sampleOrder: {[s:string]:number};
    sampleLabels: {[s:string]:string};
    sampleColors: {[s:string]:string};
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

        return (
            <div>
                <Tracks mutations={this.props.mutations} cnaSegments={this.props.cnaSegments} />
                <ThumbnailExpandVAFPlot
                    data={this.state.vafPlotData}
                    order={this.props.sampleOrder}
                    colors={this.props.sampleColors}
                    labels={this.props.sampleLabels}
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
