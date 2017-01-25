import * as React from "react";
import {SampleLabelHTML} from "../../../shared/components/sampleLabel/SampleLabel";
import { ClinicalDataBySampleId } from "../../../shared/api/api-types-extended";
import {fromPairs} from 'lodash';
import {cleanAndDerive, getSpans} from '../clinicalInformation/lib/clinicalAttributesUtil.js';

interface ISampleInlineProps {
    sample: ClinicalDataBySampleId;
    sampleNumber: number;
    showClinical: boolean;
}

export default class SampleInline extends React.Component<ISampleInlineProps, {}> {
    public render() {
        const { sample, sampleNumber, showClinical } = this.props;


        const clinicalDataLegacy: any = fromPairs(sample.clinicalData.map((x) => [x.clinicalAttributeId, x.value]));
        const clinicalDataLegacyCleanAndDerived: any = cleanAndDerive(clinicalDataLegacy);

        const customCircleAttributes: Object = {
            'data-derived-normalized-case-type': clinicalDataLegacyCleanAndDerived.DERIVED_NORMALIZED_CASE_TYPE
        };


        if (showClinical) {
            return (
                <span style={{paddingRight: '10px'}}>
                    <SampleLabelHTML label={(sampleNumber).toString()} customCircleAttributes={customCircleAttributes} />
                    {' ' + sample.id}
                    <span className="clinical-spans" dangerouslySetInnerHTML={{__html:
                        getSpans(clinicalDataLegacy, 'lgg_ucsf_2014')}}>
                    </span>
                </span>
            );
        } else {
            return (
                <span style={{paddingRight: '10px'}}>
                    <SampleLabelHTML label={(sampleNumber).toString()} customCircleAttributes={customCircleAttributes} />
                </span>
            );
        }
    }
}
