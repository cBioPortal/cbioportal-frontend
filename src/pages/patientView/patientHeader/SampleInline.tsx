import * as React from "react";
import {SampleLabelHTML} from "../SampleLabel";
import {ClinicalDataBySampleId} from "../clinicalInformation/getClinicalInformationData";

interface ISampleInlineProps {
    sample: ClinicalDataBySampleId;
    sampleNumber: number;
}

export default class SampleInline extends React.Component<ISampleInlineProps, {}> {
    public render() {
        const { sample, sampleNumber } = this.props;

        return (
            <span style={{paddingRight: '10px'}}>
                <SampleLabelHTML color={'black'} label={(sampleNumber).toString()} />
                {' ' + sample.id}
            </span>
        );
    }
}
