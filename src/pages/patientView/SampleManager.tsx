import * as React from 'react';
import _ from 'lodash';
import SampleInline from './patientHeader/SampleInline';
import {
    ClinicalData,
    ClinicalDataBySampleId,
    ClinicalAttribute,
} from 'cbioportal-ts-api-client';
import { cleanAndDerive } from './clinicalInformation/lib/clinicalAttributesUtil.js';
import styles from './patientHeader/style/clinicalAttributes.module.scss';
import naturalSort from 'javascript-natural-sort';
import { ClinicalEvent } from 'cbioportal-ts-api-client';
import { SampleLabelHTML } from 'shared/components/sampleLabel/SampleLabel';
import { computed, makeObservable } from 'mobx';
import { getServerConfig, ServerConfigHelpers } from 'config/config';
import { getClinicalAttributeDisplayName } from 'shared/lib/ClinicalAttributeDisplay';

// sort samples based on event, clinical data and id
// 1. based on sample collection data (timeline event)
// 2. if all cases have derived normalized case types, put primary first
// 3. natural sort of sample ids
export function sortSamples(
    samples: Array<ClinicalDataBySampleId>,
    clinicalDataLegacyCleanAndDerived: { [s: string]: any },
    events?: ClinicalEvent[]
) {
    const naturalSortedSampleIDs = new Array<string>(samples.length);
    for (let index = 0; index < samples.length; index += 1) {
        naturalSortedSampleIDs[index] = samples[index].id;
    }
    naturalSortedSampleIDs.sort(naturalSort);
    const naturalSortIndexMap: { [sampleId: string]: number } = {};
    for (let index = 0; index < naturalSortedSampleIDs.length; index += 1) {
        naturalSortIndexMap[naturalSortedSampleIDs[index]] = index;
    }

    // based on sample collection data (timeline event)
    const collectionDayMap = getSpecimenCollectionDayMap(
        naturalSortedSampleIDs,
        events
    );

    // create new object array, to allow sorting of samples by multiple fields
    type sampleOrderT = {
        id: string;
        // fields to sort by
        eventOrdering?: number;
        sampleTypeIndex: number;
        naturalSortIndex: number;
    };
    // put primaries first (could be extended with more if necessary)
    let sampleTypeOrdering: string[] = ['primary', 'metastasis', 'cfdna'];
    let sampleOrder: sampleOrderT[] = new Array<sampleOrderT>(samples.length);

    for (let i: number = 0; i < samples.length; i++) {
        let id = samples[i].id;
        // 1. based on sample collection data (timeline event)
        let eventOrdering = collectionDayMap.get(id);

        // 2. if cases have derived normalized case types, put primary first
        const caseType =
            clinicalDataLegacyCleanAndDerived[id].DERIVED_NORMALIZED_CASE_TYPE;
        let sampleTypeIndex = caseType
            ? sampleTypeOrdering.indexOf(caseType.toLowerCase())
            : -1;
        if (sampleTypeIndex === -1) {
            sampleTypeIndex = sampleTypeOrdering.length;
        }

        // 3. natural sort of sample ids
        let naturalSortIndex = naturalSortIndexMap[id];

        sampleOrder[i] = {
            id,
            sampleTypeIndex,
            naturalSortIndex,
            eventOrdering,
        };
    }

    sampleOrder.sort((left, right) => {
        const leftEventOrdering =
            left.eventOrdering === undefined
                ? Number.POSITIVE_INFINITY
                : left.eventOrdering;
        const rightEventOrdering =
            right.eventOrdering === undefined
                ? Number.POSITIVE_INFINITY
                : right.eventOrdering;
        return (
            leftEventOrdering - rightEventOrdering ||
            left.sampleTypeIndex - right.sampleTypeIndex ||
            left.naturalSortIndex - right.naturalSortIndex
        );
    });
    let sampleOrderMap: { [sampleId: string]: number } = {};
    for (let index = 0; index < sampleOrder.length; index += 1) {
        sampleOrderMap[sampleOrder[index].id] = index;
    }

    const sortedSamples = [...samples];
    sortedSamples.sort((left, right) => {
        return sampleOrderMap[left.id] - sampleOrderMap[right.id];
    });
    return sortedSamples;
}

export function getSpecimenCollectionDayMap(
    sampleIDs: string[],
    events?: ClinicalEvent[]
) {
    let collectionDayMap = new Map<string, number>();
    if (events) {
        const sampleIdSet = new Set(sampleIDs);
        // use SPECIMEN or SAMPLE_ACQUISITION track on timeline to get timeline
        // event
        // TODO: SAMPLE_ACQUISITION is specific to genie_bpc_test study. We
        // should probably have some config to allow people to choose what
        // timeline tracks get labels
        for (let eventIndex = 0; eventIndex < events.length; eventIndex += 1) {
            const event = events[eventIndex];
            if (
                !/SPECIMEN|Sample Acquisition|sample_acquisition'/i.test(
                    event.eventType
                )
            ) {
                continue;
            }

            const attributes = event.attributes || [];
            for (
                let attributeIndex = 0;
                attributeIndex < attributes.length;
                attributeIndex += 1
            ) {
                const attr = attributes[attributeIndex];
                if (
                    (attr.key === 'SAMPLE_ID' ||
                        attr.key === 'SpecimenReferenceNumber' ||
                        attr.key === 'SPECIMEN_REFERENCE_NUMBER') &&
                    sampleIdSet.has(attr.value)
                ) {
                    collectionDayMap.set(
                        attr.value,
                        event.startNumberOfDaysSinceDiagnosis
                    );
                    break;
                }
            }
        }
    }
    return collectionDayMap;
}

export function clinicalAttributeListForSamples(
    samples: Array<ClinicalDataBySampleId>
) {
    let clinicalAttributes: { [id: string]: ClinicalAttribute } = {};
    let output: { id: string; value: string }[] = [];
    for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex += 1) {
        const sample = samples[sampleIndex];
        for (
            let clinicalDataIndex = 0;
            clinicalDataIndex < sample.clinicalData.length;
            clinicalDataIndex += 1
        ) {
            const clinicalData = sample.clinicalData[clinicalDataIndex];
            if (
                clinicalAttributes[clinicalData.clinicalAttributeId] ===
                undefined
            ) {
                output.push({
                    id: clinicalData.clinicalAttributeId,
                    value: getClinicalAttributeDisplayName(
                        clinicalData.clinicalAttribute
                    ),
                });
                clinicalAttributes[clinicalData.clinicalAttributeId] =
                    clinicalData.clinicalAttribute;
            }
        }
    }
    return output;
}

export function clinicalValueToSamplesMap(
    samples: Array<ClinicalDataBySampleId>,
    clinicalAttributeId: string
) {
    let clinicalAttributeSamplesMap = new Map();
    if (clinicalAttributeId === undefined) return [];

    for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex += 1) {
        const sample = samples[sampleIndex];
        for (
            let clinicalDataIndex = 0;
            clinicalDataIndex < sample.clinicalData.length;
            clinicalDataIndex += 1
        ) {
            const clinicalData = sample.clinicalData[clinicalDataIndex];
            if (clinicalData.clinicalAttributeId === clinicalAttributeId) {
                let sampleList = clinicalAttributeSamplesMap.get(
                    clinicalData.value
                );
                if (sampleList === undefined) sampleList = [];
                sampleList.push(sample.id);

                clinicalAttributeSamplesMap.set(clinicalData.value, sampleList);
            }
        }
    }
    return clinicalAttributeSamplesMap;
}

class SampleManager {
    sampleIndex: { [s: string]: number };
    sampleLabels: { [s: string]: string };
    sampleOrder: string[];
    clinicalDataLegacyCleanAndDerived: { [s: string]: any };
    sampleColors: { [s: string]: string };
    commonClinicalDataLegacyCleanAndDerived: { [s: string]: string };
    private customSampleTypeToColor: any;

    constructor(
        public samples: Array<ClinicalDataBySampleId>,
        // sampleIdsInHeader is differ from the samples when in sample view of a multi-samples patient.
        // The sampleIdsInHeader only includes the samples are presented in the page.
        // The size of sampleIdsInHeader is always less than or equal to the size of param samples
        public sampleIdsInHeader: string[],
        events?: ClinicalEvent[]
    ) {
        makeObservable(this);
        this.sampleIndex = {};
        this.sampleLabels = {};
        this.clinicalDataLegacyCleanAndDerived = {};
        this.sampleColors = {};
        // clinical attributes that should be displayed at patient level, since
        // they are the same in all samples
        this.commonClinicalDataLegacyCleanAndDerived = {};
        this.customSampleTypeToColor = ServerConfigHelpers.parseCustomSampleTypeColors(
            getServerConfig().skin_patient_view_custom_sample_type_colors_json
        ).customSampleTypeToColor;

        for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex += 1) {
            const sample = samples[sampleIndex];
            const sampleClinicalData: { [clinicalAttributeId: string]: string } = {};
            for (
                let clinicalDataIndex = 0;
                clinicalDataIndex < sample.clinicalData.length;
                clinicalDataIndex += 1
            ) {
                const clinicalData = sample.clinicalData[clinicalDataIndex];
                sampleClinicalData[clinicalData.clinicalAttributeId] =
                    clinicalData.value;
            }
            // add legacy clinical data
            this.clinicalDataLegacyCleanAndDerived[sample.id] = cleanAndDerive(
                sampleClinicalData
            );

            // determine color based on DERIVED_NORMALIZED_CASE_TYPE
            let color = 'black';
            if (
                this.customSampleTypeToColor[
                    this.clinicalDataLegacyCleanAndDerived[sample.id]
                        .DERIVED_NORMALIZED_CASE_TYPE
                ]
            ) {
                color = this.customSampleTypeToColor[
                    this.clinicalDataLegacyCleanAndDerived[sample.id]
                        .DERIVED_NORMALIZED_CASE_TYPE
                ];
            } else if (
                this.clinicalDataLegacyCleanAndDerived[sample.id][
                    'DERIVED_NORMALIZED_CASE_TYPE'
                ] === 'Primary'
            ) {
                color = styles.sampleColorPrimary;
            } else if (
                this.clinicalDataLegacyCleanAndDerived[sample.id]
                    .DERIVED_NORMALIZED_CASE_TYPE === 'Recurrence' ||
                this.clinicalDataLegacyCleanAndDerived[sample.id]
                    .DERIVED_NORMALIZED_CASE_TYPE === 'Progressed'
            ) {
                color = styles.sampleColorRecurrence;
            } else if (
                this.clinicalDataLegacyCleanAndDerived[sample.id]
                    .DERIVED_NORMALIZED_CASE_TYPE === 'Metastasis'
            ) {
                color = styles.sampleColorMetastasis;
            } else if (
                this.clinicalDataLegacyCleanAndDerived[sample.id]
                    .DERIVED_NORMALIZED_CASE_TYPE === 'cfDNA'
            ) {
                color = styles.sampleColorCfdna;
            } else if (
                this.clinicalDataLegacyCleanAndDerived[sample.id]
                    .DERIVED_NORMALIZED_CASE_TYPE === 'Xenograft'
            ) {
                color = styles.sampleColorXenograft;
            } else if (
                this.clinicalDataLegacyCleanAndDerived[sample.id]
                    .DERIVED_NORMALIZED_CASE_TYPE === 'Organoid'
            ) {
                color = styles.sampleColorOrganoid;
            } else if (
                this.clinicalDataLegacyCleanAndDerived[sample.id]
                    .DERIVED_NORMALIZED_CASE_TYPE === 'Plasma'
            ) {
                color = styles.sampleColorPlasma;
            } else if (
                this.clinicalDataLegacyCleanAndDerived[sample.id]
                    .DERIVED_NORMALIZED_CASE_TYPE === 'ctDNA'
            ) {
                color = styles.sampleColorCtdna;
            } else if (
                this.clinicalDataLegacyCleanAndDerived[sample.id]
                    .DERIVED_NORMALIZED_CASE_TYPE === 'Urine'
            ) {
                color = styles.sampleColorUrine;
            } else if (
                this.clinicalDataLegacyCleanAndDerived[sample.id]
                    .DERIVED_NORMALIZED_CASE_TYPE === 'Exosome'
            ) {
                color = styles.sampleColorExosome;
            } else if (
                this.clinicalDataLegacyCleanAndDerived[sample.id]
                    .DERIVED_NORMALIZED_CASE_TYPE === 'total RNA'
            ) {
                color = styles.sampleColorRna;
            }

            this.sampleColors[sample.id] = color;
        }

        // remove common CANCER_TYPE/CANCER_TYPE_DETAILED in top bar (display on
        // patient)
        for (const attr of ['CANCER_TYPE', 'CANCER_TYPE_DETAILED']) {
            if (
                SampleManager.isSameClinicalAttributeInAllSamples(samples, attr)
            ) {
                this.commonClinicalDataLegacyCleanAndDerived[
                    attr
                ] = this.clinicalDataLegacyCleanAndDerived[samples[0].id][attr];
                for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex += 1) {
                    const sample = samples[sampleIndex];
                    delete this.clinicalDataLegacyCleanAndDerived[sample.id][
                        attr
                    ];
                }
            }
        }

        this.samples = sortSamples(
            samples,
            this.clinicalDataLegacyCleanAndDerived,
            events
        );
        this.sampleOrder = new Array<string>(this.samples.length);
        for (let i = 0; i < this.samples.length; i += 1) {
            const sample = this.samples[i];
            this.sampleIndex[sample.id] = i;
            this.sampleLabels[sample.id] = String(i + 1);
            this.sampleOrder[i] = sample.id;
        }
    }

    static isSameClinicalAttributeInAllSamples(
        samples: Array<ClinicalDataBySampleId>,
        attribute: string
    ) {
        if (samples.length === 0) {
            return false;
        }

        let firstValue: string | undefined;
        for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex += 1) {
            const sample = samples[sampleIndex];
            let value: string | undefined;
            for (
                let attributeIndex = 0;
                attributeIndex < sample.clinicalData.length;
                attributeIndex += 1
            ) {
                const clinicalData = sample.clinicalData[attributeIndex];
                if (clinicalData.clinicalAttributeId === attribute) {
                    value = clinicalData.value;
                    break;
                }
            }

            if (sampleIndex === 0) {
                firstValue = value;
            } else if (value !== firstValue) {
                return false;
            }
        }

        return !!firstValue;
    }

    static getClinicalAttributeInSample(
        sample: ClinicalDataBySampleId,
        clinicalAttributeId: string
    ): ClinicalData | undefined {
        for (let index = 0; index < sample.clinicalData.length; index += 1) {
            const data = sample.clinicalData[index];
            if (data.clinicalAttributeId === clinicalAttributeId) {
                return data;
            }
        }
        return undefined;
    }

    public isSampleVisibleInHeader(sampleId: string) {
        return (
            !this.sampleIdsInHeader || this.sampleIdsInHeader.includes(sampleId)
        );
    }

    getComponentForSample(
        sampleId: string,
        fillOpacity: number = 1,
        extraTooltipText: string = '',
        additionalContent: JSX.Element | null = null,
        onSelectGenePanel?: (name: string) => void,
        disableTooltip?: boolean,
        extraTooltipBody?: React.ReactNode
    ) {
        let sample: ClinicalDataBySampleId | undefined;
        for (let index = 0; index < this.samples.length; index += 1) {
            if (this.samples[index].id === sampleId) {
                sample = this.samples[index];
                break;
            }
        }

        return (
            sample && (
                <SampleInline
                    sample={sample}
                    extraTooltipText={extraTooltipText}
                    additionalContent={additionalContent}
                    onSelectGenePanel={onSelectGenePanel}
                    disableTooltip={disableTooltip}
                    extraTooltipBody={extraTooltipBody}
                >
                    <SampleLabelHTML
                        label={(this.sampleIndex[sample.id] + 1).toString()}
                        fillOpacity={fillOpacity}
                        color={this.sampleColors[sample.id]}
                    />
                </SampleInline>
            )
        );
    }

    getColorForSample(sampleId: string): string {
        return this.sampleColors[sampleId];
    }

    getSampleIdsInOrder(): string[] {
        return this.sampleOrder.slice();
    }

    getActiveSampleIdsInOrder(): string[] {
        return this.getSampleIdsInOrder().filter(s =>
            this.sampleIdsInHeader.includes(s)
        );
    }

    @computed get sampleIdToIndexMap() {
        let indexMap: { [sampleId: string]: number } = {};
        for (let index = 0; index < this.samples.length; index += 1) {
            indexMap[this.samples[index].id] = index;
        }
        return indexMap;
    }

    getComponentsForSamples() {
        this.samples.map(sample => this.getComponentForSample(sample.id));
    }

    getSampleLabel(sampleId: string): string {
        if (sampleId in this.sampleLabels) {
            return this.sampleLabels[sampleId];
        }
        return '';
    }

    isOnlySequentialOrderingAvailable(events?: ClinicalEvent[]) {
        let isOnlySequentialOrderingAvailable = true;
        if (events) {
            // when all samples do NOT have "daysSinceDiagnosis" data points, force sequential mode
            isOnlySequentialOrderingAvailable = !(
                events.length >= this.sampleOrder.length &&
                getSpecimenCollectionDayMap(this.sampleOrder, events).size ===
                    this.sampleOrder.length
            );
        }
        return isOnlySequentialOrderingAvailable;
    }
}

export default SampleManager;
