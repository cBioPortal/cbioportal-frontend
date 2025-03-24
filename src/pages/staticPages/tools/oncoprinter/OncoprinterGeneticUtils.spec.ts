import { assert } from 'chai';
import { parseGeneticInput } from './OncoprinterGeneticUtils';

describe('OncoprinterGeneticUtils', () => {
    describe('parseGeneticInput', () => {
        it('skips header line', async () => {
            const parsed = await parseGeneticInput(
                'sample gene alteration type\nsample_id TP53 FUSION FUSION\n'
            );
            assert.deepEqual(parsed, {
                parseSuccess: true,
                result: [
                    {
                        sampleId: 'sample_id',
                        hugoGeneSymbol: 'TP53',
                        alteration: 'structuralVariant',
                        eventInfo: 'FUSION',
                        trackName: undefined,
                    },
                ],
                error: undefined,
            });
        });
        it('parses fusion command correctly', async () => {
            const parsed = await parseGeneticInput(
                'sample_id TP53 FUSION FUSION'
            );
            assert.deepEqual(parsed, {
                parseSuccess: true,
                result: [
                    {
                        sampleId: 'sample_id',
                        hugoGeneSymbol: 'TP53',
                        alteration: 'structuralVariant',
                        eventInfo: 'FUSION',
                        trackName: undefined,
                    },
                ],
                error: undefined,
            });
        });
        it('throws an error if fusion is not specified correctly', async () => {
            try {
                const parsed = await parseGeneticInput(
                    'sample_id TP53 FUSION apsoidjfpaos'
                );
                assert(false);
            } catch (e) {}
        });
        it('parses germline mutation correctly', async () => {
            const parsed = await parseGeneticInput(
                'sampleid	BRCA1	Q1538A	MISSENSE_GERMLINE'
            );
            assert.deepEqual(parsed, {
                parseSuccess: true,
                result: [
                    {
                        sampleId: 'sampleid',
                        hugoGeneSymbol: 'BRCA1',
                        alteration: 'missense',
                        proteinChange: 'Q1538A',
                        isGermline: true,
                        trackName: undefined,
                    },
                ],
                error: undefined,
            });
        });
        it('parses driver mutation correctly', async () => {
            const parsed = await parseGeneticInput(
                'sampleid	BRCA1	Q1538A	TRUNC_DRIVER'
            );
            assert.deepEqual(parsed, {
                parseSuccess: true,
                result: [
                    {
                        sampleId: 'sampleid',
                        hugoGeneSymbol: 'BRCA1',
                        alteration: 'trunc',
                        proteinChange: 'Q1538A',
                        isCustomDriver: true,
                        trackName: undefined,
                    },
                ],
                error: undefined,
            });
        });
        it('parses germline & driver mutation correctly', async () => {
            const parsed = await parseGeneticInput(
                'sampleid	BRCA1	Q1538A	MISSENSE_GERMLINE_DRIVER'
            );
            assert.deepEqual(parsed, {
                parseSuccess: true,
                result: [
                    {
                        sampleId: 'sampleid',
                        hugoGeneSymbol: 'BRCA1',
                        alteration: 'missense',
                        proteinChange: 'Q1538A',
                        isGermline: true,
                        isCustomDriver: true,
                        trackName: undefined,
                    },
                ],
                error: undefined,
            });
        });
        it('throws an error for an invalid mutation modifier', () => {
            try {
                const parsed = parseGeneticInput(
                    'sample_id TP53 protienchange MISSENSE_JIDFPAOIJFP'
                );
                assert(false);
            } catch (e) {}
        });
        it('parses a line with a given track name correctly', async () => {
            const parsed = await parseGeneticInput(
                'sampleid	BRCA1	Q1538A	MISSENSE_GERMLINE_DRIVER	testTrackName'
            );
            assert.deepEqual(parsed, {
                parseSuccess: true,
                result: [
                    {
                        sampleId: 'sampleid',
                        hugoGeneSymbol: 'BRCA1',
                        alteration: 'missense',
                        proteinChange: 'Q1538A',
                        isGermline: true,
                        isCustomDriver: true,
                        trackName: 'testTrackName',
                    },
                ],
                error: undefined,
            });
        });
    });
});
