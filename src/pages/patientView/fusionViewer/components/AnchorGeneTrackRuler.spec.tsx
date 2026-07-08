import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import AnchorGeneTrackRuler, {
    binBreakpointsByPixel,
} from './AnchorGeneTrackRuler';
import { ComparisonRow } from '../data/comparisonRows';
import { TranscriptData } from '../data/types';

const tx: TranscriptData = {
    transcriptId: 't1',
    displayName: 't1',
    gene: 'TMPRSS2',
    biotype: 'protein_coding',
    strand: '+',
    txStart: 0,
    txEnd: 1000,
    exons: [
        { number: 1, start: 0, end: 100 },
        { number: 2, start: 400, end: 500 },
    ],
    isForteSelected: true,
    domains: [],
    utrs: [],
};

function row(bp: number, id: string): ComparisonRow {
    return {
        event: {} as any,
        sampleId: id,
        fivePrimeSymbol: 'TMPRSS2',
        threePrimeSymbol: 'ERG',
        anchorBreakpoint: bp,
        partnerBreakpoint: null,
        frame: 'inFrame',
    };
}

describe('binBreakpointsByPixel', () => {
    it('groups positions into fixed-width bins and counts them', () => {
        // drawX=100, drawW=600, binPx=6 → bin 0 = [100,106)
        const bins = binBreakpointsByPixel([101, 103, 400, 401], 100, 600, 6);
        const first = bins.find(b => b.x === 100)!;
        assert.equal(first.count, 2);
        assert.equal(
            bins.reduce((s, b) => s + b.count, 0),
            4
        );
    });

    it('drops positions outside the drawable range', () => {
        const bins = binBreakpointsByPixel([50, 800, 200], 100, 600, 6);
        assert.equal(
            bins.reduce((s, b) => s + b.count, 0),
            1
        );
    });
});

describe('AnchorGeneTrackRuler', () => {
    it('renders a density histogram bin per occupied column', () => {
        const wrapper = mount(
            <svg>
                <AnchorGeneTrackRuler
                    anchorTranscript={tx}
                    anchorSymbol="TMPRSS2"
                    rows={[row(100, 'a'), row(500, 'b')]}
                    leftX={170}
                    junctionX={500}
                />
            </svg>
        );
        assert.lengthOf(
            wrapper.find('[data-testid="anchor-track"]').hostNodes(),
            1
        );
        assert.isAtLeast(
            wrapper.find('[data-testid="breakpoint-bin"]').hostNodes().length,
            1
        );
    });
});
