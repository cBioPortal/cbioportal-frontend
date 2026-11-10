import { assert } from 'chai';
import {
    computeLogFloor,
    formatValueTick,
    logValueTicks,
    MAX_LOG_TICKS,
} from './mrnaAxisUtils';

describe('mrnaAxisUtils', () => {
    describe('computeLogFloor', () => {
        it('returns 1 when there are no positive values', () => {
            assert.equal(computeLogFloor([]), 1);
            assert.equal(computeLogFloor([0, -2, 0]), 1);
        });

        it('uses the smallest positive value for well-behaved data', () => {
            const values = [0, 0, 0.5, 1, 2, 10, 100];
            assert.equal(computeLogFloor(values), 0.5);
        });

        it('ignores a near-zero outlier in a large cohort', () => {
            const values = [1.2e-63];
            for (let i = 0; i < 1000; i++) {
                values.push(1 + (i % 500));
            }
            assert.equal(computeLogFloor(values), 1);
        });

        it('caps the range at 8 decades below the maximum', () => {
            const values = [1e-20, 1e-19, 1e-18, 1e5, 1e5];
            assert.closeTo(computeLogFloor(values), 1e-3, 1e-12);
        });
    });

    describe('logValueTicks', () => {
        it('returns undefined for an invalid range', () => {
            assert.isUndefined(logValueTicks(0, 10));
            assert.isUndefined(logValueTicks(10, 10));
        });

        it('uses 1-2-5 ticks for narrow ranges', () => {
            assert.deepEqual(logValueTicks(1.5, 60), [2, 5, 10, 20, 50]);
        });

        it('uses powers of ten for medium ranges', () => {
            assert.deepEqual(logValueTicks(0.05, 2e3), [0.1, 1, 10, 100, 1e3]);
        });

        it('labels every decade when they fit', () => {
            assert.deepEqual(
                logValueTicks(Math.pow(10, -2.3), Math.pow(10, 4.2)),
                [0.01, 0.1, 1, 10, 100, 1e3, 1e4]
            );
        });

        it('keeps the tick count bounded for very wide ranges', () => {
            const ticks = logValueTicks(1e-64, 1e5)!;
            assert.isAtMost(ticks.length, MAX_LOG_TICKS);
            assert.include(ticks, 1);
        });
    });

    describe('formatValueTick', () => {
        it('formats large values compactly', () => {
            assert.equal(formatValueTick(1500), '1.5k');
            assert.equal(formatValueTick(10000), '10k');
            assert.equal(formatValueTick(2e6), '2M');
        });

        it('formats ordinary values as-is', () => {
            assert.equal(formatValueTick(0), '0');
            assert.equal(formatValueTick(1), '1');
            assert.equal(formatValueTick(-2.5), '-2.5');
            assert.equal(formatValueTick(0.05), '0.05');
        });

        it('adds decimals to keep million-scale ticks distinct', () => {
            const ticks = [1e6, 1.005e6, 1.01e6, 1.015e6, 1.02e6];
            assert.deepEqual(
                ticks.map((t, i) => formatValueTick(t, i, ticks)),
                ['1M', '1.005M', '1.01M', '1.015M', '1.02M']
            );
        });

        it('adds decimals to keep thousand-scale ticks distinct', () => {
            const ticks = [1000, 1005, 1010];
            assert.deepEqual(
                ticks.map((t, i) => formatValueTick(t, i, ticks)),
                ['1k', '1.005k', '1.01k']
            );
        });

        it('keeps short labels when ticks are already distinct', () => {
            const ticks = [0, 500000, 1e6, 1.5e6];
            assert.deepEqual(
                ticks.map((t, i) => formatValueTick(t, i, ticks)),
                ['0', '500k', '1M', '1.5M']
            );
        });

        it('uses exponent notation for tiny values', () => {
            assert.equal(formatValueTick(1e-6), '10⁻⁶');
            assert.equal(formatValueTick(1e-12), '10⁻¹²');
            assert.equal(formatValueTick(2e-4), '2×10⁻⁴');
        });
    });
});
