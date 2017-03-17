import * as React from 'react';
import {OverlayTrigger, Popover} from 'react-bootstrap';
import * as _ from 'lodash';
import SampleInline from './patientHeader/SampleInline';
import {ClinicalDataBySampleId} from "../../shared/api/api-types-extended";
import ClinicalInformationPatientTable from "./clinicalInformation/ClinicalInformationPatientTable";
import {Sample} from "../../shared/api/generated/CBioPortalAPI";
import DefaultTooltip from 'shared/components/DefaultTooltip';
import {cleanAndDerive} from './clinicalInformation/lib/clinicalAttributesUtil.js';
import styles from './patientHeader/style/clinicalAttributes.scss';
import naturalSort from 'natural-sort';

// we need this to account for issue with rc-tooltip when dealing with large tooltip overlay content
export function placeArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    const targetEl = this.getRootDomNode();  // eslint-disable-line no-invalid-this
    arrowEl.style.left = '10px';
}


// sort samples based event, clinical data and id
export function sortSamples(samples: Array<ClinicalDataBySampleId>,
                            clinicalDataLegacyCleanAndDerived: { [s:string]:any }) {
    // sort by
    // 1. based on sample collection data (timeline event) (unimplemented)
    // 2. if all cases have derived normalized case types, put primary first (unimplemented)
    // 3. natural sort of sample ids
    let sortedSampleIDs: string[] = [];
    sortedSampleIDs = sortedSampleIDs.concat(samples.map((sample) => sample.id)).sort(naturalSort).reverse();

    return _.sortBy(samples, function(sample) {
        return sortedSampleIDs.indexOf(sample.id);
    });
}



class SampleManager {

    sampleIndex: { [s:string]:number };
    sampleLabels: { [s:string]:string };
    sampleOrder: string[];
    clinicalDataLegacyCleanAndDerived: { [s:string]:any };
    sampleColors: { [s:string]:string };

    constructor(public samples: Array<ClinicalDataBySampleId>) {

        this.sampleIndex = {};
        this.sampleLabels = {};
        this.clinicalDataLegacyCleanAndDerived = {};
        this.sampleColors = {};

        samples.forEach((sample, i) => {
           // add legacy clinical data
           this.clinicalDataLegacyCleanAndDerived[sample.id] = cleanAndDerive(
               _.fromPairs(sample.clinicalData.map((x) => [x.clinicalAttributeId, x.value]))
           );

           // determine color based on DERIVED_NORMALIZED_CASE_TYPE
           let color = 'black';
           if (this.clinicalDataLegacyCleanAndDerived[sample.id]['DERIVED_NORMALIZED_CASE_TYPE'] === 'Primary') {
               color = styles.sampleColorPrimary;
           } else if (this.clinicalDataLegacyCleanAndDerived[sample.id].DERIVED_NORMALIZED_CASE_TYPE === 'Recurrence' ||
                      this.clinicalDataLegacyCleanAndDerived[sample.id].DERIVED_NORMALIZED_CASE_TYPE === 'Progressed') {
               color = styles.sampleColorRecurrence;
           } else if (this.clinicalDataLegacyCleanAndDerived[sample.id].DERIVED_NORMALIZED_CASE_TYPE === 'Metastasis') {
               color = styles.sampleColorMetastasis;
           }

           this.sampleColors[sample.id] = color;
        });

        this.samples = sortSamples(samples, this.clinicalDataLegacyCleanAndDerived);
        this.samples.forEach((sample, i) => {
            this.sampleIndex[sample.id] = i;
            this.sampleLabels[sample.id] = String(i+1);
        });
        // order as array of sample ids (used further downstream)
        this.sampleOrder = _.sortBy(Object.keys(this.sampleIndex), (k) => this.sampleIndex[k]);
    }

    getComponentForSample(sampleId: string, showClinical = false) {

        let sample = _.find(this.samples, (s: ClinicalDataBySampleId)=> {
            return s.id === sampleId;
        });

        return sample && this.getOverlayTriggerSample(sample, this.sampleIndex[sample.id], this.sampleColors[sample.id], showClinical);

    }

    getColorForSample(sampleId: string):string {
        return this.sampleColors[sampleId];
    }

    getSampleIdsInOrder():string[] {
        return this.samples.map((sample:ClinicalDataBySampleId) => sample.id);
    }

    getComponentsForSamples() {
        this.samples.map((sample)=>this.getComponentForSample(sample.id));
    }

    getOverlayTriggerSample(sample: ClinicalDataBySampleId, sampleIndex: number, sampleColor: string, showClinical = false) {

        const sampleNumberText: number = sampleIndex+1;

        // const align = {
        //     points: ['tl', 'tr'], // align top left point of sourceNode with top right point of targetNode
        //     offset: [0, 20], // the offset sourceNode by 10px in x and 20px in y,
        //     targetOffset: ['0','0'], // the offset targetNode by 30% of targetNode width in x and 40% of targetNode height in y,
        // };


        return (<DefaultTooltip
            placement='bottomLeft'
            trigger={['hover', 'focus']}
            overlay={this.getPopoverSample(sample, sampleNumberText)}
            arrowContent={<div className="rc-tooltip-arrow-inner" />}
            destroyTooltipOnHide={false}
            onPopupAlign={placeArrow}
            >
                <svg height="12" width="12">
                <SampleInline
                             sample={sample}
                             sampleNumber={sampleNumberText}
                             sampleColor={sampleColor}
                             showClinical={showClinical}
                         >
                </SampleInline>
                </svg>

        </DefaultTooltip>);

    }

    getPopoverSample(sample: ClinicalDataBySampleId, sampleNumber: number) {
        return (
            <div style={{ maxHeight:400, overflow:'auto' }}>
                <h5>{ sample.id }</h5>
                <ClinicalInformationPatientTable showTitleBar={false} data={sample.clinicalData} />
            </div>
        );
    }


}

export default SampleManager;
