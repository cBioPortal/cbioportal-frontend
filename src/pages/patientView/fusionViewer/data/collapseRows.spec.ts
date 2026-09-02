import { assert } from 'chai';
import { exonStructureKey, groupRows } from './collapseRows';
import { ComparisonRow } from './comparisonRows';
import { TranscriptData } from './types';

function tx(gene: string, strand: '+' | '-' = '+'): TranscriptData {
    return {
        genomeBuild: 'GRCh38',
        transcriptId: gene,
        displayName: gene,
        gene,
        biotype: 'protein_coding',
        strand,
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

function row(
    sampleId: string,
    frame: ComparisonRow['frame'],
    anchorBreakpoint = 250,
    partnerBreakpoint: number | null = 250
): ComparisonRow {
    return {
        sampleId,
        fivePrimeSymbol: 'TMPRSS2',
        threePrimeSymbol: 'ERG',
        anchorBreakpoint,
        partnerBreakpoint,
        frame,
        event: {} as any,
    } as ComparisonRow;
}

describe('exonStructureKey', () => {
    it('two rows with the same retained exon sets produce the same key', () => {
        const t5 = tx('TMPRSS2');
        const t3 = tx('ERG');
        assert.equal(
            exonStructureKey(t5, 250, t3, 250),
            exonStructureKey(t5, 260, t3, 240)
        );
    });

    it('different retained 5′ sets produce different keys', () => {
        const t5 = tx('TMPRSS2');
        const t3 = tx('ERG');
        // bp5 = 250 retains E1,E2; bp5 = 50 retains E1 only.
        assert.notEqual(
            exonStructureKey(t5, 250, t3, 250),
            exonStructureKey(t5, 50, t3, 250)
        );
    });

    it('a missing 3′ transcript still yields a stable 5p-only key', () => {
        const t5 = tx('TMPRSS2');
        const k = exonStructureKey(t5, 250, undefined, null);
        assert.match(k, /^5p:1,2\|3p:$/);
    });
});

describe('groupRows', () => {
    it('groups by key, counts, tallies frames, and sorts by count desc', () => {
        const rows = [
            row('S1', 'inFrame'),
            row('S2', 'inFrame'),
            row('S3', 'outOfFrame'),
            // a distinct product (only E1 retained on the 5′ side)
            row('S4', 'unknown', 50),
        ];
        const keyFn = (r: ComparisonRow) =>
            exonStructureKey(tx('TMPRSS2'), r.anchorBreakpoint, tx('ERG'), 250);
        const groups = groupRows(rows, keyFn);

        assert.lengthOf(groups, 2);
        // largest group first
        assert.equal(groups[0].count, 3);
        assert.deepEqual(groups[0].sampleIds, ['S1', 'S2', 'S3']);
        assert.deepEqual(groups[0].frames, {
            inFrame: 2,
            outOfFrame: 1,
            unknown: 0,
        });
        assert.equal(groups[0].representative.sampleId, 'S1');
        assert.equal(groups[1].count, 1);
        assert.deepEqual(groups[1].sampleIds, ['S4']);
    });

    it('groups by breakpoint feature when given a feature key function', () => {
        const rows = [
            row('S1', 'inFrame', 250),
            row('S2', 'inFrame', 260),
            row('S3', 'outOfFrame', 999),
        ];
        // stub feature keyFn: bucket by which exon-ish band the breakpoint hits
        const featureKey = (r: ComparisonRow) =>
            r.anchorBreakpoint < 400 ? 'E2' : 'downstream';
        const groups = groupRows(rows, featureKey);
        assert.lengthOf(groups, 2);
        assert.equal(groups[0].key, 'E2');
        assert.equal(groups[0].count, 2);
    });
});
