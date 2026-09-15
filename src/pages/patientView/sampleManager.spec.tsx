import SampleManager, {
    getSpecimenCollectionDayMap,
    sortSamples,
} from './SampleManager';
import mockClinicalData from 'shared/api/mock/Clinical_data_study_ucec_tcga_pub.json';
import {
    ClinicalData,
    ClinicalDataBySampleId,
    ClinicalEvent,
} from 'cbioportal-ts-api-client';
import { groupBySampleId } from 'shared/lib/StoreUtils';
import { assert } from 'chai';
import React from 'react';

describe('SampleManager', () => {
    const testSamples: Array<ClinicalDataBySampleId> = groupBySampleId(
        ['TCGA-BK-A0CC-01'],
        mockClinicalData as Array<ClinicalData>
    );

    it('checkIsOnlySequentialOrderingAvailable() with no valid ClinicalEvents', () => {
        const sampleManager = new SampleManager(testSamples, []);
        assert.isTrue(sampleManager.isOnlySequentialOrderingAvailable());
    });

    it('checkIsOnlySequentialOrderingAvailable() with valid ClinicalEvents', () => {
        const clinicalEvent = getClinicalEvent('TCGA-BK-A0CC-01');

        const sampleManager = new SampleManager(testSamples, []);
        assert.isFalse(
            sampleManager.isOnlySequentialOrderingAvailable([clinicalEvent])
        );
    });

    it('checkGetSpecimenCollectionDayMap() with incorrect ClinicalEvents', () => {
        const clinicalEvent = getClinicalEvent('TCGA-BK-A0CC-02');

        const sampleManager = new SampleManager(testSamples, []);
        assert.isTrue(
            sampleManager.isOnlySequentialOrderingAvailable([clinicalEvent])
        );
    });

    it('checkGetSpecimeCollectionDayMap()', () => {
        const clinicalEvent = getClinicalEvent('TCGA-BK-A0CC-01');
        const sampleManager = new SampleManager(testSamples, []);
        assert.equal(
            getSpecimenCollectionDayMap(sampleManager.sampleOrder, [
                clinicalEvent,
            ]).size,
            1
        );
    });

    it('passes extraTooltipBody through to SampleInline', () => {
        const sampleManager = new SampleManager(testSamples, []);
        const extraTooltipBody = <span className="tooltip-body">Body</span>;

        const component = sampleManager.getComponentForSample(
            'TCGA-BK-A0CC-01',
            1,
            '',
            null,
            undefined,
            undefined,
            extraTooltipBody
        ) as React.ReactElement;

        assert.deepEqual(component.props.extraTooltipBody, extraTooltipBody);
    });

    it('sorts samples by collection day before natural id order and preserves sampleOrder', () => {
        const samples: Array<ClinicalDataBySampleId> = [
            {
                id: 'S-10',
                clinicalData: [
                    {
                        clinicalAttributeId: 'DERIVED_NORMALIZED_CASE_TYPE',
                        value: 'Primary',
                    } as ClinicalData,
                ],
            } as ClinicalDataBySampleId,
            {
                id: 'S-2',
                clinicalData: [
                    {
                        clinicalAttributeId: 'DERIVED_NORMALIZED_CASE_TYPE',
                        value: 'Primary',
                    } as ClinicalData,
                ],
            } as ClinicalDataBySampleId,
            {
                id: 'S-1',
                clinicalData: [
                    {
                        clinicalAttributeId: 'DERIVED_NORMALIZED_CASE_TYPE',
                        value: 'Primary',
                    } as ClinicalData,
                ],
            } as ClinicalDataBySampleId,
        ];
        const derived = {
            'S-10': { DERIVED_NORMALIZED_CASE_TYPE: 'Primary' },
            'S-2': { DERIVED_NORMALIZED_CASE_TYPE: 'Primary' },
            'S-1': { DERIVED_NORMALIZED_CASE_TYPE: 'Primary' },
        };
        const events = [
            {
                attributes: [{ key: 'SAMPLE_ID', value: 'S-2' }],
                startNumberOfDaysSinceDiagnosis: 5,
                eventType: 'SPECIMEN',
            } as ClinicalEvent,
            {
                attributes: [{ key: 'SAMPLE_ID', value: 'S-1' }],
                startNumberOfDaysSinceDiagnosis: 10,
                eventType: 'SPECIMEN',
            } as ClinicalEvent,
        ];

        const sorted = sortSamples(samples, derived, events);
        const sampleManager = new SampleManager(samples, [], events);

        assert.deepEqual(
            sorted.map(sample => sample.id),
            ['S-2', 'S-1', 'S-10']
        );
        assert.deepEqual(sampleManager.getSampleIdsInOrder(), [
            'S-2',
            'S-1',
            'S-10',
        ]);
        assert.deepEqual(sampleManager.sampleOrder, ['S-2', 'S-1', 'S-10']);
    });
});

function getClinicalEvent(sampleID: string): ClinicalEvent {
    return {
        attributes: [{ key: 'SAMPLE_ID', value: sampleID }],
        startNumberOfDaysSinceDiagnosis: 10,
        eventType: 'SPECIMEN',
    } as ClinicalEvent;
}
