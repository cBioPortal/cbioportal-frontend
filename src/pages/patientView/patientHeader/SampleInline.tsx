import * as React from "react";
import {SampleLabelHTML} from "../../../shared/components/sampleLabel/SampleLabel";
import { ClinicalDataBySampleId } from "../../../shared/api/api-types-extended";
import {fromPairs} from 'lodash';
import {getSpans} from '../clinicalInformation/lib/clinicalAttributesUtil.js';

interface ISampleInlineProps {
    sample: ClinicalDataBySampleId;
    sampleNumber: number;
    showClinical: boolean;
}

export default class SampleInline extends React.Component<ISampleInlineProps, {}> {
    public render() {
        const { sample, sampleNumber, showClinical } = this.props;


        if (showClinical) {
            return (
                <span style={{paddingRight: '10px'}}>
                    <SampleLabelHTML color={'black'} label={(sampleNumber).toString()} />
                    {' ' + sample.id}
                    <span className="clinical-spans" dangerouslySetInnerHTML={{__html:
                        getSpans(fromPairs(sample.clinicalData.map((x) => [x.clinicalAttributeId, x.value])), 'lgg_ucsf_2014')}}>
                    </span>
                </span>
            );
        } else {
            return (
                <span style={{paddingRight: '10px'}}>
                    <SampleLabelHTML color={'black'} label={(sampleNumber).toString()} />
                </span>
            );
        }
    }
}
