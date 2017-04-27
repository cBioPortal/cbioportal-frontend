import * as React from "react";
import {SampleLabelHTML} from "../../../shared/components/sampleLabel/SampleLabel";
import { ClinicalDataBySampleId } from "../../../shared/api/api-types-extended";
import {fromPairs} from 'lodash';


interface ISampleInlineProps {
    sample: ClinicalDataBySampleId;
    sampleNumber: number;
    sampleColor: string;
    showClinical: boolean;
}

export default class SampleInline extends React.Component<ISampleInlineProps, {}> {
    public render() {
        const { sample, sampleNumber, sampleColor } = this.props;


        return (
            <SampleLabelHTML color={sampleColor} label={(sampleNumber).toString()} />
        );
    }
}
