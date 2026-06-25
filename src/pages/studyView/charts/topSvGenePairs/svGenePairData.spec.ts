import { assert } from 'chai';
import { buildPairKey, buildSvGenePairRows } from './svGenePairData';

function makeSv(
    site1: string,
    site2: string,
    sampleId: string,
    studyId = 'study1'
): any {
    return {
        site1HugoSymbol: site1,
        site2HugoSymbol: site2,
        sampleId,
        studyId,
    };
}

describe('buildPairKey', () => {
    it('sorts alphabetically so order of genes does not matter', () => {
        assert.equal(buildPairKey('TMPRSS2', 'ERG'), 'ERG::TMPRSS2');
        assert.equal(buildPairKey('ERG', 'TMPRSS2'), 'ERG::TMPRSS2');
    });

    it('uses dash for missing symbol', () => {
        assert.equal(buildPairKey('', 'GENE'), '-::GENE');
        assert.equal(buildPairKey('GENE', ''), '-::GENE');
        assert.equal(buildPairKey('', ''), '-::-');
    });
});

describe('buildSvGenePairRows', () => {
    it('returns empty array for empty input', () => {
        assert.deepEqual(buildSvGenePairRows([]), []);
    });

    it('groups by pair and counts distinct samples', () => {
        const svs = [
            makeSv('ERG', 'TMPRSS2', 'S1'),
            makeSv('TMPRSS2', 'ERG', 'S2'),
            makeSv('BCR', 'ABL1', 'S3'),
        ];
        const rows = buildSvGenePairRows(svs as any);
        assert.equal(rows.length, 2);
        const ergRow = rows.find(r => r.uniqueKey === 'ERG::TMPRSS2')!;
        assert.ok(ergRow, 'should find ERG::TMPRSS2 row');
        assert.equal(ergRow.sampleCount, 2);
        assert.equal(ergRow.gene1, 'ERG');
        assert.equal(ergRow.gene2, 'TMPRSS2');
    });

    it('deduplicates same sample appearing twice for same pair', () => {
        const svs = [
            makeSv('ERG', 'TMPRSS2', 'S1'),
            makeSv('ERG', 'TMPRSS2', 'S1'),
        ];
        const rows = buildSvGenePairRows(svs as any);
        assert.equal(rows[0].sampleCount, 1);
        assert.equal(rows[0].sampleIdentifiers.length, 1);
    });

    it('sorts rows by sampleCount descending', () => {
        const svs = [
            makeSv('BCR', 'ABL1', 'S1'),
            makeSv('ERG', 'TMPRSS2', 'S2'),
            makeSv('ERG', 'TMPRSS2', 'S3'),
        ];
        const rows = buildSvGenePairRows(svs as any);
        assert.equal(rows[0].uniqueKey, 'ERG::TMPRSS2');
        assert.equal(rows[0].sampleCount, 2);
        assert.equal(rows[1].sampleCount, 1);
    });

    it('skips records where both symbols are missing', () => {
        const svs = [makeSv('', '', 'S1'), makeSv('ERG', 'TMPRSS2', 'S2')];
        const rows = buildSvGenePairRows(svs as any);
        assert.equal(rows.length, 1);
        assert.equal(rows[0].uniqueKey, 'ERG::TMPRSS2');
    });

    it('populates sampleIdentifiers with studyId and sampleId', () => {
        const svs = [makeSv('ERG', 'TMPRSS2', 'S1', 'study_x')];
        const rows = buildSvGenePairRows(svs as any);
        assert.deepEqual(rows[0].sampleIdentifiers, [
            { studyId: 'study_x', sampleId: 'S1' },
        ]);
    });
});
