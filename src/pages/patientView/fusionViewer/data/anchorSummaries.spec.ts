import { assert } from 'chai';
import { buildGeneSummaries, buildPartnerSummaries } from './anchorSummaries';
import { ComparisonRow, NO_PARTNER, INTRAGENIC } from './comparisonRows';
import { FusionEvent } from './types';

function ev(
    sample: string,
    g1: string,
    g2: string | null,
    frame = 'in_frame'
): FusionEvent {
    const site = (symbol: string) => ({
        symbol,
        chromosome: '1',
        position: 100,
        selectedTranscriptId: '',
        siteDescription: '',
    });
    return {
        id: `${sample}-${g1}-${g2}`,
        tumorId: sample,
        gene1: site(g1),
        gene2: g2 ? site(g2) : null,
        frameCallMethod: frame,
    } as FusionEvent;
}

const asRow = (e: FusionEvent): ComparisonRow => ({
    event: e,
    sampleId: e.tumorId,
    fivePrimeSymbol: e.gene1.symbol,
    threePrimeSymbol: e.gene2 ? e.gene2.symbol : null,
    anchorBreakpoint: 100,
    partnerBreakpoint: e.gene2 ? 200 : null,
    frame: e.frameCallMethod === 'in_frame' ? 'inFrame' : 'unknown',
});

describe('buildGeneSummaries', () => {
    it('counts unique samples per gene across both sites', () => {
        const s = buildGeneSummaries([
            ev('S1', 'EML4', 'ALK'),
            ev('S1', 'EML4', 'ALK'), // duplicate event, same sample
            ev('S2', 'KIF5B', 'ALK'),
            ev('S3', 'ALK', 'ALK'), // intragenic counts once
        ]);
        assert.deepEqual(s[0], { gene: 'ALK', sampleCount: 3 });
        assert.deepEqual(
            s.map(g => g.gene),
            ['ALK', 'EML4', 'KIF5B']
        );
    });
});

describe('buildPartnerSummaries', () => {
    it('groups by partner category with unique samples and sentinels', () => {
        const rows = [
            ev('S1', 'EML4', 'ALK'),
            ev('S1', 'EML4', 'ALK', 'frameshift'),
            ev('S2', 'EML4', 'ALK', 'frameshift'),
            ev('S3', 'ALK', null),
            ev('S4', 'ALK', 'ALK'),
        ].map(asRow);
        const s = buildPartnerSummaries(rows, 'ALK', '3p');
        assert.deepEqual(s[0], {
            category: 'EML4',
            sampleCount: 2,
            eventCount: 3,
            anyInFrame: true,
        });
        assert.sameMembers(
            s.map(p => p.category),
            ['EML4', NO_PARTNER, INTRAGENIC]
        );
    });
});
