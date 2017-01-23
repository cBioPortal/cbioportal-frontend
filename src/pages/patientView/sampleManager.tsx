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

    getComponentForSample(sampleId: string, showClinical = false) {

        let sample = _.find(this.samples, (s: ClinicalDataBySampleId)=> {
            return s.id === sampleId;
        });

        console.log(sample);
        return sample && this.getOverlayTriggerSample(sample, this.sampleIndex[sample.id], showClinical);

    }

    getComponentsForSamples() {
        this.samples.map((sample)=>this.getComponentForSample(sample.id));
    }

    getOverlayTriggerSample(sample: ClinicalDataBySampleId, sampleIndex: number, showClinical = false) {

        let sampleNumberText: number = sampleIndex+1;

        return (
            <OverlayTrigger
                delayHide={100}
                key={sampleNumberText}
                trigger={['hover', 'focus']}
                placement='bottom'
                overlay={this.getPopoverSample(sample, sampleNumberText)}
            >
                <SampleInline
                    sample={sample}
                    sampleNumber={sampleNumberText}
                    showClinical={showClinical}
                />
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
