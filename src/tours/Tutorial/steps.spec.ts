import { assert } from 'chai';
import { navigationFor, tutorialSteps } from './steps';
import tutorial1 from './tutorial1';

describe('tutorial steps', () => {
    it('makes one step per point, and one per beat without points', () => {
        const steps = tutorialSteps(tutorial1);
        const points = tutorial1.beats.reduce(
            (n, b) => n + (b.points ? b.points.length : 1),
            0
        );
        assert.equal(steps.length, points);
        assert.equal(steps[0].beat.kind, 'title');
        assert.equal(steps[steps.length - 1].beat.kind, 'end');
    });

    it('gives every point of Tutorial 1 a text and a target', () => {
        for (const { beat, point } of tutorialSteps(tutorial1)) {
            if (point) {
                assert.isOk(point.say, beat.title);
                assert.isDefined(point.target, beat.title);
            }
        }
    });

    it('fills the study into every page', () => {
        for (const beat of tutorial1.beats) {
            assert.notInclude(beat.page || '', '{study}');
        }
    });

    it('navigates only when the page differs', () => {
        const home = { pathname: '/', search: '' };
        assert.isNull(navigationFor('/', home));
        assert.isNull(navigationFor(undefined, home));
        assert.equal(
            navigationFor('/study/summary?id=lgg', home),
            '/study/summary?id=lgg'
        );
    });

    it('keeps the filters when it moves between tabs of the same study', () => {
        const summary = {
            pathname: '/study/summary',
            search: '?id=lgg&filterJson=x',
            hash: '#h',
        };
        assert.isNull(navigationFor('/study/summary?id=lgg', summary));
        assert.equal(
            navigationFor('/study/plots?id=lgg', summary),
            '/study/plots?id=lgg&filterJson=x#h'
        );
        assert.equal(
            navigationFor('/study/plots?id=other', summary),
            '/study/plots?id=other'
        );
    });
});
