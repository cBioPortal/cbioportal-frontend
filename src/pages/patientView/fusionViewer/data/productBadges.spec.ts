import { assert } from 'chai';
import {
    isCalledCombo,
    calledTranscriptLabel,
    resolveCallerState,
} from './productBadges';
import { FusionEvent } from './types';

const fusion = {
    gene1: { selectedTranscriptId: 'ENST_5' },
    gene2: { selectedTranscriptId: 'ENST_3' },
    callMethod: 'AFS',
} as FusionEvent;

describe('isCalledCombo', () => {
    it('is true only for the caller-reported combo', () => {
        assert.isTrue(isCalledCombo(fusion, 'ENST_5', 'ENST_3'));
        assert.isFalse(isCalledCombo(fusion, 'ENST_5', 'ENST_ALT'));
    });
});

describe('calledTranscriptLabel', () => {
    it('joins the two called transcripts', () => {
        assert.equal(calledTranscriptLabel(fusion), 'ENST_5::ENST_3');
    });
    it('omits the 3p side when gene2 is null', () => {
        const single = {
            gene1: { selectedTranscriptId: 'ENST_5' },
            gene2: null,
        } as FusionEvent;
        assert.equal(calledTranscriptLabel(single), 'ENST_5');
    });
});

describe('resolveCallerState', () => {
    it('returns the caller letters on the called combo', () => {
        const s = resolveCallerState(fusion, 'ENST_5', 'ENST_3');
        assert.equal(s.kind, 'called');
        if (s.kind === 'called') {
            assert.deepEqual(s.callers, [
                'Arriba',
                'FusionCatcher',
                'StarFusion',
            ]);
            assert.equal(s.rawCallMethod, 'AFS');
        }
    });

    it('returns a user-selected marker on any other combo', () => {
        const s = resolveCallerState(fusion, 'ENST_5', 'ENST_ALT');
        assert.equal(s.kind, 'userSelected');
        if (s.kind === 'userSelected') {
            assert.equal(s.calledTranscriptLabel, 'ENST_5::ENST_3');
        }
    });
});
