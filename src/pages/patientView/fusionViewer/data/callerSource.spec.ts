import { assert } from 'chai';
import { describeCallerSource } from './callerSource';

describe('describeCallerSource', () => {
    it('decodes all three callers from "AFS" in order', () => {
        assert.deepEqual(describeCallerSource('AFS'), [
            'Arriba',
            'FusionCatcher',
            'StarFusion',
        ]);
    });

    it('decodes a single caller', () => {
        assert.deepEqual(describeCallerSource('F'), ['FusionCatcher']);
        assert.deepEqual(describeCallerSource('A'), ['Arriba']);
        assert.deepEqual(describeCallerSource('S'), ['StarFusion']);
    });

    it('is case-insensitive and trims whitespace', () => {
        assert.deepEqual(describeCallerSource(' af '), [
            'Arriba',
            'FusionCatcher',
        ]);
    });

    it('returns [] for a non-caller-code string (e.g. a DNA SV variant class)', () => {
        // "TRANSLOCATION" contains an incidental "A" but is not a caller code,
        // so it must not decode to ['Arriba'].
        assert.deepEqual(describeCallerSource('TRANSLOCATION'), []);
        assert.deepEqual(describeCallerSource('DELETION'), []);
    });

    it('collapses duplicate letters', () => {
        assert.deepEqual(describeCallerSource('AA'), ['Arriba']);
        assert.deepEqual(describeCallerSource('SASS'), [
            'StarFusion',
            'Arriba',
        ]);
    });

    it('returns [] for empty / null / undefined', () => {
        assert.deepEqual(describeCallerSource(''), []);
        assert.deepEqual(describeCallerSource(null), []);
        assert.deepEqual(describeCallerSource(undefined), []);
    });
});
