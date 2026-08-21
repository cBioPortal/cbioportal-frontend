// react-markdown is ESM-only and incompatible with Jest's CJS transform;
// mock it to avoid a transform error. It is not exercised by these tests.
jest.mock('react-markdown', () => () => null);

import { assert } from 'chai';
import { autorun } from 'mobx';
import { TimelineStore } from './TimelineStore';
import { TimelineEvent, TimelineTrackSpecification } from './types';

function makeMinimalTrackAndEvents(): {
    track: TimelineTrackSpecification;
    firstEvent: TimelineEvent;
    secondEvent: TimelineEvent;
} {
    const track: TimelineTrackSpecification = {
        items: [],
        type: 'SPECIMEN',
        uid: 'test-track',
    };
    const firstEvent: TimelineEvent = {
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
    const secondEvent: TimelineEvent = {
        ...firstEvent,
        event: {
            ...firstEvent.event,
            uniquePatientKey: 'key2',
        },
    };
    track.items = [firstEvent, secondEvent];
    return { track, firstEvent, secondEvent };
}

describe('TimelineStore', () => {
    it('navigates a tooltip by explicit uid even when another tooltip is hovered', () => {
        const { track, firstEvent, secondEvent } = makeMinimalTrackAndEvents();
        const store = new TimelineStore([track]);
        const targetUid = store.addTooltip({
            track,
            events: [firstEvent, secondEvent],
        });
        const hoveredUid = store.addTooltip({
            track,
            events: [firstEvent],
        });

        store.setHoveredTooltipUid(hoveredUid);

        assert.isTrue(store.nextTooltipEvent(targetUid));
        assert.equal(
            store.tooltipModels.find(([uid]) => uid === targetUid)![2],
            1
        );

        assert.isTrue(store.prevTooltipEvent(targetUid));
        assert.equal(
            store.tooltipModels.find(([uid]) => uid === targetUid)![2],
            0
        );
    });

    it('pins a tooltip at the current mouse position only once', () => {
        const { track, firstEvent, secondEvent } = makeMinimalTrackAndEvents();
        const store = new TimelineStore([track]);
        const tooltipUid = store.addTooltip({
            track,
            events: [firstEvent, secondEvent],
        });

        store.setMousePosition({ x: 100, y: 200 });
        store.pinTooltip(tooltipUid);
        assert.deepEqual(
            store.tooltipModels.find(([uid]) => uid === tooltipUid)![1]
                .position,
            { x: 100, y: 200 }
        );

        store.setMousePosition({ x: 300, y: 400 });
        store.pinTooltip(tooltipUid);
        assert.deepEqual(
            store.tooltipModels.find(([uid]) => uid === tooltipUid)![1]
                .position,
            { x: 100, y: 200 }
        );
    });

    it('returns false when navigating a missing tooltip uid', () => {
        const { track } = makeMinimalTrackAndEvents();
        const store = new TimelineStore([track]);

        assert.isFalse(store.nextTooltipEvent('missing'));
        assert.isFalse(store.prevTooltipEvent('missing'));
    });

    it('does not notify observers when hovered tooltip uid is unchanged', () => {
        const { track, firstEvent, secondEvent } = makeMinimalTrackAndEvents();
        const store = new TimelineStore([track]);
        const tooltipUid = store.addTooltip({
            track,
            events: [firstEvent],
        });
        store.addTooltip({
            track,
            events: [secondEvent],
        });
        let runs = 0;
        const dispose = autorun(() => {
            store.hoveredTooltipUid;
            runs += 1;
        });

        store.setHoveredTooltipUid(tooltipUid);
        assert.equal(runs, 2);

        store.setHoveredTooltipUid(tooltipUid);
        assert.equal(runs, 2);

        dispose();
    });

    it('reuses the same tooltip-model snapshot for unchanged warm tooltip state', () => {
        const { track, firstEvent, secondEvent } = makeMinimalTrackAndEvents();
        const store = new TimelineStore([track]);
        store.addTooltip({
            track,
            events: [firstEvent, secondEvent],
        });
        let runs = 0;
        const dispose = autorun(() => {
            const first = store.tooltipModels;
            const second = store.tooltipModels;

            assert.strictEqual(second, first);
            assert.lengthOf(second, 1);
            assert.equal(second[0][2], 0);
            runs += 1;
        });

        assert.equal(runs, 1);
        dispose();
    });

    it('does not notify observers when mouse position is unchanged', () => {
        const { track } = makeMinimalTrackAndEvents();
        const store = new TimelineStore([track]);
        let runs = 0;
        const dispose = autorun(() => {
            store.mousePosition.x;
            store.mousePosition.y;
            runs += 1;
        });

        store.setMousePosition({ x: 10, y: 20 });
        assert.equal(runs, 2);

        store.setMousePosition({ x: 10, y: 20 });
        assert.equal(runs, 2);

        dispose();
    });

    it('rebuilds sample event and id derivations when sample attributes mutate in place', () => {
        const track: TimelineTrackSpecification = {
            items: [],
            type: 'SPECIMEN',
            uid: 'sample-track',
        };
        const sampleEvent: TimelineEvent = {
            start: 0,
            end: 0,
            event: {
                attributes: [{ key: 'SAMPLE_ID', value: 'S-1' }],
                eventType: 'SPECIMEN',
                patientId: 'P-001',
                startNumberOfDaysSinceDiagnosis: 0,
                studyId: 'study1',
                uniquePatientKey: 'sample-event',
            },
            containingTrack: track,
        };
        const treatmentEvent: TimelineEvent = {
            start: 5,
            end: 5,
            event: {
                attributes: [{ key: 'SAMPLE_ID', value: 'IGNORED' }],
                eventType: 'TREATMENT',
                patientId: 'P-001',
                startNumberOfDaysSinceDiagnosis: 5,
                studyId: 'study1',
                uniquePatientKey: 'treatment-event',
            },
            containingTrack: track,
        };
        track.items = [sampleEvent, treatmentEvent];

        const store = new TimelineStore([track]);

        assert.deepEqual(store.sampleIds, ['S-1']);
        assert.deepEqual(
            store.sampleEvents.map(event => event.event.uniquePatientKey),
            ['sample-event']
        );

        sampleEvent.event.attributes = [{ key: 'SAMPLE_ID', value: 'S-2' }];

        assert.deepEqual(store.sampleIds, ['S-2']);
        assert.deepEqual(
            store.sampleEvents.map(event => event.event.uniquePatientKey),
            ['sample-event']
        );
    });

    it('reuses cached event positions for the same warm item and viewport context', () => {
        const { track, firstEvent } = makeMinimalTrackAndEvents();
        const store = new TimelineStore([track]);
        store.viewPortWidth = 1000;

        const first = store.getPosition(firstEvent);
        const second = store.getPosition(firstEvent);

        assert.strictEqual(second, first);
    });

    it('rebuilds cached event positions when the item or viewport changes', () => {
        const { track, firstEvent } = makeMinimalTrackAndEvents();
        const store = new TimelineStore([track]);
        store.viewPortWidth = 1000;

        const first = store.getPosition(firstEvent);

        store.viewPortWidth = 1200;
        const second = store.getPosition(firstEvent);

        assert.notStrictEqual(second, first);

        firstEvent.end = 10;
        const third = store.getPosition(firstEvent);

        assert.notStrictEqual(third, second);
    });

    it('rebuilds cached event positions when the tick layout changes', () => {
        const { track, firstEvent, secondEvent } = makeMinimalTrackAndEvents();
        const store = new TimelineStore([track]);
        store.viewPortWidth = 1000;

        const first = store.getPosition(firstEvent);

        secondEvent.start = 4000;
        secondEvent.end = 4000;
        const second = store.getPosition(firstEvent);

        assert.notStrictEqual(second, first);
    });

    it('reuses cached tick positions for the same warm tick start and viewport context', () => {
        const { track } = makeMinimalTrackAndEvents();
        const store = new TimelineStore([track]);
        store.viewPortWidth = 1000;

        const first = store.getTickPosition(0);
        const second = store.getTickPosition(0);

        assert.strictEqual(second, first);
    });

    it('rebuilds cached tick positions when the tick layout changes', () => {
        const { track, secondEvent } = makeMinimalTrackAndEvents();
        const store = new TimelineStore([track]);
        store.viewPortWidth = 1000;

        const first = store.getTickPosition(0);

        secondEvent.start = 4000;
        secondEvent.end = 4000;
        const second = store.getTickPosition(0);

        assert.notStrictEqual(second, first);
    });

    it('reuses cached tooltip content for the same warm tooltip snapshot', () => {
        const { track, firstEvent, secondEvent } = makeMinimalTrackAndEvents();
        const store = new TimelineStore([track]);
        const tooltipUid = store.addTooltip({
            track,
            events: [firstEvent, secondEvent],
        });
        const [, tooltipModel, tooltipIndex] = store.tooltipModels.find(
            ([uid]) => uid === tooltipUid
        )!;

        const first = store.getTooltipContent(
            tooltipUid,
            tooltipModel,
            tooltipIndex
        );
        const second = store.getTooltipContent(
            tooltipUid,
            tooltipModel,
            tooltipIndex
        );

        assert.strictEqual(second, first);
    });

    it('passes the active event to a custom tooltip renderer', () => {
        const { track, firstEvent, secondEvent } = makeMinimalTrackAndEvents();
        const renderTooltip = jest.fn(() => 'custom tooltip');
        track.renderTooltip = renderTooltip;
        const store = new TimelineStore([track]);
        const tooltipUid = store.addTooltip({
            track,
            events: [firstEvent, secondEvent],
        });
        const [, tooltipModel, tooltipIndex] = store.tooltipModels.find(
            ([uid]) => uid === tooltipUid
        )!;

        store.getTooltipContent(tooltipUid, tooltipModel, tooltipIndex);

        expect(renderTooltip).toHaveBeenCalledWith(firstEvent);
    });

    it('includes descendant events exactly once when a nested track is collapsed', () => {
        const childTrack: TimelineTrackSpecification = {
            items: [],
            type: 'TREATMENT',
            uid: 'child-track',
        };
        const parentTrack: TimelineTrackSpecification = {
            items: [],
            tracks: [childTrack],
            type: 'SPECIMEN',
            uid: 'parent-track',
        };
        const parentEvent: TimelineEvent = {
            start: 10,
            end: 10,
            event: {
                attributes: [],
                eventType: 'SPECIMEN',
                patientId: 'P-001',
                startNumberOfDaysSinceDiagnosis: 10,
                studyId: 'study1',
                uniquePatientKey: 'parent-event',
            },
            containingTrack: parentTrack,
        };
        const childEvent: TimelineEvent = {
            start: 20,
            end: 20,
            event: {
                attributes: [],
                eventType: 'TREATMENT',
                patientId: 'P-001',
                startNumberOfDaysSinceDiagnosis: 20,
                studyId: 'study1',
                uniquePatientKey: 'child-event',
            },
            containingTrack: childTrack,
        };
        parentTrack.items = [parentEvent];
        childTrack.items = [childEvent];

        const store = new TimelineStore([parentTrack]);
        store.toggleTrackCollapse(parentTrack.uid);

        assert.deepEqual(
            store.allItems.map(event => event.event.uniquePatientKey),
            ['parent-event', 'child-event']
        );
    });

    it('rebuilds cached tooltip content when the active tooltip event changes', () => {
        const { track, firstEvent, secondEvent } = makeMinimalTrackAndEvents();
        const store = new TimelineStore([track]);
        const tooltipUid = store.addTooltip({
            track,
            events: [firstEvent, secondEvent],
        });
        const [, tooltipModel, tooltipIndex] = store.tooltipModels.find(
            ([uid]) => uid === tooltipUid
        )!;

        const first = store.getTooltipContent(
            tooltipUid,
            tooltipModel,
            tooltipIndex
        );
        store.nextTooltipEvent(tooltipUid);
        const nextTooltipIndex = store.tooltipModels.find(
            ([uid]) => uid === tooltipUid
        )![2];
        const second = store.getTooltipContent(
            tooltipUid,
            tooltipModel,
            nextTooltipIndex
        );

        assert.notStrictEqual(second, first);
    });

    it('reuses previously built tooltip content when multi-event navigation returns to the same item', () => {
        const { track, firstEvent, secondEvent } = makeMinimalTrackAndEvents();
        const store = new TimelineStore([track]);
        const tooltipUid = store.addTooltip({
            track,
            events: [firstEvent, secondEvent],
        });
        const [, tooltipModel, tooltipIndex] = store.tooltipModels.find(
            ([uid]) => uid === tooltipUid
        )!;

        const first = store.getTooltipContent(
            tooltipUid,
            tooltipModel,
            tooltipIndex
        );

        store.nextTooltipEvent(tooltipUid);
        const nextTooltipIndex = store.tooltipModels.find(
            ([uid]) => uid === tooltipUid
        )![2];
        store.getTooltipContent(tooltipUid, tooltipModel, nextTooltipIndex);

        store.prevTooltipEvent(tooltipUid);
        const restoredTooltipIndex = store.tooltipModels.find(
            ([uid]) => uid === tooltipUid
        )![2];
        const restored = store.getTooltipContent(
            tooltipUid,
            tooltipModel,
            restoredTooltipIndex
        );

        assert.strictEqual(restored, first);
    });
});
