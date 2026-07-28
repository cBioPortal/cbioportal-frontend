import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import FusionStripList, {
    visibleWindow,
    ladderTranscript,
} from './FusionStripList';
import { TranscriptData, FusionEvent } from '../data/types';
import { ComparisonRow } from '../data/comparisonRows';

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

    it('returns undefined when the row has no transcript even if a reference exists', () => {
        assert.isUndefined(ladderTranscript(undefined, t('ERG'), true));
    });
});

function multiExonTx(gene: string): TranscriptData {
    return {
        transcriptId: gene,
        displayName: gene,
        gene,
        biotype: 'protein_coding',
        strand: '+',
        txStart: 0,
        txEnd: 1000,
        exons: [
            { number: 1, start: 0, end: 100 },
            { number: 2, start: 200, end: 300 },
            { number: 3, start: 400, end: 500 },
        ],
        isForteSelected: true,
        isCallerSelected: true,
        isCanonical: true,
        domains: [],
        utrs: [],
    };
}

function makeRow(sampleId: string): ComparisonRow {
    return {
        event: { totalReadSupport: 12 } as FusionEvent,
        sampleId,
        fivePrimeSymbol: 'TMPRSS2',
        threePrimeSymbol: 'ERG',
        anchorBreakpoint: 250,
        partnerBreakpoint: 250,
        frame: 'inFrame',
    };
}

describe('FusionStripList stale hover overlay', () => {
    function mountList() {
        return mount(
            <FusionStripList
                rows={[makeRow('S1')]}
                transcriptForRow={(_, is5p) =>
                    is5p ? multiExonTx('TMPRSS2') : multiExonTx('ERG')
                }
                width={800}
                pxPerBp5p={0.5}
                pxPerBp3p={0.5}
                alignment="junction"
                exonMode="full"
            />
        );
    }

    it('shows the shared overlay on exon hover and clears it on scroll', () => {
        const wrapper = mountList();
        wrapper
            .find('[data-testid="strip-exon"]')
            .hostNodes()
            .first()
            .simulate('mouseenter', { clientX: 10, clientY: 20 });
        assert.lengthOf(
            wrapper.find('[data-testid="exon-hover-readout"]').hostNodes(),
            1
        );

        wrapper
            .find('[data-testid="strip-scroll"]')
            .hostNodes()
            .simulate('scroll', { target: { scrollTop: 5 } });
        assert.lengthOf(
            wrapper.find('[data-testid="exon-hover-readout"]').hostNodes(),
            0
        );
    });

    it('clears the overlay on mouseleave of the scroll container', () => {
        const wrapper = mountList();
        wrapper
            .find('[data-testid="strip-exon"]')
            .hostNodes()
            .first()
            .simulate('mouseenter', { clientX: 10, clientY: 20 });
        wrapper
            .find('[data-testid="strip-scroll"]')
            .hostNodes()
            .simulate('mouseleave');
        assert.lengthOf(
            wrapper.find('[data-testid="exon-hover-readout"]').hostNodes(),
            0
        );
    });

    it('clears the overlay when exonMode switches away from full', () => {
        const wrapper = mountList();
        wrapper
            .find('[data-testid="strip-exon"]')
            .hostNodes()
            .first()
            .simulate('mouseenter', { clientX: 10, clientY: 20 });
        wrapper.setProps({ exonMode: 'retained' });
        wrapper.update();
        assert.lengthOf(
            wrapper.find('[data-testid="exon-hover-readout"]').hostNodes(),
            0
        );
    });
});
