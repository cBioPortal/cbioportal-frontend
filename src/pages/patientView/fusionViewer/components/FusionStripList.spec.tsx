import { assert } from 'chai';
import { visibleWindow, ladderTranscript } from './FusionStripList';
import { TranscriptData } from '../data/types';

describe('visibleWindow', () => {
    it('returns only the rows intersecting the viewport plus overscan', () => {
        // 100 rows, 50px each, 200px viewport, scrolled to 1000px
        const { start, end } = visibleWindow(100, 50, 200, 1000);
        // first visible row = 1000/50 = 20; overscan 2 → start 18
        assert.equal(start, 18);
        // last visible = (1000+200)/50 = 24; +overscan → 26 (exclusive)
        assert.equal(end, 26);
    });

    it('clamps to [0, total]', () => {
        const { start, end } = visibleWindow(5, 50, 400, 0);
        assert.equal(start, 0);
        assert.equal(end, 5);
    });
});

function t(gene: string): TranscriptData {
    return {
        transcriptId: gene,
        displayName: gene,
        gene,
        biotype: 'protein_coding',
        strand: '+',
        txStart: 0,
        txEnd: 1000,
        exons: [{ number: 1, start: 0, end: 100 }],
        isForteSelected: true,
        isCallerSelected: true,
        isCanonical: true,
        domains: [],
        utrs: [],
    };
}

describe('ladderTranscript', () => {
    it('uses the row transcript when not in reference mode', () => {
        assert.equal(ladderTranscript(t('ERG'), t('ETV1'), false)!.gene, 'ERG');
    });

    it('uses the reference transcript when the genes match', () => {
        const ref = t('ERG');
        assert.strictEqual(ladderTranscript(t('ERG'), ref, true), ref);
    });

    it('falls back to the row transcript for an off-reference partner', () => {
        // Driver-anchor mode: this row's partner is not the dominant partner,
        // so drawing it against the reference ladder would be wrong.
        assert.equal(ladderTranscript(t('FLI1'), t('ERG'), true)!.gene, 'FLI1');
    });

    it('returns the row transcript when there is no reference', () => {
        assert.equal(ladderTranscript(t('ERG'), undefined, true)!.gene, 'ERG');
    });

    it('returns undefined when the row has no transcript', () => {
        assert.isUndefined(ladderTranscript(undefined, undefined, true));
    });
});
