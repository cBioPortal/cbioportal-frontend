import { assert } from 'chai';
import OncoprinterStore from './OncoprinterStore';
import {
    initDriverAnnotationSettings,
    parseGeneticInput,
} from './OncoprinterGeneticUtils';
import AppConfig from 'appConfig';

describe('OncoprinterGeneticUtils', () => {
    describe('initDriverAnnotationSettings', () => {
        it('initializes correctly with custom drivers', () => {
            // only custom drivers selected as annotation source
            const store = { existCustomDrivers: true } as OncoprinterStore;
            const settings = initDriverAnnotationSettings(store);
            assert.isTrue(settings.customBinary);
            assert.isFalse(settings.oncoKb);
            assert.isFalse(settings.cbioportalCount);
        });
        it('initializes correctly without custom drivers', () => {
            // only oncokb selected as annotation source
            AppConfig.serverConfig.show_oncokb = true;
            const store = { existCustomDrivers: false } as OncoprinterStore;
            const settings = initDriverAnnotationSettings(store);
            assert.isTrue(settings.oncoKb);
            assert.isFalse(settings.customBinary);
            assert.isFalse(settings.cbioportalCount);
        });
    });

    describe('parseGeneticInput', () => {
        it('skips header line', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'sample gene alteration type\nsample_id TP53 FUSION FUSION\n'
                ),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sample_id',
                            hugoGeneSymbol: 'TP53',
                            alteration: 'structuralVariant',
                            proteinChange: 'FUSION',
                            trackName: undefined,
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('parses fusion command correctly', () => {
            assert.deepEqual(
                parseGeneticInput('sample_id TP53 FUSION FUSION'),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sample_id',
                            hugoGeneSymbol: 'TP53',
                            alteration: 'structuralVariant',
                            proteinChange: 'FUSION',
                            trackName: undefined,
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('throws an error if fusion is not specified correctly', () => {
            try {
                const parsed = parseGeneticInput(
                    'sample_id TP53 FUSION apsoidjfpaos'
                );
                assert(false);
            } catch (e) {}
        });
        it('parses germline mutation correctly', () => {
            assert.deepEqual(
                parseGeneticInput('sampleid	BRCA1	Q1538A	MISSENSE_GERMLINE'),
                {
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
                }
            );
        });
        it('parses driver mutation correctly', () => {
            assert.deepEqual(
                parseGeneticInput('sampleid	BRCA1	Q1538A	TRUNC_DRIVER'),
                {
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
                }
            );
        });
        it('parses germline & driver mutation correctly', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'sampleid	BRCA1	Q1538A	MISSENSE_GERMLINE_DRIVER'
                ),
                {
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
                }
            );
        });
        it('throws an error for an invalid mutation modifier', () => {
            try {
                const parsed = parseGeneticInput(
                    'sample_id TP53 protienchange MISSENSE_JIDFPAOIJFP'
                );
                assert(false);
            } catch (e) {}
        });
        it('parses a line with a given track name correctly', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'sampleid	BRCA1	Q1538A	MISSENSE_GERMLINE_DRIVER	testTrackName'
                ),
                {
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
                }
            );
        });
    });
});
