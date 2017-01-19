import * as React from 'react';
import {OverlayTrigger, Popover} from 'react-bootstrap';
import * as _ from 'lodash';
import SampleInline from './patientHeader/SampleInline';
import {ClinicalDataBySampleId} from "../../shared/api/api-types-extended";
import ClinicalInformationPatientTable from "./clinicalInformation/ClinicalInformationPatientTable";
import {Sample} from "../../shared/api/CBioPortalAPI";

class SampleManager {

    sampleIndex: { [s:string]:number };

    constructor(public samples: Array<ClinicalDataBySampleId>){

        this.sampleIndex = {};

        samples.forEach((sample, i)=>{
           this.sampleIndex[sample.id] = i;
        });
    }

    getComponentForSample(sampleId: string, options?: { showText:Boolean }) {

        let sample = _.find(this.samples, (sample: ClinicalDataBySampleId)=>{
            return sample.id === sampleId;
        });

        return sample && this.getOverlayTriggerSample(sample, this.sampleIndex[sample.id]);
    }

    getComponentsForSamples() {
        this.samples.map((sample)=>this.getComponentForSample(sample.id));
    }

    getOverlayTriggerSample(sample: ClinicalDataBySampleId, sampleIndex: number) {

        let sampleNumberText: number = sampleIndex+1;

        return (
            <OverlayTrigger
                delayHide={100}
                key={sampleNumberText}
                trigger={['hover', 'focus']}
                placement='bottom'
                overlay={this.getPopoverSample(sample, sampleNumberText)}
            >
                <span>
                    <SampleInline
                        sample={sample}
                        sampleNumber={sampleNumberText}
                    />
                </span>
            </OverlayTrigger>
        );
    }

    getPopoverSample(sample: ClinicalDataBySampleId, sampleNumber: number) {
        return (
            <Popover key={sampleNumber} id={'popover-sample-' + sampleNumber}>
                <ClinicalInformationPatientTable showTitleBar={false} data={sample.clinicalData} />
            </Popover>
        );
    }


}

export default SampleManager;
