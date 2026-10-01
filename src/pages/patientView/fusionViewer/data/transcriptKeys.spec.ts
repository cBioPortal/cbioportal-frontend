import { assert } from 'chai';
import { txKey, transcriptRequestsForRows } from './transcriptKeys';
import { ComparisonRow } from './comparisonRows';

const row = (ncbiBuild: string): ComparisonRow =>
    ({
        event: {
            ncbiBuild,
            gene1: { symbol: 'EML4', selectedTranscriptId: 'ENST1' },
            gene2: { symbol: 'ALK', selectedTranscriptId: '' },
        },
        sampleId: 'S1',
        fivePrimeSymbol: 'EML4',
        threePrimeSymbol: 'ALK',
        anchorBreakpoint: 1,
        partnerBreakpoint: 2,
        frame: 'unknown',
    } as any);

describe('transcriptKeys', () => {
    it('txKey keeps the build|symbol|id schema', () => {
        assert.equal(txKey('GRCh38', 'ALK'), 'GRCh38|ALK|');
        assert.equal(txKey('GRCh37', 'ALK', 'ENST9'), 'GRCh37|ALK|ENST9');
    });

    it('requests row-build isoforms plus cohort-build canonicals, deduped', () => {
        const reqs = transcriptRequestsForRows(
            [row('GRCh37'), row('GRCh37')],
            'GRCh38'
        ).map(r => txKey(r.build, r.symbol, r.transcriptId));
        assert.sameMembers(reqs, [
            'GRCh37|EML4|',
            'GRCh37|EML4|ENST1',
            'GRCh37|ALK|',
            'GRCh38|EML4|',
            'GRCh38|ALK|',
        ]);
    });
});
