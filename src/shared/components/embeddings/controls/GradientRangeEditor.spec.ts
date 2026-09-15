import { assert } from 'chai';
import {
    COLOR_SCALES,
    DEFAULT_HIGH,
    DEFAULT_LOW,
    GradientOverride,
    getGradientStops,
    gradientCssFromColorFn,
    gradientCssFromStops,
    makeGradientColorFn,
    pickPercentileRange,
    seedLowHighColors,
} from './GradientRangeEditor';

describe('GradientRangeEditor', () => {
    describe('seedLowHighColors', () => {
        it("uses the override's own colors when one is already active", () => {
            const override: GradientOverride = {
                min: 0,
                max: 10,
                mid: 5,
                lowColor: '#111111',
                highColor: '#222222',
            };
            assert.deepEqual(seedLowHighColors(override, undefined, 0, 10), {
                lowColor: '#111111',
                highColor: '#222222',
            });
        });

        it('samples the auto color function at min/max when there is no override', () => {
            const autoColorFn = (x: number) =>
                x < 5 ? 'rgb(255, 245, 240)' : 'rgb(103, 0, 13)';
            assert.deepEqual(seedLowHighColors(undefined, autoColorFn, 0, 10), {
                lowColor: '#fff5f0',
                highColor: '#67000d',
            });
        });

        it('falls back to the default preset colors when there is neither an override nor an auto color function', () => {
            assert.deepEqual(seedLowHighColors(undefined, undefined, 0, 10), {
                lowColor: DEFAULT_LOW,
                highColor: DEFAULT_HIGH,
            });
        });
    });

    describe('getGradientStops', () => {
        it('returns the two-color low/high stops when no named scale is set', () => {
            const override: GradientOverride = {
                min: 0,
                max: 10,
                mid: 5,
                lowColor: '#ff0000',
                highColor: '#0000ff',
            };
            assert.deepEqual(getGradientStops(override), [
                [255, 0, 0],
                [0, 0, 255],
            ]);
        });

        it('prefers a named perceptual scale over the low/high colors when set', () => {
            const override: GradientOverride = {
                min: 0,
                max: 10,
                mid: 5,
                lowColor: '#ff0000',
                highColor: '#0000ff',
                scaleName: 'viridis',
            };
            assert.deepEqual(getGradientStops(override), COLOR_SCALES.viridis);
        });

        it('falls back to the low/high colors for an unrecognized scale name', () => {
            const override: GradientOverride = {
                min: 0,
                max: 10,
                mid: 5,
                lowColor: '#ff0000',
                highColor: '#0000ff',
                scaleName: 'not-a-real-scale',
            };
            assert.deepEqual(getGradientStops(override), [
                [255, 0, 0],
                [0, 0, 255],
            ]);
        });
    });

    describe('gradientCssFromStops', () => {
        it('builds a linear-gradient with stops evenly spaced from 0% to 100%', () => {
            assert.equal(
                gradientCssFromStops([
                    [255, 0, 0],
                    [0, 255, 0],
                    [0, 0, 255],
                ]),
                'linear-gradient(to right, rgb(255, 0, 0) 0%, rgb(0, 255, 0) 50%, rgb(0, 0, 255) 100%)'
            );
        });

        it('does not divide by zero for a single stop', () => {
            assert.equal(
                gradientCssFromStops([[128, 128, 128]]),
                'linear-gradient(to right, rgb(128, 128, 128) 0%)'
            );
        });
    });

    describe('gradientCssFromColorFn', () => {
        it('samples the color function at evenly spaced values across [min, max]', () => {
            const sampled: number[] = [];
            const colorFn = (x: number) => {
                sampled.push(x);
                return 'rgb(0, 0, 0)';
            };
            gradientCssFromColorFn(colorFn, 0, 10, 3);
            assert.deepEqual(sampled, [0, 5, 10]);
        });

        it('defaults to 8 steps', () => {
            let calls = 0;
            gradientCssFromColorFn(
                () => {
                    calls++;
                    return 'rgb(0, 0, 0)';
                },
                0,
                1
            );
            assert.equal(calls, 8);
        });
    });

    describe('makeGradientColorFn', () => {
        const stops: [number, number, number][] = [
            [0, 0, 0],
            [255, 255, 255],
        ];

        it('returns the low stop color at min and the high stop color at max', () => {
            const colorFn = makeGradientColorFn(0, 5, 10, stops);
            assert.equal(colorFn(0), 'rgb(0, 0, 0)');
            assert.equal(colorFn(10), 'rgb(255, 255, 255)');
        });

        it('places the midpoint color at the mid pivot regardless of where it sits in [min, max]', () => {
            // A skewed pivot should still map to the 50%-through-the-stops color at x === mid.
            const colorFn = makeGradientColorFn(0, 9, 10, stops);
            assert.equal(colorFn(9), 'rgb(128, 128, 128)');
        });

        it('is monotonic on both sides of the pivot', () => {
            const colorFn = makeGradientColorFn(0, 5, 10, stops);
            const toGray = (css: string) => parseInt(css.match(/\d+/)![0], 10);
            assert.isBelow(toGray(colorFn(1)), toGray(colorFn(4)));
            assert.isBelow(toGray(colorFn(6)), toGray(colorFn(9)));
        });
    });

    describe('pickPercentileRange', () => {
        it('picks the values at the given percentiles from the sorted data', () => {
            const values = Array.from({ length: 101 }, (_, i) => i); // 0..100
            assert.deepEqual(pickPercentileRange(values, 1, 99), [1, 99]);
            assert.deepEqual(pickPercentileRange(values, 5, 95), [5, 95]);
            assert.deepEqual(pickPercentileRange(values, 0, 100), [0, 100]);
        });

        it('is insensitive to input order', () => {
            const values = [50, 10, 90, 30, 70, 20, 80, 40, 60, 0, 100];
            assert.deepEqual(pickPercentileRange(values, 0, 100), [0, 100]);
        });

        it('returns undefined for an empty input', () => {
            assert.isUndefined(pickPercentileRange([], 1, 99));
        });

        it('returns undefined when the percentiles collapse to the same or an inverted value', () => {
            // All identical values: every percentile picks the same number.
            assert.isUndefined(pickPercentileRange([5, 5, 5, 5], 1, 99));
        });
    });
});
