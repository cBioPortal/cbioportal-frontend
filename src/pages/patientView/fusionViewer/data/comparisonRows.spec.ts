import { assert } from 'chai';
import {
    buildComparisonRows,
    sortComparisonRows,
    ComparisonAnchor,
} from './comparisonRows';
import { FusionEvent } from './types';

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
});
