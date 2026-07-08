// react-markdown is ESM-only and incompatible with Jest's CJS transform;
// mock it to avoid a transform error. It is not exercised by these tests.
jest.mock('react-markdown', () => () => null);

import { assert } from 'chai';
import React from 'react';
import { mount } from 'enzyme';
import { TimelineStore } from './TimelineStore';
import { TimelineItemWithTooltip } from './TimelineTrack';
import { TimelineEvent, TimelineTrackSpecification } from './types';

function makeMinimalTrackAndEvent(): {
    track: TimelineTrackSpecification;
    event: TimelineEvent;
} {
    const track: TimelineTrackSpecification = {
        items: [],
        type: 'SPECIMEN',
        uid: 'test-track',
    };
    const event: TimelineEvent = {
        start: 0,
        end: 0,
        event: {
            attributes: [],
            eventType: 'SPECIMEN',
            patientId: 'P-001',
            startNumberOfDaysSinceDiagnosis: 0,
            studyId: 'study1',
            uniquePatientKey: 'key1',
        },
        containingTrack: track,
    };
    track.items = [event];
    return { track, event };
}

describe('TimelineItemWithTooltip', () => {
    it('updates mousePosition on every onMouseMove, not just on first tooltip creation', () => {
        const { track, event } = makeMinimalTrackAndEvent();
        const store = new TimelineStore([track]);

        const wrapper = mount(
            <TimelineItemWithTooltip
                x={50}
                store={store}
                track={track}
                events={[event]}
                content={null}
            />
        );

        // First move: tooltip is created and mousePosition is set
        wrapper.simulate('mousemove', { pageX: 100, pageY: 200 });
        assert.deepEqual(
            store.mousePosition,
            { x: 100, y: 200 },
            'mousePosition set on first move'
        );

        // Second move: tooltip already exists — mousePosition must still update.
        // Before the fix, setMousePosition was only called inside the `if (!uid)`
        // guard, so repeated moves would leave mousePosition frozen at the entry
        // point, causing the tooltip to obstruct the underlying SVG clickthrough.
        wrapper.simulate('mousemove', { pageX: 300, pageY: 400 });
        assert.deepEqual(
            store.mousePosition,
            { x: 300, y: 400 },
            'mousePosition updated on subsequent moves'
        );
    });
});
