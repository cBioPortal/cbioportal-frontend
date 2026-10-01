import { assert } from 'chai';
import { resolveAnchorIdentity, resolveEffectiveSide } from './anchorPipeline';
import { buildGeneSummaries } from './anchorSummaries';
import { buildPairSummaries } from './cohortAggregation';
import { ComparisonRow } from './comparisonRows';
import { FusionEvent } from './types';

const site = (symbol: string) => ({
    symbol,
    chromosome: '1',
    position: 1,
    selectedTranscriptId: '',
    siteDescription: '',
});
const ev = (s: string, g1: string, g2: string | null): FusionEvent =>
    ({
        id: `${s}${g1}${g2}`,
        tumorId: s,
        gene1: site(g1),
        gene2: g2 ? site(g2) : null,
        frameCallMethod: '',
    } as FusionEvent);

const args = (events: FusionEvent[], selection: any, seedPending = false) => ({
    selection,
    events,
    pairSummaries: buildPairSummaries(events),
    geneSummaries: buildGeneSummaries(events),
    seedPending,
});

describe('resolveAnchorIdentity', () => {
    const events = [ev('S1', 'EML4', 'ALK'), ev('S2', 'EML4', 'ALK')];

    it('keeps a gene selection mentioned by any event (side preserved)', () => {
        const sel = { mode: 'gene', gene: 'ALK', side: '5p' } as const;
        assert.deepEqual(resolveAnchorIdentity(args(events, sel)), sel);
    });

    it('falls back to the most recurrent gene, side auto, when unmentioned', () => {
        const id = resolveAnchorIdentity(
            args(events, { mode: 'gene', gene: 'RET', side: '3p' })
        );
        assert.deepEqual(id, { mode: 'gene', gene: 'ALK', side: 'auto' });
    });

    it('pair fallback is unchanged (most recurrent surviving pair)', () => {
        const id = resolveAnchorIdentity(
            args(events, { mode: 'pair', key: 'CCDC6::RET' })
        );
        assert.deepEqual(id, { mode: 'pair', key: 'ALK::EML4' });
    });

    it('no fallback while a seed is pending and there are no events', () => {
        assert.isUndefined(
            resolveAnchorIdentity(
                args([], { mode: 'gene', gene: 'ALK', side: 'auto' }, true)
            )
        );
    });
});

describe('resolveEffectiveSide', () => {
    const r = (five: string, three: string): ComparisonRow =>
        ({
            fivePrimeSymbol: five,
            threePrimeSymbol: three,
            anchorBreakpoint: 1,
            partnerBreakpoint: 2,
        } as ComparisonRow);

    it('explicit side wins; auto uses resolved rows once ready, else unresolved', () => {
        const resolved = [r('EML4', 'ALK')];
        const unresolved = [r('ALK', 'EML4')];
        const auto = { mode: 'gene', gene: 'ALK', side: 'auto' } as const;
        assert.equal(
            resolveEffectiveSide(
                { ...auto, side: '5p' },
                resolved,
                unresolved,
                true
            ),
            '5p'
        );
        assert.equal(
            resolveEffectiveSide(auto, resolved, unresolved, true),
            '3p'
        );
        assert.equal(
            resolveEffectiveSide(auto, resolved, unresolved, false),
            '5p'
        );
        assert.isUndefined(
            resolveEffectiveSide({ mode: 'pair', key: 'A::B' }, [], [], true)
        );
    });
});
