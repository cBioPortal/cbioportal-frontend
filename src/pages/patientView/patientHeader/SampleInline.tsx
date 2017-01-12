import * as React from "react";
import {SampleLabelHTML} from "../../../shared/components/sampleLabel/SampleLabel";
import { ClinicalDataBySampleId } from "../../../shared/api/api-types-extended";

interface ISampleInlineProps {
    sample: ClinicalDataBySampleId;
    sampleNumber: number;
}

export default class SampleInline extends React.Component<ISampleInlineProps, {}> {
    public render() {
        const { sample, sampleNumber } = this.props;

        return (
            <SampleLabelHTML color={'black'} label={(sampleNumber).toString()} />
        );
    }
}
