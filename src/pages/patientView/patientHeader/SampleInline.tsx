import * as React from "react";
import {SampleLabelHTML} from "../../../shared/components/sampleLabel/SampleLabel";
import { ClinicalDataBySampleId } from "../../../shared/api/api-types-extended";


interface ISampleInlineProps {
    sample: ClinicalDataBySampleId;
    sampleNumber: number;
    sampleColor: string;
    fillOpacity: number;
}

export default class SampleInline extends React.Component<ISampleInlineProps, {}> {
    public render() {
        const { sample, sampleNumber, sampleColor, fillOpacity } = this.props;


        return (
            <SampleLabelHTML fillOpacity={fillOpacity} color={sampleColor} label={(sampleNumber).toString()} />
        );
    }
}
