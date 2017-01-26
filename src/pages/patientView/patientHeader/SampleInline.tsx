import * as React from "react";
import {SampleLabelHTML} from "../../../shared/components/sampleLabel/SampleLabel";
import { ClinicalDataBySampleId } from "../../../shared/api/api-types-extended";
import {fromPairs} from 'lodash';
import {getSpans} from '../clinicalInformation/lib/clinicalAttributesUtil.js';


interface ISampleInlineProps {
    sample: ClinicalDataBySampleId;
    sampleNumber: number;
    sampleColor: string;
    showClinical: boolean;
}

export default class SampleInline extends React.Component<ISampleInlineProps, {}> {
    public render() {
        const { sample, sampleNumber, sampleColor, showClinical } = this.props;

        if (showClinical) {
            const clinicalDataLegacy: any = fromPairs(sample.clinicalData.map((x) => [x.clinicalAttributeId, x.value]));

            return (
                <span style={{paddingRight: '10px'}}>
                    <SampleLabelHTML color={sampleColor} label={(sampleNumber).toString()} />
                    {' ' + sample.id}
                    <span className='clinical-spans' dangerouslySetInnerHTML={{__html:
                        getSpans(clinicalDataLegacy, 'lgg_ucsf_2014')}}>
                    </span>
                </span>
            );
        } else {
            return (
                <span>
                    <SampleLabelHTML color={sampleColor} label={(sampleNumber).toString()} />
                </span>
            );
        }
    }
}
