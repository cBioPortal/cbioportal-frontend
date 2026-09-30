import { ClinicalEvent } from 'cbioportal-ts-api-client';
import {
    buildWsiSampleTimelineMap,
    DAY_ZERO_TOOLTIP,
    procedureRelativeToSequencingText,
    procedureSequencingOffset,
    procedureTooltip,
    sampleSequencedText,
    sampleSequencedTooltip,
    sequencedRelativeToProcedureText,
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

describe('day tooltips', () => {
    it('explains d0 as the first tumor sequencing', () => {
        expect(DAY_ZERO_TOOLTIP).toContain('first tumor sequencing (d0)');
    });

    it('relates the procedure to the sample sequencing in words', () => {
        expect(procedureTooltip(-242, 7)).toBe(
            `Procedure on d-242, 249 days before this sample was sequenced (d+7). ${DAY_ZERO_TOOLTIP}`
        );
        expect(procedureTooltip(20, 7)).toContain(
            '13 days after this sample was sequenced (d+7)'
        );
        expect(procedureTooltip(7, 7)).toContain(
            'the same day this sample was sequenced'
        );
        expect(procedureTooltip(-242, undefined)).toBe(
            `Procedure on d-242. ${DAY_ZERO_TOOLTIP}`
        );
        expect(procedureTooltip(undefined, 7)).toBeUndefined();
    });

    it('describes when the sample was sequenced', () => {
        expect(sampleSequencedTooltip({ sequencingDays: 7 })).toBe(
            `This sample was sequenced on d+7. ${DAY_ZERO_TOOLTIP}`
        );
        expect(sampleSequencedTooltip({ acquisitionDays: 3 })).toBeUndefined();
    });
});

describe('sample timeline text', () => {
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

    it('relates the procedure to sample sequencing', () => {
        expect(procedureRelativeToSequencingText(-242, 7)).toBe(
            'Proc 249 d before sequencing'
        );
        expect(procedureRelativeToSequencingText(20, 7)).toBe(
            'Proc 13 d after sequencing'
        );
        expect(procedureRelativeToSequencingText(7, 7)).toBe(
            'Proc same day as sequencing'
        );
        expect(procedureRelativeToSequencingText(undefined, 7)).toBeNull();
        expect(procedureRelativeToSequencingText(-242, undefined)).toBeNull();
    });

    it('relates sequencing to the procedure', () => {
        expect(sequencedRelativeToProcedureText(7, -242)).toBe(
            'd+7 (249 d later)'
        );
        expect(sequencedRelativeToProcedureText(-10, -4)).toBe(
            'd-10 (6 d earlier)'
        );
        expect(sequencedRelativeToProcedureText(0, 0)).toBe('d0 (same day)');
        expect(sequencedRelativeToProcedureText(7, undefined)).toBe('d+7');
    });
});

describe('procedureSequencingOffset', () => {
    it('measures the procedure against sequencing', () => {
        expect(procedureSequencingOffset(-42, 0)).toEqual({
            days: 42,
            relation: 'before',
        });
        expect(procedureSequencingOffset(10, 3)).toEqual({
            days: 7,
            relation: 'after',
        });
        expect(procedureSequencingOffset(5, 5)).toEqual({
            days: 0,
            relation: 'same',
        });
    });

    it('is undefined when either day is unknown', () => {
        expect(procedureSequencingOffset(undefined, 5)).toBeUndefined();
        expect(procedureSequencingOffset(5, null)).toBeUndefined();
    });
});
