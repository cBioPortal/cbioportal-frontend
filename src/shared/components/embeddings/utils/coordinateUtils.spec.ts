import { assert } from 'chai';
import { dataToScreen } from './coordinateUtils';

describe('dataToScreen', () => {
    const viewState = {
        target: [0, 0, 0] as [number, number, number],
        zoom: 0,
        minZoom: -5,
        maxZoom: 10,
    };
    const WIDTH = 800;
    const HEIGHT = 600;

    it('puts the viewport target at the middle of the plot', () => {
        const at = dataToScreen(0, 0, viewState, WIDTH, HEIGHT);
        assert.deepEqual(at, { x: 400, y: 300 });
    });

    it('grows screen y downward, as the plot draws it', () => {
        // The plot uses an OrthographicView built without `flipY`, which
        // defaults to true: data y runs down the screen. An overlay that
        // negated it would mirror about the centre, so marks would slide
        // against the points as the map is panned.
        const below = dataToScreen(0, 10, viewState, WIDTH, HEIGHT);
        assert.isAbove(below.y, 300);
    });

    it('scales by a power of two of the zoom', () => {
        const at = dataToScreen(
            10,
            10,
            { ...viewState, zoom: 2 },
            WIDTH,
            HEIGHT
        );
        assert.deepEqual(at, { x: 400 + 10 * 4, y: 300 + 10 * 4 });
    });

    it('agrees with the viewport the plot actually projects through', () => {
        // The overlay projects through a deck viewport built from the view
        // state being drawn; this arithmetic stands in before the first
        // render, so the two have to land in the same place. deck.gl is
        // mocked under jest, so these are its own OrthographicView's answers
        // for an 800x600 plot, recorded rather than recomputed.
        const cases: {
            target: [number, number, number];
            zoom: number;
            expected: [number, number][];
        }[] = [
            {
                target: [0, 0, 0],
                zoom: 0,
                expected: [
                    [400, 300],
                    [405, 311],
                    [387, 302],
                ],
            },
            {
                target: [0, 0, 0],
                zoom: 3,
                expected: [
                    [400, 300],
                    [440, 388],
                    [296, 316],
                ],
            },
            {
                target: [12, -4, 0],
                zoom: 0,
                expected: [
                    [388, 304],
                    [393, 315],
                    [375, 306],
                ],
            },
            {
                target: [-7, 9, 0],
                zoom: -2,
                expected: [
                    [401.75, 297.75],
                    [403, 300.5],
                    [398.5, 298.25],
                ],
            },
        ];
        const points: [number, number][] = [
            [0, 0],
            [5, 11],
            [-13, 2],
        ];
        for (const { target, zoom, expected } of cases) {
            points.forEach(([x, y], i) => {
                const at = dataToScreen(
                    x,
                    y,
                    { ...viewState, target, zoom },
                    WIDTH,
                    HEIGHT
                );
                assert.closeTo(at.x, expected[i][0], 1e-6);
                assert.closeTo(at.y, expected[i][1], 1e-6);
            });
        }
    });

    it('moves a point by exactly what the target moved, in both axes', () => {
        // What a pan does: the mark has to travel with the map, not against
        // it, or it drifts off the sample it marks.
        const before = dataToScreen(3, 7, viewState, WIDTH, HEIGHT);
        const after = dataToScreen(
            3,
            7,
            { ...viewState, target: [1, 2, 0] },
            WIDTH,
            HEIGHT
        );
        assert.deepEqual(
            { dx: after.x - before.x, dy: after.y - before.y },
            { dx: -1, dy: -2 }
        );
    });
});
