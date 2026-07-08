import { assert } from 'chai';
import {
    buildComparisonRows,
    sortComparisonRows,
    resolveComparisonRows,
    orientComparisonRowsTo5p,
    snapBreakpointsToAnchorGene,
    ComparisonAnchor,
    ComparisonRow,
} from './comparisonRows';
import { FusionEvent, TranscriptData } from './types';

function makeTx(
    gene: string,
    txStart: number,
    txEnd: number,
    strand: '+' | '-'
): TranscriptData {
    return {
        transcriptId: gene,
        displayName: gene,
        gene,
        biotype: 'protein_coding',
        strand,
        txStart,
        txEnd,
        exons: [{ number: 1, start: txStart, end: txEnd }],
        isForteSelected: true,
        domains: [],
        utrs: [],
    };
}

function ev(over: Partial<FusionEvent>): FusionEvent {
    return {
        id: 'e',
        tumorId: 'S1',
        gene1: {
            symbol: 'TMPRSS2',
            chromosome: '21',
            position: 100,
            selectedTranscriptId: 't1',
            siteDescription: '',
        },
        gene2: {
            symbol: 'ERG',
            chromosome: '21',
            position: 900,
            selectedTranscriptId: 't2',
            siteDescription: '',
        },
        fusion: 'TMPRSS2::ERG',
        totalReadSupport: 5,
        callMethod: 'FUSION',
        frameCallMethod: 'in_frame',
        annotation: '',
        position: '',
        significance: '',
        note: '',
        connectionType: '5to3',
        ...over,
    } as FusionEvent;
}

describe('buildComparisonRows', () => {
    it('pair mode keeps only events for the pair key, anchored on 5′', () => {
        const anchor: ComparisonAnchor = {
            mode: 'pair',
            key: 'ERG::TMPRSS2',
        };
        const rows = buildComparisonRows(
            [
                ev({ tumorId: 'S1', id: 'a' }),
                ev({
                    tumorId: 'S2',
                    id: 'b',
                    gene2: {
                        symbol: 'FLI1',
                        chromosome: '11',
                        position: 5,
                        selectedTranscriptId: 't',
                        siteDescription: '',
                    },
                    fusion: 'TMPRSS2::FLI1',
                }),
            ],
            anchor
        );
        assert.lengthOf(rows, 1);
        assert.equal(rows[0].sampleId, 'S1');
        assert.equal(rows[0].anchorBreakpoint, 100);
    });

    it('driver mode keeps every event touching the driver gene', () => {
        const anchor: ComparisonAnchor = { mode: 'driver', key: 'TMPRSS2' };
        const rows = buildComparisonRows(
            [ev({ id: 'a' }), ev({ id: 'b', tumorId: 'S2' })],
            anchor
        );
        assert.lengthOf(rows, 2);
        assert.equal(rows[0].fivePrimeSymbol, 'TMPRSS2');
    });

    it('sortComparisonRows orders ascending by anchor breakpoint', () => {
        const a = { anchorBreakpoint: 300 } as any;
        const b = { anchorBreakpoint: 100 } as any;
        const sorted = sortComparisonRows([a, b]);
        assert.equal(sorted[0].anchorBreakpoint, 100);
    });

    it('carries the 3′ partner breakpoint', () => {
        const rows = buildComparisonRows([ev({})], {
            mode: 'driver',
            key: 'TMPRSS2',
        });
        assert.equal(rows[0].partnerBreakpoint, 900);
    });
});

describe('resolveComparisonRows', () => {
    // TMPRSS2 chr21:42.8M−, ERG chr21:39.7M− — canonical 5′ = TMPRSS2.
    const tmprss2Tx = makeTx('TMPRSS2', 42836478, 42903043, '-');
    const ergTx = makeTx('ERG', 39751949, 40033704, '-');
    const txFor = (g: string): TranscriptData[] =>
        g === 'TMPRSS2' ? [tmprss2Tx] : g === 'ERG' ? [ergTx] : [];

    // Row as the cohort curates it: site1=ERG (5′ naively), site2=TMPRSS2.
    const naiveErgAnchorRow = buildComparisonRows(
        [
            ev({
                connectionType: '3to5',
                gene1: {
                    symbol: 'ERG',
                    chromosome: '21',
                    position: 39860000,
                    selectedTranscriptId: 't',
                    siteDescription: '',
                },
                gene2: {
                    symbol: 'TMPRSS2',
                    chromosome: '21',
                    position: 42880000,
                    selectedTranscriptId: 't',
                    siteDescription: '',
                },
            }),
        ],
        { mode: 'driver', key: 'ERG' }
    );

    it('flips TMPRSS2-ERG so TMPRSS2 becomes the 5′ anchor', () => {
        // sanity: the naive row anchors on ERG
        assert.equal(naiveErgAnchorRow[0].fivePrimeSymbol, 'ERG');

        const resolved = resolveComparisonRows(naiveErgAnchorRow, txFor);
        assert.equal(resolved[0].fivePrimeSymbol, 'TMPRSS2');
        assert.equal(resolved[0].threePrimeSymbol, 'ERG');
        assert.equal(resolved[0].anchorBreakpoint, 42880000);
        assert.equal(resolved[0].partnerBreakpoint, 39860000);
    });

    it('falls back to the naive ordering when transcripts are unavailable', () => {
        const resolved = resolveComparisonRows(naiveErgAnchorRow, () => []);
        assert.equal(resolved[0].fivePrimeSymbol, 'ERG');
        assert.equal(resolved[0].threePrimeSymbol, 'TMPRSS2');
    });
});

describe('orientComparisonRowsTo5p', () => {
    const mk = (
        five: string,
        three: string,
        anchorBp: number,
        partnerBp: number
    ): ComparisonRow =>
        ({
            event: {} as any,
            sampleId: 's',
            fivePrimeSymbol: five,
            threePrimeSymbol: three,
            anchorBreakpoint: anchorBp,
            partnerBreakpoint: partnerBp,
            frame: 'unknown',
        } as ComparisonRow);

    it('swaps rows whose 5′ is not the target, including breakpoints', () => {
        const out = orientComparisonRowsTo5p(
            [mk('ERG', 'TMPRSS2', 39860000, 42880000)],
            'TMPRSS2'
        );
        assert.equal(out[0].fivePrimeSymbol, 'TMPRSS2');
        assert.equal(out[0].threePrimeSymbol, 'ERG');
        assert.equal(out[0].anchorBreakpoint, 42880000);
        assert.equal(out[0].partnerBreakpoint, 39860000);
    });

    it('leaves rows already anchored on the target untouched', () => {
        const row = mk('TMPRSS2', 'ERG', 42880000, 39860000);
        const out = orientComparisonRowsTo5p([row], 'TMPRSS2');
        assert.equal(out[0].anchorBreakpoint, 42880000);
        assert.equal(out[0].fivePrimeSymbol, 'TMPRSS2');
    });

    it('leaves rows not containing the target gene untouched', () => {
        const row = mk('FOO', 'BAR', 1, 2);
        const out = orientComparisonRowsTo5p([row], 'TMPRSS2');
        assert.equal(out[0].fivePrimeSymbol, 'FOO');
    });

    it('produces a single consistent 5′ across a mixed set', () => {
        const out = orientComparisonRowsTo5p(
            [
                mk('TMPRSS2', 'ERG', 42880000, 39860000),
                mk('ERG', 'TMPRSS2', 39870000, 42890000),
            ],
            'TMPRSS2'
        );
        assert.deepEqual(
            out.map(r => r.fivePrimeSymbol),
            ['TMPRSS2', 'TMPRSS2']
        );
    });
});

describe('snapBreakpointsToAnchorGene', () => {
    // TMPRSS2 transcript locus (GRCh37).
    const TX_START = 42836480;
    const TX_END = 42879992;
    const mk = (anchorBp: number, partnerBp: number | null): ComparisonRow =>
        ({
            event: {} as any,
            sampleId: 's',
            fivePrimeSymbol: 'TMPRSS2',
            threePrimeSymbol: 'ERG',
            anchorBreakpoint: anchorBp,
            partnerBreakpoint: partnerBp,
            frame: 'unknown',
        } as ComparisonRow);

    it('swaps breakpoints when the partner one is nearer the anchor locus (pattern B)', () => {
        // anchor bp in ERG locus, partner bp in TMPRSS2 locus → swap
        const out = snapBreakpointsToAnchorGene(
            [mk(39875226, 42871354)],
            TX_START,
            TX_END
        );
        assert.equal(out[0].anchorBreakpoint, 42871354);
        assert.equal(out[0].partnerBreakpoint, 39875226);
    });

    it('leaves rows whose anchor breakpoint is already in the locus', () => {
        const out = snapBreakpointsToAnchorGene(
            [mk(42860000, 39875226)],
            TX_START,
            TX_END
        );
        assert.equal(out[0].anchorBreakpoint, 42860000);
    });

    it('does not swap when there is no partner breakpoint', () => {
        const out = snapBreakpointsToAnchorGene(
            [mk(39875226, null)],
            TX_START,
            TX_END
        );
        assert.equal(out[0].anchorBreakpoint, 39875226);
    });
});
