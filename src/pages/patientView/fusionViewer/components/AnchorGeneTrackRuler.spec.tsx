import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import AnchorGeneTrackRuler, {
    binBreakpointsByPixel,
    assignBreakpointsToFeatures,
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

// A + strand transcript with three exons (two introns) for feature tests.
const plusTx: TranscriptData = {
    transcriptId: 'p1',
    displayName: 'p1',
    gene: 'PLUS',
    biotype: 'protein_coding',
    strand: '+',
    txStart: 1000,
    txEnd: 2000,
    exons: [
        { number: 1, start: 1000, end: 1100 },
        { number: 2, start: 1400, end: 1500 },
        { number: 3, start: 1900, end: 2000 },
    ],
    isForteSelected: true,
    domains: [],
    utrs: [],
};

// A − strand transcript (same coords, descending transcription order).
const minusTx: TranscriptData = {
    ...plusTx,
    transcriptId: 'm1',
    gene: 'MINUS',
    strand: '-',
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

    it('records the input indices contributing to each bin', () => {
        // 101 & 103 → bin 0; 400 → some later bin. Index alignment preserved.
        const bins = binBreakpointsByPixel([101, 400, 103], 100, 600, 6);
        const first = bins.find(b => b.x === 100)!;
        assert.deepEqual(first.members.slice().sort(), [0, 2]);
    });

    it('drops out-of-range positions from members too', () => {
        const bins = binBreakpointsByPixel([50, 200, 800], 100, 600, 6);
        const all = bins.flatMap(b => b.members);
        // only index 1 (x=200) is in range
        assert.deepEqual(all, [1]);
    });
});

describe('assignBreakpointsToFeatures', () => {
    it('orders features 5′→3′ for a + strand transcript', () => {
        const { features } = assignBreakpointsToFeatures(plusTx, []);
        const labels = features.map(f => f.label);
        // promoter, E1, intron 1-2, E2, intron 2-3, E3, downstream
        assert.deepEqual(labels, ['P', 'E1', '1-2', 'E2', '2-3', 'E3', '▸']);
        assert.equal(features[0].kind, 'promoter');
        assert.equal(features[features.length - 1].kind, 'downstream');
        // Exon gStart must ascend on + strand.
        const exons = features.filter(f => f.kind === 'exon');
        assert.isTrue(exons[0].gStart < exons[1].gStart);
    });

    it('orders features 5′→3′ (descending genomic coord) for a − strand transcript', () => {
        const { features } = assignBreakpointsToFeatures(minusTx, []);
        const labels = features.map(f => f.label);
        // Transcription order reverses the exons: E3 first, E1 last.
        assert.deepEqual(labels, ['P', 'E3', '3-2', 'E2', '2-1', 'E1', '▸']);
        // On − strand the 5′ (first) exon is the higher-coord one.
        const exons = features.filter(f => f.kind === 'exon');
        assert.isTrue(exons[0].gStart > exons[1].gStart);
    });

    it('assigns a breakpoint inside an exon to that exon', () => {
        const { features } = assignBreakpointsToFeatures(plusTx, [1450]);
        const e2 = features.find(f => f.label === 'E2')!;
        assert.equal(e2.count, 1);
    });

    it('assigns a breakpoint in an intron to the correct intron', () => {
        // 1200 is strictly between E1 (…1100) and E2 (1400…) → intron 1-2.
        const { features } = assignBreakpointsToFeatures(plusTx, [1200]);
        const i12 = features.find(f => f.label === '1-2')!;
        const i23 = features.find(f => f.label === '2-3')!;
        assert.equal(i12.count, 1);
        assert.equal(i23.count, 0);
    });

    it('assigns a breakpoint just 5′ of the first exon to the promoter', () => {
        // 990 is upstream of txStart(1000) but within slop → promoter.
        const { features } = assignBreakpointsToFeatures(plusTx, [990]);
        const p = features.find(f => f.kind === 'promoter')!;
        assert.equal(p.count, 1);
    });

    it('assigns a breakpoint just 3′ of the last exon to downstream', () => {
        const { features } = assignBreakpointsToFeatures(plusTx, [2010]);
        const d = features.find(f => f.kind === 'downstream')!;
        assert.equal(d.count, 1);
    });

    it('counts far-off breakpoints as offTranscript without placing them', () => {
        const { features, offTranscript } = assignBreakpointsToFeatures(
            plusTx,
            [1_000_000]
        );
        assert.equal(offTranscript, 1);
        assert.equal(
            features.reduce((s, f) => s + f.count, 0),
            0
        );
    });

    it('aggregates counts across multiple breakpoints', () => {
        const { features, offTranscript } = assignBreakpointsToFeatures(
            plusTx,
            [1050, 1060, 1450, 1200, 990, 2010, 5_000_000]
        );
        const byLabel = (l: string) => features.find(f => f.label === l)!.count;
        assert.equal(byLabel('E1'), 2);
        assert.equal(byLabel('E2'), 1);
        assert.equal(byLabel('1-2'), 1);
        assert.equal(features.find(f => f.kind === 'promoter')!.count, 1);
        assert.equal(features.find(f => f.kind === 'downstream')!.count, 1);
        assert.equal(offTranscript, 1);
    });

    it('records the breakpoint indices that fall in each feature', () => {
        // idx0 → E1, idx1 → E2, idx2 → intron 1-2, idx3 → E1
        const { features } = assignBreakpointsToFeatures(plusTx, [
            1050,
            1450,
            1200,
            1060,
        ]);
        const e1 = features.find(f => f.label === 'E1')!;
        const e2 = features.find(f => f.label === 'E2')!;
        const i12 = features.find(f => f.label === '1-2')!;
        assert.deepEqual(e1.members.slice().sort(), [0, 3]);
        assert.deepEqual(e2.members, [1]);
        assert.deepEqual(i12.members, [2]);
    });

    it('does not add off-transcript/null breakpoints to any feature members', () => {
        const { features } = assignBreakpointsToFeatures(plusTx, [
            null as any,
            5_000_000,
            1050,
        ]);
        const allMembers = features.flatMap(f => f.members);
        // only index 2 (1050 → E1) is placed
        assert.deepEqual(allMembers, [2]);
    });

    it('skips null/undefined breakpoints', () => {
        const { features, offTranscript } = assignBreakpointsToFeatures(
            plusTx,
            [null as any, undefined as any, 1050]
        );
        assert.equal(offTranscript, 0);
        assert.equal(features.find(f => f.label === 'E1')!.count, 1);
    });
});

describe('AnchorGeneTrackRuler', () => {
    it('feature mode (default): renders a bar per occupied feature and exon labels', () => {
        const wrapper = mount(
            <svg>
                <AnchorGeneTrackRuler
                    transcript={plusTx}
                    symbol="PLUS"
                    breakpoints={[1050, 1450, 1200]}
                    drawX={170}
                    drawW={330}
                    labelX={160}
                    labelAnchor="end"
                />
            </svg>
        );
        // 3 occupied features (E1, E2, intron 1-2) → 3 bars.
        assert.lengthOf(
            wrapper.find('[data-testid="feature-bar"]').hostNodes(),
            3
        );
        // Exon labels render for all three exons.
        assert.lengthOf(
            wrapper.find('[data-testid="exon-number"]').hostNodes(),
            3
        );
        assert.lengthOf(
            wrapper.find('[data-testid="feature-exon"]').hostNodes(),
            3
        );
    });

    it('genomic mode: renders the retained fixed-pixel bins path', () => {
        const wrapper = mount(
            <svg>
                <AnchorGeneTrackRuler
                    mode="genomic"
                    transcript={tx}
                    symbol="TMPRSS2"
                    breakpoints={[100, 500]}
                    drawX={170}
                    drawW={330}
                    labelX={160}
                    labelAnchor="end"
                />
            </svg>
        );
        assert.isAtLeast(
            wrapper.find('[data-testid="breakpoint-bin"]').hostNodes().length,
            1
        );
        // Feature-mode glyphs must not appear in genomic mode.
        assert.lengthOf(
            wrapper.find('[data-testid="feature-bar"]').hostNodes(),
            0
        );
    });

    it('shows an off-transcript warning in feature mode when a breakpoint is far outside', () => {
        const wrapper = mount(
            <svg>
                <AnchorGeneTrackRuler
                    transcript={tx}
                    symbol="TMPRSS2"
                    breakpoints={[100, 1_000_000]}
                    drawX={170}
                    drawW={330}
                    labelX={160}
                    labelAnchor="end"
                />
            </svg>
        );
        const warn = wrapper.find('[data-testid="off-transcript"]').hostNodes();
        assert.lengthOf(warn, 1);
        assert.include(warn.text(), '1');
    });

    it('does not throw when an off-locus breakpoint is present', () => {
        assert.doesNotThrow(() => {
            mount(
                <svg>
                    <AnchorGeneTrackRuler
                        transcript={plusTx}
                        symbol="PLUS"
                        breakpoints={[10_000_000, 1050, 1450]}
                        drawX={170}
                        drawW={330}
                        labelX={160}
                        labelAnchor="start"
                    />
                </svg>
            );
        });
    });

    it('shows no off-transcript warning when all breakpoints are in range', () => {
        const wrapper = mount(
            <svg>
                <AnchorGeneTrackRuler
                    transcript={plusTx}
                    symbol="PLUS"
                    breakpoints={[1050, 1450]}
                    drawX={170}
                    drawW={330}
                    labelX={160}
                    labelAnchor="end"
                />
            </svg>
        );
        assert.lengthOf(
            wrapper.find('[data-testid="off-transcript"]').hostNodes(),
            0
        );
    });
});

describe('AnchorGeneTrackRuler (legacy genomic-mode DOM)', () => {
    it('renders a density histogram bin per occupied column', () => {
        const wrapper = mount(
            <svg>
                <AnchorGeneTrackRuler
                    mode="genomic"
                    transcript={tx}
                    symbol="TMPRSS2"
                    breakpoints={[
                        row(100, 'a').anchorBreakpoint,
                        row(500, 'b').anchorBreakpoint,
                    ]}
                    drawX={170}
                    drawW={330}
                    labelX={160}
                    labelAnchor="end"
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

    it('shows an off-transcript warning when a breakpoint is far outside the transcript range', () => {
        // tx is 0..1000; a breakpoint at 10^6 is well beyond SLOP (20000).
        const wrapper = mount(
            <svg>
                <AnchorGeneTrackRuler
                    mode="genomic"
                    transcript={tx}
                    symbol="TMPRSS2"
                    breakpoints={[100, 1_000_000]}
                    drawX={170}
                    drawW={330}
                    labelX={160}
                    labelAnchor="end"
                />
            </svg>
        );
        const warn = wrapper.find('[data-testid="off-transcript"]').hostNodes();
        assert.lengthOf(warn, 1);
        assert.include(warn.text(), '1');
    });

    it('renders bins without throwing when an off-locus partner breakpoint is present', () => {
        // An off-locus breakpoint (far from the transcript) must not throw or
        // collapse the drawn range: the range is now keyed to the transcript
        // midpoint, not the breakpoint.
        assert.doesNotThrow(() => {
            const wrapper = mount(
                <svg>
                    <AnchorGeneTrackRuler
                        mode="genomic"
                        transcript={tx}
                        symbol="ERG"
                        breakpoints={[10_000_000, 100, 500]}
                        drawX={170}
                        drawW={330}
                        labelX={160}
                        labelAnchor="start"
                    />
                </svg>
            );
            assert.isAtLeast(
                wrapper.find('[data-testid="breakpoint-bin"]').hostNodes()
                    .length,
                1
            );
        });
    });

    it('shows no off-transcript warning when all breakpoints are in range', () => {
        const wrapper = mount(
            <svg>
                <AnchorGeneTrackRuler
                    mode="genomic"
                    transcript={tx}
                    symbol="TMPRSS2"
                    breakpoints={[100, 500]}
                    drawX={170}
                    drawW={330}
                    labelX={160}
                    labelAnchor="end"
                />
            </svg>
        );
        assert.lengthOf(
            wrapper.find('[data-testid="off-transcript"]').hostNodes(),
            0
        );
    });
});
