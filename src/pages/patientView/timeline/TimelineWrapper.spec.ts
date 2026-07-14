import { ClinicalEvent } from 'cbioportal-ts-api-client';
import { getTimelineDataWithPortalExtras } from './TimelineWrapper';

describe('getTimelineDataWithPortalExtras', () => {
    it('returns the original array when no portal extras should be added', () => {
        const timelineData = [
            {
                eventType: 'TREATMENT',
                patientId: 'P-1',
                startNumberOfDaysSinceDiagnosis: 1,
                studyId: 'study',
            },
        ] as ClinicalEvent[];

        expect(getTimelineDataWithPortalExtras(timelineData, false)).toBe(
            timelineData
        );
    });

    it('adds the HTAN extra event without mutating the original timeline data', () => {
        const timelineData = [
            {
                eventType: 'TREATMENT',
                patientId: 'P-1',
                startNumberOfDaysSinceDiagnosis: 1,
                studyId: 'study',
            },
        ] as ClinicalEvent[];

        const result = getTimelineDataWithPortalExtras(timelineData, true);

        expect(result).toHaveLength(2);
        expect(result[0]).toBe(timelineData[0]);
        expect(result[1].eventType).toBe('IMAGING');
        expect(timelineData).toHaveLength(1);
    });

    it('does not accumulate extra events across repeated calls', () => {
        const timelineData = [
            {
                eventType: 'TREATMENT',
                patientId: 'P-1',
                startNumberOfDaysSinceDiagnosis: 1,
                studyId: 'study',
            },
        ] as ClinicalEvent[];

        expect(
            getTimelineDataWithPortalExtras(timelineData, true)
        ).toHaveLength(2);
        expect(
            getTimelineDataWithPortalExtras(timelineData, true)
        ).toHaveLength(2);
        expect(timelineData).toHaveLength(1);
    });
});
