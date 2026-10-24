import SampleManager, { getSpecimenCollectionDayMap } from './SampleManager';
import mockClinicalData from 'shared/api/mock/Clinical_data_study_ucec_tcga_pub.json';
import {
    ClinicalData,
    ClinicalDataBySampleId,
    ClinicalEvent,
} from 'cbioportal-ts-api-client';
import { groupBySampleId } from 'shared/lib/StoreUtils';
import { assert } from 'chai';

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

    describe('sample acquisition ordering', () => {
        const createSamples = (): ClinicalDataBySampleId[] => [
            { id: 'sample1', clinicalData: [] },
            { id: 'sample2', clinicalData: [] },
        ];
        const createEvents = (eventType: string): ClinicalEvent[] => [
            {
                ...getClinicalEvent('sample1'),
                eventType,
                startNumberOfDaysSinceDiagnosis: 100,
            },
            {
                ...getClinicalEvent('sample2'),
                eventType,
                startNumberOfDaysSinceDiagnosis: 0,
            },
        ];

        [
            'SAMPLE_ACQUISITION',
            'sample_acquisition',
            'sAmPlE_aCqUiSiTiOn',
            'Sample Acquisition',
            'SPECIMEN',
            'Custom SPECIMEN track',
        ].forEach(eventType => {
            it(`uses acquisition days for ${eventType}`, () => {
                const samples = createSamples();
                const events = createEvents(eventType);
                const originalSamples = JSON.stringify(samples);
                const originalEvents = JSON.stringify(events);
                const manager = new SampleManager(samples, [], events);

                assert.deepEqual(manager.getSampleIdsInOrder(), [
                    'sample2',
                    'sample1',
                ]);
                assert.equal(manager.getSampleLabel('sample2'), '1');
                assert.equal(manager.getSampleLabel('sample1'), '2');
                assert.isFalse(
                    manager.isOnlySequentialOrderingAvailable(events)
                );
                assert.equal(JSON.stringify(samples), originalSamples);
                assert.equal(JSON.stringify(events), originalEvents);
            });
        });

        it('preserves natural ordering without acquisition events', () => {
            const events = createEvents('TREATMENT');
            const manager = new SampleManager(createSamples(), [], events);

            assert.deepEqual(manager.getSampleIdsInOrder(), [
                'sample1',
                'sample2',
            ]);
            assert.isTrue(manager.isOnlySequentialOrderingAvailable(events));
            assert.isTrue(manager.isOnlySequentialOrderingAvailable());
        });

        it('requires acquisition events for every sample before enabling time-based mode', () => {
            const events = createEvents('SAMPLE_ACQUISITION').slice(1);
            const manager = new SampleManager(createSamples(), [], events);

            assert.deepEqual(manager.getSampleIdsInOrder(), [
                'sample2',
                'sample1',
            ]);
            assert.isTrue(manager.isOnlySequentialOrderingAvailable(events));
        });

        it('preserves the last acquisition event for a sample', () => {
            const events = createEvents('SAMPLE_ACQUISITION');
            events.push({
                ...events[0],
                startNumberOfDaysSinceDiagnosis: -10,
            });
            const manager = new SampleManager(createSamples(), [], events);

            assert.deepEqual(manager.getSampleIdsInOrder(), [
                'sample1',
                'sample2',
            ]);
            assert.equal(
                getSpecimenCollectionDayMap(['sample1', 'sample2'], events).get(
                    'sample1'
                ),
                -10
            );
            assert.isFalse(manager.isOnlySequentialOrderingAvailable(events));
        });

        it('ignores acquisition events for an unknown sample', () => {
            const events = [
                {
                    ...getClinicalEvent('unknown'),
                    eventType: 'SAMPLE_ACQUISITION',
                },
            ];
            const manager = new SampleManager(createSamples(), [], events);

            assert.deepEqual(manager.getSampleIdsInOrder(), [
                'sample1',
                'sample2',
            ]);
            assert.isTrue(manager.isOnlySequentialOrderingAvailable(events));
        });
    });
});

function getClinicalEvent(sampleID: string): ClinicalEvent {
    return {
        attributes: [{ key: 'SAMPLE_ID', value: sampleID }],
        startNumberOfDaysSinceDiagnosis: 10,
        eventType: 'SPECIMEN',
    } as ClinicalEvent;
}
