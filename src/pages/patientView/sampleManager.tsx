import * as React from 'react';
import * as _ from 'lodash';
import SampleInline from './patientHeader/SampleInline';
import {ClinicalDataBySampleId} from "../../shared/api/api-types-extended";
import ClinicalInformationPatientTable from "./clinicalInformation/ClinicalInformationPatientTable";
import DefaultTooltip from 'shared/components/DefaultTooltip';
import {cleanAndDerive} from './clinicalInformation/lib/clinicalAttributesUtil.js';
import styles from './patientHeader/style/clinicalAttributes.scss';
import naturalSort from 'javascript-natural-sort';
import {ClinicalEvent, ClinicalEventData} from "../../shared/api/generated/CBioPortalAPI";

// we need this to account for issue with rc-tooltip when dealing with large tooltip overlay content
export function placeArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    const targetEl = this.getRootDomNode();  // eslint-disable-line no-invalid-this
    arrowEl.style.left = '10px';
}


// sort samples based on event, clinical data and id
// 1. based on sample collection data (timeline event)
// 2. if all cases have derived normalized case types, put primary first
// 3. natural sort of sample ids
export function sortSamples(samples: Array<ClinicalDataBySampleId>,
                            clinicalDataLegacyCleanAndDerived: { [s:string]:any },
                            events?: any) {
    // natural sort (use contrived concatenation, to avoid complaints about
    // immutable types)
    let naturalSortedSampleIDs: string[] = [];
    naturalSortedSampleIDs = naturalSortedSampleIDs.concat(samples.map((sample) => sample.id)).sort(naturalSort);

    // based on sample collection data (timeline event)
    let collectionDayMap: {[s:string]:number} = {};
    if (events) {
        let specimenEvents = events.filter((e: ClinicalEvent) => (e.eventType === 'SPECIMEN'));

        collectionDayMap = specimenEvents.reduce((map:{[s:string]:number}, specimenEvent: ClinicalEvent) => {
            let sampleAttr = _.find(specimenEvent.attributes, (attr: ClinicalEventData) => {
                // TODO: This is legacy support for old timeline data that does not use SAMPLE_ID, but one of the specrefnum
                return (attr.key === "SAMPLE_ID" || attr.key === "SpecimenReferenceNumber" || attr.key === "SPECIMEN_REFERENCE_NUMBER") &&
                    (naturalSortedSampleIDs.indexOf(attr.value) !== -1);
            });
            if (sampleAttr) {
                map[sampleAttr.value] = specimenEvent.startNumberOfDaysSinceDiagnosis;
            }
            return map;
        }, {});
    }

    // create new object array, to allow sorting of samples by multiple fields
    type sampleOrderT = {
        id: string;
        // fields to sort by
        eventOrdering?: number;
        sampleTypeIndex: number;
        naturalSortIndex: number;
    };
    // put primaries first (could be extended with more if necessary)
    let sampleTypeOrdering: string[] = ['Primary'];
    let sampleOrder: sampleOrderT[] = [];
    
    for (let i: number = 0; i < samples.length; i++) {
        let id = samples[i].id;
        // 1. based on sample collection data (timeline event)
        let eventOrdering = collectionDayMap[id];

        // 2. if cases have derived normalized case types, put primary first
        let sampleTypeIndex = sampleTypeOrdering.indexOf(clinicalDataLegacyCleanAndDerived[id].DERIVED_NORMALIZED_CASE_TYPE);
        if (sampleTypeIndex === -1) {
            sampleTypeIndex = sampleTypeOrdering.length;
        }

        // 3. natural sort of sample ids
        let naturalSortIndex = naturalSortedSampleIDs.indexOf(id);

        sampleOrder = sampleOrder.concat({id, sampleTypeIndex, naturalSortIndex, eventOrdering});
    }

    sampleOrder = _.orderBy(sampleOrder, ['eventOrdering', 'sampleTypeIndex', 'naturalSortIndex'], ['asc','asc','asc']);
    let sampleOrderMap = _.fromPairs(sampleOrder.map((so, i) => [so.id, i]));
    return _.sortBy(samples, (sample) => {
        return sampleOrderMap[sample.id];
    });
}


class SampleManager {

    sampleIndex: { [s:string]:number };
    sampleLabels: { [s:string]:string };
    sampleOrder: string[];
    clinicalDataLegacyCleanAndDerived: { [s:string]:any };
    sampleColors: { [s:string]:string };

    constructor(public samples: Array<ClinicalDataBySampleId>, events?: any) {

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
           } else if (this.clinicalDataLegacyCleanAndDerived[sample.id].DERIVED_NORMALIZED_CASE_TYPE === 'cfDNA') {
               color = styles.sampleColorCfdna;
           } else if (this.clinicalDataLegacyCleanAndDerived[sample.id].DERIVED_NORMALIZED_CASE_TYPE === 'Xenograft') {
               color = styles.sampleColorXenograft;
           }

           this.sampleColors[sample.id] = color;
        });

        this.samples = sortSamples(samples, this.clinicalDataLegacyCleanAndDerived, events);
        this.samples.forEach((sample, i) => {
            this.sampleIndex[sample.id] = i;
            this.sampleLabels[sample.id] = String(i+1);
        });
        // order as array of sample ids (used further downstream)
        this.sampleOrder = _.sortBy(Object.keys(this.sampleIndex), (k) => this.sampleIndex[k]);
    }

    getComponentForSample(sampleId: string, fillOpacity: number = 1) {

        let sample = _.find(this.samples, (s: ClinicalDataBySampleId)=> {
            return s.id === sampleId;
        });

        return sample && this.getOverlayTriggerSample(sample, this.sampleIndex[sample.id], this.sampleColors[sample.id], fillOpacity=fillOpacity);

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

    getOverlayTriggerSample(sample: ClinicalDataBySampleId, sampleIndex: number, sampleColor: string, fillOpacity: number = 1) {

        const sampleNumberText: number = sampleIndex+1;

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
                             fillOpacity={fillOpacity}
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
