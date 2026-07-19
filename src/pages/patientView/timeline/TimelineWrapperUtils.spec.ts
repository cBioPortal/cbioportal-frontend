import { assert } from 'chai';
import {
    getEventColor,
    getNumberRangeLabel,
    getSampleInfo,
    getSortedSampleInfo,
} from './TimelineWrapperUtils';

describe('TimelineWrapperUtils', () => {
    it('resolves sample info through the cached event-attribute map', () => {
        const event = {
            event: {
                attributes: [{ key: 'SAMPLE_ID', value: 'S-1' }],
            },
        } as any;
        const caseMetaData = {
            color: { 'S-1': '#123456' },
            index: { 'S-1': 1 },
            label: { 'S-1': 'Sample 1' },
        };

        assert.deepEqual(getSampleInfo(event, caseMetaData as any), {
            color: '#123456',
            label: 'Sample 1',
        });
    });

    it('rebuilds sample info when event attributes mutate in place', () => {
        const event = {
            event: {
                attributes: [{ key: 'SAMPLE_ID', value: 'S-1' }],
            },
        } as any;
        const caseMetaData = {
            color: { 'S-1': '#123456', 'S-2': '#abcdef' },
            index: { 'S-1': 1, 'S-2': 2 },
            label: { 'S-1': 'Sample 1', 'S-2': 'Sample 2' },
        };

        const first = getSampleInfo(event, caseMetaData as any);
        event.event.attributes[0].value = 'S-2';
        const second = getSampleInfo(event, caseMetaData as any);

        assert.notDeepEqual(second, first);
        assert.deepEqual(second, {
            color: '#abcdef',
            label: 'Sample 2',
        });
    });

    it('resolves event colors through the cached event-attribute map', () => {
        const event = {
            event: {
                attributes: [
                    { key: 'UNUSED', value: 'x' },
                    { key: 'STATUS', value: 'Positive' },
                ],
            },
        } as any;

        const color = getEventColor(
            event,
            ['MISSING', 'STATUS'],
            [
                { re: /Positive/, color: '#00ff00' },
                { re: /Negative/, color: '#ff0000' },
            ]
        );

        assert.equal(color, '#00ff00');
    });

    it('formats numeric labels into collapsed ranges', () => {
        assert.equal(getNumberRangeLabel([]), '-');
        assert.equal(getNumberRangeLabel([1, 2, 3, 5, 7, 8]), '1-3, 5, 7-8');
    });

    it('sorts numeric sample labels and drops non-numeric values', () => {
        assert.deepEqual(
            getSortedSampleInfo(
                ['#333333', '#111111', '#222222', '#444444'],
                ['3', '1', 'bad', '2']
            ),
            [
                { color: '#111111', label: 1 },
                { color: '#444444', label: 2 },
                { color: '#333333', label: 3 },
            ]
        );
    });
});
