/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { render } from '@testing-library/react';
import {
    TimelineStore,
    TimelineTrackSpecification,
} from 'cbioportal-clinical-timeline';
import { ClinicalEvent } from 'cbioportal-ts-api-client';
import SampleManager from 'pages/patientView/SampleManager';
import PatientViewMutationsDataStore from '../mutation/PatientViewMutationsDataStore';
import TimelineWrapper from './TimelineWrapper';

const mockTimeline = jest.fn(
    (_props: { store: TimelineStore; onClickDownload: () => void }) => null
);
const mockDownload = jest.fn();

jest.mock('cbioportal-clinical-timeline', () => ({
    ...jest.requireActual('cbioportal-clinical-timeline'),
    Timeline: (props: { store: TimelineStore; onClickDownload: () => void }) =>
        mockTimeline(props),
}));

jest.mock('./timelineDataUtils', () => ({
    downloadZippedTracks: (events: ClinicalEvent[]) => mockDownload(events),
}));

const SAMPLE = 'PATIENT-1-S1';
const LINKOUT = '/patient/wsiHESlides?studyId=study_1&caseId=PATIENT-1';

function event(
    eventType: string,
    days: number,
    attributes: Record<string, string>
): ClinicalEvent {
    return {
        eventType,
        patientId: 'PATIENT-1',
        startNumberOfDaysSinceDiagnosis: days,
        attributes: Object.entries(attributes).map(([key, value]) => ({
            key,
            value,
        })),
    } as ClinicalEvent;
}

const DATA = [
    event('PATHOLOGY SLIDES', 920, {
        SAMPLE_ID: SAMPLE,
        SUBTYPE: 'H&E',
        MATCH_LEVEL: 'BLOCK',
        IMAGE_COUNT: '1',
        TOTAL_IMAGE_COUNT: '1',
        LINKOUT,
    }),
    event('Sequencing', 962, { SAMPLE_ID: SAMPLE }),
];

function renderWrapper(showPathologySlides: boolean) {
    render(
        <TimelineWrapper
            dataStore={{} as PatientViewMutationsDataStore}
            data={DATA}
            caseMetaData={{
                color: { [SAMPLE]: '#ff0000' },
                label: { [SAMPLE]: '1' },
                index: { [SAMPLE]: 0 },
            }}
            sampleManager={{} as SampleManager}
            width={1000}
            samples={[]}
            mutationProfileId="study_1_mutations"
            showPathologySlides={showPathologySlides}
        />
    );
    const props =
        mockTimeline.mock.calls[mockTimeline.mock.calls.length - 1][0];
    const slideTrack = props.store.data
        .map(d => d.track)
        .find(t => t.type === 'H&E') as TimelineTrackSpecification;
    return { props, slideTrack };
}

function linkouts(events: ClinicalEvent[]) {
    return events
        .filter(e => e.eventType === 'PATHOLOGY SLIDES')
        .map(e => e.attributes.find(a => a.key === 'LINKOUT')?.value);
}

describe('TimelineWrapper pathology slides', () => {
    beforeEach(() => {
        mockTimeline.mockClear();
        mockDownload.mockClear();
    });

    it('draws linked slide events when the Pathology Slides tab is shown', () => {
        const { props, slideTrack } = renderWrapper(true);

        expect(slideTrack.renderTooltip).toBeDefined();
        expect(slideTrack.items[0].event.attributes).toContainEqual({
            key: 'LINKOUT',
            value: LINKOUT,
        });
        props.onClickDownload();
        expect(linkouts(mockDownload.mock.calls[0][0])).toEqual([LINKOUT]);
    });

    it('draws a generic track without links when the tab is not shown', () => {
        const { props, slideTrack } = renderWrapper(false);

        expect(slideTrack.renderTooltip).toBeUndefined();
        expect(
            slideTrack.items[0].event.attributes.map(a => a.key)
        ).not.toContain('LINKOUT');
        props.onClickDownload();
        expect(linkouts(mockDownload.mock.calls[0][0])).toEqual([undefined]);
        // The page's events are left as they are.
        expect(linkouts(DATA)).toEqual([LINKOUT]);
    });
});
