import { ClinicalEvent } from 'cbioportal-ts-api-client';
import { DAY_ZERO_TOOLTIP } from './wsiNavUtils';
import {
    buildWsiSampleTimelineMap,
    sampleSequencedText,
    sampleSequencedTooltip,
} from './wsiSampleTimeline';

function event(
    eventType: string,
    startDays: number,
    attributes: Record<string, string>
): ClinicalEvent {
    return ({
        eventType,
        startNumberOfDaysSinceDiagnosis: startDays,
        endNumberOfDaysSinceDiagnosis: startDays,
        patientId: 'P-1',
        studyId: 'study',
        uniquePatientKey: 'P-1',
        uniqueSampleKey: '',
        attributes: Object.entries(attributes).map(([key, value]) => ({
            key,
            value,
        })),
    } as unknown) as ClinicalEvent;
}

describe('buildWsiSampleTimelineMap', () => {
    it('reads acquisition and sequencing days by sample', () => {
        const map = buildWsiSampleTimelineMap([
            event('Sample Acquisition', -242, { SAMPLE_ID: 'S-1' }),
            event('SEQUENCING', 7, { SAMPLE_ID: 'S-1' }),
            event('SPECIMEN', 30, { SpecimenReferenceNumber: 'S-2' }),
            event('Specimen', 31, { SPECIMEN_REFERENCE_NUMBER: 'S-3' }),
        ]);

        expect(map.get('S-1')).toEqual({
            acquisitionDays: -242,
            sequencingDays: 7,
        });
        expect(map.get('S-2')).toEqual({ acquisitionDays: 30 });
        expect(map.get('S-3')).toEqual({ acquisitionDays: 31 });
    });

    it('keeps the earliest day when a sample has several events', () => {
        const map = buildWsiSampleTimelineMap([
            event('Sequencing', 40, { SAMPLE_ID: 'S-1' }),
            event('Sequencing', 7, { SAMPLE_ID: 'S-1' }),
            event('Sequencing', 12, { SAMPLE_ID: 'S-1' }),
            event('SPECIMEN', 5, { SAMPLE_ID: 'S-1' }),
            event('SPECIMEN', -3, { SAMPLE_ID: 'S-1' }),
        ]);

        expect(map.get('S-1')).toEqual({
            acquisitionDays: -3,
            sequencingDays: 7,
        });
    });

    it('ignores unrelated, sample-less and undated events', () => {
        const map = buildWsiSampleTimelineMap([
            event('Treatment', 1, { SAMPLE_ID: 'S-1' }),
            event('Sequencing Report', 2, { SAMPLE_ID: 'S-1' }),
            event('Sequencing', 3, { SpecimenReferenceNumber: 'S-2' }),
            event('Sequencing', 4, {}),
            event('SPECIMEN', NaN, { SAMPLE_ID: 'S-3' }),
        ]);

        expect(map.size).toBe(0);
    });

    it('returns an empty map without events', () => {
        expect(buildWsiSampleTimelineMap(undefined).size).toBe(0);
        expect(buildWsiSampleTimelineMap(null).size).toBe(0);
        expect(buildWsiSampleTimelineMap([]).size).toBe(0);
    });
});

describe('sample timeline text', () => {
    it('describes when the sample was sequenced', () => {
        expect(sampleSequencedTooltip({ sequencingDays: 7 })).toBe(
            `This sample was sequenced on d+7. ${DAY_ZERO_TOOLTIP}`
        );
        expect(sampleSequencedTooltip({ acquisitionDays: 3 })).toBeUndefined();
    });

    it('describes the sample sequencing day in d-notation', () => {
        expect(sampleSequencedText({ sequencingDays: 7 })).toBe(
            'sequenced d+7'
        );
        expect(sampleSequencedText({ sequencingDays: 0 })).toBe('sequenced d0');
        expect(sampleSequencedText({ sequencingDays: -14 })).toBe(
            'sequenced d-14'
        );
        expect(sampleSequencedText({ acquisitionDays: 3 })).toBeNull();
        expect(sampleSequencedText(undefined)).toBeNull();
    });
});
