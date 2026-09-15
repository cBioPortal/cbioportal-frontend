import React from 'react';
import TestRenderer from 'react-test-renderer';
import { ClinicalEvent } from 'cbioportal-ts-api-client';
import {
    collapsePathologyTimelineEvents,
    getTimelineDataWithPortalExtras,
    nestPathologyTimelineTracks,
} from './TimelineWrapper';
import TimelineWrapper from './TimelineWrapper';
import { buildTimelineEventsSignature } from './pathologyTimelineUtils';
import * as pathologyTimelineUtils from './pathologyTimelineUtils';
import { sortTracks } from 'pages/patientView/timeline/timeline_helpers';
import { TimelineStore } from 'cbioportal-clinical-timeline';
import { usePathologyAugmentedClinicalEventsState } from './usePathologyAugmentedClinicalEvents';

jest.mock('./usePathologyAugmentedClinicalEvents');
jest.mock('pages/patientView/timeline/timeline_helpers', () => ({
    buildBaseConfig: jest.fn(() => ({})),
    configureGenieTimeline: jest.fn(),
    configureHtanOhsuTimeline: jest.fn(),
    configureTimelineToxicityColors: jest.fn(),
    sortTracks: jest.fn(() => []),
}));
jest.mock('cbioportal-clinical-timeline', () => ({
    configureTracks: jest.fn(),
    Timeline: () => null,
    TimelineStore: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('./timelineDataUtils', () => ({
    downloadZippedTracks: jest.fn(),
}));

describe('getTimelineDataWithPortalExtras', () => {
    it('returns the original array when no portal extras should be added', () => {
        const timelineData: ClinicalEvent[] = [
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

    it('reuses cached portal-extra arrays for equivalent timeline snapshots', () => {
        const firstTimelineData = [
            {
                eventType: 'TREATMENT',
                patientId: 'P-1',
                startNumberOfDaysSinceDiagnosis: 1,
                studyId: 'study',
                attributes: [{ key: 'A', value: '1' }],
            },
        ] as ClinicalEvent[];
        const secondTimelineData = [
            {
                eventType: 'TREATMENT',
                patientId: 'P-1',
                startNumberOfDaysSinceDiagnosis: 1,
                studyId: 'study',
                attributes: [{ key: 'A', value: '1' }],
            },
        ] as ClinicalEvent[];

        const first = getTimelineDataWithPortalExtras(firstTimelineData, true);
        const second = getTimelineDataWithPortalExtras(secondTimelineData, true);

        expect(second).toBe(first);
    });
});

describe('nestPathologyTimelineTracks', () => {
    it('returns the original array when there are no pathology events to nest', () => {
        const events = [
            {
                eventType: 'TREATMENT',
                patientId: 'P-1',
                studyId: 'study',
                startNumberOfDaysSinceDiagnosis: 1,
            },
            {
                eventType: 'SPECIMEN',
                patientId: 'P-1',
                studyId: 'study',
                startNumberOfDaysSinceDiagnosis: 2,
            },
        ] as ClinicalEvent[];

        expect(nestPathologyTimelineTracks(events)).toBe(events);
    });

    it('nests slides and biomarkers under a shared pathology event type', () => {
        const biomarker = {
            eventType: 'PATHOLOGY',
            patientId: 'P-1',
        } as ClinicalEvent;
        const slides = {
            eventType: 'PATHOLOGY SLIDES',
            patientId: 'P-1',
            attributes: [{ key: 'SUBTYPE', value: 'H&E (Non-viewable)' }],
        } as ClinicalEvent;

        const result = nestPathologyTimelineTracks([biomarker, slides]);

        expect(result.map(event => event.eventType)).toEqual([
            'PATHOLOGY',
            'PATHOLOGY',
        ]);
        expect(
            result.map(
                event =>
                    event.attributes.find(
                        attribute => attribute.key === 'PATHOLOGY_TYPE'
                    )?.value
            )
        ).toEqual(['Biomarkers', 'Slides']);
        expect(
            result[1].attributes.find(attribute => attribute.key === 'SUBTYPE')
                ?.value
        ).toBe('H&E');
    });

    it('reuses cached nested pathology arrays for equivalent event snapshots', () => {
        const firstEvents = [
            {
                eventType: 'PATHOLOGY SLIDES',
                patientId: 'P-1',
                attributes: [{ key: 'SUBTYPE', value: 'H&E (Non-viewable)' }],
                startNumberOfDaysSinceDiagnosis: 5,
                studyId: 'study',
                uniquePatientKey: 'patient-key',
                uniqueSampleKey: 'sample-key',
            },
        ] as ClinicalEvent[];
        const secondEvents = [
            {
                eventType: 'PATHOLOGY SLIDES',
                patientId: 'P-1',
                attributes: [{ key: 'SUBTYPE', value: 'H&E (Non-viewable)' }],
                startNumberOfDaysSinceDiagnosis: 5,
                studyId: 'study',
                uniquePatientKey: 'patient-key',
                uniqueSampleKey: 'sample-key',
            },
        ] as ClinicalEvent[];

        const first = nestPathologyTimelineTracks(firstEvents);
        const second = nestPathologyTimelineTracks(secondEvents);

        expect(second).toBe(first);
    });
});

describe('collapsePathologyTimelineEvents', () => {
    it('collapses specimen-split pathology slide events for the summary timeline', () => {
        const events = [
            {
                eventType: 'PATHOLOGY SLIDES',
                patientId: 'P-1',
                studyId: 'study',
                startNumberOfDaysSinceDiagnosis: -20,
                endNumberOfDaysSinceDiagnosis: -20,
                uniquePatientKey: 'study_P-1',
                uniqueSampleKey: 'path-1',
                attributes: [
                    { key: 'SAMPLE_ID', value: 'S-1' },
                    { key: 'SUBTYPE', value: 'H&E' },
                    { key: 'MATCH_LEVEL', value: 'PART' },
                    { key: 'SPECIMEN', value: 'Part 1 / Block A1' },
                    { key: 'IMAGE_COUNT', value: '2' },
                    { key: 'NON_SERVABLE_IMAGE_COUNT', value: '0' },
                    { key: 'TOTAL_IMAGE_COUNT', value: '2' },
                    { key: 'TIMEPOINT_SOURCE', value: 'Procedure' },
                    {
                        key: 'LINKOUT',
                        value:
                            '/patient/wsiHESlides?studyId=study&caseId=P-1&sampleId=S-1&stainFilter=hne&matchLevel=PART&specimenKey=part%3A%3A1',
                    },
                ],
            },
            {
                eventType: 'PATHOLOGY SLIDES',
                patientId: 'P-1',
                studyId: 'study',
                startNumberOfDaysSinceDiagnosis: -20,
                endNumberOfDaysSinceDiagnosis: -20,
                uniquePatientKey: 'study_P-1',
                uniqueSampleKey: 'path-2',
                attributes: [
                    { key: 'SAMPLE_ID', value: 'S-1' },
                    { key: 'SUBTYPE', value: 'H&E' },
                    { key: 'MATCH_LEVEL', value: 'PART' },
                    { key: 'SPECIMEN', value: 'Part 2 / Block B1' },
                    { key: 'IMAGE_COUNT', value: '1' },
                    { key: 'NON_SERVABLE_IMAGE_COUNT', value: '1' },
                    { key: 'TOTAL_IMAGE_COUNT', value: '2' },
                    { key: 'TIMEPOINT_SOURCE', value: 'Procedure' },
                    {
                        key: 'LINKOUT',
                        value:
                            '/patient/wsiHESlides?studyId=study&caseId=P-1&sampleId=S-1&stainFilter=hne&matchLevel=PART&specimenKey=part%3A%3A2',
                    },
                ],
            },
        ] as ClinicalEvent[];

        const collapsed = collapsePathologyTimelineEvents(events);

        expect(collapsed).toHaveLength(1);
        expect(collapsed[0].attributes).toEqual(
            expect.arrayContaining([
                { key: 'IMAGE_COUNT', value: '3' },
                { key: 'NON_SERVABLE_IMAGE_COUNT', value: '1' },
                { key: 'TOTAL_IMAGE_COUNT', value: '4' },
                {
                    key: 'SPECIMEN',
                    value: 'Part 1 / Block A1, Part 2 / Block B1',
                },
                {
                    key: 'LINKOUT',
                    value:
                        '/patient/wsiHESlides?studyId=study&caseId=P-1&sampleId=S-1&stainFilter=hne&matchLevel=PART',
                },
            ])
        );
    });
});

describe('TimelineWrapper', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (usePathologyAugmentedClinicalEventsState as jest.Mock).mockReturnValue(
            {
                events: [],
                eventsSignature: '',
            }
        );
    });

    it('uses enriched clinical samples for pathology augmentation when provided', () => {
        const clinicalEvents = [
            {
                eventType: 'TREATMENT',
                patientId: 'P-1',
                startNumberOfDaysSinceDiagnosis: 1,
                studyId: 'study',
            },
        ] as ClinicalEvent[];
        const clinicalEventsSignature =
            buildTimelineEventsSignature(clinicalEvents);
        const clinicalSamples = [
            {
                id: 'S-1',
                clinicalData: [
                    {
                        clinicalAttributeId: 'WSI_TIMEPOINT_DAYS',
                        value: '5',
                    },
                ],
            },
        ];
        const sampleManager = {
            samples: [
                {
                    id: 'S-1',
                    clinicalData: [],
                },
            ],
        };
        const props = {
            dataStore: {} as any,
            data: clinicalEvents,
            caseMetaData: { color: {}, index: {}, label: {} },
            sampleManager: sampleManager as any,
            width: 1000,
            samples: [
                {
                    patientId: 'P-1',
                    studyId: 'study',
                },
            ] as any,
            clinicalSamples: clinicalSamples as any,
            mutationProfileId: 'profile',
        };

        let renderer!: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
            renderer = TestRenderer.create(
                React.createElement(TimelineWrapper, props)
            );
        });

        expect(usePathologyAugmentedClinicalEventsState).toHaveBeenCalledWith(
            expect.objectContaining({
                clinicalEvents,
                clinicalEventsSignature,
                samples: clinicalSamples,
            })
        );

        renderer.unmount();
    });

    it('forwards a caller-provided clinical-events signature to the augmentation hook', () => {
        const clinicalEvents = [
            {
                eventType: 'TREATMENT',
                patientId: 'P-1',
                startNumberOfDaysSinceDiagnosis: 1,
                studyId: 'study',
            },
        ] as ClinicalEvent[];
        const props = {
            dataStore: {} as any,
            data: clinicalEvents,
            clinicalEventsSignature: 'provided-signature',
            caseMetaData: { color: {}, index: {}, label: {} },
            sampleManager: { samples: [] } as any,
            width: 1000,
            samples: [
                {
                    patientId: 'P-1',
                    studyId: 'study',
                },
            ] as any,
            mutationProfileId: 'profile',
        };

        let renderer!: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
            renderer = TestRenderer.create(
                React.createElement(TimelineWrapper, props)
            );
        });

        expect(usePathologyAugmentedClinicalEventsState).toHaveBeenCalledWith(
            expect.objectContaining({
                clinicalEvents,
                clinicalEventsSignature: 'provided-signature',
            })
        );

        renderer.unmount();
    });

    it('does not rebuild the clinical-events signature when the caller provides one', () => {
        const buildTimelineEventsSignatureSpy = jest.spyOn(
            pathologyTimelineUtils,
            'buildTimelineEventsSignature'
        );
        const clinicalEvents = [
            {
                eventType: 'TREATMENT',
                patientId: 'P-1',
                startNumberOfDaysSinceDiagnosis: 1,
                studyId: 'study',
            },
        ] as ClinicalEvent[];
        const props = {
            dataStore: {} as any,
            data: clinicalEvents,
            clinicalEventsSignature: 'provided-signature',
            caseMetaData: { color: {}, index: {}, label: {} },
            sampleManager: { samples: [] } as any,
            width: 1000,
            samples: [
                {
                    patientId: 'P-1',
                    studyId: 'study',
                },
            ] as any,
            mutationProfileId: 'profile',
        };
        (
            usePathologyAugmentedClinicalEventsState as jest.Mock
        ).mockReturnValue({
            events: clinicalEvents,
            eventsSignature: 'augmented-signature',
        });

        let renderer!: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
            renderer = TestRenderer.create(
                React.createElement(TimelineWrapper, props)
            );
        });

        expect(buildTimelineEventsSignatureSpy).not.toHaveBeenCalled();
        renderer.unmount();
    });

    it('does not rebuild tracks after its store update rerenders', () => {
        const timelineData: ClinicalEvent[] = [
            {
                eventType: 'PATHOLOGY SLIDES',
                patientId: 'P-1',
                studyId: 'study',
                attributes: [],
                startNumberOfDaysSinceDiagnosis: 5,
                endNumberOfDaysSinceDiagnosis: 5,
                uniquePatientKey: 'patient-key',
                uniqueSampleKey: '',
            },
        ];
        const props = {
            dataStore: {} as any,
            data: timelineData,
            caseMetaData: { color: {}, index: {}, label: {} },
            sampleManager: { samples: [] } as any,
            width: 1000,
            samples: [
                {
                    patientId: 'P-1',
                    studyId: 'study',
                },
            ] as any,
            mutationProfileId: 'profile',
        };
        (
            usePathologyAugmentedClinicalEventsState as jest.Mock
        ).mockReturnValue({
            events: timelineData,
            eventsSignature: buildTimelineEventsSignature(timelineData),
        });

        let renderer!: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
            renderer = TestRenderer.create(
                React.createElement(TimelineWrapper, props)
            );
        });

        expect(sortTracks).toHaveBeenCalledTimes(1);
        expect((sortTracks as jest.Mock).mock.calls[0][2]).toBe(
            buildTimelineEventsSignature(timelineData)
        );
        expect(TimelineStore).toHaveBeenCalledTimes(1);
        renderer.unmount();
    });

    it('does not rebuild tracks when rerendered with equivalent timeline events', () => {
        const firstTimelineData: ClinicalEvent[] = [
            {
                eventType: 'PATHOLOGY SLIDES',
                patientId: 'P-1',
                studyId: 'study',
                attributes: [
                    { key: 'SUBTYPE', value: 'H&E' },
                    { key: 'PATHOLOGY_TYPE', value: 'Slides' },
                ],
                startNumberOfDaysSinceDiagnosis: 5,
                endNumberOfDaysSinceDiagnosis: 5,
                uniquePatientKey: 'patient-key',
                uniqueSampleKey: 'sample-key',
            },
        ];
        const secondTimelineData: ClinicalEvent[] = [
            {
                eventType: 'PATHOLOGY SLIDES',
                patientId: 'P-1',
                studyId: 'study',
                attributes: [
                    { key: 'PATHOLOGY_TYPE', value: 'Slides' },
                    { key: 'SUBTYPE', value: 'H&E' },
                ],
                startNumberOfDaysSinceDiagnosis: 5,
                endNumberOfDaysSinceDiagnosis: 5,
                uniquePatientKey: 'patient-key',
                uniqueSampleKey: 'sample-key',
            },
        ];
        const props = {
            dataStore: {} as any,
            data: firstTimelineData,
            caseMetaData: { color: {}, index: {}, label: {} },
            sampleManager: { samples: [] } as any,
            width: 1000,
            samples: [
                {
                    patientId: 'P-1',
                    studyId: 'study',
                },
            ] as any,
            mutationProfileId: 'profile',
        };
        (
            usePathologyAugmentedClinicalEventsState as jest.Mock
        ).mockReturnValue({
            events: firstTimelineData,
            eventsSignature: buildTimelineEventsSignature(firstTimelineData),
        });

        let renderer!: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
            renderer = TestRenderer.create(
                React.createElement(TimelineWrapper, props)
            );
        });

        expect(sortTracks).toHaveBeenCalledTimes(1);
        expect(TimelineStore).toHaveBeenCalledTimes(1);

        (
            usePathologyAugmentedClinicalEventsState as jest.Mock
        ).mockReturnValue({
            events: secondTimelineData,
            eventsSignature: buildTimelineEventsSignature(secondTimelineData),
        });

        TestRenderer.act(() => {
            renderer.update(React.createElement(TimelineWrapper, props));
        });

        expect(sortTracks).toHaveBeenCalledTimes(1);
        expect(TimelineStore).toHaveBeenCalledTimes(1);
        renderer.unmount();
    });

    it('does not rebuild tracks when rerendered with equivalent case metadata', () => {
        const timelineData: ClinicalEvent[] = [
            {
                eventType: 'SPECIMEN',
                patientId: 'P-1',
                studyId: 'study',
                attributes: [{ key: 'SAMPLE_ID', value: 'S-1' }],
                startNumberOfDaysSinceDiagnosis: 5,
                endNumberOfDaysSinceDiagnosis: 5,
                uniquePatientKey: 'patient-key',
                uniqueSampleKey: 'sample-key',
            },
        ];
        const firstCaseMetaData = {
            color: { 'S-1': '#123456' },
            index: { 'S-1': 0 },
            label: { 'S-1': '1' },
        };
        const secondCaseMetaData = {
            color: { 'S-1': '#123456' },
            index: { 'S-1': 0 },
            label: { 'S-1': '1' },
        };
        const props = {
            dataStore: {} as any,
            data: timelineData,
            caseMetaData: firstCaseMetaData,
            sampleManager: { samples: [] } as any,
            width: 1000,
            samples: [
                {
                    patientId: 'P-1',
                    studyId: 'study',
                },
            ] as any,
            mutationProfileId: 'profile',
        };
        (
            usePathologyAugmentedClinicalEventsState as jest.Mock
        ).mockReturnValue({
            events: timelineData,
            eventsSignature: buildTimelineEventsSignature(timelineData),
        });

        let renderer!: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
            renderer = TestRenderer.create(
                React.createElement(TimelineWrapper, props)
            );
        });

        TestRenderer.act(() => {
            renderer.update(
                React.createElement(TimelineWrapper, {
                    ...props,
                    caseMetaData: secondCaseMetaData,
                })
            );
        });

        expect(sortTracks).toHaveBeenCalledTimes(1);
        expect(TimelineStore).toHaveBeenCalledTimes(1);
        renderer.unmount();
    });

    it('does not rebuild tracks when rerendered with an equivalent sample manager wrapper', () => {
        const timelineData: ClinicalEvent[] = [
            {
                eventType: 'SPECIMEN',
                patientId: 'P-1',
                studyId: 'study',
                attributes: [{ key: 'SAMPLE_ID', value: 'S-1' }],
                startNumberOfDaysSinceDiagnosis: 5,
                endNumberOfDaysSinceDiagnosis: 5,
                uniquePatientKey: 'patient-key',
                uniqueSampleKey: 'sample-key',
            },
        ];
        const firstSampleManager = {
            samples: [
                {
                    id: 'S-1',
                    clinicalData: [
                        {
                            clinicalAttributeId: 'CANCER_TYPE',
                            value: 'Breast Cancer',
                        },
                    ],
                },
            ],
        };
        const secondSampleManager = {
            samples: [
                {
                    id: 'S-1',
                    clinicalData: [
                        {
                            clinicalAttributeId: 'CANCER_TYPE',
                            value: 'Breast Cancer',
                        },
                    ],
                },
            ],
        };
        const props = {
            dataStore: {} as any,
            data: timelineData,
            caseMetaData: { color: {}, index: {}, label: {} },
            sampleManager: firstSampleManager as any,
            width: 1000,
            samples: [
                {
                    patientId: 'P-1',
                    studyId: 'study',
                },
            ] as any,
            mutationProfileId: 'profile',
        };
        (
            usePathologyAugmentedClinicalEventsState as jest.Mock
        ).mockReturnValue({
            events: timelineData,
            eventsSignature: buildTimelineEventsSignature(timelineData),
        });

        let renderer!: TestRenderer.ReactTestRenderer;
        TestRenderer.act(() => {
            renderer = TestRenderer.create(
                React.createElement(TimelineWrapper, props)
            );
        });

        TestRenderer.act(() => {
            renderer.update(
                React.createElement(TimelineWrapper, {
                    ...props,
                    sampleManager: secondSampleManager as any,
                })
            );
        });

        expect(sortTracks).toHaveBeenCalledTimes(1);
        expect(TimelineStore).toHaveBeenCalledTimes(1);
        renderer.unmount();
    });
});
