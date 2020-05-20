import { assert } from 'chai';
import * as _ from 'lodash';
import { getPointInTrimmedSpace } from './helpers';
import intersect from './intersect';

describe('getPointInTrimmedSpace', () => {
    let ticks;

    beforeEach(() => {
        ticks = [
            { start: -20, end: -1, offset: 0 },
            { start: 0, end: 364, offset: 0 },
            {
                start: 365,
                end: 729,
                offset: 0,
            },
            { start: 730, end: 1094, offset: 0 },
            {
                isTrim: true,
                start: 1095,
                end: 1459,
                realEnd: 2189,
                offset: 0,
            },
            { start: 2190, end: 2554, offset: 1095 },
            {
                start: 2555,
                end: 2919,
                offset: 1095,
            },
            { start: 2920, end: 3284, offset: 1095 },
            {
                start: 3285,
                end: 3649,
                offset: 1095,
            },
            { start: 3650, end: 4014, offset: 1095 },
            {
                start: 4015,
                end: 4379,
                offset: 1095,
            },
            { start: 4380, end: 4744, offset: 1095 },
            {
                start: 4745,
                end: 5109,
                offset: 1095,
            },
            { start: 5110, end: 5474, offset: 1095 },
            {
                start: 5475,
                end: 5839,
                offset: 1095,
            },
            { start: 5840, end: 6204, offset: 1095 },
            {
                start: 6205,
                end: 6569,
                offset: 1095,
            },
            {
                isTrim: true,
                start: 6570,
                end: 6934,
                realEnd: 7299,
                offset: 1095,
            },
            {
                start: 7300,
                end: 7664,
                offset: 1337,
            },
            { start: 7665, end: 7785, offset: 1337 },
        ];
    });

    it('', () => {
        assert.isUndefined(
            getPointInTrimmedSpace(-21, ticks),
            'point prior to start of first tick is undefined'
        );

        assert.equal(
            getPointInTrimmedSpace(-20, ticks),
            -20,
            'point at start of first tick is equal to itself'
        );

        assert.equal(
            getPointInTrimmedSpace(-1, ticks),
            -1,
            'point at end of first tick is equal to itself'
        );

        assert.equal(
            getPointInTrimmedSpace(-1, ticks),
            -1,
            'point at end of first tick is equal to itself'
        );
    });

    it('points around/after trim regions incorporate trims', () => {
        assert.equal(getPointInTrimmedSpace(0, ticks), 0);
        assert.equal(getPointInTrimmedSpace(20, ticks), 20);
        assert.equal(
            getPointInTrimmedSpace(1500, ticks),
            1095,
            'point in trimmed region maps to start of trim'
        );
        assert.equal(
            getPointInTrimmedSpace(2200, ticks),
            1105,
            'point after trim observers is reduced by offset'
        );
    });

    it('point outside of limit returns undefined', () => {
        assert.equal(getPointInTrimmedSpace(-21, ticks), undefined);
        assert.equal(getPointInTrimmedSpace(7786, ticks), undefined);
    });
});

describe('intersect', () => {
    it('detects overlaps', () => {
        assert.isTrue(intersect(-100, -10, -50, 20), 'overlap');
        assert.isTrue(intersect(-50, 20, -100, -10), 'overlap');
        assert.isTrue(intersect(-100, -10, -10, 20), 'overlap single point');
        assert.isFalse(intersect(-100, -10, -9, 20), 'no overlap');

        assert.isTrue(intersect(100, -10, -9, 20), 'reversed coordinates');
    });
});
