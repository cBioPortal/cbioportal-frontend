import * as React from 'react';
import * as _ from 'lodash';
import SampleInline, {SortableSampleInline} from './patientHeader/SampleInline';
import {ClinicalDataBySampleId} from "../../shared/api/api-types-extended";
import { ClinicalData } from "shared/api/generated/CBioPortalAPI";
import {cleanAndDerive} from './clinicalInformation/lib/clinicalAttributesUtil.js';
import styles from './patientHeader/style/clinicalAttributes.scss';
import naturalSort from 'javascript-natural-sort';
import {ClinicalEvent, ClinicalEventData} from "../../shared/api/generated/CBioPortalAPI";
import {action, computed} from "mobx";
import {stringListToIndexSet} from "../../public-lib";


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
    return _.sortBy<ClinicalDataBySampleId>(samples, (sample) => {
        return sampleOrderMap[sample.id];
    });
}


class SampleManager {
    clinicalDataLegacyCleanAndDerived: { [s:string]:any };
    sampleColors: { [s:string]:string };
    commonClinicalDataLegacyCleanAndDerived: { [s:string]:string };

    constructor(
        private _samples: Array<ClinicalDataBySampleId>,
        private getSampleIdOrder: ()=>string[]|null,
        events?: any
    ) {
        this.clinicalDataLegacyCleanAndDerived = {};
        this.sampleColors = {};
        // clinical attributes that should be displayed at patient level, since
        // they are the same in all samples
        this.commonClinicalDataLegacyCleanAndDerived = {};

        _samples.forEach((sample, i) => {
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

        // remove common CANCER_TYPE/CANCER_TYPE_DETAILED in top bar (display on
        // patient)
        ['CANCER_TYPE', 'CANCER_TYPE_DETAILED'].forEach((attr) => {
            if (SampleManager.isSameClinicalAttributeInAllSamples(_samples, attr)) {
                this.commonClinicalDataLegacyCleanAndDerived[attr] = this.clinicalDataLegacyCleanAndDerived[_samples[0].id][attr];
                _samples.forEach((sample) => {
                    delete this.clinicalDataLegacyCleanAndDerived[sample.id][attr];
                });
            }
        })

        this._samples = sortSamples(_samples, this.clinicalDataLegacyCleanAndDerived, events);
    }

    @computed public get samples() {
        const sampleIdOrder = this.getSampleIdOrder();
        if (sampleIdOrder && sampleIdOrder.length === this._samples.length) {
            const sampleOrder = stringListToIndexSet(sampleIdOrder);
            return _.sortBy<ClinicalDataBySampleId>(this._samples, s=>sampleOrder[s.id]);
        } else {
            return this._samples;
        }
    }

    @computed public get sampleIndex() {
        return stringListToIndexSet(this.samples.map(s=>s.id));
    }

    @computed public get sampleLabels() {
        return _.mapValues(this.sampleIndex, i=>String(i+1));
    }

    static isSameClinicalAttributeInAllSamples(samples:Array<ClinicalDataBySampleId>, attribute:string) {
        let uniqueValues = _.uniq(samples.map((sample) => {
            let attr = sample.clinicalData.find(
                (x:ClinicalData) => x.clinicalAttributeId === attribute
            );
            return attr? attr.value : attr
        }));
        return uniqueValues.length === 1 && uniqueValues[0];
    }

    static getClinicalAttributeInSample(sample: ClinicalDataBySampleId, clinicalAttributeId: string) : ClinicalData | undefined {
        return _.find(sample.clinicalData, (data) => {
            return data.clinicalAttributeId === clinicalAttributeId;
        })
    }

    getComponentForSample(sampleId: string,
                          fillOpacity: number = 1,
                          extraTooltipText: string = '',
                          additionalContent: JSX.Element|null = null)
    {
        let sample = _.find(this.samples, (s: ClinicalDataBySampleId)=> {
            return s.id === sampleId;
        });

        return sample && (
            <SampleInline
                sample={sample}
                sampleNumber={this.sampleIndex[sample.id] + 1}
                sampleColor={this.sampleColors[sample.id]}
                fillOpacity={fillOpacity}
                extraTooltipText={extraTooltipText}
                additionalContent={additionalContent}
            />
        );
    }

    getColorForSample(sampleId: string):string {
        return this.sampleColors[sampleId];
    }

    @computed get sampleIdsInOrder():string[] {
        return this.samples.map((sample:ClinicalDataBySampleId) => sample.id);
    }
}

export default SampleManager;
