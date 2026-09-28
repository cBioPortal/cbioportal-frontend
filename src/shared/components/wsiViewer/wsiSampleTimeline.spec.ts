import { ClinicalEvent } from 'cbioportal-ts-api-client';
import {
    buildWsiSampleTimelineMap,
    procedureRelativeToSequencingText,
    sampleSequencedText,
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
