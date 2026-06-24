import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import AnchorGeneTrackRuler, { stackLollipops } from './AnchorGeneTrackRuler';
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
        frame: 'inFrame',
    };
}

describe('stackLollipops', () => {
    it('assigns increasing binIndex to rows sharing a breakpoint', () => {
        const out = stackLollipops([
            row(100, 'a'),
            row(100, 'b'),
            row(500, 'c'),
        ]);
        const at100 = out.filter(o => o.row.anchorBreakpoint === 100);
        assert.deepEqual(at100.map(o => o.binIndex).sort(), [0, 1]);
        assert.equal(out.find(o => o.row.sampleId === 'c')!.binIndex, 0);
    });
});

describe('AnchorGeneTrackRuler', () => {
    it('renders one lollipop per row and an anchor track', () => {
        const wrapper = mount(
            <svg>
                <AnchorGeneTrackRuler
                    anchorTranscript={tx}
                    anchorSymbol="TMPRSS2"
                    rows={[row(100, 'a'), row(500, 'b')]}
                    width={800}
                />
            </svg>
        );
        assert.lengthOf(
            wrapper.find('[data-testid="anchor-track"]').hostNodes(),
            1
        );
        assert.lengthOf(
            wrapper.find('[data-testid="lollipop"]').hostNodes(),
            2
        );
    });
});
