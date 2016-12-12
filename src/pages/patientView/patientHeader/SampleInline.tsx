import * as React from "react";
import {SampleLabelHTML} from "../../../shared/components/sampleLabel/SampleLabel";
import { ClinicalDataBySampleId } from "../../../shared/api/api-types-extended";
import * as _ from 'underscore';
import {SampleLabelHTML} from "../SampleLabel";
import {ClinicalDataBySampleId} from "../clinicalInformation/getClinicalInformationData";
import {getSpans} from '../clinicalInformation/lib/clinicalAttributesUtil.js';

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
                <span dangerouslySetInnerHTML={{__html:
                    getSpans(_.object(sample.clinicalData.map((x) => [x.attrId, x.attrValue])), 'lgg_ucsf_2014')}}>
                </span>
            </span>
        );
    }
}
